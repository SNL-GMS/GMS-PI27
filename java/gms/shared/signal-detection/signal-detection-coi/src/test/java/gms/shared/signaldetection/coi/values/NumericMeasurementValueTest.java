package gms.shared.signaldetection.coi.values;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class NumericMeasurementValueTest {

  private final Instant referenceTime = Instant.EPOCH;
  private final DoubleValue measuredValue =
      DoubleValue.from(0.0, Optional.of(0.0), Units.NANOMETERS);
  private final DoubleValue predictedValue =
      DoubleValue.from(0.0, Optional.of(0.0), Units.NANOMETERS);

  @Test
  void testCreateNumericMeasurementValueForMeasurement() {
    assertNotNull(
        NumericMeasurementValue.fromFeatureMeasurement(referenceTime, measuredValue),
        "There was a problem creating NumericMeasurementValue");
  }

  @Test
  void testCreateNumericMeasurementValueForPrediction() {
    assertNotNull(
        NumericMeasurementValue.fromFeaturePrediction(predictedValue),
        "There was a problem creating NumericMeasurementValue");
  }
}
