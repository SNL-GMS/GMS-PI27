package gms.shared.fk.coi;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkSpectraDefinitionTest {

  private static final FkSpectraDefinition DEFINITION =
      FkSpectraDefinition.builder()
          .setWindowLead(Duration.ZERO)
          .setWindowLength(Duration.ofSeconds(4))
          .setSampleRateHz(0.5)
          .setLowFrequencyHz(1)
          .setHighFrequencyHz(2)
          .setUseChannelVerticalOffsets(true)
          .setNormalizeWaveforms(false)
          .setPhaseType(PhaseType.P)
          .setSlowStartXSecPerKm(22)
          .setSlowDeltaXSecPerKm(23)
          .setSlowCountX(24)
          .setSlowStartYSecPerKm(66)
          .setSlowDeltaYSecPerKm(68)
          .setSlowCountY(69)
          .setWaveformSampleRateHz(4)
          .setWaveformSampleRateToleranceHz(.01)
          .setMinimumWaveformsForSpectra(2)
          .build();

  @ParameterizedTest
  @MethodSource("getBuildArguments")
  void testBuildValidation(String expectedMessage, FkSpectraDefinition.Builder builder) {
    IllegalStateException ex =
        Assertions.assertThrows(IllegalStateException.class, () -> builder.build());
    Assertions.assertEquals(expectedMessage, ex.getMessage());
  }

  static Stream<Arguments> getBuildArguments() {
    return Stream.of(
        arguments(
            "FkSpectraDefinition requires windowLength of Duration > 0",
            DEFINITION.toBuilder().setWindowLength(Duration.ZERO)),
        arguments(
            "FkSpectraDefinition requires sampleRate > 0.0",
            DEFINITION.toBuilder().setSampleRateHz(-1)),
        arguments(
            "FkSpectraDefinition requires lowFrequency >= 0.0",
            DEFINITION.toBuilder().setLowFrequencyHz(-1)),
        arguments(
            "FkSpectraDefinition requires lowFrequency < highFrequency",
            DEFINITION.toBuilder().setHighFrequencyHz(1)),
        arguments(
            "FkSpectraDefinition requires slowCountX > 0",
            DEFINITION.toBuilder().setSlowCountX(-1)),
        arguments(
            "FkSpectraDefinition requires slowCountY > 0", DEFINITION.toBuilder().setSlowCountY(0)),
        arguments(
            "FkSpectraDefinition requires waveformSampleRateHz > 0.0",
            DEFINITION.toBuilder().setWaveformSampleRateHz(-3)),
        arguments(
            "FkSpectraDefinition requires waveformSampleRateToleranceHz >= 0.0",
            DEFINITION.toBuilder().setWaveformSampleRateToleranceHz(-1)),
        arguments(
            "FkSpectraDefinition requires minimumWaveformsForSpectra > 1",
            DEFINITION.toBuilder().setMinimumWaveformsForSpectra(1)));
  }

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(DEFINITION, FkSpectraDefinition.class);
  }
}
