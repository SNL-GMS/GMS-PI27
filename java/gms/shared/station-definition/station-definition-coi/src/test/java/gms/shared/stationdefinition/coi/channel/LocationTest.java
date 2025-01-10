package gms.shared.stationdefinition.coi.channel;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class LocationTest {

  @Test
  void testEquals() {
    // Test equals
    Location location = Location.from(1.0, 2.0, 3.0, 4.0);
    Location sameLocation = Location.from(1.0, 2.0, 3.0, 4.0);
    Location differentLocation = Location.from(1.0, 2.0, 3.0, 5.0);
    Assertions.assertEquals(location, location);
    Assertions.assertEquals(location, sameLocation);
    Assertions.assertEquals(sameLocation, location);
    Assertions.assertNotEquals(location, differentLocation);

    // Test class path
    Assertions.assertNotEquals(location, location.getDepthKm());

    // Test null path
    Location nullLocation = null;
    Assertions.assertNotEquals(location, nullLocation);
  }
}
