package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.util.Precision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FirBlockParserTest {

  private static final double TOLERANCE = 1E-12;
  private static final double LOOSE_TOLERANCE = 1E-6;
  private FirBlockParser firBlockParser;

  @BeforeEach
  void setup() {
    firBlockParser = new FirBlockParser();
  }

  @Test
  void testParseBlock() {
    var result = firBlockParser.parseBlock(TestFixtures.TEST_INPUT, TestFixtures.TEST_FREQS);

    for (var i = 0; i < result.size(); i++) {
      assertTrue(
          Precision.equals(result.get(i).getLeft(), TestFixtures.TEST_FREQS.get(i), TOLERANCE));
      assertTrue(
          Complex.equals(result.get(i).getRight(), TestFixtures.TEST_RESPONSES.get(i), TOLERANCE));
    }
  }

  @Test
  void testParseBlockSmeData() {
    var result = firBlockParser.parseBlock(TestFixtures.TEST_INPUT, TestFixtures.SME_FREQS);

    for (var i = 0; i < result.size(); i++) {
      assertTrue(
          Precision.equals(result.get(i).getLeft(), TestFixtures.SME_FREQS.get(i), TOLERANCE));
      // The python code does not directly calculate H(f) for the requested f.  Instead, it
      // calculates H(f) for a mesh of frequencies from 0 to fNyquist, and interpolates to
      // get H(f) at f.  This process means that the output of the python code will be
      // close to, but not match, the result of directly calculating H(f) at f.
      assertTrue(
          Precision.equals(
              result.get(i).getRight().getReal(),
              TestFixtures.SME_RESPONSES.get(i).getLeft(),
              LOOSE_TOLERANCE));
      assertTrue(
          Precision.equals(
              result.get(i).getRight().getImaginary(),
              TestFixtures.SME_RESPONSES.get(i).getRight(),
              TOLERANCE));
    }

    // The last entry in the SME list is one of the interpolation values.  This should match
    // our calculation exactly
    assertTrue(
        Precision.equals(
            result.get(result.size() - 1).getRight().getReal(),
            TestFixtures.SME_RESPONSES.get(result.size() - 1).getLeft(),
            TOLERANCE));
  }

  @Test
  void testParseBlockBadInputs() {
    var badNumCoefficients = TestFixtures.TEST_INPUT.clone();
    badNumCoefficients[2] = "8";
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(badNumCoefficients, TestFixtures.TEST_FREQS));

    var parseError = TestFixtures.TEST_INPUT.clone();
    parseError[2] = "seven";
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(parseError, TestFixtures.TEST_FREQS));

    String[] tinyArray = {"2.343750E-01   0", "9.375000E-02  0", "1.562500E-02   0", "0"};
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(tinyArray, TestFixtures.TEST_FREQS));

    String[] giantArray = {
      "theoretical 5  digitizer   fir",
      "32000",
      "7",
      "1.562500E-02 0",
      "9.375000E-02 0",
      "2.343750E-01 0",
      "3.125000E-01        0",
      "2.343750E-01   0",
      "9.375000E-02  0",
      "1.562500E-02   0",
      "2.0 0",
      "0"
    };
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(giantArray, TestFixtures.TEST_FREQS));

    var tooManyEntries = TestFixtures.TEST_INPUT.clone();
    tooManyEntries[4] = "9.375000E-02 0 9.375000E-02 0";
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(tooManyEntries, TestFixtures.TEST_FREQS));

    var tooFewEntries = TestFixtures.TEST_INPUT.clone();
    tooFewEntries[4] = "9.375000E-02";
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(tooFewEntries, TestFixtures.TEST_FREQS));

    var badSampleFreq = TestFixtures.TEST_INPUT.clone();
    badSampleFreq[1] = "30 20";
    assertThrows(
        IllegalArgumentException.class,
        () -> firBlockParser.parseBlock(badSampleFreq, TestFixtures.TEST_FREQS));

    var goodArray = TestFixtures.TEST_INPUT.clone();
    assertDoesNotThrow(() -> firBlockParser.parseBlock(goodArray, TestFixtures.TEST_FREQS));
  }

  private static class TestFixtures {
    /**
     * The TEST_* data were calculated in Excel using an example FIR block from the Instrument
     * Response training and the formulas from the GMS wiki - Instrument Response architecture
     * guidance
     */
    private static final String[] TEST_INPUT = {
      "theoretical 5  digitizer   fir",
      "32000",
      "7",
      "1.562500E-02 0",
      "9.375000E-02 0  ",
      "  2.343750E-01 0",
      "3.125000E-01        0",
      "2.343750E-01   0",
      "9.375000E-02  0",
      "1.562500E-02   0",
      "0"
    };

    private static final List<Double> TEST_FREQS = List.of(1.0, 20.0, 800.0, 1600.0);

    private static final List<Complex> TEST_RESPONSES =
        List.of(
            Complex.valueOf(0.999999971085144, 0.0),
            Complex.valueOf(0.999988434116797, 0.0),
            Complex.valueOf(0.98164596034020, 0.0),
            Complex.valueOf(0.928366717592795, 0.0));

    /**
     * The SME_* data are a subset of the truth set provided by the SMEs using the TEST_INPUT FIR
     * file above.
     */
    private static final List<Double> SME_FREQS =
        List.of(
            0.020000000000000004,
            0.021117963888671577,
            0.022298419940161834,
            4.605053924358659,
            17.93849075734543,
            18.94122000154448,
            20.0,
            8003.90815828041);

    private static final List<Pair<Double, Double>> SME_RESPONSES =
        List.of(
            Pair.of(0.9999999954798501, 0.0),
            Pair.of(0.9999999952271819, 0.0),
            Pair.of(0.9999999949603899, 0.0),
            Pair.of(0.9999989592232964, 0.0),
            Pair.of(0.9999903281511321, 0.0),
            Pair.of(0.9999891950401827, 0.0),
            Pair.of(0.999987998590377, 0.0),
            Pair.of(Complex.valueOf(0.0002870997058453534, 0.12471212841810211).abs(), 0.0));
  }
}
