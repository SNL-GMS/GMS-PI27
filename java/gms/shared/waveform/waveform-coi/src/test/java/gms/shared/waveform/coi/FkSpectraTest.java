package gms.shared.waveform.coi;

import static gms.shared.waveform.testfixture.FkTestFixtures.FK_SPECTRUM2;
import static gms.shared.waveform.testfixture.FkTestFixtures.FK_SPECTRUM3;
import static gms.shared.waveform.testfixture.FkTestFixtures.SPECTRA;
import static gms.shared.waveform.testfixture.FkTestFixtures.SPECTRUM;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.FkSpectra.Builder;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkSpectraTest {

  @ParameterizedTest
  @MethodSource("getBuildArguments")
  void testBuildValidation(String expectedMessage, Builder builder) {
    IllegalStateException ex = assertThrows(IllegalStateException.class, () -> builder.build());
    assertEquals(expectedMessage, ex.getMessage());
  }

  static Stream<Arguments> getBuildArguments() {
    return Stream.of(
        arguments(
            "cannot contain empty FkSpectrum values", SPECTRA.toBuilder().setValues(List.of())),
        arguments(
            "Power must contain the same number of rows",
            SPECTRA.toBuilder().setValues(List.of(FK_SPECTRUM2, FK_SPECTRUM3))),
        arguments(
            "Power must contain the same number of columns",
            SPECTRA.toBuilder().setValues(List.of(FK_SPECTRUM2, SPECTRUM))),
        arguments(
            "The number of FkSpectrum objects found in the FkSpectra"
                + " does not match the Sample Count specified in the Channel Segment object "
                + "(expected 2, found 1).",
            SPECTRA.toBuilder().setSampleCount(2)));
  }

  @Test
  void testSerialization() {

    JsonTestUtilities.assertSerializes(SPECTRA, FkSpectra.class);
  }
}
