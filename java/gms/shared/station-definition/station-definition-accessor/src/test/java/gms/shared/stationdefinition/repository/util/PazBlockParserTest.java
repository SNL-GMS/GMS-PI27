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

class PazBlockParserTest {

  private static final double TOLERANCE = 1E-12;
  private PazBlockParser pazBlockParser;

  @BeforeEach
  void setup() {
    pazBlockParser = new PazBlockParser();
  }

  @Test
  void testParseBlock() {
    var result = pazBlockParser.parseBlock(TestFixtures.TEST_INPUT, TestFixtures.TEST_FREQS);

    for (var i = 0; i < result.size(); i++) {
      assertTrue(
          Precision.equals(result.get(i).getLeft(), TestFixtures.TEST_FREQS.get(i), TOLERANCE));
      assertTrue(
          Complex.equals(result.get(i).getRight(), TestFixtures.TEST_RESPONSES.get(i), TOLERANCE));
    }
  }

  @Test
  void testParseBlockSmeTestData() {
    var result = pazBlockParser.parseBlock(TestFixtures.TEST_INPUT, TestFixtures.SME_FREQS);
    var scalingFactor = 1.142369132E+12;

    for (var i = 0; i < result.size(); i++) {
      var actualFreq = result.get(i).getLeft();
      // PazBlockParser does not use the scaling factor, as it gets wiped out during the
      // normalization step
      var actualAmplitude = result.get(i).getRight().abs() * scalingFactor;
      var actualPhaseDegrees = Math.toDegrees(result.get(i).getRight().getArgument());
      assertTrue(Precision.equals(actualFreq, TestFixtures.SME_FREQS.get(i), TOLERANCE));
      assertTrue(
          Precision.equals(
              actualAmplitude, TestFixtures.SME_RESPONSES.get(i).getLeft(), TOLERANCE));
      assertTrue(
          Precision.equals(
              actualPhaseDegrees, TestFixtures.SME_RESPONSES.get(i).getRight(), TOLERANCE));
    }
  }

  @Test
  void testParseBlockBadInputs() {

    String[] tinyArray = {"2.343750E-01   0", "9.375000E-02  0", "1.562500E-02   0", "0"};
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(tinyArray, TestFixtures.TEST_FREQS));

    var noPoles = TestFixtures.TEST_INPUT.clone();
    noPoles[2] = "0";
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(noPoles, TestFixtures.TEST_FREQS));

    String[] missingPoles = {
      "theoretical  1   instrument    paz",
      "1.142369132E+12",
      "7",
      "-3.70236694e-02 -3.70236694e-02 0   0",
      "4",
      "-2.09230070e+00 0   0   0",
      "0       0   0   0",
      "0       0   0   0",
      "0       0   0   0"
    };
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(missingPoles, TestFixtures.TEST_FREQS));

    var parseError = TestFixtures.TEST_INPUT.clone();
    parseError[2] = "seven";
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(parseError, TestFixtures.TEST_FREQS));

    var wrongNumberOfEntriesForPole = TestFixtures.TEST_INPUT.clone();
    wrongNumberOfEntriesForPole[3] = "-3.70236694e-02 -3.70236694e-02 0 0 0";
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(wrongNumberOfEntriesForPole, TestFixtures.TEST_FREQS));

    var noZeros = TestFixtures.TEST_INPUT.clone();
    noZeros[10] = "0";
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(noZeros, TestFixtures.TEST_FREQS));

    String[] tooManyZeros = {
      "theoretical  1   instrument    paz",
      "1.142369132E+12",
      "7",
      "-3.70236694e-02 -3.70236694e-02 0   0",
      "-3.70236694e-02 +3.70236694e-02 0   0",
      "-1.31946891e+01  0.00000000e+00 0   0",
      "-5.02654824e+02 -8.16814089e+02 0   0",
      "-5.02654824e+02 +8.16814089e+02 0   0",
      "-3.26725636e+02  0.00000000e+00 0   0",
      "-1.72787596e+03  0.00000000e+00 0   0",
      "4",
      "-2.09230070e+00 0   0   0",
      "0       0   0   0",
      "0       0   0   0",
      "0       0   0   0",
      "0       0   0   0"
    };
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(tooManyZeros, TestFixtures.TEST_FREQS));

    var wrongNumberOfEntriesForZero = TestFixtures.TEST_INPUT.clone();
    wrongNumberOfEntriesForZero[12] = "-3.70236694e-02 -3.70236694e-02";
    assertThrows(
        IllegalArgumentException.class,
        () -> pazBlockParser.parseBlock(wrongNumberOfEntriesForZero, TestFixtures.TEST_FREQS));

    var divisionByZero = TestFixtures.TEST_INPUT.clone();
    divisionByZero[5] = "0 " + 2.0 * Math.PI * TestFixtures.TEST_FREQS.get(0) + " 0 0";
    var result = pazBlockParser.parseBlock(divisionByZero, TestFixtures.TEST_FREQS);
    assertEquals(Complex.NaN, result.get(0).getRight());

    var goodArray = TestFixtures.TEST_INPUT.clone();
    assertDoesNotThrow(() -> pazBlockParser.parseBlock(goodArray, TestFixtures.TEST_FREQS));
  }

  private static class TestFixtures {

    // This is a SME-provided example PAZ file
    private static String[] TEST_INPUT = {
      "theoretical  1   instrument    paz",
      "1.142369132E+12",
      "7",
      "-3.70236694e-02 -3.70236694e-02 0   0",
      "-3.70236694e-02 +3.70236694e-02 0   0",
      "-1.31946891e+01  0.00000000e+00 0   0",
      "-5.02654824e+02 -8.16814089e+02 0   0",
      "-5.02654824e+02 +8.16814089e+02 0   0",
      "-3.26725636e+02  0.00000000e+00 0   0",
      "-1.72787596e+03  0.00000000e+00 0   0",
      "4",
      "-2.09230070e+00 0   0   0",
      "0       0   0   0",
      "0       0   0   0",
      "0       0   0   0"
    };

    // This is a partial list of the SME frequency list
    private static final List<Double> TEST_FREQS =
        List.of(0.02, 0.0211179638886715, 18.9412200015444, 20.0);

    // This is an Excel calculation of the responses using the method in the wiki
    private static final List<Complex> TEST_RESPONSES =
        List.of(
            Complex.valueOf(-2.34980398961197E-14, +2.97028211403866E-14),
            Complex.valueOf(-2.38495144636006E-14, +3.22538316290321E-14),
            Complex.valueOf(9.46823861745879E-11, +1.93058367033891E-10),
            Complex.valueOf(1.06271352712743E-10, +1.99212018009279E-10));

    // This is a partial list of the SME frequency test data
    private static final List<Double> SME_FREQS =
        List.of(
            0.020000000000000004,
            0.021117963888671577,
            0.022298419940161834,
            17.93849075734543,
            18.94122000154448,
            20.000000000000004);

    // This is the list of corresponding SME instrument responses (amplitude phase)
    private static final List<Pair<Double, Double>> SME_RESPONSES =
        List.of(
            Pair.of(0.043265720321816845, 128.3476849748379),
            Pair.of(0.045824653607370036, 126.48040583807644),
            Pair.of(0.048509418880427535, 124.7473625936405),
            Pair.of(233.78671474163966, 65.76626240194918),
            Pair.of(245.63934829706062, 63.8750977640425),
            Pair.of(257.9302250546503, 61.92192810813666));
  }
}
