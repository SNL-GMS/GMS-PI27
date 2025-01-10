package gms.shared.fk.plugin.algorithms.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.waveform.coi.Immutable2dDoubleArray;

public class FkTestUtilities {

  private static final double MAX_UNCERTAINTY = .00000001;

  public static void compareArrays(Immutable2dDoubleArray expected, Immutable2dDoubleArray actual) {
    assertEquals(expected.rowCount(), actual.rowCount());
    assertEquals(expected.columnCount(), actual.columnCount());

    for (int i = 0; i < expected.rowCount(); i++) {
      for (int j = 0; j < expected.columnCount(); j++) {
        assertEquals(
            expected.getValue(i, j),
            actual.getValue(i, j),
            MAX_UNCERTAINTY,
            "validation failed on (" + i + ", " + j + ")");
      }
    }
  }
}
