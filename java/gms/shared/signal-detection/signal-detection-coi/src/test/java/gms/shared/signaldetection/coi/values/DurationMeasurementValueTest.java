package gms.shared.signaldetection.coi.values;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class DurationMeasurementValueTest {

  private final InstantValue startTime = InstantValue.from(Instant.EPOCH, Duration.ofSeconds(1));
  private final DurationValue duration = DurationValue.from(Duration.ofSeconds(1), Duration.ZERO);

  @Test
  void testCreateDurationMeasurementValueMeasurement() {
    assertNotNull(
        DurationMeasurementValue.from(startTime, duration),
        "There was a problem creating DurationMeasurementValue");
  }
}
