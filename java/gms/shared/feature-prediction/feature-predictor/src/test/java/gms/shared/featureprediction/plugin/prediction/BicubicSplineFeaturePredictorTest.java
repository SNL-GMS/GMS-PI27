package gms.shared.featureprediction.plugin.prediction;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;

import com.google.common.primitives.ImmutableDoubleArray;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.ElevationCorrectionDefinition;
import gms.shared.event.coi.featureprediction.EllipticityCorrectionDefinition;
import gms.shared.event.coi.featureprediction.EllipticityCorrectionType;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionCorrectionDefinition;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.ArrivalTimeFeaturePredictionValue;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.featureprediction.plugin.api.correction.ellipticity.EllipticityCorrectorPlugin;
import gms.shared.featureprediction.plugin.api.lookuptable.TravelTimeDepthDistanceLookupTablePlugin;
import gms.shared.featureprediction.plugin.correction.elevation.ElevationCorrector;
import gms.shared.featureprediction.utilities.view.Immutable2dArray;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BicubicSplineFeaturePredictorTest {
  private static final String AK135 = "Ak135";
  private static final String ELLIPTIC_PLUGIN = "ellipticPlugin";
  private static final String TRAVEL_TIME_PLUGIN = "travelTimePlugin";

  private BicubicSplineFeaturePredictor bicubicSplineFeaturePredictor;

  @Mock private ElevationCorrector mockElevationCorrector;

  @Mock private BicubicSplineFeaturePredictorDefinition mockDefinition;

  @Mock private TravelTimeDepthDistanceLookupTablePlugin mockTravelTimePlugin;

  @Mock private EllipticityCorrectorPlugin mockEllipticityCorrectorPlugin;

  @BeforeEach
  void initialize() {
    var ellipticityCorrectorMap = Map.of(ELLIPTIC_PLUGIN, mockEllipticityCorrectorPlugin);
    var travelTimeMap = Map.of(TRAVEL_TIME_PLUGIN, mockTravelTimePlugin);
    bicubicSplineFeaturePredictor =
        new BicubicSplineFeaturePredictor(
            mockDefinition, mockElevationCorrector, ellipticityCorrectorMap, travelTimeMap);
  }

  @Test
  void testInit() {
    setupTravelTimeAndEllipticMockPluginConfiguration();
    bicubicSplineFeaturePredictor.initialize();

    Mockito.verify(mockTravelTimePlugin).initialize();
    Mockito.verify(mockEllipticityCorrectorPlugin).initialize();
  }

  @Test
  void testForArrivalTimePredictionType() {
    setupTravelTimeAndEllipticMockPluginConfiguration();
    setupMockTravelTimePlugin();

    Mockito.when(mockElevationCorrector.correct(eq(AK135), any(), anyDouble(), any()))
        .thenReturn(
            Optional.of(
                FeaturePredictionComponent.from(
                    DurationValue.from(Duration.ofSeconds(1), null),
                    false,
                    FeaturePredictionComponentType.ELEVATION_CORRECTION)));

    // Output should have no ellipticty correction since this returns empty.
    Mockito.when(mockEllipticityCorrectorPlugin.correct(eq(AK135), any(), any(), eq(PhaseType.P)))
        .thenReturn(Optional.<FeaturePredictionComponent<DurationValue>>empty());

    var sourceLocation = EventLocation.from(3, 0, 3, Instant.EPOCH);
    var receiverLocation = Location.from(0, 0, 0, 0);
    var actual =
        bicubicSplineFeaturePredictor.predict(
            FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE,
            sourceLocation,
            receiverLocation,
            PhaseType.P,
            AK135,
            List.of(
                ElevationCorrectionDefinition.from(AK135),
                EllipticityCorrectionDefinition.from(EllipticityCorrectionType.DZIEWONSKI_GILBERT),

                // Exercise the "unrecognized definition" branch of logic, which
                // will return an empty correction, thus should not add to the output
                // list of corrections.
                // Note, may need to change this if SOURCE_DEPENDENT_CORRECTION ever
                // gets implemented.
                (FeaturePredictionCorrectionDefinition)
                    () -> FeaturePredictionComponentType.SOURCE_DEPENDENT_CORRECTION));

    Assertions.assertTrue(actual.isPresent());

    Assertions.assertEquals(
        FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
            .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .noChannel()
            .setExtrapolated(false)
            .setPhase(PhaseType.P)
            .noPredictionChannelSegment()
            .setReceiverLocation(receiverLocation)
            .setSourceLocation(sourceLocation)
            .setPredictionValue(
                ArrivalTimeFeaturePredictionValue.create(
                    ArrivalTimeMeasurementValue.from(
                        InstantValue.from(Instant.EPOCH.plusSeconds(4), Duration.ZERO),
                        Optional.of(DurationValue.from(Duration.ofSeconds(4), Duration.ZERO))),
                    Map.of(),
                    Set.of(
                        FeaturePredictionComponent.from(
                            DurationValue.from(Duration.ofSeconds(1), null),
                            false,
                            FeaturePredictionComponentType.ELEVATION_CORRECTION),
                        FeaturePredictionComponent.from(
                            DurationValue.from(Duration.ofSeconds(3), null),
                            false,
                            FeaturePredictionComponentType.BASEMODEL_PREDICTION))))
            .build(),
        actual.get());
  }

  @Test
  void testSourceToReceiverAzimuthPredictionType() {
    setupTravelTimeMockPluginConfiguration();
    setupMockTravelTimePlugin();

    var sourceLocation = EventLocation.from(37, 138, 20, Instant.EPOCH);
    var receiverLocation = Location.from(37, 138, 0, 0);
    var expectedAzimuth =
        bicubicSplineFeaturePredictor.getSourceToReceiverAzimuthValue(
            sourceLocation, receiverLocation);
    var expectedFeaturePrediction =
        getExpectedFeaturePrediction(
            FeaturePredictionType.SOURCE_TO_RECEIVER_AZIMUTH_PREDICTION_TYPE,
            FeatureMeasurementTypes.SOURCE_TO_RECEIVER_AZIMUTH,
            sourceLocation,
            receiverLocation,
            expectedAzimuth,
            Units.DEGREES);

    var actual =
        runBicubicSplineFeaturePrediction(
            FeaturePredictionType.SOURCE_TO_RECEIVER_AZIMUTH_PREDICTION_TYPE,
            sourceLocation,
            receiverLocation);

    Assertions.assertTrue(actual.isPresent());

    Assertions.assertEquals(expectedFeaturePrediction, actual.get());
  }

  @Test
  void testReceiverToSourceAzimuthPredictionType() {
    setupTravelTimeMockPluginConfiguration();
    setupMockTravelTimePlugin();

    var sourceLocation = EventLocation.from(37, 138, 20, Instant.EPOCH);
    var receiverLocation = Location.from(37, 138, 0, 0);
    var expectedAzimuth =
        bicubicSplineFeaturePredictor.getReceiverToSourceAzimuthValue(
            receiverLocation, sourceLocation);
    var expectedFeaturePrediction =
        getExpectedFeaturePrediction(
            FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE,
            FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
            sourceLocation,
            receiverLocation,
            expectedAzimuth,
            Units.DEGREES);

    var actual =
        runBicubicSplineFeaturePrediction(
            FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE,
            sourceLocation,
            receiverLocation);

    Assertions.assertTrue(actual.isPresent());

    Assertions.assertEquals(expectedFeaturePrediction, actual.get());
  }

  @Test
  void testSlownessPredictionType() {
    setupTravelTimeMockPluginConfiguration();
    setupMockTravelTimePlugin();

    var sourceLocation = EventLocation.from(37, 138, 20, Instant.EPOCH);
    var receiverLocation = Location.from(37, 138, 0, 0);
    var expectedAzimuth = 1.0;
    var expectedFeaturePrediction =
        getExpectedFeaturePrediction(
            FeaturePredictionType.SLOWNESS_PREDICTION_TYPE,
            FeatureMeasurementTypes.SLOWNESS,
            sourceLocation,
            receiverLocation,
            expectedAzimuth,
            Units.SECONDS_PER_DEGREE);

    var actual =
        runBicubicSplineFeaturePrediction(
            FeaturePredictionType.SLOWNESS_PREDICTION_TYPE, sourceLocation, receiverLocation);

    Assertions.assertTrue(actual.isPresent());
    Assertions.assertEquals(expectedFeaturePrediction, actual.get());
  }

  @Test
  void testPredictForNonExistingPhases() {
    setupTravelTimeMockPluginConfiguration();

    var sourceLocation = EventLocation.from(3, 0, 3, Instant.EPOCH);
    var receiverLocation = Location.from(0, 0, 0, 0);
    var actual =
        bicubicSplineFeaturePredictor.predict(
            FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE,
            sourceLocation,
            receiverLocation,
            PhaseType.IPx,
            AK135,
            List.of(
                ElevationCorrectionDefinition.from(AK135),
                EllipticityCorrectionDefinition.from(EllipticityCorrectionType.DZIEWONSKI_GILBERT),
                (FeaturePredictionCorrectionDefinition)
                    () -> FeaturePredictionComponentType.SOURCE_DEPENDENT_CORRECTION));

    Assertions.assertTrue(actual.isEmpty());
  }

  @Test
  void testNanPrediction() {
    setupTravelTimeMockPluginConfiguration();

    Mockito.when(mockTravelTimePlugin.getDepthsKmForData(PhaseType.P))
        .thenReturn(ImmutableDoubleArray.copyOf(new double[] {1, 2, 3, 4, 5}));
    Mockito.when(mockTravelTimePlugin.getDistancesDegForData(PhaseType.P))
        .thenReturn(ImmutableDoubleArray.copyOf(new double[] {1, 2, 3, 4, 5}));

    // Table with NaNs at an edge. Should return an Optional.empty
    // if near or beyond those NaNs.
    Mockito.when(mockTravelTimePlugin.getValues(PhaseType.P))
        .thenReturn(
            Immutable2dArray.from(
                Duration.class,
                new Duration[][] {
                  {
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(3),
                    Duration.ofSeconds(4),
                    Duration.ofSeconds(5)
                  },
                  {Duration.ofSeconds(1), null, null, null, null},
                  {Duration.ofSeconds(1), null, null, null, null},
                  {Duration.ofSeconds(1), null, null, null, null},
                  {Duration.ofSeconds(1), null, null, null, null}
                }));

    var sourceLocation = EventLocation.from(6, 0, 6, Instant.EPOCH);
    var receiverLocation = Location.from(0, 0, 0, 0);

    var actual =
        bicubicSplineFeaturePredictor.predict(
            FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE,
            sourceLocation,
            receiverLocation,
            PhaseType.P,
            AK135,
            List.of());

    Assertions.assertTrue(actual.isEmpty());

    //
    // Near NaNs
    //
    sourceLocation = EventLocation.from(4, 0, 4, Instant.EPOCH);
    receiverLocation = Location.from(0, 0, 0, 0);

    actual =
        bicubicSplineFeaturePredictor.predict(
            FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE,
            sourceLocation,
            receiverLocation,
            PhaseType.P,
            AK135,
            List.of());

    Assertions.assertTrue(actual.isEmpty());
  }

  /**
   * Run the {@link BicubicSplineFeaturePredictor} predict method for calculating feature
   * predictions
   *
   * @param featurePredictionType - {@link FeaturePredictionType}
   * @param sourceLocation - {@link EventLocation}
   * @param receiverLocation - {@link Location}
   */
  private <T extends FeaturePredictionValue<?, ?, ?>>
      Optional<FeaturePrediction<T>> runBicubicSplineFeaturePrediction(
          FeaturePredictionType<T> featurePredictionType,
          EventLocation sourceLocation,
          Location receiverLocation) {
    return bicubicSplineFeaturePredictor.predict(
        featurePredictionType,
        sourceLocation,
        receiverLocation,
        PhaseType.P,
        AK135,
        List.of(
            ElevationCorrectionDefinition.from(AK135),
            EllipticityCorrectionDefinition.from(EllipticityCorrectionType.DZIEWONSKI_GILBERT),
            (FeaturePredictionCorrectionDefinition)
                () -> FeaturePredictionComponentType.BASEMODEL_PREDICTION));
  }

  /**
   * Get the expected {@link FeaturePrediction} for given inputs
   *
   * @param featurePredictionType
   * @param featureMeasurementType
   * @param sourceLocation
   * @param receiverLocation
   * @param expectedAzimuth
   * @param units
   */
  private FeaturePrediction<NumericFeaturePredictionValue> getExpectedFeaturePrediction(
      FeaturePredictionType<NumericFeaturePredictionValue> featurePredictionType,
      FeatureMeasurementType<NumericMeasurementValue> featureMeasurementType,
      EventLocation sourceLocation,
      Location receiverLocation,
      double expectedAzimuth,
      Units units) {
    return FeaturePrediction.<NumericFeaturePredictionValue>builder()
        .setPredictionType(featurePredictionType)
        .noChannel()
        .setExtrapolated(false)
        .setPhase(PhaseType.P)
        .noPredictionChannelSegment()
        .setReceiverLocation(receiverLocation)
        .setSourceLocation(sourceLocation)
        .setPredictionValue(
            NumericFeaturePredictionValue.from(
                featureMeasurementType,
                NumericMeasurementValue.from(
                    Optional.empty(), DoubleValue.from(expectedAzimuth, Optional.empty(), units)),
                Map.of(),
                Set.of(
                    FeaturePredictionComponent.from(
                        DoubleValue.from(expectedAzimuth, Optional.empty(), units),
                        false,
                        FeaturePredictionComponentType.BASEMODEL_PREDICTION))))
        .build();
  }

  /** Set up the travel time plugin mock configuration */
  private void setupTravelTimeMockPluginConfiguration() {
    Mockito.when(mockDefinition.getTravelTimeDepthDistanceLookupTablePluginNameByEarthModel())
        .thenReturn(Map.of(AK135, TRAVEL_TIME_PLUGIN));
  }

  /** Set up the travel time and elliptic corrector plugin mock configuration */
  private void setupTravelTimeAndEllipticMockPluginConfiguration() {
    Mockito.when(mockDefinition.getTravelTimeDepthDistanceLookupTablePluginNameByEarthModel())
        .thenReturn(Map.of(AK135, TRAVEL_TIME_PLUGIN));

    Mockito.when(
            mockDefinition.getEllipticityCorrectorPluginNameByEllipticityCorrectionPluginType())
        .thenReturn(Map.of(EllipticityCorrectionType.DZIEWONSKI_GILBERT, ELLIPTIC_PLUGIN));
  }

  private void setupMockTravelTimePlugin() {
    Mockito.when(mockTravelTimePlugin.getDepthsKmForData(PhaseType.P))
        .thenReturn(ImmutableDoubleArray.copyOf(new double[] {1, 2, 3, 4, 5}));
    Mockito.when(mockTravelTimePlugin.getDistancesDegForData(PhaseType.P))
        .thenReturn(ImmutableDoubleArray.copyOf(new double[] {1, 2, 3, 4, 5}));
    Mockito.when(mockTravelTimePlugin.getValues(PhaseType.P))
        .thenReturn(
            Immutable2dArray.from(
                Duration.class,
                new Duration[][] {
                  {
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(3),
                    Duration.ofSeconds(4),
                    Duration.ofSeconds(5)
                  },
                  {
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(3),
                    Duration.ofSeconds(4),
                    Duration.ofSeconds(5)
                  },
                  {
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(3),
                    Duration.ofSeconds(4),
                    Duration.ofSeconds(5)
                  },
                  {
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(3),
                    Duration.ofSeconds(4),
                    Duration.ofSeconds(5)
                  },
                  {
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(3),
                    Duration.ofSeconds(4),
                    Duration.ofSeconds(5)
                  }
                }));
  }
}
