package gms.shared.signalenhancement.coi.rotation;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import org.junit.jupiter.api.Test;

class RotationDescriptionTest {

  @Test
  void testRotationDescription() {
    assertThrows(
        NullPointerException.class,
        () -> new RotationDescription(null, SamplingType.INTERPOLATED, true));
    assertThrows(
        NullPointerException.class, () -> new RotationDescription(PhaseType.I, null, false));
    assertDoesNotThrow(
        () -> new RotationDescription(PhaseType.UNKNOWN, SamplingType.NEAREST_SAMPLE, true));
    assertDoesNotThrow(
        () ->
            RotationDescription.builder()
                .phaseType(PhaseType.UNKNOWN)
                .samplingType(SamplingType.NEAREST_SAMPLE)
                .twoDimensional(true)
                .build());
  }
}
