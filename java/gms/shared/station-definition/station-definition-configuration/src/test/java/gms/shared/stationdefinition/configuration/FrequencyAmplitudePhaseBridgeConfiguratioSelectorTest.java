package gms.shared.stationdefinition.configuration;

import static com.google.common.base.Preconditions.checkNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelNameUtilities;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.io.File;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FrequencyAmplitudePhaseBridgeConfiguratioSelectorTest {

  private static final Location LOCATION = Location.from(35.0, -125.0, 100.0, 5500.0);

  private FrequencyAmplitudePhaseBridgeConfiguration fapConfig;
  private ConfigurationConsumerUtility configurationConsumerUtility;

  @BeforeAll
  void init() {
    var configurationRoot =
        checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"),
                "Unable to find configuration-base test directory")
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();
  }

  @BeforeEach
  void setUp() {
    fapConfig = new FrequencyAmplitudePhaseBridgeConfiguration(configurationConsumerUtility);
    fapConfig.instrumentResponseDefinitionConfig =
        "station-definition.frequency-amplitude-phase-fap-definition-selector-test";
  }

  @Test
  void testFrequencyAmplitudePhaseDefinitionSelectorDefault() {
    var expectedDefinition =
        new FrequencyAmplitudePhaseDefinition(5, 6, FrequencySamplingMode.LOG, 1024);

    var testChannel =
        UtilsTestFixtures.createTestChannelForProcessingMaskConfiguration(
            "STAT",
            "beam",
            "QAR",
            ChannelBandType.PERIOD_GREATER_TEN_DAYS,
            ChannelInstrumentType.TEMPERATURE,
            ChannelOrientationType.RADIAL,
            LOCATION);

    String station = testChannel.getStation().getName();
    String fdsnChannelName = ChannelNameUtilities.getFdsnChannelName(testChannel);
    String channelGroup =
        testChannel
            .getProcessingMetadata()
            .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
            .toString();
    String channelBand = String.valueOf(testChannel.getChannelBandType().getCode());
    String channelInstrument = String.valueOf(testChannel.getChannelInstrumentType().getCode());

    var definition =
        fapConfig.getFrequencyAmplitudePhaseDefinition(
            station, fdsnChannelName, channelGroup, channelBand, channelInstrument);
    assertEquals(expectedDefinition, definition);
  }

  @Test
  void testFrequencyAmplitudePhaseDefinitionSelectorStation() {
    var expectedDefinition =
        new FrequencyAmplitudePhaseDefinition(7.0, 8, FrequencySamplingMode.LINEAR, 2048);

    var testChannel =
        UtilsTestFixtures.createTestChannelForProcessingMaskConfiguration(
            "ASAR",
            "beam",
            "QAR",
            ChannelBandType.PERIOD_GREATER_TEN_DAYS,
            ChannelInstrumentType.TEMPERATURE,
            ChannelOrientationType.RADIAL,
            LOCATION);

    String station = testChannel.getStation().getName();
    String fdsnChannelName = ChannelNameUtilities.getFdsnChannelName(testChannel);
    String channelGroup =
        testChannel
            .getProcessingMetadata()
            .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
            .toString();
    String channelBand = String.valueOf(testChannel.getChannelBandType().getCode());
    String channelInstrument = String.valueOf(testChannel.getChannelInstrumentType().getCode());

    var definition =
        fapConfig.getFrequencyAmplitudePhaseDefinition(
            station, fdsnChannelName, channelGroup, channelBand, channelInstrument);
    assertEquals(expectedDefinition, definition);
  }

  @Test
  void testFrequencyAmplitudePhaseDefinitionSelectorChannelBand() {
    var expectedDefinition =
        new FrequencyAmplitudePhaseDefinition(9.0, 10.0, FrequencySamplingMode.LOG, 4098);

    var testChannel =
        UtilsTestFixtures.createTestChannelForProcessingMaskConfiguration(
            "TEST1",
            "beam",
            "SHZ",
            ChannelBandType.SHORT_PERIOD,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            LOCATION);

    String station = testChannel.getStation().getName();
    String fdsnChannelName = ChannelNameUtilities.getFdsnChannelName(testChannel);
    String channelGroup =
        testChannel
            .getProcessingMetadata()
            .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
            .toString();
    String channelBand = String.valueOf(testChannel.getChannelBandType().getCode());
    String channelInstrument = String.valueOf(testChannel.getChannelInstrumentType().getCode());

    var definition =
        fapConfig.getFrequencyAmplitudePhaseDefinition(
            station, fdsnChannelName, channelGroup, channelBand, channelInstrument);
    assertEquals(expectedDefinition, definition);
  }

  @Test
  void testFrequencyAmplitudePhaseDefinitionSelectorChannelInstrument() {
    var expectedDefinition =
        new FrequencyAmplitudePhaseDefinition(1e-3, 1e-1, FrequencySamplingMode.LINEAR, 2);

    var testChannel =
        UtilsTestFixtures.createTestChannelForProcessingMaskConfiguration(
            "TEST2",
            "beam",
            "EHZ",
            ChannelBandType.EXTREMELY_SHORT_PERIOD,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            LOCATION);

    String station = testChannel.getStation().getName();
    String fdsnChannelName = ChannelNameUtilities.getFdsnChannelName(testChannel);
    String channelGroup =
        testChannel
            .getProcessingMetadata()
            .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
            .toString();
    String channelBand = String.valueOf(testChannel.getChannelBandType().getCode());
    String channelInstrument = String.valueOf(testChannel.getChannelInstrumentType().getCode());

    var definition =
        fapConfig.getFrequencyAmplitudePhaseDefinition(
            station, fdsnChannelName, channelGroup, channelBand, channelInstrument);
    assertEquals(expectedDefinition, definition);
  }
}
