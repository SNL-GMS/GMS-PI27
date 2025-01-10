package gms.shared.utilities.signalprocessing.normalization;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class TransformTest {

  @Test
  void testAbsTransform() {
    assertEquals(4.0, Transform.ABS.getTransformFunction().applyAsDouble(-4.0));
  }

  @Test
  void testSquareTransform() {
    assertEquals(4.0, Transform.SQUARE.getTransformFunction().applyAsDouble(2));
  }
}
