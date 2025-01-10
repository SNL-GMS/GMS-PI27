package gms.shared.signaldetection.coi.values;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.common.coi.types.PhaseType;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PhaseTypeMeasurementValueTest {

  private static final String CONFIDENCE_ERR =
      "PhaseTypeMeasurementValue did not check for confidence out of range";
  private static final String CREATE_ERR = "There was a problem creating PhaseTypeMeasurementValue";

  private final PhaseType value = PhaseType.NP;
  private final Optional<Double> confidence = Optional.of(1.0);
  private final Instant referenceTime = Instant.EPOCH;

  @Test
  void testCheckIllegalConfidenceMeasurement() {
    Optional<Double> optionalV = Optional.of(2.0);
    assertThrows(
        IllegalStateException.class,
        () -> PhaseTypeMeasurementValue.fromFeatureMeasurement(value, optionalV, referenceTime),
        CONFIDENCE_ERR);
  }

  @Test
  void testCreatePhaseTypeMeasurementValueMeasurement() {
    assertNotNull(
        PhaseTypeMeasurementValue.fromFeatureMeasurement(value, confidence, referenceTime),
        CREATE_ERR);
  }

  @Test
  void testCheckIllegalConfidencePrediction() {
    Optional<Double> optionalV = Optional.of(2.0);
    assertThrows(
        IllegalStateException.class,
        () -> PhaseTypeMeasurementValue.fromFeaturePrediction(value, optionalV),
        CONFIDENCE_ERR);
  }

  @Test
  void testCreatePhaseTypeMeasurementValuePrediction() {
    assertNotNull(PhaseTypeMeasurementValue.fromFeaturePrediction(value, confidence), CREATE_ERR);
  }
}
