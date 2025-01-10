package gms.shared.featureprediction.framework;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.LocationUncertainty;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.ArrivalTimeFeaturePredictionValue;
import gms.shared.featureprediction.configuration.FeaturePredictorDefinition;
import gms.shared.featureprediction.configuration.TypeSafePluginByTypeMap;
import gms.shared.featureprediction.plugin.api.FeaturePredictorPlugin;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FeaturePredictorTest {

  private static final String PLUGIN_NAME = "dummyFeaturePredictor";

  private FeaturePredictor featurePredictor;

  @Mock private FeaturePredictorPlugin mockFeaturePredictorPlugin;

  @Mock private FeaturePredictorDefinition mockFeaturePredictorDefinition;

  @BeforeEach
  void initialize() {

    var featurePredictorMap = Map.of(PLUGIN_NAME, mockFeaturePredictorPlugin);

    featurePredictor = new FeaturePredictor(mockFeaturePredictorDefinition, featurePredictorMap);
  }

  @Test
  void testInit() {
    Mockito.when(mockFeaturePredictorDefinition.getPluginByPredictionTypeMap())
        .thenReturn(
            new TypeSafePluginByTypeMap(
                Map.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE, PLUGIN_NAME)));

    featurePredictor.init();

    Mockito.verify(mockFeaturePredictorPlugin).initialize();
  }

  @Test
  void testEventAndReceiverLocation() {

    var sourceLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var receiverLocation = List.of(Location.from(1.0, 1.0, 1.0, 1.0));
    var phase = PhaseType.P;

    var value =
        ArrivalTimeFeaturePredictionValue.create(
            ArrivalTimeMeasurementValue.from(
                InstantValue.from(Instant.EPOCH.plusSeconds(1), Duration.ZERO), Optional.empty()),
            Map.of(),
            Set.of());

    Mockito.when(
            mockFeaturePredictorPlugin.predict(
                eq(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
                any(EventLocation.class),
                any(Location.class),
                any(PhaseType.class),
                eq("Ak135"),
                anyList()))
        .thenAnswer(
            answer -> {
              EventLocation sourceLocationArgument = answer.getArgument(1);
              Location receiverLocationArgument = answer.getArgument(2);
              PhaseType phaseArgument = answer.getArgument(3);

              Assertions.assertEquals(sourceLocation, sourceLocationArgument);
              Assertions.assertEquals(receiverLocation.get(0), receiverLocationArgument);

              // Enums will be the exact same reference.
              Assertions.assertSame(phase, phaseArgument);

              return Optional.of(
                  FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
                      .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
                      .noPredictionChannelSegment()
                      .noChannel()
                      .setReceiverLocation(receiverLocationArgument)
                      .setSourceLocation(sourceLocationArgument)
                      .setExtrapolated(false)
                      .setPhase(phaseArgument)
                      .setPredictionValue(value)
                      .build());
            });

    Mockito.when(
            mockFeaturePredictorDefinition.getPluginNameByType(
                FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE))
        .thenReturn(PLUGIN_NAME);

    var newFeaturePredictionContainer =
        featurePredictor.predict(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            sourceLocation,
            receiverLocation,
            List.of(PhaseType.P),
            "Ak135",
            List.of());

    var newFeaturePredictions =
        newFeaturePredictionContainer
            .getLeft()
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE);

    Assertions.assertEquals(1, newFeaturePredictions.size());

    var newFeaturePrediction = newFeaturePredictions.stream().findFirst().get();

    Assertions.assertEquals(value, newFeaturePrediction.getPredictionValue());
  }

  @Test
  void testEarthModelMissingPhase() {
    var sourceLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var receiverLocation = List.of(Location.from(1.0, 1.0, 1.0, 1.0));

    Mockito.when(
            mockFeaturePredictorPlugin.predict(
                eq(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
                any(EventLocation.class),
                any(Location.class),
                eq(PhaseType.IPx),
                eq("Ak135"),
                anyList()))
        .thenReturn(Optional.empty());

    Mockito.when(
            mockFeaturePredictorDefinition.getPluginNameByType(
                FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE))
        .thenReturn(PLUGIN_NAME);

    var newFeaturePredictionContainer =
        featurePredictor.predict(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            sourceLocation,
            receiverLocation,
            List.of(PhaseType.IPx),
            "Ak135",
            List.of());

    var newFeaturePredictions =
        newFeaturePredictionContainer
            .getLeft()
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE);

    Assertions.assertTrue(newFeaturePredictions.isEmpty());

    Assertions.assertTrue(newFeaturePredictionContainer.getRight());
  }

  @ParameterizedTest
  @MethodSource("testSource")
  void testLocationSolutionAndChannel(Channel channel1, Channel channel2) {

    var sourceLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    var phase = PhaseType.P;
    var receiverLocation = channel1.getLocation();

    var value1 =
        ArrivalTimeFeaturePredictionValue.create(
            ArrivalTimeMeasurementValue.from(
                InstantValue.from(Instant.EPOCH.plusSeconds(1), Duration.ZERO), Optional.empty()),
            Map.of(),
            Set.of());

    var value2 =
        ArrivalTimeFeaturePredictionValue.create(
            ArrivalTimeMeasurementValue.from(
                InstantValue.from(Instant.EPOCH.plusSeconds(2), Duration.ZERO), Optional.empty()),
            Map.of(),
            Set.of());

    var inputFeaturePrediction =
        FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
            .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .noPredictionChannelSegment()
            .setChannel(channel2)
            .setReceiverLocation(receiverLocation)
            .setSourceLocation(sourceLocation)
            .setExtrapolated(false)
            .setPhase(phase)
            .setPredictionValue(value2)
            .build();

    var inputLocationSolutionDate =
        LocationSolution.Data.builder()
            .setLocation(sourceLocation)
            .setLocationBehaviors(Set.of())
            .setLocationUncertainty(
                LocationUncertainty.builder()
                    .setEllipsoids(Set.of())
                    .setEllipses(Set.of())
                    .setStdDevOneObservation(0)
                    .setXx(0)
                    .setXy(0)
                    .setXz(0)
                    .setXt(0)
                    .setYy(0)
                    .setYz(0)
                    .setYt(0)
                    .setZz(0)
                    .setZt(0)
                    .setTt(0)
                    .build())
            .setNetworkMagnitudeSolutions(Set.of())
            .setLocationRestraint(LocationRestraint.free())
            .setFeaturePredictions(FeaturePredictionContainer.of(inputFeaturePrediction))
            .build();

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000035");
    var inputLocationSolution =
        LocationSolution.builder().setId(uuid).setData(inputLocationSolutionDate).build();

    var intermediateOutputFeaturePrediction =
        FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
            .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .noPredictionChannelSegment()
            .noChannel()
            .setReceiverLocation(receiverLocation)
            .setSourceLocation(sourceLocation)
            .setExtrapolated(false)
            .setPhase(phase)
            .setPredictionValue(value1)
            .build();

    var outputFeaturePrediction =
        intermediateOutputFeaturePrediction.toBuilder().setChannel(channel1).build();

    if (channel1.equals(channel2)) {
      Mockito.verify(mockFeaturePredictorPlugin, Mockito.never())
          .predict(any(), any(), any(), any(), any(), any());
    } else {
      Mockito.when(
              mockFeaturePredictorPlugin.predict(
                  eq(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
                  any(EventLocation.class),
                  any(Location.class),
                  any(PhaseType.class),
                  eq("Ak135"),
                  any(List.class)))
          .thenAnswer(
              answer -> {
                EventLocation sourceLocationArgument = answer.getArgument(1);
                Location receiverLocationArgument = answer.getArgument(2);
                PhaseType phaseArgument = answer.getArgument(3);

                Assertions.assertEquals(sourceLocation, sourceLocationArgument);
                Assertions.assertEquals(receiverLocation, receiverLocationArgument);

                // Enums will be the exact same reference.
                Assertions.assertSame(phase, phaseArgument);

                return Optional.of(intermediateOutputFeaturePrediction);
              });

      Mockito.when(
              mockFeaturePredictorDefinition.getPluginNameByType(
                  FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE))
          .thenReturn(PLUGIN_NAME);
    }

    var newLocationSolutionPair =
        featurePredictor.predict(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            inputLocationSolution,
            List.of(channel1),
            List.of(phase),
            "Ak135",
            List.of());

    if (channel1.equals(channel2)) {
      Assertions.assertEquals(inputLocationSolution, newLocationSolutionPair.getLeft());
    } else {
      var newFeaturePredictions =
          newLocationSolutionPair
              .getLeft()
              .getData()
              .get()
              .getFeaturePredictions()
              .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE);

      Assertions.assertTrue(newFeaturePredictions.contains(inputFeaturePrediction));
      Assertions.assertTrue(newFeaturePredictions.contains(outputFeaturePrediction));
      Assertions.assertFalse(newLocationSolutionPair.getRight());
    }
  }

  private static Stream<Arguments> testSource() {
    var receiverLocation = List.of(Location.from(1.0, 1.0, 1.0, 1.0));
    var channel1 = Mockito.mock(Channel.class);
    Mockito.when(channel1.getName()).thenReturn("Channel1");
    Mockito.when(channel1.getLocation()).thenReturn(receiverLocation.get(0));
    var channel2 = Mockito.mock(Channel.class);

    return Stream.of(
        Arguments.arguments(channel1, channel2),

        // TODO: see if we still want this case
        Arguments.arguments(channel1, channel1));
  }
}
