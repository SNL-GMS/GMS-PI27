package gms.shared.stationdefinition.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.AmplitudePhaseResponse;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseBridgeConfiguration;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseDefinition;
import gms.shared.stationdefinition.configuration.FrequencySamplingMode;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.enums.Band;
import gms.shared.stationdefinition.dao.css.enums.Digital;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(MockitoExtension.class)
@ExtendWith(OutputCaptureExtension.class)
class BridgedFrequencyAmplitudePhaseRepositoryTest {

  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;
  @Mock private InstrumentDatabaseConnector instrumentDatabaseConnector;

  @Mock
  private FrequencyAmplitudePhaseBridgeConfiguration frequencyAmplitudePhaseBridgeConfiguration;

  private BridgedFrequencyAmplitudePhaseRepository repository;

  @BeforeEach
  void setup() {
    repository =
        new BridgedFrequencyAmplitudePhaseRepository(
            stationDefinitionIdUtility,
            instrumentDatabaseConnector,
            frequencyAmplitudePhaseBridgeConfiguration);
  }

  @Test
  void testBadUuid(CapturedOutput capturedOutput) {
    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Channel name not found for FAP UUID: " + TestFixtures.DUMMY_UUID.toString()));
  }

  @Test
  void testBadChannelNameParseIntoTypes(CapturedOutput capturedOutput) {
    when(stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.BAD_PARSE_CHANNEL_NAME));

    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Channel name "
                    + TestFixtures.BAD_PARSE_CHANNEL_NAME
                    + " did not parse into types for FAP UUID: "
                    + TestFixtures.DUMMY_UUID.toString()));
  }

  @Test
  void testBadChannelNameMatch(CapturedOutput capturedOutput) {
    when(stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.BAD_MATCH_CHANNEL_NAME));

    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Channel name "
                    + TestFixtures.BAD_MATCH_CHANNEL_NAME
                    + " did not parse into station/group/fdsn for FAP UUID: "
                    + TestFixtures.DUMMY_UUID.toString()));
  }

  @Test
  void testNoInstrumentDaoId(CapturedOutput capturedOutput) {
    when(stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.GOOD_CHANNEL_NAME));

    when(frequencyAmplitudePhaseBridgeConfiguration.getFrequencyAmplitudePhaseDefinition(
            any(), any(), any(), any(), any()))
        .thenReturn(TestFixtures.FAP_DEF);

    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "InstrumentDao ID not found for FAP UUID: " + TestFixtures.DUMMY_UUID.toString()));
  }

  @Test
  void testNoInstrumentDao(CapturedOutput capturedOutput) {
    when(stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.GOOD_CHANNEL_NAME));

    when(frequencyAmplitudePhaseBridgeConfiguration.getFrequencyAmplitudePhaseDefinition(
            any(), any(), any(), any(), any()))
        .thenReturn(TestFixtures.FAP_DEF);

    when(stationDefinitionIdUtility.retrieveInstrumentIdFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.INST_ID));

    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "InstrumentDao not found for InstrumentDao ID: "
                    + TestFixtures.INST_ID
                    + " / FAP UUID: "
                    + TestFixtures.DUMMY_UUID.toString()));
  }

  @Test
  void testMultipleDaos(CapturedOutput capturedOutput) {
    when(stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.GOOD_CHANNEL_NAME));

    when(frequencyAmplitudePhaseBridgeConfiguration.getFrequencyAmplitudePhaseDefinition(
            any(), any(), any(), any(), any()))
        .thenReturn(TestFixtures.FAP_DEF);

    when(stationDefinitionIdUtility.retrieveInstrumentIdFromFrequencyAmplitudePhaseUUID(any()))
        .thenReturn(Optional.of(TestFixtures.INST_ID));

    var dao = TestFixtures.getInstrumentDao();
    when(instrumentDatabaseConnector.findInstruments(any())).thenReturn(List.of(dao, dao));

    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    // The returned FAP is an entity reference because the instrument response file cannot be found
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Multiple InstrumentDaos found for InstrumentDao ID: "
                    + TestFixtures.INST_ID
                    + " - using the first result"));
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Instrument response file '"
                    + dao.getDirectory()
                    + dao.getDataFile()
                    + "' could not be read"));
  }

  @Test
  void testSingleDao(CapturedOutput capturedOutput) {
    when(stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(
            TestFixtures.DUMMY_UUID))
        .thenReturn(Optional.of(TestFixtures.GOOD_CHANNEL_NAME));

    when(frequencyAmplitudePhaseBridgeConfiguration.getFrequencyAmplitudePhaseDefinition(
            "ASAR", "SHZ", "AS01", "S", "H"))
        .thenReturn(TestFixtures.FAP_DEF);

    when(stationDefinitionIdUtility.retrieveInstrumentIdFromFrequencyAmplitudePhaseUUID(
            TestFixtures.DUMMY_UUID))
        .thenReturn(Optional.of(TestFixtures.INST_ID));

    var dao = TestFixtures.getInstrumentDao();
    when(instrumentDatabaseConnector.findInstruments(List.of(TestFixtures.INST_ID)))
        .thenReturn(List.of(dao));

    var result = repository.findFrequencyAmplitudePhaseById(TestFixtures.DUMMY_UUID);
    // The returned FAP is an entity reference because the instrument response file cannot be found
    assertEquals(FrequencyAmplitudePhase.createEntityReference(TestFixtures.DUMMY_UUID), result);
    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Instrument response file '"
                    + dao.getDirectory()
                    + dao.getDataFile()
                    + "' could not be read"));
  }

  private static class TestFixtures {
    private static final UUID DUMMY_UUID = UUID.fromString("80a97730-22fa-416a-9b41-6d9ba5008a51");
    private static final String BAD_PARSE_CHANNEL_NAME = "ASAR.AS01.S";
    private static final String BAD_MATCH_CHANNEL_NAME = "ASAR.AS01";
    private static final String GOOD_CHANNEL_NAME = "ASAR.AS01.SHZ";
    private static final Long INST_ID = 12345L;

    private static final FrequencyAmplitudePhaseDefinition FAP_DEF =
        new FrequencyAmplitudePhaseDefinition(1.0, 100.0, FrequencySamplingMode.LOG, 4000);

    private static final FrequencyAmplitudePhase FAP =
        FrequencyAmplitudePhase.builder()
            .setId(DUMMY_UUID)
            .setData(
                FrequencyAmplitudePhase.Data.builder()
                    .setFrequencies(List.of(1.0))
                    .setAmplitudePhaseResponses(
                        List.of(
                            AmplitudePhaseResponse.from(
                                DoubleValue.from(0.0, Optional.of(0.0), Units.UNITLESS),
                                DoubleValue.from(0.0, Optional.of(0.0), Units.UNITLESS))))
                    .setNominalSampleRateHz(0.0)
                    .setNominalCalibration(UtilsTestFixtures.calibration)
                    .build())
            .build();

    private static InstrumentDao getInstrumentDao() {
      var dao = new InstrumentDao();
      dao.setBand(Band.BROADBAND);
      dao.setDataFile("dummy-file-name");
      dao.setDigital(Digital.DIGITAL);
      dao.setDirectory("dummy/file/");
      dao.setInstrumentId(INST_ID);
      dao.setLoadDate(Instant.MIN);
      dao.setNominalCalibrationFactor(1.0);
      dao.setNominalCalibrationPeriod(1.0);
      dao.setResponseType("dummy-response-type");
      dao.setSampleRate(1.0);
      return dao;
    }
  }
}
