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
import gms.shared.stationdefinition.configuration.utils.StationDefinitionBridgeConfigurationTestUtility;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.io.File;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
class BeamformingTemplateConfigurationTest {

  private ConfigurationConsumerUtility configurationConsumerUtility;
  private ProcessingMaskDefinitionBridgeConfiguration processingMaskDefinitionConfiguration;
  private BeamformingTemplateConfiguration beamformingTemplateConfiguration;
  private StationDefinitionBridgeConfigurationTestUtility
      stationDefinitionBridgeConfigurationTestUtility;

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
    stationDefinitionBridgeConfigurationTestUtility =
        new StationDefinitionBridgeConfigurationTestUtility(configurationConsumerUtility);

    processingMaskDefinitionConfiguration =
        new ProcessingMaskDefinitionBridgeConfiguration(configurationConsumerUtility);
  }

  @BeforeEach
  void setUp() {
    beamformingTemplateConfiguration =
        new BeamformingTemplateConfiguration(configurationConsumerUtility);

    processingMaskDefinitionConfiguration.processingMaskDefinitionConfig =
        "station-definition-manager.processing-mask-definition";
  }

  @Test
  void testBeamformingTemplateDefault() {
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
        beamformingTemplateConfiguration.getBeamformingTemplate(station, phaseType, beamType);

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
    var beamformingTemplate = beamformingTemplateOpt.get();
    assertEquals(expectedBeamDescription, beamformingTemplate.getBeamDescription());
    var beamformingChannels = beamformingTemplate.getInputChannels();
    assertEquals(1, beamformingChannels.size());
    assertEquals(expectedChannel, beamformingChannels.get(0));
  }

  @Test
  void testBeamformingTemplateEmptyBeamConfiguration() {
    var station = UtilsTestFixtures.getStationForDaos();
    var phaseType = PhaseType.I;
    var beamType = BeamType.EVENT;

    var beamformingTemplateOpt =
        beamformingTemplateConfiguration.getBeamformingTemplate(station, phaseType, beamType);
    assertTrue(beamformingTemplateOpt.isEmpty());
  }

  @Test
  void testBeamformingTemplateUnpopulatedStation() {
    var station = UtilsTestFixtures.getStationVersion();
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;

    Assertions.assertThrows(
        IllegalStateException.class,
        () ->
            beamformingTemplateConfiguration.getBeamformingTemplate(station, phaseType, beamType));
  }

  @Test
  void testBeamformingTemplateEmptyBeamformingChannels() {
    var station = UtilsTestFixtures.getStationForDaosTwo();
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;

    var beamformingTemplateOpt =
        beamformingTemplateConfiguration.getBeamformingTemplate(station, phaseType, beamType);
    assertTrue(beamformingTemplateOpt.isEmpty());
  }
}
