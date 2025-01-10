package gms.shared.signalenhancement.coi.utils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class ChannelComponentsTest {

  @ParameterizedTest
  @MethodSource("channelComponentsValidationSource")
  void testChannelComponentsFromChannelName(String channelName, boolean expectThrowsIAE) {

    if (expectThrowsIAE) {
      assertThrows(
          IllegalArgumentException.class, () -> ChannelComponents.fromChannelName(channelName));

    } else {
      assertDoesNotThrow(() -> ChannelComponents.fromChannelName(channelName));
    }
  }

  private static Stream<Arguments> channelComponentsValidationSource() {
    return Stream.of(
        Arguments.arguments("STA.CHAN1.BHZ", false),
        Arguments.arguments("STA.CHAN1.BE", false),
        Arguments.arguments("STA.BEAM.BE/some-beam-info", false),
        Arguments.arguments("STA.BHZ", true),
        Arguments.arguments("STA.BHZ", true),
        Arguments.arguments("/some-beam-info", true));
  }
}
