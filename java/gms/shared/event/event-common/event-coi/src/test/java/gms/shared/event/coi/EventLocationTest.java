package gms.shared.event.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class EventLocationTest {

  public static final double LAT = 23.9;
  public static final double LON = -89.0;
  public static final double DEPTH = 0.06;
  public static final Instant TIME = Instant.EPOCH;
  private static final NegativeNaInstantToDoubleConverter instantToDoubleConverter =
      new NegativeNaInstantToDoubleConverter();

  @Test
  void testFrom() {
    var loc = EventLocation.from(LAT, LON, DEPTH, TIME);
    assertEquals(LAT, loc.getLatitudeDegrees(), 0.001);
    assertEquals(LON, loc.getLongitudeDegrees(), 0.001);
    assertEquals(DEPTH, loc.getDepthKm(), 0.001);
    assertEquals(TIME, loc.getTime());
  }

  @Test
  void testSerialization() throws Exception {
    var loc = EventLocation.from(LAT, LON, DEPTH, TIME);
    JsonTestUtilities.assertSerializes(loc, EventLocation.class);
  }
}
