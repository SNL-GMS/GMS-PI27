package gms.shared.event.analysis;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.event.coi.ScalingFactorType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class LocationUncertaintyDefinitionTest {

  @ParameterizedTest
  @MethodSource("missingInputsArguments")
  void testMissingInputs(
      LocationUncertaintyDefinition.Builder lduBuilder,
      Class<? extends Throwable> expectedException) {
    Assertions.assertThrows(expectedException, () -> lduBuilder.build());
  }

  private static Stream<Arguments> missingInputsArguments() {
    var lduBuilder = LocationUncertaintyDefinition.builder();

    return Stream.of(
        arguments(
            LocationUncertaintyDefinition.builder()
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setKWeight(Double.POSITIVE_INFINITY)
                .setScalingFactorType(ScalingFactorType.COVERAGE),
            NullPointerException.class),
        arguments(
            LocationUncertaintyDefinition.builder()
                .setAprioriStandardError(10.0)
                .setEllipsoid(true)
                .setKWeight(Double.POSITIVE_INFINITY)
                .setScalingFactorType(ScalingFactorType.COVERAGE),
            IllegalStateException.class),
        arguments(
            LocationUncertaintyDefinition.builder()
                .setAprioriStandardError(10.0)
                .setConfidenceLevel(0.5)
                .setKWeight(Double.POSITIVE_INFINITY)
                .setScalingFactorType(ScalingFactorType.COVERAGE),
            IllegalStateException.class),
        arguments(
            LocationUncertaintyDefinition.builder()
                .setAprioriStandardError(10.0)
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setScalingFactorType(ScalingFactorType.COVERAGE),
            IllegalStateException.class),
        arguments(
            LocationUncertaintyDefinition.builder()
                .setAprioriStandardError(10.0)
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setKWeight(Double.POSITIVE_INFINITY),
            IllegalStateException.class));
  }

  @ParameterizedTest
  @MethodSource("preconditionsArguments")
  void testPreconditions(LocationUncertaintyDefinition.Builder lduBuilder) {
    Assertions.assertThrows(IllegalArgumentException.class, () -> lduBuilder.build());
  }

  private static Stream<Arguments> preconditionsArguments() {
    var ldu =
        LocationUncertaintyDefinition.builder()
            .setAprioriStandardError(10.0)
            .setConfidenceLevel(0.5)
            .setEllipsoid(true)
            .setKWeight(Double.POSITIVE_INFINITY)
            .setScalingFactorType(ScalingFactorType.COVERAGE)
            .build();

    return Stream.of(
        arguments(ldu.toBuilder().setAprioriStandardError(-1.0)),
        arguments(ldu.toBuilder().setAprioriStandardError(1_000_000.0)),
        arguments(ldu.toBuilder().setConfidenceLevel(-1.0)),
        arguments(ldu.toBuilder().setConfidenceLevel(1_000_000.0)),
        arguments(ldu.toBuilder().setKWeight(-1.0)),
        arguments(
            LocationUncertaintyDefinition.builder(ldu)
                .setScalingFactorType(ScalingFactorType.CONFIDENCE)),
        arguments(LocationUncertaintyDefinition.builder(ldu).setKWeight(0.0)),
        arguments(
            LocationUncertaintyDefinition.builder(ldu)
                .setScalingFactorType(ScalingFactorType.K_WEIGHTED)),
        arguments(
            LocationUncertaintyDefinition.builder(ldu)
                .setScalingFactorType(ScalingFactorType.K_WEIGHTED)
                .setKWeight(0.0)));
  }

  @Test
  void testSerialization() {
    var ldu =
        LocationUncertaintyDefinition.builder()
            .setAprioriStandardError(10.0)
            .setConfidenceLevel(0.5)
            .setEllipsoid(true)
            .setKWeight(Double.POSITIVE_INFINITY)
            .setScalingFactorType(ScalingFactorType.COVERAGE)
            .build();

    JsonTestUtilities.assertSerializes(ldu, LocationUncertaintyDefinition.class);
  }
}
