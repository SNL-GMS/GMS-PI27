package gms.shared.fk.plugin;

import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.ATTRIBUTES;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.FK_MAX_COORDINATES;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.SPECTRA_INFO;
import static gms.shared.fk.plugin.fkattributes.utils.FkAttributesTestFixtures.SPECTRUM;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.waveform.coi.FkAttributes;
import gms.shared.waveform.coi.FkSpectrum;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class MaxPowerFkAttributesPluginTest {

  private MaxPowerFkAttributesPlugin plugin;

  @BeforeEach
  void setup() {
    plugin = new MaxPowerFkAttributesPlugin();
  }

  @ParameterizedTest
  @MethodSource("getGenerateFkAttributesArguments")
  void testGenerateFkAttributesValidation(
      String expectedMessage, FkSpectraInfo spectraInfo, FkSpectrum spectrum) {
    Exception exception =
        assertThrows(
            NullPointerException.class, () -> plugin.generateFkAttributes(spectraInfo, spectrum));

    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getGenerateFkAttributesArguments() {
    return Stream.of(
        arguments("(FkSpectrainfo) spectra information cannot be null.", null, SPECTRUM),
        arguments("(FkSpectrum) spectrum values cannot be null.", SPECTRA_INFO, null));
  }

  @Test
  void testGenerateFkAttributes() {
    FkAttributes actualAttributes = plugin.generateFkAttributes(SPECTRA_INFO, SPECTRUM);

    assertEquals(ATTRIBUTES.getAzimuth(), actualAttributes.getAzimuth(), 0.0001);
    assertEquals(ATTRIBUTES.getSlowness(), actualAttributes.getSlowness(), 0.0001);
    assertEquals(
        ATTRIBUTES.getAzimuthUncertainty(), actualAttributes.getAzimuthUncertainty(), 0.0001);
    assertEquals(
        ATTRIBUTES.getSlownessUncertainty(), actualAttributes.getSlownessUncertainty(), 0.0001);
    assertEquals(ATTRIBUTES.getPeakFStat(), actualAttributes.getPeakFStat(), 0.0001);
  }

  @ParameterizedTest
  @MethodSource("getGenerateFkAttributesCustomPointArguments")
  void testGenerateFkAttributesCustomPointArguments(
      String expectedMessage,
      FkSpectraInfo spectraInfo,
      FkSpectrum spectrum,
      Pair<Double, Double> customPoint) {

    Exception exception =
        assertThrows(
            NullPointerException.class,
            () -> plugin.generateFkAttributes(spectraInfo, spectrum, customPoint));
    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getGenerateFkAttributesCustomPointArguments() {
    return Stream.of(
        arguments("(FkSpectraInfo) spectraInfo cannot be null", null, SPECTRUM, FK_MAX_COORDINATES),
        arguments("(FkSpectrum) spectrum cannot be null.", SPECTRA_INFO, null, FK_MAX_COORDINATES),
        arguments(
            "(Pair<Double, Double>) customPoint cannot be null.", SPECTRA_INFO, SPECTRUM, null));
  }

  @Test
  void testGenerateFkAttributesCustomPoint() {
    FkAttributes actualAttributes =
        plugin.generateFkAttributes(SPECTRA_INFO, SPECTRUM, FK_MAX_COORDINATES);

    assertEquals(ATTRIBUTES.getAzimuth(), actualAttributes.getAzimuth(), 0.0001);
    assertEquals(ATTRIBUTES.getSlowness(), actualAttributes.getSlowness(), 0.0001);
    assertEquals(
        ATTRIBUTES.getAzimuthUncertainty(), actualAttributes.getAzimuthUncertainty(), 0.0001);
    assertEquals(
        ATTRIBUTES.getSlownessUncertainty(), actualAttributes.getSlownessUncertainty(), 0.0001);
    assertEquals(ATTRIBUTES.getPeakFStat(), actualAttributes.getPeakFStat(), 0.0001);
  }
}
