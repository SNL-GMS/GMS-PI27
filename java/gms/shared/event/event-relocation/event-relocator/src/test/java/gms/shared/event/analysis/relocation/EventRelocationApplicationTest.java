package gms.shared.event.analysis.relocation;

import static gms.shared.event.coi.EventTestFixtures.EVENT_UUID;
import static gms.shared.event.coi.EventTestFixtures.HYPOTHESIS_UUID;
import static gms.shared.event.coi.EventTestFixtures.LOCATION_UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.ResidualDefinition;
import gms.shared.event.analysis.relocation.api.EventRelocatorPlugin;
import gms.shared.event.analysis.relocation.controller.EventRelocationRequest;
import gms.shared.event.analysis.relocation.controller.EventRelocationServiceController;
import gms.shared.event.analysis.relocation.locoo3d.configuration.LocOo3dConfigurationResolver;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.coi.featureprediction.MasterEventCorrectionDefinition;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.locoo3d.LocOO;
import java.io.File;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@SpringBootTest(properties = {"spring.main.allow-bean-definition-overriding=true"})
@AutoConfigureMockMvc
class EventRelocationApplicationTest {

  @Autowired MockMvc mockMvc;

  @Autowired private EventRelocationServiceController controller;

  @Autowired private Map<String, EventRelocatorPlugin> eventRelocatorPluginMap;

  @MockBean SystemConfig systemConfig;

  @Test
  void testContextLoads() throws Exception {
    assertThat(controller).isNotNull();
  }

