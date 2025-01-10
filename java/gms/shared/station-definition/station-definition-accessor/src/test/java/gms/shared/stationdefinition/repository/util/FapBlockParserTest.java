package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.util.Precision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FapBlockParserTest {

  private static final double TOLERANCE = 1E-12;
  private FapBlockParser fapBlockParser;

  @BeforeEach
  void setup() {
    fapBlockParser = new FapBlockParser();
  }

  @Test
  void testParseBlock() {
    var result = fapBlockParser.parseBlock(TestFixtures.TEST_INPUT, TestFixtures.TEST_FREQS);

    for (var n = 0; n < result.size(); n++) {
      var actualAmp = result.get(n).getRight().abs();
      var actualPhase = Math.toDegrees(result.get(n).getRight().getArgument());
      var expectedAmp = TestFixtures.TEST_RESPONSES.get(n).getLeft();
      var expectedPhase = TestFixtures.TEST_RESPONSES.get(n).getRight();
      expectedPhase = (expectedPhase <= -180.0) ? (expectedPhase + 360.0) : expectedPhase;

      assertTrue(Precision.equals(expectedAmp, actualAmp, TOLERANCE));
      assertTrue(Precision.equals(expectedPhase, actualPhase, TOLERANCE));
    }
  }

  @Test
  void testParseBlockBadInputs() {

    String[] tinyArray = {"one line in file"};
    assertThrows(
        IllegalArgumentException.class,
        () -> fapBlockParser.parseBlock(tinyArray, TestFixtures.TEST_FREQS));

    var noData = TestFixtures.TEST_INPUT.clone();
    noData[1] = "0";
    assertThrows(
        IllegalArgumentException.class,
        () -> fapBlockParser.parseBlock(noData, TestFixtures.TEST_FREQS));

    var wrongNumberOfDataRows = TestFixtures.TEST_INPUT.clone();
    noData[1] = "8";
    assertThrows(
        IllegalArgumentException.class,
        () -> fapBlockParser.parseBlock(noData, TestFixtures.TEST_FREQS));

    var parseError = TestFixtures.TEST_INPUT.clone();
    parseError[1] = "nine";
    assertThrows(
        IllegalArgumentException.class,
        () -> fapBlockParser.parseBlock(parseError, TestFixtures.TEST_FREQS));

    var tooManyEntries = TestFixtures.TEST_INPUT.clone();
    tooManyEntries[3] = "-3.70236694e-02 -3.70236694e-02 0 0 0 0";
    assertThrows(
        IllegalArgumentException.class,
        () -> fapBlockParser.parseBlock(tooManyEntries, TestFixtures.TEST_FREQS));

    var tooFewEntries = TestFixtures.TEST_INPUT.clone();
    tooFewEntries[3] = "-3.70236694e-02 -3.70236694e-02";
    assertThrows(
        IllegalArgumentException.class,
        () -> fapBlockParser.parseBlock(tooFewEntries, TestFixtures.TEST_FREQS));

    var goodArray = TestFixtures.TEST_INPUT.clone();
    assertDoesNotThrow(() -> fapBlockParser.parseBlock(goodArray, TestFixtures.TEST_FREQS));
  }

  @Test
  void testParseBlockOutOfBounds() {
    var freqs = List.of(0.01, 25.0);

    var result = fapBlockParser.parseBlock(TestFixtures.TEST_INPUT, freqs);

    for (var actual : result) {
      assertEquals(Complex.NaN, actual.getRight());
    }
  }

  @Test
  void testQuadrants() {
    var result =
        fapBlockParser.parseBlock(
            TestFixtures.TEST_INPUT_QUADRANTS, TestFixtures.TEST_FREQS_QUADRANTS);

    for (var n = 0; n < result.size(); n++) {
      assertTrue(
          Precision.equals(
              TestFixtures.TEST_RESPONSES_QUADRANTS.get(n).getLeft(),
              result.get(n).getLeft(),
              TOLERANCE));
      assertTrue(
          Complex.equals(
              TestFixtures.TEST_RESPONSES_QUADRANTS.get(n).getRight(),
              result.get(n).getRight(),
              TOLERANCE));
    }
  }

  private static class TestFixtures {

    // A subset of the SME test FAP file
    private static String[] TEST_INPUT = {
      "theoretical 0   instrument  fap",
      "9",
      "00.0200    0.000012000   -88.85850     0.0    0.0  ",
      "00.0240    0.000020700   -89.67920     0.0    0.0 ",
      "00.1400    0.004108000  -101.69400     0.0    0.0  ",
      "00.1800    0.008715000  -105.29000     0.0    0.0 ",
      "00.3000    0.039919000  -116.14900     0.0    0.0  ",
      "00.3400    0.057780000  -119.83300     0.0    0.0 ",
      "19.6000    0.033057000  -267.41900     0.0    0.0  ",
      "19.8000    0.005864000  -267.48200     0.0    0.0  ",
      "20.0000    0.000140000  -267.54400     0.0    0.0"
    };

    // A subset of the SME frequency results
    private static final List<Double> TEST_FREQS =
        List.of(
            0.02,
            0.17732283464566928,
            0.3346456692913386,
            19.685354330708662,
            19.84267716535433,
            20.0);

    // The associated SME response results
    private static final List<Pair<Double, Double>> TEST_RESPONSES =
        List.of(
            Pair.of(1.2000000000000007e-05, -88.8585),
            Pair.of(0.008332807727793662, -105.04932283464568),
            Pair.of(0.05513283301087924, -119.3398661417323),
            Pair.of(0.015768671993527876, -267.44588661417316),
            Pair.of(0.002634494314009509, -267.4952299212598),
            Pair.of(0.00014000000000000004, -267.5439999999999));

    // Made to test convert() for different quadrants
    private static String[] TEST_INPUT_QUADRANTS = {
      "ignored",
      "4",
      "1.0  1.0   45  0.0  0.0",
      "2.0  1.0  135  0.0  0.0",
      "3.0  1.0  225  0.0  0.0",
      "4.0  1.0  315  0.0  0.0"
    };

    private static final List<Double> TEST_FREQS_QUADRANTS = List.of(1.0, 2.0, 3.0, 4.0);

    private static final List<Pair<Double, Complex>> TEST_RESPONSES_QUADRANTS =
        List.of(
            Pair.of(1.0, Complex.valueOf(Math.sqrt(2.0) / 2.0, Math.sqrt(2.0) / 2.0)),
            Pair.of(2.0, Complex.valueOf(-1.0 * Math.sqrt(2.0) / 2.0, Math.sqrt(2.0) / 2.0)),
            Pair.of(3.0, Complex.valueOf(-1.0 * Math.sqrt(2.0) / 2.0, -1.0 * Math.sqrt(2.0) / 2.0)),
            Pair.of(4.0, Complex.valueOf(Math.sqrt(2.0) / 2.0, -1.0 * Math.sqrt(2.0) / 2.0)));
  }
}
