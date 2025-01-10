package gms.shared.signaldetection.coi.values;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.signaldetection.coi.types.FirstMotionType;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class FirstMotionMeasurementValueTest {

  private static final String CONFIDENCE_ERR =
      "FirstMotionMeasurementValue did not check for confidence out of range";
  private static final String CREATE_ERR =
      "There was a problem creating FirstMotionMeasurementValue";

  private final FirstMotionType value = FirstMotionType.DILATION;
  private final Optional<Double> confidence = Optional.of(1.0);
  private final Optional<Double> illegalConfidence = Optional.of(2.0);
  private final Instant referenceTime = Instant.EPOCH;

  @Test
  void testCheckIllegalConfidenceMeasurement() {
    assertThrows(
        IllegalStateException.class,
        () ->
            FirstMotionMeasurementValue.fromFeatureMeasurement(
                value, illegalConfidence, referenceTime),
        CONFIDENCE_ERR);
  }

  @Test
  void testCreateFirstMotionMeasurementValueMeasurement() {
    assertNotNull(
        FirstMotionMeasurementValue.fromFeatureMeasurement(value, confidence, referenceTime),
        CREATE_ERR);
  }

  @Test
  void testCheckIllegalConfidencePrediction() {

    assertThrows(
        IllegalStateException.class,
        () -> {
          FirstMotionMeasurementValue.fromFeaturePrediction(value, illegalConfidence);
        },
        CONFIDENCE_ERR);
  }

  @Test
  void testCreateFirstMotionMeasurementValuePrediction() {
    assertNotNull(FirstMotionMeasurementValue.fromFeaturePrediction(value, confidence), CREATE_ERR);
  }
}