  @Test
  void testGetEventRelocationProcessingDefinitionEndpoint() throws Exception {
    var resultJson =
        mockMvc
            .perform(
                MockMvcRequestBuilders.get("/relocation/event-relocation-processing-definition"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // Test that returned JSON deserializes
    var deserialized =
        ObjectMappers.jsonReader().readValue(resultJson, EventRelocationProcessingDefinition.class);
    assertThat(deserialized).isNotNull();
  }

  @Test
  void testGetEventRelocationPredictorDefinitionByPhaseTypeEndpoint() throws Exception {
    var phases = Set.of(PhaseType.Pn, PhaseType.UNSET);
    var resultJson =
        mockMvc
            .perform(
                MockMvcRequestBuilders.post(
                        "/relocation/event-relocation-predictor-definition-by-phasetype")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .content(ObjectMappers.jsonWriter().writeValueAsBytes(phases)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    var result =
        ObjectMappers.jsonMapper()
            .readValue(
                resultJson,
                new TypeReference<HashMap<PhaseType, EventRelocationPredictorDefinition>>() {});

    assertThat(result).isNotNull();
    assertEquals(phases, result.keySet());
    assertEquals(2, Set.copyOf(result.values()).size());
  }

  @Test
  void testRelocate() throws Exception {

    var baseEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            EVENT_UUID,
            HYPOTHESIS_UUID,
            LOCATION_UUID,
            0.0,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(0.0, Optional.empty(), Units.COUNT),
            List.of());

    var featureMeasurements1 =
        Set.of(
            SignalDetectionTestFixtures.SLOW_FEATURE_MEASUREMENT.toBuilder()
                .setMeasurementValue(
                    NumericMeasurementValue.from(
                        Optional.of(Instant.EPOCH),
                        DoubleValue.from(8.3213, Optional.of(0.1), Units.SECONDS_PER_DEGREE)))
                .build(),
            SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT.toBuilder()
                .setMeasurementValue(
                    NumericMeasurementValue.from(
                        Optional.empty(), DoubleValue.from(180, Optional.of(1.0), Units.DEGREES)))
                .build(),
            SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT.toBuilder()
                .setMeasurementValue(
                    ArrivalTimeMeasurementValue.from(
                        InstantValue.from(
                            Instant.EPOCH
                                .plusSeconds(7 * 60 + 30)
                                .plusNanos((long) (0.4416 * 1_000_000_000)),
                            Duration.ofMillis(100)),
                        Optional.empty()))
                .build());

    var baseSdh1 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    baseSdh1 =
        baseSdh1.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setLocation(Location.from(40.0, 0.0, 0.0, 0.0))
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(1000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements1)
                    .build())
            .build();

    var baseSdh2 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    var featureMeasurements2 =
        Set.of(
            SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT.toBuilder()
                .setMeasurementValue(
                    PhaseTypeMeasurementValue.fromFeaturePrediction(PhaseType.pP, Optional.of(0.5)))
                .build(),
            SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT.toBuilder()
                .setMeasurementValue(
                    ArrivalTimeMeasurementValue.from(
                        InstantValue.from(
                            Instant.EPOCH
                                .plusSeconds(7 * 60 + 39)
                                .plusNanos((long) (0.4053 * 1_000_000_000)),
                            Duration.ofMillis(100)),
                        Optional.empty()))
                .build());

    baseSdh2 =
        baseSdh2.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setLocation(Location.from(40.0, 0.0, 0.0, 0.0))
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(2000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements2)
                    .build())
            .build();

    var associatedSdhs = Set.of(baseSdh1, baseSdh2);
    var assoicatedSdhEnitityReferences =
        associatedSdhs.stream().map(sdh -> sdh.toEntityReference()).toList();

    var eventHypothesis =
        baseEventHypothesis.toBuilder()
            .setData(
                baseEventHypothesis.getData().get().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(assoicatedSdhEnitityReferences)
                    .setPreferredLocationSolution(
                        baseEventHypothesis
                            .getData()
                            .get()
                            .getPreferredLocationSolution()
                            .get()
                            .toEntityReference())
                    .build())
            .build();

    var sdhDefiningMap =
        associatedSdhs.stream()
            .map(
                sdh ->
                    Map.entry(
                        sdh,
                        new DefiningFeatureByFeatureMeasurementType(
                            Map.of(
                                FeatureMeasurementTypes.ARRIVAL_TIME,
                                    new DefiningFeatureDefinition(true, false, true),
                                FeatureMeasurementTypes.SLOWNESS,
                                    new DefiningFeatureDefinition(true, false, true),
                                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                                    new DefiningFeatureDefinition(true, false, true)))))
            .collect(Collectors.toMap(Entry::getKey, Entry::getValue));

    var correction =
        new MasterEventCorrectionDefinition(EventTestFixtures.getTestEventHypothesis());
    var definition = new EventRelocationDefinition(sdhDefiningMap, correction);

    var eventHypothesisMap = Map.of(eventHypothesis, definition);

    var phasePredictorMap =
        Map.of(
            PhaseType.P, List.of(new EventRelocationPredictorDefinition("lookup2d", "ak135")),
            PhaseType.pP,
                List.of(
                    new EventRelocationPredictorDefinition("lookup2d", "ak135"),
                    new EventRelocationPredictorDefinition("lookup2d", "ak135")));

    var defaultPredictorDefinition =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("lookup2d")
            .setEarthModel("ak135")
            .build();

    var locationRestraints =
        List.of(
            LocationRestraint.builder()
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .build());

    var locationUncertaintyDefinitions =
        List.of(
            LocationUncertaintyDefinition.builder()
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setKWeight(0.0)
                .setScalingFactorType(ScalingFactorType.CONFIDENCE)
                .build());

    var residualDefinition =
        ResidualDefinition.builder()
            .setAllowBigResidual(true)
            .setBigResidualThreshold(1.0)
            .setMaxFraction(1.0)
            .build();

    var erpd =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(List.of())
            .setEventRelocator("locOo3dEventRelocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    var request = new EventRelocationRequest(eventHypothesisMap, phasePredictorMap, erpd);

    var resultJson =
        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/relocation/relocate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .content(ObjectMappers.jsonWriter().writeValueAsBytes(request)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    var actualEventHypotheses =
        ObjectMappers.jsonMapper()
            .readValue(resultJson, new TypeReference<Collection<EventHypothesis>>() {});

    assertEquals(1, actualEventHypotheses.size());
  }

  // Making this a top level class does not work - Spring always tries to create the CCU that
  // reaches out to ETC.
  // So, making it an innter class.
  @TestConfiguration
  public static class EventRelocationApplicationTestConfiguration {
    @Bean("serviceBasedProcessingConfig")
    public ConfigurationConsumerUtility getConfigurationConsumerUtility() {
      var configurationRoot =
          Preconditions.checkNotNull(
                  Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
              .getPath();

      return ConfigurationConsumerUtility.builder(
              FileConfigurationRepository.create(new File(configurationRoot).toPath()))
          .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
          .build();
    }

    @Bean
    public LocOO getLocOO(@Autowired LocOo3dConfigurationResolver resolver) throws Exception {
      // ignore resolver and just use default settings for loco for unit testing
      return new LocOO(new PropertiesPlusGMP());
    }
  }
}
