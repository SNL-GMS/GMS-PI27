package gms.shared.signalfeaturemeasurement.service;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementConditioningTemplateRequest;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementTypeRequest;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import java.io.File;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SignalFeatureMeasurementConfigurationServiceTest {

  private static final String SLOWNESS = "SLOWNESS";

  private ConfigurationConsumerUtility configurationConsumerUtility;
  private SignalFeatureMeasurementConfigurationResolver
      signalFeatureMeasurementConfigurationResolver;
  private SignalFeatureMeasurementConfigurationService signalFeatureMeasurementConfigurationService;

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
    signalFeatureMeasurementConfigurationService =
        new SignalFeatureMeasurementConfigurationService(
            signalFeatureMeasurementConfigurationResolver);
  }

  @BeforeEach
  void setUp() {
    signalFeatureMeasurementConfigurationResolver.stationsByFeatureMeasurementTypeConfig =
        "signal-feature-measurement.stations-by-feature-measurement-type";

    signalFeatureMeasurementConfigurationResolver.amplitudeMeasurementConditioningTemplateConfig =
        "global.amplitude-measurement-conditioning-template";

    signalFeatureMeasurementConfigurationResolver.amplitudeMeasurementDefinitionsConfig =
        "signal-feature-measurement.amplitude-measurement-definitions";
  }

  @ParameterizedTest
  @MethodSource("resolveStationsByMeasurementType")
  void testResolveStationsByMeasurementType(
      AmplitudeMeasurementType amplitudeType, int expectedNumberOfStations) {
    var amplitudeMeasurementTypeRequest =
        new AmplitudeMeasurementTypeRequest(ImmutableList.of(amplitudeType));

    var defaultType =
        signalFeatureMeasurementConfigurationService.getDefaultStationsToMeasureByAmplitudeType(
            amplitudeMeasurementTypeRequest);
    var data = defaultType.data();

    for (var entry : data.entrySet()) {
      Assertions.assertEquals(
          amplitudeType.getFeatureMeasurementTypeName(),
          entry.getKey().getFeatureMeasurementTypeName());
      Assertions.assertEquals(amplitudeType, entry.getKey());
      Assertions.assertEquals(expectedNumberOfStations, entry.getValue().size());
    }
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
    var amplitudeMeasurementTypeRequest =
        new AmplitudeMeasurementTypeRequest(ImmutableList.of(amplitudeType));

    Collection<AmplitudeMeasurementDefinition> amds =
        signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementDefinitions(
            amplitudeMeasurementTypeRequest);
    amds.forEach(actual -> Assertions.assertEquals(amplitudeType, actual.type()));
    amds.forEach(actual -> Assertions.assertEquals(expectedNumberOfPhases, actual.phases().size()));
  }

  private static Stream<Arguments> resolveAmdByMeasurementType() {
    return Stream.of(
        arguments(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2, 29),
        arguments(FeatureMeasurementTypes.AMPLITUDE_ANL_OVER_2, 30),
        arguments(FeatureMeasurementTypes.AMPLITUDE_ALR_OVER_2, 1));
  }

  @ParameterizedTest
  @MethodSource("resolveAmct")
  void testResolveGetAmplitudeMeasurementConditioningTemplates(
      AmplitudeMeasurementType amplitudeType, String stationName) {
    Station station =
        DefaultCoiTestFixtures.getDefaultStation().toBuilder().setName(stationName).build();
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(station.toEntityReference()), ImmutableList.of(amplitudeType));
    var result =
        signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementConditioningTemplates(
            request);
    Assertions.assertEquals(1, result.table().size());
    Assertions.assertEquals(stationName, result.table().columnKeySet().iterator().next().getName());
  }

  private static Stream<Arguments> resolveAmct() {
    return Stream.of(
        arguments(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2, "ASAR", 1),
        arguments(FeatureMeasurementTypes.AMPLITUDE_ANL_OVER_2, "CMAR"));
  }

  @Test
  void testResolveGetAmplitudeMeasurementConditioningTemplatesAllEmpty() {
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(ImmutableList.of(), ImmutableList.of());
    var result =
        signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementConditioningTemplates(
            request);
    Assertions.assertEquals(0, result.table().size());
  }

  @Test
  void testResolveGetAmplitudeMeasurementConditioningTemplatesEmptyAmplitudeMeasurementTypes() {

    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(DefaultCoiTestFixtures.getDefaultStation()), ImmutableList.of());
    var result =
        signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementConditioningTemplates(
            request);
    Assertions.assertEquals(0, result.table().size());
  }

  @Test
  void testResolveGetAmplitudeMeasurementConditioningTemplatesEmptyStations() {
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(), ImmutableList.of(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2));
    var result =
        signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementConditioningTemplates(
            request);
    Assertions.assertEquals(0, result.table().size());
  }

  @Test
  void testResolveGetAmplitudeMeasurementConditioningTemplatesIncorrectMeasurementType() {
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(), ImmutableList.of(AmplitudeMeasurementType.from(SLOWNESS)));
    var exceptionMessage =
        Assertions.assertThrows(
            InvalidInputException.class,
            () ->
                signalFeatureMeasurementConfigurationService
                    .getAmplitudeMeasurementConditioningTemplates(request));
    var expectedMsg =
        "Encountered type [" + SLOWNESS + "] that isn't a recognized AmplitudeMeasurementType";
    Assertions.assertEquals(expectedMsg, exceptionMessage.getLocalizedMessage());
  }

  @Test
  void testResolveGetAmplitudeMeasurementConditioningTemplatesInvalidMeasurementType() {
    var invalidTypeString = "BADINPUT";
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(), ImmutableList.of(AmplitudeMeasurementType.from(invalidTypeString)));
    var exceptionMessage =
        Assertions.assertThrows(
            InvalidInputException.class,
            () ->
                signalFeatureMeasurementConfigurationService
                    .getAmplitudeMeasurementConditioningTemplates(request));
    var expectedMsg =
        "Encountered type ["
            + invalidTypeString
            + "] that isn't a recognized FeatureMeasurementType";
    Assertions.assertEquals(expectedMsg, exceptionMessage.getLocalizedMessage());
  }
}
