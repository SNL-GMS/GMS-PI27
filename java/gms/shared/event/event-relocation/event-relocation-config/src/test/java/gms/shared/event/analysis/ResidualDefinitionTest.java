package gms.shared.event.analysis;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class ResidualDefinitionTest {

  @ParameterizedTest
  @MethodSource("missingInputsArguments")
  void testMissingInputs(
      ResidualDefinition.Builder rdBuilder, Class<? extends Throwable> expectedException) {
    Assertions.assertThrows(expectedException, () -> rdBuilder.build());
  }

  private static Stream<Arguments> missingInputsArguments() {
    return Stream.of(
        arguments(
            ResidualDefinition.builder().setAllowBigResidual(true).setBigResidualThreshold(10.0),
            NullPointerException.class),
        arguments(
            ResidualDefinition.builder().setAllowBigResidual(true).setMaxFraction(0.5),
            NullPointerException.class),
        arguments(
            ResidualDefinition.builder().setBigResidualThreshold(10.0).setMaxFraction(0.5),
            IllegalStateException.class));
  }

  @ParameterizedTest
  @MethodSource("preconditionsArguments")
  void testPreconditions(ResidualDefinition.Builder rdBuilder) {
    Assertions.assertThrows(IllegalArgumentException.class, () -> rdBuilder.build());
  }

  private static Stream<Arguments> preconditionsArguments() {
    var rd =
        ResidualDefinition.builder()
            .setAllowBigResidual(true)
            .setMaxFraction(.5)
            .setBigResidualThreshold(10.0)
            .build();

    return Stream.of(
        arguments(rd.toBuilder().setBigResidualThreshold(-1.0)),
        arguments(rd.toBuilder().setBigResidualThreshold(1_000_000.0)),
        arguments(ResidualDefinition.builder(rd).setMaxFraction(-1.0)),
        arguments(ResidualDefinition.builder(rd).setMaxFraction(2.0)),
        arguments(ResidualDefinition.builder(rd).setAllowBigResidual(false)),
        arguments(ResidualDefinition.builder(rd).setAllowBigResidual(false).setMaxFraction(null)));
  }

  @Test
  void testGoodInputs() {
    assertDoesNotThrow(
        () ->
            ResidualDefinition.builder()
                .setAllowBigResidual(true)
                .setMaxFraction(.5)
                .setBigResidualThreshold(10.0)
                .build());

    assertDoesNotThrow(
        () ->
            ResidualDefinition.builder()
                .setAllowBigResidual(false)
                .setMaxFraction(null)
                .setBigResidualThreshold(null)
                .build());
  }

  @Test
  void testSerialization() {
    var rd =
        ResidualDefinition.builder()
            .setAllowBigResidual(true)
            .setMaxFraction(.5)
            .setBigResidualThreshold(10.0)
            .build();

    JsonTestUtilities.assertSerializes(rd, ResidualDefinition.class);
  }
}
