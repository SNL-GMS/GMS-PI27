package gms.shared.stationdefinition.configuration;

import static com.google.common.base.Preconditions.checkNotNull;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA2_PARAM_MAP;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.common.coi.types.BeamSummation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.derivedchannel.coi.BeamDescription;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategoryAndType;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.stationdefinition.coi.qc.TaperDefinition;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.configuration.utils.StationDefinitionBridgeConfigurationTestUtility;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.io.File;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
class StationDefinitionBridgeConfigurationTest {

  private static final Location PROCESSING_MASK_LOCATION =
      Location.from(35.0, -125.0, 100.0, 5500.0);

  private ProcessingMaskDefinitionBridgeConfiguration processingMaskDefinitionConfiguration;
  private EventBeamConfiguration eventBeamConfiguration;
  private BeamformingTemplateConfiguration beamformingTemplateConfiguration;
  private ConfigurationConsumerUtility configurationConsumerUtility;
  private StationDefinitionBridgeConfigurationTestUtility
      stationDefinitionBridgeConfigurationTestUtility;

  StationDefinitionBridgeConfiguration stationDefinitionBridgeConfiguration;

  @BeforeAll
  void init() {
    var configurationRoot =
        checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();

    processingMaskDefinitionConfiguration =
        new ProcessingMaskDefinitionBridgeConfiguration(configurationConsumerUtility);
    eventBeamConfiguration = new EventBeamConfiguration(configurationConsumerUtility);
    beamformingTemplateConfiguration =
        new BeamformingTemplateConfiguration(configurationConsumerUtility);
    stationDefinitionBridgeConfigurationTestUtility =
        new StationDefinitionBridgeConfigurationTestUtility(configurationConsumerUtility);

    processingMaskDefinitionConfiguration.processingMaskDefinitionConfig =
        "station-definition-manager.processing-mask-definition";
    eventBeamConfiguration.beamPhaseConfig =
        "station-definition-manager" + ".event-beam-configuration";
  }

  @BeforeEach
  void setUp() {
    stationDefinitionBridgeConfiguration =
        new StationDefinitionBridgeConfiguration(
            processingMaskDefinitionConfiguration,
            eventBeamConfiguration,
            beamformingTemplateConfiguration);
  }

  @Test
  void testResolveProcessingMaskDefinition() {
    var testChannel =
        UtilsTestFixtures.createTestChannelForProcessingMaskConfiguration(
            "ASAR",
            "AS31",
            "BHZ",
            ChannelBandType.BROADBAND,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            PROCESSING_MASK_LOCATION);
    var actualPMD =
        stationDefinitionBridgeConfiguration.getProcessingMaskDefinition(
            ProcessingOperation.FK_SPECTRA, testChannel, PhaseType.P);

    // 22 QcSegmentCategoryAndType values expected
    var qcExpectedSet =
        Set.of(
            QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.AGGREGATE),
            QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.FLAT),
            QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.GAP),
            QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY),
            QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.SPIKE),
            QcSegmentCategoryAndType.create(QcSegmentCategory.LONG_TERM),
            QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.AGGREGATE),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.CALIBRATION),
            QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.FLAT),
            QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.GAP),
            QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.NOISY),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.SENSOR_PROBLEM),
            QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.SPIKE),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.STATION_PROBLEM),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.STATION_SECURITY),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.TIMING),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.STATION_SOH, QcSegmentType.CALIBRATION),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.STATION_SOH, QcSegmentType.SENSOR_PROBLEM),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.STATION_SOH, QcSegmentType.STATION_PROBLEM),
            QcSegmentCategoryAndType.create(
                QcSegmentCategory.STATION_SOH, QcSegmentType.STATION_SECURITY),
            QcSegmentCategoryAndType.create(QcSegmentCategory.UNPROCESSED));

    var expectedPMD =
        new ProcessingMaskDefinition(
            Duration.ofSeconds(1),
            ProcessingOperation.FK_SPECTRA,
            qcExpectedSet,
            new TaperDefinition(4, TaperFunction.BLACKMAN));
    stationDefinitionBridgeConfigurationTestUtility.verifyProcessingMaskDefinition(
        expectedPMD, actualPMD);
  }

  @Test
  void testResolveBeamPhase() {
    Map<String, PhaseType> inputMap = new HashMap<>();
    inputMap.put("szb", PhaseType.P);
    inputMap.put("Pgb", PhaseType.Pg);
    inputMap.put("Pnb", PhaseType.Pn);
    inputMap.put("MTB", PhaseType.LQ);
    inputMap.put("MZB", PhaseType.LR);
    inputMap.put("lzb", PhaseType.LR);
    inputMap.put("ltb", PhaseType.LQ);

    PhaseTypesByBeamDescriptions expectedBeamPhase = PhaseTypesByBeamDescriptions.from(inputMap);

    PhaseTypesByBeamDescriptions actualBeamPhase =
        stationDefinitionBridgeConfiguration.getBeamPhase();

    Assertions.assertEquals(expectedBeamPhase, actualBeamPhase);
  }

  @Test
  void testResolveBeamformingTemplate() {
    var station = UtilsTestFixtures.getStationForDaos();
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;

    var expectedChannel =
        Channel.createVersionReference(
            UtilsTestFixtures.createTestChannelForDao(
                CssDaoAndCoiParameters.REFERENCE_STATION,
                STA2,
                CHAN3,
                SITE_DAO_3,
                CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
                STA2_PARAM_MAP,
                CssDaoAndCoiParameters.CHAN_PARAM_MAP));

    var beamformingTemplateOpt =
        stationDefinitionBridgeConfiguration.getBeamformingTemplate(station, phaseType, beamType);

    var expectedBeamDescription =
        BeamDescription.builder()
            .setPhase(phaseType)
            .setBeamType(beamType)
            .setBeamSummation(BeamSummation.COHERENT)
            .setTwoDimensional(true)
            .setSamplingType(SamplingType.NEAREST_SAMPLE)
            .build();

    // first check the beam description, station and channels
    assertTrue(beamformingTemplateOpt.isPresent());
    var actualBeamformingTemplate = beamformingTemplateOpt.get();
    assertEquals(expectedBeamDescription, actualBeamformingTemplate.getBeamDescription());
    var beamformingChannels = actualBeamformingTemplate.getInputChannels();
    assertEquals(1, beamformingChannels.size());
    assertEquals(expectedChannel, beamformingChannels.get(0));
  }
}
