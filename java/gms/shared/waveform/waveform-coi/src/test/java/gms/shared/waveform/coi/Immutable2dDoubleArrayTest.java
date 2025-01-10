package gms.shared.waveform.coi;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import org.junit.jupiter.api.Test;

class Immutable2dDoubleArrayTest {

  @Test
  void testCopyOf() {
    double[][] expected = new double[][] {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    assertTrue(Arrays.deepEquals(expected, Immutable2dDoubleArray.from(expected).copyOf()));
  }
}
