package gms.shared.waveform.coi;

import static gms.shared.waveform.testfixture.FkTestFixtures.SPECTRUM;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkSpectrumTest {

  @ParameterizedTest
  @MethodSource("getBuildArguments")
  void testBuildValidation(String expectedMessage, FkSpectrum.Builder builder) {
    IllegalStateException ex = assertThrows(IllegalStateException.class, () -> builder.build());
    assertEquals(expectedMessage, ex.getMessage());
  }

  static Stream<Arguments> getBuildArguments() {
    return Stream.of(
        arguments(
            "Power and Fstat must have same row count",
            SPECTRUM.toBuilder()
                .setPower(
                    Immutable2dDoubleArray.from(
                        new double[][] {{0.1, 0.1, 0.1}, {0.1, 0.5, 0.1}}))),
        arguments(
            "Power and Fstat must have same column count",
            SPECTRUM.toBuilder()
                .setPower(
                    Immutable2dDoubleArray.from(
                        new double[][] {{0.1, 0.1}, {0.1, 0.5}, {0.1, 0.1}}))));
  }

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(SPECTRUM, FkSpectrum.class);
  }
}
