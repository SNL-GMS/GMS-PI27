package gms.shared.event.utility.id;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class OriginUniqueIdentifierTest {

  @Test
  void testOriginUniqueIdentifierPreconditions() {
    assertThrows(IllegalArgumentException.class, () -> OriginUniqueIdentifier.create(-1, "stage"));
    assertThrows(IllegalArgumentException.class, () -> OriginUniqueIdentifier.create(1L, ""));
    assertThrows(NullPointerException.class, () -> OriginUniqueIdentifier.create(1L, null));
  }
}
