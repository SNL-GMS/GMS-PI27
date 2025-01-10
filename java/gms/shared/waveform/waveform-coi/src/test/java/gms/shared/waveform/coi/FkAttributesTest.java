package gms.shared.waveform.coi;

import static gms.shared.waveform.testfixture.FkTestFixtures.ATTRIBUTES;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkAttributesTest {

  @ParameterizedTest
  @MethodSource("getBuildArguments")
  void testBuildValidation(String expectedMessage, FkAttributes.Builder builder) {
    IllegalArgumentException exception =
        assertThrows(IllegalArgumentException.class, () -> builder.build());
    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getBuildArguments() {
    return Stream.of(
        arguments(
            "Azimuth uncertainty must be greater than or equal to zero",
            ATTRIBUTES.toBuilder().setAzimuthUncertainty(-1)),
        arguments(
            "Slowness uncertainty must be greater than or equal to zero",
            ATTRIBUTES.toBuilder().setSlownessUncertainty(-2)));
  }

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(ATTRIBUTES, FkAttributes.class);
  }
}
