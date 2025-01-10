package gms.shared.event.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MagnitudeTypeTest {

  @Test
  void testNewValueMap() {
    assertEquals("mb", MagnitudeType.MB.getType());
    assertEquals("ml", MagnitudeType.ML.getType());
  }

  @Test
  void testFromString() {
    assertEquals(MagnitudeType.MB, MagnitudeType.fromString("mb"));
    assertEquals(MagnitudeType.ML, MagnitudeType.fromString("ml"));
  }

  @Test
  void testContains() {
    assertFalse(MagnitudeType.containsType(null));
    assertFalse(MagnitudeType.containsType(""));
    assertFalse(MagnitudeType.containsType("      "));
    assertFalse(MagnitudeType.containsType("Invalid"));
    assertTrue(MagnitudeType.containsType("mb"));
  }
}
