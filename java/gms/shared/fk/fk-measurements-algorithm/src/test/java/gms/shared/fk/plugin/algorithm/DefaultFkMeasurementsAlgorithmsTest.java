package gms.shared.fk.plugin.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;

class DefaultFkMeasurementsAlgorithmsTest {

  private static final double PRECISION = 0.001;
  private static final double EXPECTED_SLOWNESS_UNCERTAINTY = 0.2900481473559255;
  private static final double EXPECTED_FSTAT = 11.026701173043678;

  @Test
  void testIndexOfFkMax() {
    // Test at (1, 2)
    double[][] testMap1 = {
      {0, 0, 0},
      {0, 0, 0},
      {0, 1, 0}
    };
    Pair<Double, Double> expected = Pair.of(1.0, 2.0);
    Pair<Double, Double> actual = DefaultFkMeasurementsAlgorithms.indexOfFkMax(testMap1);
    assertEquals(expected, actual);

    // Test at (0, 0)
    double[][] testMap2 = {
      {10, 2, 3},
      {3, 2, 1},
      {1, 0, 9}
    };
    Pair<Double, Double> expected2 = Pair.of(0.0, 0.0);
    Pair<Double, Double> actual2 = DefaultFkMeasurementsAlgorithms.indexOfFkMax(testMap2);
    assertEquals(expected2, actual2);

    // Test at (2, 2)
    double[][] testMap3 = {
      {0.001, 0.002, 0.003},
      {0.001, 0.003, 0.003},
      {0.001, 0.002, 0.0031}
    };
    Pair<Double, Double> expected3 = Pair.of(2.0, 2.0);
    Pair<Double, Double> actual3 = DefaultFkMeasurementsAlgorithms.indexOfFkMax(testMap3);
    assertEquals(expected3, actual3);
  }

  @Test
  void testSlownessXComponent() {
    assertEquals(0.0, DefaultFkMeasurementsAlgorithms.slownessXComponent(-5, 1, 5), PRECISION);
    assertEquals(1, DefaultFkMeasurementsAlgorithms.slownessXComponent(0, 0.2, 5), PRECISION);
    assertEquals(3, DefaultFkMeasurementsAlgorithms.slownessXComponent(0, 0.1, 30), PRECISION);
  }

  @Test
  void testSlownessYComponent() {
    assertEquals(0.0, DefaultFkMeasurementsAlgorithms.slownessYComponent(5, -1, 5), PRECISION);
    assertEquals(-1, DefaultFkMeasurementsAlgorithms.slownessYComponent(0, -0.2, 5), PRECISION);
    assertEquals(-4, DefaultFkMeasurementsAlgorithms.slownessYComponent(0, -0.1, 40), PRECISION);
  }

  @Test
  void testSlownessOfIndex() {
    assertEquals(
        0.0, DefaultFkMeasurementsAlgorithms.slownessOfIndex(-5, 1, 5, -1, 5, 5), PRECISION);
    assertEquals(
        157.2533733278164,
        DefaultFkMeasurementsAlgorithms.slownessOfIndex(0, 0.2, 0, -0.2, 5, 5),
        PRECISION);
    assertEquals(
        555.9746332227937,
        DefaultFkMeasurementsAlgorithms.slownessOfIndex(0, 0.1, 0, -0.1, 30, 40),
        PRECISION);
  }

  @Test
  void testAzimuthOfIndex() {
    assertEquals(
        0.0, DefaultFkMeasurementsAlgorithms.azimuthOfIndex(-5, 1, 5, -1, 5, 5), PRECISION);
    assertEquals(
        225.0, DefaultFkMeasurementsAlgorithms.azimuthOfIndex(0, 0.2, 0, -0.2, 5, 5), PRECISION);
    assertEquals(
        233.130,
        DefaultFkMeasurementsAlgorithms.azimuthOfIndex(0, 0.1, 0, -0.1, 30, 40),
        PRECISION);
  }

  @Test
  void testSlownessUncertainty() {
    assertEquals(
        EXPECTED_SLOWNESS_UNCERTAINTY,
        DefaultFkMeasurementsAlgorithms.slownessUncertainty(10, 0, EXPECTED_FSTAT, 0.04),
        PRECISION);
  }

  @Test
  void testAzimuthUncertainty() {
    assertEquals(
        1.9571319732727406,
        DefaultFkMeasurementsAlgorithms.azimuthUncertainty(
            8.491682159702084, EXPECTED_SLOWNESS_UNCERTAINTY),
        PRECISION);
  }
}
