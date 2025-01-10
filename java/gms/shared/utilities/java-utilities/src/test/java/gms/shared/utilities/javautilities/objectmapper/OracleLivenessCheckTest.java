package gms.shared.utilities.javautilities.objectmapper;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class OracleLivenessCheckTest {

  @Test
  void testCreate() {
    OracleLivenessCheck livenessCheck = assertDoesNotThrow(() -> OracleLivenessCheck.create());
    assertNotNull(livenessCheck);
  }
}
