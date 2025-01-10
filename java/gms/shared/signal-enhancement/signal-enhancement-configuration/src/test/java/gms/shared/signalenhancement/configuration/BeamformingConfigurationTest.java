package gms.shared.signalenhancement.configuration;

import static com.google.common.base.Preconditions.checkNotNull;
import static gms.shared.derivedchannel.coi.BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE;
import static gms.shared.derivedchannel.coi.BeamTestFixtures.TXAR_BEAMFORMING_TEMPLATE;
import static gms.shared.derivedchannel.coi.BeamTestFixtures.TXAR_STATION;
import static gms.shared.derivedchannel.coi.BeamTestFixtures.TXAR_STATION_WRONG_CHANNELS;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.io.File;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class BeamformingConfigurationTest {

  @Mock private StationDefinitionAccessor stationDefinitionAccessor;

  private SignalEnhancementConfiguration signalEnhancementFilterConfiguration;
  private ConfigurationConsumerUtility configurationConsumerUtility;
  private ProcessingMaskDefinitionConfiguration processingMaskDefinitionConfiguration;

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
        new ProcessingMaskDefinitionConfiguration(configurationConsumerUtility);
  }

  @BeforeEach
  void setUp() {
    signalEnhancementFilterConfiguration =
        new SignalEnhancementConfiguration(
            stationDefinitionAccessor,
            configurationConsumerUtility,
            processingMaskDefinitionConfiguration);
    signalEnhancementFilterConfiguration.signalEnhancementBeamformingConfig =
        "global.beamforming-configuration";
    signalEnhancementFilterConfiguration.filterListDefinitionConfig =
        "global.filter-list-definition";
    signalEnhancementFilterConfiguration.filterMetadataConfig = "global.filter-metadata";
  }

  @Test
  void testStationVersionBeamformingTemplate() {

    var station = Station.createVersionReference("TXAR", Instant.EPOCH);
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;
    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(
                List.of(station.getName()), station.getEffectiveAt().get()))
        .thenReturn(List.of(TXAR_STATION));

    testBeamformingTemplate(station, phaseType, beamType, Optional.of(TXAR_BEAMFORMING_TEMPLATE));
  }

  @Test
  void testFullStationBeamformingTemplate() {
    var station = TXAR_STATION;
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;

    testBeamformingTemplate(station, phaseType, beamType, Optional.of(TXAR_BEAMFORMING_TEMPLATE));
  }

  @Test
  void testEmptyBeamformingChannels() {
    var station = TXAR_STATION_WRONG_CHANNELS;
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;

    testBeamformingTemplate(station, phaseType, beamType, Optional.empty());
  }

  @Test
  void testEmptyStationBeamformingTemplate() {

    var station = Station.createVersionReference("TXAR", Instant.EPOCH);
    var phaseType = PhaseType.P;
    var beamType = BeamType.EVENT;
    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(
                List.of(station.getName()), station.getEffectiveAt().get()))
        .thenReturn(List.of());

    testBeamformingTemplate(station, phaseType, beamType, Optional.empty());
  }

  @Test
  void testFilterDefinitionReferenceBeamformingTemplate() {
    var station = UtilsTestFixtures.TEST_STATION;
    var phaseType = PhaseType.WILD_CARD;
    var beamType = BeamType.CONTINUOUS_LOCATION;

    testBeamformingTemplate(
        station, phaseType, beamType, Optional.of(CONTINUOUS_BEAMFORMING_TEMPLATE));
  }

  @Test
  void testEmptyBeamformingConfiguration() {
    var station = TXAR_STATION;
    var phaseType = PhaseType.LR;
    var beamType = BeamType.FK;

    var beamformingTemplate =
        signalEnhancementFilterConfiguration.getBeamformingTemplate(station, phaseType, beamType);
    assertTrue(beamformingTemplate.isEmpty());
  }

  /**
   * Test method for executing the beamforming template creator
   *
   * @param station input {@link Station}
   * @param phaseType input {@link PhaseType}
   * @param beamType input {@link BeamType}
   */
  private void testBeamformingTemplate(
      Station station,
      PhaseType phaseType,
      BeamType beamType,
      Optional<BeamformingTemplate> expectedTemplate) {
    var beamformingTemplate =
        signalEnhancementFilterConfiguration.getBeamformingTemplate(station, phaseType, beamType);

    assertNotNull(beamformingTemplate);
    Assertions.assertEquals(expectedTemplate, beamformingTemplate);
  }

  @ParameterizedTest
  @MethodSource("beamformingTemplateInputs")
  void testBeamformingTemplateInputs(
      Station station,
      PhaseType phaseType,
      BeamType beamType,
      Class<? extends Exception> expectedExceptionClass) {
    testBeamformingTemplateThrows(station, phaseType, beamType, expectedExceptionClass);
  }

  static Stream<Arguments> beamformingTemplateInputs() {
    return Stream.of(
        arguments(null, PhaseType.I, BeamType.CONTINUOUS_LOCATION, NullPointerException.class),
        arguments(TXAR_STATION, null, BeamType.CONTINUOUS_LOCATION, NullPointerException.class),
        arguments(TXAR_STATION, PhaseType.I, null, NullPointerException.class),
        arguments(
            Station.createVersionReference("ANMO", Instant.EPOCH),
            PhaseType.P,
            BeamType.EVENT,
            IllegalArgumentException.class),
        arguments(
            Station.createVersionReference("BDFB", Instant.EPOCH),
            PhaseType.P,
            BeamType.EVENT,
            IllegalArgumentException.class));
  }

  /**
   * Test method for checking different exceptions
   *
   * @param station
   * @param phaseType
   * @param beamType
   * @param expectedExceptionClass
   */
  private void testBeamformingTemplateThrows(
      Station station,
      PhaseType phaseType,
      BeamType beamType,
      Class<? extends Exception> expectedExceptionClass) {

    assertThrows(
        expectedExceptionClass,
        () ->
            signalEnhancementFilterConfiguration.getBeamformingTemplate(
                station, phaseType, beamType));
  }
}
