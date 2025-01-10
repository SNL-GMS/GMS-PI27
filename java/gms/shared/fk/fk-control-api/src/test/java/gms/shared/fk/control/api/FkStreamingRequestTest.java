package gms.shared.fk.control.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkStreamingRequestTest {

  private static final FkStreamingRequest REQUEST =
      FkStreamingRequest.builder()
          .setChannels(Set.of(UtilsTestFixtures.CHANNEL))
          .setStartTime(Instant.EPOCH)
          .setSampleRate(20.0)
          .setSampleCount(10)
          .setWindowLead(Duration.ofSeconds(5))
          .setWindowLength(Duration.ofSeconds(60))
          .setLowFrequency(3.0)
          .setHighFrequency(6.0)
          .setPhaseType(PhaseType.P)
          .setSlowStartX(2.0)
          .setSlowDeltaX(3.0)
          .setSlowCountX(10)
          .setSlowStartY(1.0)
          .setSlowDeltaY(1.0)
          .setSlowCountY(10)
          .setUseChannelVerticalOffset(false)
          .setNormalizeWaveforms(true)
          .build();

  @ParameterizedTest
  @MethodSource("getBuildArguments")
  void testBuildValidation(String expectedMessage, FkStreamingRequest.Builder builder) {
    IllegalStateException ex = assertThrows(IllegalStateException.class, () -> builder.build());
    assertEquals(expectedMessage, ex.getMessage());
  }

  static Stream<Arguments> getBuildArguments() {
    return Stream.of(
        arguments(
            "Error creating FkStreamingRequest: Sample Rate must be greater than 0",
            REQUEST.toBuilder().setSampleRate(-2.0)),
        arguments(
            "Error creating FkStreamingRequest: Sample Count must be greater than 0",
            REQUEST.toBuilder().setSampleCount(0)),
        arguments(
            "Error creating FkStreamingRequest: Channel Names cannot be empty",
            REQUEST.toBuilder().setChannels(Set.of())));
  }

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(REQUEST, FkStreamingRequest.class);
  }

  @Test
  void testToString() {

    var expected =
        "Channel names: "
            + REQUEST.getChannels()
            + "\n"
            + "Start time: "
            + REQUEST.getStartTime()
            + "\n"
            + "Sample rate: "
            + REQUEST.getSampleRate()
            + "\n"
            + "Sample count: "
            + REQUEST.getSampleCount()
            + "\n"
            + "Window lead: "
            + REQUEST.getWindowLead()
            + "\n"
            + "Window length: "
            + REQUEST.getWindowLength()
            + "\n"
            + "Frequency band (low, high): "
            + REQUEST.getLowFrequency()
            + ", "
            + REQUEST.getHighFrequency()
            + "\n"
            + "Phase type: "
            + REQUEST.getPhaseType()
            + "\n"
            + "Slow start: (x: "
            + REQUEST.getSlowStartX()
            + ", y: "
            + REQUEST.getSlowStartY()
            + ")\n"
            + "Slow delta: (x: "
            + REQUEST.getSlowDeltaX()
            + ", y: "
            + REQUEST.getSlowDeltaY()
            + ")\n"
            + "Slow count: (x: "
            + REQUEST.getSlowCountX()
            + ", y: "
            + REQUEST.getSlowCountY()
            + ")\n"
            + "Use channel vertical offset: "
            + REQUEST.getUseChannelVerticalOffset()
            + "\n"
            + "Normalize Waveforms: "
            + REQUEST.getNormalizeWaveforms();

    assertEquals(expected, REQUEST.toString());
  }
}
