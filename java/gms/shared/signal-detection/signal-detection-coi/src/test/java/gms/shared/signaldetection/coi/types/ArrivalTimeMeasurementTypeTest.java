package gms.shared.signaldetection.coi.types;

import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class ArrivalTimeMeasurementTypeTest {

  @Test
  void testSerialization() {
    ArrivalTimeMeasurementType type = FeatureMeasurementTypes.ARRIVAL_TIME;
    JsonTestUtilities.assertSerializes(type, ArrivalTimeMeasurementType.class);
    JsonTestUtilities.assertSerializes(type, FeatureMeasurementType.class);
  }
}
