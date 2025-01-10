package gms.shared.signalfeaturemeasurement.coi;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class AmplitudeMeasurementDefinitionTest {

  private static AmplitudeMeasurementDefinition amd =
      AmplitudeMeasurementDefinition.builder()
          .setMinPeriod(Duration.ofSeconds(10))
          .setMaxPeriod(Duration.ofSeconds(100))
          .setWindowDuration(Duration.ofSeconds(50))
          .setWindowArrivalTimeLead(Duration.ofSeconds(60))
          .setPhases(List.of(PhaseType.P))
          .setSmoothnessThreshold(0.5)
          .setRemoveFilterResponse(false)
          .setRemoveInstrumentResponse(false)
          .setMeasurementMethod(AmplitudeMeasurementMethod.MAX_PEAK_TO_TROUGH)
          .setType(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2)
          .build();

  @ParameterizedTest
  @MethodSource("invalidInputArguments")
  void testInvalidInputs(AmplitudeMeasurementDefinition.Builder builder) {
    Assertions.assertThrows(IllegalArgumentException.class, () -> builder.build());
  }

  private static Stream<Arguments> invalidInputArguments() {
    return Stream.of(
        arguments(amd.toBuilder().setMinPeriod(null)),
        arguments(amd.toBuilder().setMinPeriod(Duration.ofSeconds(-10))),
        arguments(amd.toBuilder().setMinPeriod(Duration.ofSeconds(0))),
        arguments(amd.toBuilder().setMaxPeriod(null)),
        arguments(amd.toBuilder().setMaxPeriod(Duration.ofSeconds(5))),
        arguments(amd.toBuilder().setSmoothnessThreshold(null)),
        arguments(amd.toBuilder().setSmoothnessThreshold(-0.5)),
        arguments(amd.toBuilder().setSmoothnessThreshold(1.5)),
        arguments(amd.toBuilder().setPhases(List.of())),
        arguments(
            AmplitudeMeasurementDefinition.builder(amd)
                .setMinPeriod(null)
                .setMaxPeriod(null)
                .setMeasurementMethod(AmplitudeMeasurementMethod.ROOT_MEAN_SQUARE)),
        arguments(
            AmplitudeMeasurementDefinition.builder(amd)
                .setMaxPeriod(null)
                .setSmoothnessThreshold(null)
                .setMeasurementMethod(AmplitudeMeasurementMethod.ROOT_MEAN_SQUARE)),
        arguments(
            AmplitudeMeasurementDefinition.builder(amd)
                .setMinPeriod(null)
                .setSmoothnessThreshold(null)
                .setMeasurementMethod(AmplitudeMeasurementMethod.ROOT_MEAN_SQUARE)));
  }
}
