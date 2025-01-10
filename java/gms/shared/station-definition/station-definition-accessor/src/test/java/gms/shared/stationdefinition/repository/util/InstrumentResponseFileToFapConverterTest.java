package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.fasterxml.jackson.annotation.JsonProperty;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseDefinition;
import gms.shared.stationdefinition.configuration.FrequencySamplingMode;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.util.Precision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class InstrumentResponseFileToFapConverterTest {

  private InstrumentDao dao;

  @BeforeEach
  void init() {
    dao = new InstrumentDao();
    dao.setNominalCalibrationFactor(TestFixtures.CAL_FACTOR);
    dao.setNominalCalibrationPeriod(TestFixtures.CAL_PERIOD);
    dao.setSampleRate(TestFixtures.SAMPLE_RATE);
  }

  @Test
  void testGoodInput(CapturedOutput capturedOutput) {
    var file = TestFixtures.GOOD_INPUT_FILE;
    var url = this.getClass().getClassLoader().getResource(file);
    var dir = url.getPath().replaceAll(file, "");

    dao.setDirectory(dir);
    dao.setDataFile(file);

    var result =
        InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
            dao, TestFixtures.FAP_DEF, TestFixtures.ID, ChannelDataType.SEISMIC);

    assertEquals(TestFixtures.ID, result.getId());
    assertTrue(result.getData().isPresent());
    assertTrue(capturedOutput.isEmpty());
  }

  @ParameterizedTest
  @MethodSource("getBadInputArguments")
  void testBadInputs(
      String dir,
      String file,
      boolean loggedWarning,
      String warnMsg,
      boolean loggedInfo,
      CapturedOutput capturedOutput) {

    if (dir == null) {
      var url = this.getClass().getClassLoader().getResource(file);
      dir = url.getPath().replaceAll(file, "");
    }

    dao.setDirectory(dir);
    dao.setDataFile(file);

    var result =
        InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
            dao, TestFixtures.FAP_DEF, TestFixtures.ID, ChannelDataType.SEISMIC);

    assertEquals(TestFixtures.ID, result.getId());
    assertTrue(result.getData().isEmpty());
    assertEquals(loggedWarning, capturedOutput.toString().contains("WARN"));
    if (loggedWarning) {
      assertTrue(capturedOutput.toString().contains(warnMsg));
    }
    assertEquals(loggedInfo, capturedOutput.toString().contains("INFO"));
  }

  private static Stream<Arguments> getBadInputArguments() {
    return Stream.of(
        arguments(
            TestFixtures.NO_SUCH_DIR, TestFixtures.NO_SUCH_FILE, true, "could not be read", false),
        arguments(
            null,
            TestFixtures.BAD_INPUT_FILE,
            true,
            "FrequencyAmplitudePhase object could not be created",
            false),
        arguments(
            null,
            TestFixtures.UNKNOWN_TYPE_FILE,
            true,
            "contained no parseable data blocks",
            true));
  }

  @ParameterizedTest
  @MethodSource("getSmeArguments")
  void testSmeDataValidation(
      String fileExt,
      FrequencyAmplitudePhaseDefinition fapDef,
      double calPer,
      int expectedDataPoints,
      int numInfo,
      double tolerance,
      CapturedOutput capturedOutput)
      throws IOException {

    var dataFile = TestFixtures.SME_INPUT_FILE + fileExt;
    var url = this.getClass().getClassLoader().getResource(dataFile);
    var dir = url.getPath().replaceAll(dataFile, "");

    dao.setDirectory(dir);
    dao.setDataFile(dataFile);
    dao.setNominalCalibrationPeriod(calPer);

    // Read the SME response file, delete the last line if necessary, and normalize
    var jsonFileName = dir + fileExt + TestFixtures.SME_OUTPUT_FILE;
    List<Pair<Double, Pair<Double, Double>>> expected = readResponseFile(jsonFileName);
    expected = expected.subList(0, expectedDataPoints);
    double fCal = 1.0 / calPer;
    var HfCal =
        expected.stream()
            .filter(val -> Precision.equals(val.getLeft(), fCal, TestFixtures.TOLERANCE))
            .findFirst()
            .orElseThrow()
            .getRight()
            .getLeft();
    double calFactor = (1.0 / TestFixtures.CAL_FACTOR) / HfCal;
    expected =
        expected.stream()
            .map(
                val ->
                    Pair.of(
                        val.getLeft(),
                        Pair.of(val.getRight().getLeft() * calFactor, val.getRight().getRight())))
            .toList();

    var result =
        InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
            dao, fapDef, TestFixtures.ID, ChannelDataType.SEISMIC);

    // Validate logged messages
    // - All of the files provide valid results, so no warnings are expected
    // - Only the .all file has an invalid block, a single INFO warning about the "delay" block
    assertEquals(numInfo, StringUtils.countMatches(capturedOutput.toString(), "INFO"));
    assertEquals(0, StringUtils.countMatches(capturedOutput.toString(), "WARN"));

    // Validate ID and presence of data
    assertEquals(TestFixtures.ID, result.getId());
    assertTrue(result.getData().isPresent());

    // Validate number of data points
    // - By choosing a calPeriod such that the calFreq is in the interpolated list, the number of
    //   responses should be equal to the number of interpolation points (128)
    // - For the combined file, the interior FAP block has a max of 20.0.  This means that the
    //   highest f of 20.000000000000004 is outside the range of valid f and is discarded, so
    //   the .all file only has 127 points
    var actual = result.getData().get();
    assertEquals(expectedDataPoints, actual.getFrequencies().size());
    assertEquals(expected.size(), actual.getFrequencies().size());

    // Validate values
    for (var n = 0; n < expected.size(); n++) {
      assertTrue(
          Precision.equals(
              expected.get(n).getLeft(), actual.getFrequencies().get(n), TestFixtures.TOLERANCE),
          "Frequency: Expected "
              + expected.get(n).getLeft()
              + " was "
              + actual.getFrequencies().get(n));
      assertTrue(
          Precision.equals(
              expected.get(n).getRight().getLeft(),
              actual.getAmplitudePhaseResponses().get(n).getAmplitude().getValue(),
              tolerance),
          "Amplitude: Expected "
              + expected.get(n).getRight().getLeft()
              + " was "
              + actual.getAmplitudePhaseResponses().get(n).getAmplitude().getValue()
              + " for frequency "
              + actual.getFrequencies().get(n));
      assertTrue(
          Precision.equals(
              expected.get(n).getRight().getRight(),
              actual.getAmplitudePhaseResponses().get(n).getPhase().getValue(),
              TestFixtures.TOLERANCE),
          "Phase: Expected "
              + expected.get(n).getRight().getRight()
              + " was "
              + actual.getAmplitudePhaseResponses().get(n).getPhase().getValue());
    }
  }

  private static Stream<Arguments> getSmeArguments() {
    return Stream.of(
        arguments(
            TestFixtures.SME_EXTS.get(0),
            TestFixtures.FAP_DEF_LINEAR,
            TestFixtures.CAL_PERIOD_LINEAR,
            128,
            0,
            TestFixtures.TOLERANCE),
        arguments(
            TestFixtures.SME_EXTS.get(1),
            TestFixtures.FAP_DEF_LOG,
            TestFixtures.CAL_PERIOD_LOG,
            128,
            0,
            TestFixtures.TOLERANCE),
        arguments(
            TestFixtures.SME_EXTS.get(2),
            TestFixtures.FAP_DEF_LOG,
            TestFixtures.CAL_PERIOD_LOG,
            128,
            0,
            TestFixtures.LOOSE_TOLERANCE),
        arguments(
            TestFixtures.SME_EXTS.get(3),
            TestFixtures.FAP_DEF_LOG,
            TestFixtures.CAL_PERIOD_LOG,
            128,
            0,
            TestFixtures.LOOSE_TOLERANCE),
        arguments(
            TestFixtures.SME_EXTS.get(4),
            TestFixtures.FAP_DEF_LOG,
            TestFixtures.CAL_PERIOD_LOG,
            127,
            1,
            TestFixtures.LOOSE_TOLERANCE));
  }

  private List<Pair<Double, Pair<Double, Double>>> readResponseFile(String jsonFileName)
      throws IOException {
    var jsonFile = new File(jsonFileName);
    FAP fap = ObjectMappers.jsonReader().readValue(jsonFile, FAP.class);

    var result = new ArrayList<Pair<Double, Pair<Double, Double>>>();
    for (var n = 0; n < fap.amplitude.length; n++) {
      var phase = fap.phase[n];
      while (phase < 0.0) {
        phase += 360.0;
      }
      while (phase > 360.0) {
        phase -= 360.0;
      }
      result.add(Pair.of(fap.frequency[n], Pair.of(fap.amplitude[n], phase)));
    }

    return result;
  }

  @ParameterizedTest
  @MethodSource("getFirExcelArguments")
  void testFirExcel(Pair<Double, Double> fir) {
    var dataFile = TestFixtures.SME_INPUT_FILE + "fir";
    var url = this.getClass().getClassLoader().getResource(dataFile);
    var dir = url.getPath().replaceAll(dataFile, "");

    dao.setDirectory(dir);
    dao.setDataFile(dataFile);
    dao.setNominalCalibrationPeriod(TestFixtures.CAL_PERIOD_LOG);

    var result =
        InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
            dao, TestFixtures.FAP_DEF_LOG, TestFixtures.ID, ChannelDataType.SEISMIC);

    var data = result.getData().get();
    var freqs = data.getFrequencies();
    var resps = data.getAmplitudePhaseResponses();

    var matched = false;
    for (var i = 0; i < freqs.size(); i++) {
      if (Precision.equals(fir.getLeft(), freqs.get(i), TestFixtures.TOLERANCE)) {
        matched = true;
        assertTrue(
            Precision.equals(
                fir.getRight(),
                resps.get(i).getAmplitude().getValue(),
                TestFixtures.EXCEL_TOLERANCE));
        break;
      }
    }

    assertTrue(matched);
  }

  private static Stream<Arguments> getFirExcelArguments() {
    return TestFixtures.FIR_EXCEL.stream().map(p -> arguments(p));
  }

  @ParameterizedTest
  @MethodSource("getPazFirExcelArguments")
  void testPazFirExcel(Pair<Double, Double> pazfir) {
    var dataFile = TestFixtures.SME_INPUT_FILE + "pazfir";
    var url = this.getClass().getClassLoader().getResource(dataFile);
    var dir = url.getPath().replaceAll(dataFile, "");

    dao.setDirectory(dir);
    dao.setDataFile(dataFile);
    dao.setNominalCalibrationPeriod(TestFixtures.CAL_PERIOD_LOG);

    var result =
        InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
            dao, TestFixtures.FAP_DEF_LOG, TestFixtures.ID, ChannelDataType.SEISMIC);

    var data = result.getData().get();
    var freqs = data.getFrequencies();
    var resps = data.getAmplitudePhaseResponses();

    var matched = false;
    for (var i = 0; i < freqs.size(); i++) {
      if (Precision.equals(pazfir.getLeft(), freqs.get(i), TestFixtures.TOLERANCE)) {
        matched = true;
        assertTrue(
            Precision.equals(
                pazfir.getRight(),
                resps.get(i).getAmplitude().getValue(),
                TestFixtures.EXCEL_TOLERANCE));
        break;
      }
    }

    assertTrue(matched);
  }

  private static Stream<Arguments> getPazFirExcelArguments() {
    return TestFixtures.PAZFIR_EXCEL.stream().map(p -> arguments(p));
  }

  @ParameterizedTest
  @MethodSource("getAllExcelArguments")
  void testAllExcel(Pair<Double, Double> all) {
    var dataFile = TestFixtures.SME_INPUT_FILE + "all";
    var url = this.getClass().getClassLoader().getResource(dataFile);
    var dir = url.getPath().replaceAll(dataFile, "");

    dao.setDirectory(dir);
    dao.setDataFile(dataFile);
    dao.setNominalCalibrationPeriod(TestFixtures.CAL_PERIOD_LOG);

    var result =
        InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
            dao, TestFixtures.FAP_DEF_LOG, TestFixtures.ID, ChannelDataType.SEISMIC);

    var data = result.getData().get();
    var freqs = data.getFrequencies();
    var resps = data.getAmplitudePhaseResponses();

    var matched = false;
    for (var i = 0; i < freqs.size(); i++) {
      if (Precision.equals(all.getLeft(), freqs.get(i), TestFixtures.TOLERANCE)) {
        matched = true;
        assertTrue(
            Precision.equals(
                all.getRight(),
                resps.get(i).getAmplitude().getValue(),
                TestFixtures.EXCEL_TOLERANCE));
        break;
      }
    }

    assertTrue(matched);
  }

  private static Stream<Arguments> getAllExcelArguments() {
    return TestFixtures.ALL_EXCEL.stream().map(p -> arguments(p));
  }

  private static class TestFixtures {
    private static final UUID ID = UUID.fromString("00000000-000-0000-0000-000000000001");

    private static final FrequencyAmplitudePhaseDefinition FAP_DEF =
        new FrequencyAmplitudePhaseDefinition(2.0, 20.0, FrequencySamplingMode.LINEAR, 4);

    private static final String GOOD_INPUT_FILE = "responseTestFilePaz.paz";

    private static final String NO_SUCH_DIR = "dir";

    private static final String NO_SUCH_FILE = "noSuchFile.fap";

    private static final String BAD_INPUT_FILE = "responseTestFile1.fap";

    private static final String UNKNOWN_TYPE_FILE = "unknownTypeTestFile.unk";

    private static final double CAL_FACTOR = 1000.0;

    private static final double CAL_PERIOD = 0.1;

    private static final double SAMPLE_RATE = 1000.0;

    private static final String SME_INPUT_FILE = "sample_response.";
    private static final List<String> SME_EXTS = List.of("fap", "paz", "fir", "pazfir", "all");
    private static final String SME_OUTPUT_FILE = ".json";

    private static final FrequencyAmplitudePhaseDefinition FAP_DEF_LOG =
        new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LOG, 128);

    private static final FrequencyAmplitudePhaseDefinition FAP_DEF_LINEAR =
        new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LINEAR, 128);

    private static final double CAL_PERIOD_LOG = 1.0 / 0.6154871241796125;
    private static final double CAL_PERIOD_LINEAR = 1.0 / 9.931338582677165;

    private static final double TOLERANCE = 1E-12;
    private static final double EXCEL_TOLERANCE = 1E-9;
    private static final double LOOSE_TOLERANCE = 1E-4;

    // The *_EXCEL data were calculated using the GMS algorithms based on the SME input response
    // files.  Only amplitude was calculated because the phases matched the python outputs.
    private static final List<Pair<Double, Double>> FIR_EXCEL =
        List.of(
            Pair.of(0.0211179638886716, 0.001000000236631420),
            Pair.of(0.1079725753476500, 0.000999997240024058),
            Pair.of(0.6154871241796120, 0.001000000000000000),
            Pair.of(12.2583373918515000, 0.000999998882000500),
            Pair.of(18.9412200015445000, 0.000792510264380791));

    private static final List<Pair<Double, Double>> PAZFIR_EXCEL =
        List.of(
            Pair.of(0.0211179638886716, 0.0000168452406155630),
            Pair.of(0.1079725753476500, 0.0000913304101176629),
            Pair.of(0.6154871241796120, 0.0010000000000000000),
            Pair.of(12.2583373918515000, 0.0598886916722941000),
            Pair.of(18.9412200015445000, 0.0715617179072103000));

    private static final List<Pair<Double, Double>> ALL_EXCEL =
        List.of(
            Pair.of(0.0211179638886716, 0.0000000007569217961346),
            Pair.of(0.1079725753476500, 0.0000005482502407269150),
            Pair.of(0.6154871241796120, 0.0010000000000000000000),
            Pair.of(12.2583373918515000, 3.5006500086888400000000),
            Pair.of(18.9412200015445000, 0.1941677786359320000000));
  }

  private static class FAP {
    @JsonProperty("frequency")
    private double[] frequency;

    @JsonProperty("amplitude")
    private double[] amplitude;

    @JsonProperty("phase")
    private double[] phase;
  }
}
