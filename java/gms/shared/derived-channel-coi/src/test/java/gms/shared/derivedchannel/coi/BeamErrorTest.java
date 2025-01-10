package gms.shared.derivedchannel.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.function.Executable;

public abstract class BeamErrorTest {

  void assertErrorThrown(
      Class<? extends Exception> expectedType, String expectedErrorMessage, Executable executable) {
    final Exception exception = assertThrows(expectedType, executable);

    assertNotNull(exception);
    assertEquals(expectedErrorMessage, exception.getMessage());
  }
}
