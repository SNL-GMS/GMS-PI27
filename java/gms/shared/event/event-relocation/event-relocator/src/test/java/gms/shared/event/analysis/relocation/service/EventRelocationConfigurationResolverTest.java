package gms.shared.event.analysis.relocation.service;

import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.io.File;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@TestInstance(Lifecycle.PER_CLASS)
class EventRelocationConfigurationResolverTest {

  private EventRelocationConfigurationResolver eventRelocationConfigurationResolver;
  private ConfigurationConsumerUtility configurationConsumerUtility;

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
  }

  @BeforeEach
  void setUp() {
    eventRelocationConfigurationResolver =
        new EventRelocationConfigurationResolver(
            configurationConsumerUtility,
            "event-relocation-service.event-relocation-processing-definition",
            "event-relocation-service.event-relocation-predictors-for-phases",
            "event-relocation-service.event-relocation-earthmodels-for-predictors",
            "event-relocation-service.event-relocation-defining-feature-measurement");
  }

  @Test
  void testResolveEventRelocationProcessingDefinition() {
    var eventRelocationProcessingDefinition =
        eventRelocationConfigurationResolver.getDefaultEventRelocationProcessingDefinition();

    Assertions.assertNotNull(eventRelocationProcessingDefinition);
  }

  @Test
  void testResolveDefaultDefiningFeatures() {
    var defaultDefiningFeatures =
        eventRelocationConfigurationResolver.getDefaultDefiningFeatures(
            UtilsTestFixtures.CHANNEL_VERSION_REAL_NAME, PhaseType.P);

    Assertions.assertNotNull(defaultDefiningFeatures);
  }

  @Test
  void testResolveAsarStationDefiningFeatures() {
    var defaultDefiningFeatures =
        eventRelocationConfigurationResolver.getDefaultDefiningFeatures(
            UtilsTestFixtures.CHANNEL_VERSION_REAL_ASAR, PhaseType.P);

    Assertions.assertNotNull(defaultDefiningFeatures);

    String actualFeatureMeasurementType =
        defaultDefiningFeatures.definingFeatureByFeatureMeasurementType().keySet().stream()
            .findFirst()
            .get()
            .getFeatureMeasurementTypeName();

    Assertions.assertEquals("SLOWNESS", actualFeatureMeasurementType);
  }

  @Test
  void testResolveEventRelocationPredictorsByPhaseType() {
    Assertions.assertNotNull(
        eventRelocationConfigurationResolver.getEventRelocationPredictorDefinition(PhaseType.Pn));
    Assertions.assertNotNull(
        eventRelocationConfigurationResolver.getEventRelocationPredictorDefinition(
            PhaseType.UNSET));
  }
}
