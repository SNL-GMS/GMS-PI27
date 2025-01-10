package gms.shared.fk.plugin.fkattributes;

import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.AZIMUTH;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.DEL_AZ;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.DEL_SLOW;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.FK_MAX_COORDINATES;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.F_STAT;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.SLOWNESS;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.SPECTRA_INFO;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.SPECTRUM;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.waveform.coi.FkSpectrum;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkAttributesCalculatorTest {

  private FkAttributesCalculator calculator;

  private static final double UNCERTAINTY = 0.000001;

  @BeforeEach
  void setup() {
    calculator = FkAttributesCalculator.create(SPECTRA_INFO, SPECTRUM, FK_MAX_COORDINATES);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(
      String expectedMessage,
      FkSpectraInfo spectraInfo,
      FkSpectrum spectrum,
      Pair<Double, Double> fkMaxCoordinates) {

    Exception ex =
        assertThrows(
            NullPointerException.class,
            () -> FkAttributesCalculator.create(spectraInfo, spectrum, fkMaxCoordinates));
    assertEquals(expectedMessage, ex.getMessage());
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments("Fk Spectra Info cannot be null.", null, SPECTRUM, FK_MAX_COORDINATES),
        arguments("Fk Spectrum cannot be null.", SPECTRA_INFO, null, FK_MAX_COORDINATES),
        arguments("Fk Max Coordinate info cannot be null.", SPECTRA_INFO, SPECTRUM, null));
  }

  @Test
  void testCreate() {
    FkAttributesCalculator calculator =
        assertDoesNotThrow(
            () -> FkAttributesCalculator.create(SPECTRA_INFO, SPECTRUM, FK_MAX_COORDINATES));

    assertNotNull(calculator);
  }

  @Test
  void testAzimuth() {
    assertEquals(AZIMUTH, calculator.azimuth(), UNCERTAINTY);
  }

  @Test
  void testSlowness() {
    assertEquals(SLOWNESS, calculator.slowness(), UNCERTAINTY);
  }

  @Test
  void testFStatistic() {
    assertEquals(F_STAT, calculator.fStatistic(), UNCERTAINTY);
  }

  @Test
  void testSlownessUncertainty() {
    assertEquals(DEL_SLOW, calculator.slownessUncertainty(), UNCERTAINTY);
  }

  @Test
  void testAzimuthUncertainty() {
    assertEquals(DEL_AZ, calculator.azimuthUncertainty(), UNCERTAINTY);
  }
}
