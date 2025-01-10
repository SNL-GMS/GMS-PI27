package gms.shared.event.coi.featureprediction.value;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class NumericFeaturePredictionValueTest {

  @ParameterizedTest
  @MethodSource("provideAllowableTypes")
  void testAllowableTypes(
      FeatureMeasurementType<NumericMeasurementValue> featureMeasurementType, boolean shouldThrow) {

    var predictedValue =
        NumericMeasurementValue.from(
            Optional.of(Instant.MIN), DoubleValue.from(1.0, Optional.of(0.5), Units.DEGREES));

    if (shouldThrow) {
      assertThrows(
          IllegalArgumentException.class,
          () ->
              NumericFeaturePredictionValue.from(
                  featureMeasurementType, predictedValue, null, null));
    } else {
      assertDoesNotThrow(
          () ->
              NumericFeaturePredictionValue.from(
                  featureMeasurementType, predictedValue, null, null));
    }
  }

  private static Stream<Arguments> provideAllowableTypes() {
    return Stream.of(
        arguments(FeatureMeasurementTypes.SLOWNESS, false),
        arguments(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH, false),
        arguments(FeatureMeasurementTypes.SOURCE_TO_RECEIVER_AZIMUTH, false),
        arguments(FeatureMeasurementTypes.SOURCE_TO_RECEIVER_DISTANCE, false),
        arguments(FeatureMeasurementTypes.RECTILINEARITY, true));
  }
}
