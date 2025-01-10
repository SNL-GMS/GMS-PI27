package gms.shared.signaldetection.coi.values;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class AmplitudeMeasurementValueTest {

  private static final String ZERO_PERIOD_ERR =
      "AmplitudeMeasurementValue period should be non-zero";
  private static final String CREATE_ERR = "There was a problem creating AmplitudeMeasurementValue";

  private final double amplitude = 0.0;
  private final Units units = Units.NANOMETERS;
  private final Duration period = Duration.ofSeconds(1);
  private final Instant measurementTime = Instant.EPOCH;
  private final Instant measurementWindowStart = Instant.EPOCH;
  private final Duration measurementWindowDuration = Duration.ofSeconds(1);
  private final Boolean isClipped = true;

  @Test
  void testCheckZeroPeriodMeasurement() {
    assertThrows(
        IllegalStateException.class,
        () ->
            AmplitudeMeasurementValue.fromFeatureMeasurement(
                amplitude,
                units,
                Duration.ZERO,
                measurementTime,
                measurementWindowStart,
                measurementWindowDuration,
                isClipped),
        ZERO_PERIOD_ERR);
  }

  @Test
  void testCreateAmplitudeMeasurementValueMeasurement() {
    assertNotNull(
        AmplitudeMeasurementValue.fromFeatureMeasurement(
            amplitude,
            units,
            period,
            measurementTime,
            measurementWindowStart,
            measurementWindowDuration,
            isClipped),
        CREATE_ERR);
  }

  @Test
  void testCheckZeroPeriodPrediction() {
    assertThrows(
        IllegalStateException.class,
        () -> AmplitudeMeasurementValue.fromFeaturePrediction(amplitude, units, Duration.ZERO),
        ZERO_PERIOD_ERR);
  }

  @Test
  void testCreateAmplitudeMeasurementValuePrediction() {
    assertNotNull(
        AmplitudeMeasurementValue.fromFeaturePrediction(amplitude, units, period), CREATE_ERR);
  }
}
