package gms.shared.stationdefinition.coi.channel;

import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class CalibrationTest {

  @Test
  void testSerialization() throws Exception {
    JsonTestUtilities.assertSerializes(UtilsTestFixtures.calibration, Calibration.class);
  }

  @Test
  void testNotEquals() {
    // Test class path
    var calFactor = UtilsTestFixtures.calibration.getCalibrationFactor();
    Assertions.assertNotEquals(UtilsTestFixtures.calibration, calFactor);

    // Test null path
    Calibration nullCalibration = null;
    Assertions.assertNotEquals(UtilsTestFixtures.calibration, nullCalibration);
  }
}
