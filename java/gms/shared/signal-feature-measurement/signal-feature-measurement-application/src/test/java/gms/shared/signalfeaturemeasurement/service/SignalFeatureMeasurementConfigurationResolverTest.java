package gms.shared.signalfeaturemeasurement.service;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplate;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import java.io.File;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
class SignalFeatureMeasurementConfigurationResolverTest {
  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalFeatureMeasurementConfigurationResolverTest.class);

  private static final String ASAR = "ASAR";
  private static final String MKAR = "MKAR";
  private static final String CMAR = "CMAR";

  private ConfigurationConsumerUtility configurationConsumerUtility;
  private SignalFeatureMeasurementConfigurationResolver
      signalFeatureMeasurementConfigurationResolver;

  @BeforeAll
  void init() {
    var configurationRoot =
        Preconditions.checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();

    signalFeatureMeasurementConfigurationResolver =
        new SignalFeatureMeasurementConfigurationResolver(configurationConsumerUtility);
  }

  @BeforeEach
  void setUp() {
    signalFeatureMeasurementConfigurationResolver.stationsByFeatureMeasurementTypeConfig =
        "signal-feature-measurement.stations-by-feature-measurement-type";
    signalFeatureMeasurementConfigurationResolver.amplitudeMeasurementDefinitionsConfig =
        "signal-feature-measurement.amplitude-measurement-definitions";
    signalFeatureMeasurementConfigurationResolver.amplitudeMeasurementConditioningTemplateConfig =
        "global.amplitude-measurement-conditioning-template";
  }

  @ParameterizedTest
  @MethodSource("resolveStationsByMeasurementType")
  void testResolveStationsByMeasurementType(
      AmplitudeMeasurementType amplitudeType, int expectedNumberOfStations) {
    var stations =
        signalFeatureMeasurementConfigurationResolver.getDefaultStationsToMeasure(amplitudeType);

    Assertions.assertEquals(expectedNumberOfStations, stations.size());
  }

  private static Stream<Arguments> resolveStationsByMeasurementType() {
    return Stream.of(
        arguments(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2, 223),
        arguments(FeatureMeasurementTypes.AMPLITUDE_ANP_OVER_2, 45));
  }

  @ParameterizedTest
  @MethodSource("resolveAmdByMeasurementType")
  void testResolveAmdByMeasurementType(
      AmplitudeMeasurementType amplitudeType, int expectedNumberOfPhases) {
    var actual =
        signalFeatureMeasurementConfigurationResolver.getAmplitudeMeasurementDefinition(
            amplitudeType);

    Assertions.assertEquals(amplitudeType, actual.type());
    Assertions.assertEquals(expectedNumberOfPhases, actual.phases().size());
  }

  private static Stream<Arguments> resolveAmdByMeasurementType() {
    return Stream.of(
        arguments(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2, 29),
        arguments(FeatureMeasurementTypes.AMPLITUDE_ANL_OVER_2, 30),
        arguments(FeatureMeasurementTypes.AMPLITUDE_ALR_OVER_2, 1));
  }

  @ParameterizedTest
  @MethodSource("inputDefaultTemplateArguments")
  void testResolveDefaultAmplitudeMeasurementConditioningTemplate(
      String stationName, AmplitudeMeasurementType amplitudeType) {
    Station station =
        DefaultCoiTestFixtures.getDefaultStation().toBuilder().setName(stationName).build();

    Optional<AmplitudeMeasurementConditioningTemplate> amctOptional =
        signalFeatureMeasurementConfigurationResolver.getAmplitudeMeasurementConditioningTemplate(
            station, amplitudeType);

    Assertions.assertTrue(amctOptional.isPresent());
    var amct = amctOptional.get();
    switch (stationName) {
      case ASAR -> Assertions.assertTrue(amct.beamformingTemplate().isPresent());
      case CMAR -> Assertions.assertTrue(amct.rotationTemplate().isPresent());
      default -> Assertions.assertTrue(amct.measuredChannel().isPresent());
    }
  }

  static Stream<Arguments> inputDefaultTemplateArguments() {
    return Stream.of(
        arguments(ASAR, FeatureMeasurementTypes.AMPLITUDE_ALR_OVER_2),
        arguments(MKAR, FeatureMeasurementTypes.ROOT_MEAN_SQUARE),
        arguments(CMAR, FeatureMeasurementTypes.AMPLITUDE_ANL_OVER_2));
  }

  @ParameterizedTest
  @MethodSource("inputAmplitudeMeasurementConditioningTemplate")
  void testResolveAmplitudeMeasurementConditioningTemplate(String stationName) {

    Station station =
        DefaultCoiTestFixtures.getDefaultStation().toBuilder().setName(stationName).build();

    Optional<AmplitudeMeasurementConditioningTemplate> amctOptional =
        signalFeatureMeasurementConfigurationResolver.getAmplitudeMeasurementConditioningTemplate(
            station, FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2);

    Assertions.assertTrue(amctOptional.isPresent());

    if (amctOptional.isPresent()) {
      var actual = amctOptional.get();
      Assertions.assertEquals(
          FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2, actual.amplitudeMeasurementType());
      Assertions.assertEquals(stationName, actual.station().getName());
      Assertions.assertEquals("0.8 4.5 3 BP causal", actual.filterDefinition().get().getName());
    }
  }

  static Stream<Arguments> inputAmplitudeMeasurementConditioningTemplate() {
    return Stream.of(arguments(CMAR), arguments(MKAR), arguments(ASAR));
  }
}
