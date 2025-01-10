package gms.shared.stationdefinition.coi.fk;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class SlownessGridTest {

  @Test
  void testNonzeroVals() {

    assertThrows(IllegalArgumentException.class, () -> new SlownessGrid(0, 1));

    assertThrows(IllegalArgumentException.class, () -> new SlownessGrid(1, 0));
  }
}
