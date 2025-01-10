package gms.shared.signaldetection.coi.values;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ArrivalTimeMeasurementValueTest {

  private final InstantValue arrivalTime = InstantValue.from(Instant.EPOCH, Duration.ofSeconds(1));
  private final DurationValue travelTime = DurationValue.from(Duration.ofSeconds(1), Duration.ZERO);

  @Test
  void testCreateArrivalTimeMeasurementValueForMeasurement() {
    assertNotNull(
        ArrivalTimeMeasurementValue.fromFeatureMeasurement(arrivalTime),
        "There was a problem creating ArrivalTimeMeasurementValue");
  }

  @Test
  void testCreateArrivalTimeMeasurementValueForPrediction() {
    assertNotNull(
        ArrivalTimeMeasurementValue.fromFeaturePrediction(arrivalTime, travelTime),
        "There was a problem creating ArrivalTimeMeasurementValue");
  }
}
