package gms.shared.utilities.signalprocessing.normalization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class MaxAmplitudeNormalizerTest {

  @Test
  void testNormalizeEmptyStream() {
    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> MaxAmplitudeNormalizer.normalize(new double[] {}));
    assertEquals(
        "Cannot normalize data when a maximum amplitude cannot be calculated", ex.getMessage());
  }

  @Test
  void testNormalize() {
    double[] data = new double[] {0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, -10.0};
    double[] expected = new double[] {0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, -1.0};

    double[] actual = MaxAmplitudeNormalizer.normalize(data);
    assertNotNull(actual);
    assertEquals(expected.length, actual.length);

    for (int i = 0; i < expected.length; i++) {
      assertEquals(expected[i], actual[i]);
    }
  }
}
