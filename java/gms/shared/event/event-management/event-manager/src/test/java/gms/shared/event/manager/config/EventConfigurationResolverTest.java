package gms.shared.event.manager.config;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.io.File;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EventConfigurationResolverTest {

  private ConfigurationConsumerUtility configurationConsumerUtility;

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
  }

  @Test
  void testGetPredictionDefinitions() {

    var eventManagerConfiguration = new EventConfigurationResolver(configurationConsumerUtility);
    var resolvedPredictionDefinitions = eventManagerConfiguration.resolvePredictionDefinitions();

    var expectedPredictionDefinitions =
        List.of(
            FeaturePredictionsDefinitions.create(
                "Iaspei", List.of(), List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)));

    Assertions.assertEquals(expectedPredictionDefinitions, resolvedPredictionDefinitions);
  }

  @Test
  void testGetPredictionDefinitionsStation() {
    var eventManagerConfiguration = new EventConfigurationResolver(configurationConsumerUtility);
    var resolvedPredictionDefinitions =
        eventManagerConfiguration.resolvePredictionDefinitions(
            "ASAR", "badChannel", PhaseType.P4KPdf_B, -99.0);

    var expectedPredictionDefinitions =
        List.of(
            FeaturePredictionsDefinitions.create(
                "Iaspei",
                List.of(),
                List.of(
                    FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE,
                    FeaturePredictionType.SOURCE_TO_RECEIVER_AZIMUTH_PREDICTION_TYPE)));

    Assertions.assertEquals(expectedPredictionDefinitions, resolvedPredictionDefinitions);
  }

  @Test
  void testGetPredictionDefinitionsChannel() {
    var eventManagerConfiguration = new EventConfigurationResolver(configurationConsumerUtility);
    var resolvedPredictionDefinitions =
        eventManagerConfiguration.resolvePredictionDefinitions(
            "ASAR", "CHANNEL_ONE", PhaseType.P4KPdf_B, -99.0);

    var expectedPredictionDefinitions =
        List.of(
            FeaturePredictionsDefinitions.create(
                "Iaspei",
                List.of(),
                List.of(FeaturePredictionType.EMERGENCE_ANGLE_PREDICTION_TYPE)));

    Assertions.assertEquals(expectedPredictionDefinitions, resolvedPredictionDefinitions);
  }

  @Test
  void testGetPredictionDefinitionsPhase() {
    var eventManagerConfiguration = new EventConfigurationResolver(configurationConsumerUtility);
    var resolvedPredictionDefinitions =
        eventManagerConfiguration.resolvePredictionDefinitions(
            "badStation", "badChannel", PhaseType.P, -99.0);

    var expectedPredictionDefinitions =
        List.of(
            FeaturePredictionsDefinitions.create(
                "Iaspei", List.of(), List.of(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE)));

    Assertions.assertEquals(expectedPredictionDefinitions, resolvedPredictionDefinitions);
  }

  @Test
  void testGetPredictionDefinitionsDistance() {
    var eventManagerConfiguration = new EventConfigurationResolver(configurationConsumerUtility);
    var resolvedPredictionDefinitions =
        eventManagerConfiguration.resolvePredictionDefinitions(
            "badStation", "badChannel", PhaseType.P4KPdf_B, 60.0);

    var expectedPredictionDefinitions =
        List.of(
            FeaturePredictionsDefinitions.create(
                "Iaspei",
                List.of(),
                List.of(FeaturePredictionType.SOURCE_TO_RECEIVER_DISTANCE_PREDICTION_TYPE)));

    Assertions.assertEquals(expectedPredictionDefinitions, resolvedPredictionDefinitions);
  }
}
