package gms.shared.stationdefinition.coi.qc;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ProcessingOperationTest {

  @Test
  void testContainsOperation() {
    Assertions.assertFalse(ProcessingOperation.containsOperation(null));
    Assertions.assertFalse(ProcessingOperation.containsOperation("JK"));
    Assertions.assertTrue(ProcessingOperation.containsOperation("FK_SPECTRA"));
  }
}
