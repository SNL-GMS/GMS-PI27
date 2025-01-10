package gms.shared.event.coi.featureprediction;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.ArrivalTimeFeaturePredictionValue;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;

class FeaturePredictionTest {

  @Test
  void testTypeDeserialization() {

    JsonTestUtilities.assertSerializes(
        FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE, FeaturePredictionType.class);
  }

  @Test
  void testSerialization() {

    var x = FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE;

    JsonTestUtilities.assertSerializes(
        FeaturePrediction.<ArrivalTimeFeaturePredictionValue>builder()
            .setPredictionValue(
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
                            FeaturePredictionComponentType.BASEMODEL_PREDICTION))))
            .setPredictionType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE)
            .setPhase(PhaseType.P)
            .setExtrapolated(false)
            .setSourceLocation(EventLocation.from(1, 1, 1, Instant.EPOCH))
            .setReceiverLocation(Location.from(1.0, 1.0, 1.0, 1.0))
            .noChannel()
            .noPredictionChannelSegment()
            .build(),
        FeaturePrediction.class);

    JsonTestUtilities.assertSerializes(
        FeaturePrediction.<NumericFeaturePredictionValue>builder()
            .setPredictionValue(
                NumericFeaturePredictionValue.from(
                    FeatureMeasurementTypes.SLOWNESS,
                    NumericMeasurementValue.from(
                        Optional.of(Instant.ofEpochSecond(1)),
                        DoubleValue.from(1.0, Optional.of(1.0), Units.SECONDS_PER_DEGREE)),
                    Map.of(
                        FeaturePredictionDerivativeType.DERIVATIVE_WRT_DEPTH,
                        DoubleValue.from(2.0, Optional.of(1.0), Units.SECONDS)),
                    Set.of(
                        FeaturePredictionComponent.from(
                            DoubleValue.from(1.0, Optional.of(2.0), Units.UNITLESS),
                            false,
                            FeaturePredictionComponentType.BASEMODEL_PREDICTION))))
            .setPredictionType(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE)
            .setPhase(PhaseType.P)
            .setExtrapolated(false)
            .setSourceLocation(EventLocation.from(1, 1, 1, Instant.EPOCH))
            .setReceiverLocation(Location.from(1.0, 1.0, 1.0, 1.0))
            .noChannel()
            .noPredictionChannelSegment()
            .build(),
        FeaturePrediction.class);
  }
}
