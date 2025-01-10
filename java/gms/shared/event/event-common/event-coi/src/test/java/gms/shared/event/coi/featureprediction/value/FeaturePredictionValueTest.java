package gms.shared.event.coi.featureprediction.value;

import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionDerivativeType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class FeaturePredictionValueTest {

  private static final ArrivalTimeFeaturePredictionValue standardValue =
      ArrivalTimeFeaturePredictionValue.from(
          FeatureMeasurementTypes.ARRIVAL_TIME,
          ArrivalTimeMeasurementValue.from(
              InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
              Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO))),
          Map.of(
              FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
              DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS)),
          Set.of(
              FeaturePredictionComponent.from(
                  DurationValue.from(Duration.ofDays(1), Duration.ofHours(1)),
                  false,
                  FeaturePredictionComponentType.BASEMODEL_PREDICTION)));

  private static final ArrivalTimeFeaturePredictionValue equals_standardValue =
      ArrivalTimeFeaturePredictionValue.from(
          FeatureMeasurementTypes.ARRIVAL_TIME,
          ArrivalTimeMeasurementValue.from(
              InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
              Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO))),
          Map.of(
              FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
              DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS)),
          Set.of(
              FeaturePredictionComponent.from(
                  DurationValue.from(Duration.ofDays(1), Duration.ofHours(1)),
                  false,
                  FeaturePredictionComponentType.BASEMODEL_PREDICTION)));

  private static final ArrivalTimeFeaturePredictionValue not_equals_mv_standardValue =
      ArrivalTimeFeaturePredictionValue.from(
          FeatureMeasurementTypes.ARRIVAL_TIME,
          ArrivalTimeMeasurementValue.from(
              InstantValue.from(Instant.ofEpochSecond(2), Duration.ofHours(3)),
              Optional.of(DurationValue.from(Duration.ofDays(4), Duration.ZERO))),
          Map.of(
              FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
              DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS)),
          Set.of(
              FeaturePredictionComponent.from(
                  DurationValue.from(Duration.ofDays(1), Duration.ofHours(1)),
                  false,
                  FeaturePredictionComponentType.BASEMODEL_PREDICTION)));

  private static final ArrivalTimeFeaturePredictionValue not_equals_dm_standardValue =
      ArrivalTimeFeaturePredictionValue.from(
          FeatureMeasurementTypes.ARRIVAL_TIME,
          ArrivalTimeMeasurementValue.from(
              InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
              Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO))),
          Map.of(
              FeaturePredictionDerivativeType.DERIVATIVE_WRT_DISTANCE,
              DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS)),
          Set.of(
              FeaturePredictionComponent.from(
                  DurationValue.from(Duration.ofDays(1), Duration.ofHours(1)),
                  false,
                  FeaturePredictionComponentType.BASEMODEL_PREDICTION)));

  private static final ArrivalTimeFeaturePredictionValue not_equals_fc_standardValue =
      ArrivalTimeFeaturePredictionValue.from(
          FeatureMeasurementTypes.ARRIVAL_TIME,
          ArrivalTimeMeasurementValue.from(
              InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
              Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO))),
          Map.of(
              FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
              DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS)),
          Set.of(
              FeaturePredictionComponent.from(
                  DurationValue.from(Duration.ofDays(3), Duration.ofHours(1)),
                  false,
                  FeaturePredictionComponentType.BASEMODEL_PREDICTION)));

  @Test
  void testEqualsHashcode() {
    Assertions.assertEquals(standardValue, standardValue);

    Assertions.assertEquals(standardValue, equals_standardValue);

    Assertions.assertEquals(equals_standardValue, standardValue);

    Assertions.assertEquals(standardValue.hashCode(), equals_standardValue.hashCode());
  }

  @Test
  void testNotEquals() {
    // Test the class path of equals - standardValue is first so its equals() is used
    Assertions.assertNotEquals(standardValue, standardValue.getDerivativeMap());

    // Test the null path of equals - standardValue is first so its equals() is used
    ArrivalTimeFeaturePredictionValue nullATFPV = null;
    Assertions.assertNotEquals(standardValue, nullATFPV);

    Assertions.assertNotEquals(standardValue, not_equals_mv_standardValue);

    Assertions.assertNotEquals(standardValue, not_equals_dm_standardValue);

    Assertions.assertNotEquals(standardValue, not_equals_fc_standardValue);
  }

  @Test
  void testSubclasssesEnforceFeatureMeasurementType() {

    var arrivalTimeValue =
        ArrivalTimeMeasurementValue.from(
            InstantValue.from(Instant.ofEpochSecond(1), Duration.ofHours(1)),
            Optional.of(DurationValue.from(Duration.ofDays(1), Duration.ZERO)));

    var arrivalTimeDerivatives =
        Map.of(
            FeaturePredictionDerivativeType.DERIVATIVE_WRT_DISTANCE,
            DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS));

    var arrivalTimeComponents =
        Set.of(
            FeaturePredictionComponent.from(
                DurationValue.from(Duration.ofDays(1), Duration.ofHours(1)),
                false,
                FeaturePredictionComponentType.BASEMODEL_PREDICTION));

    Assertions.assertThrows(
        IllegalArgumentException.class,
        () ->
            ArrivalTimeFeaturePredictionValue.from(
                FeatureMeasurementTypes.SLOWNESS,
                arrivalTimeValue,
                arrivalTimeDerivatives,
                arrivalTimeComponents));

    var slownessValue =
        NumericMeasurementValue.from(
            Optional.of(Instant.ofEpochSecond(1)),
            DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS_PER_DEGREE));

    var slownessDerivatives =
        Map.of(
            FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
            DoubleValue.from(2.0, Optional.of(1.0), Units.SECONDS));

    var slownessComponents =
        Set.of(
            FeaturePredictionComponent.from(
                DoubleValue.from(1.0, Optional.of(2.0), Units.UNITLESS),
                false,
                FeaturePredictionComponentType.BASEMODEL_PREDICTION));
  }
}
