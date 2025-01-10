package gms.shared.signalenhancement.api;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FilterDefintionByUsageMapRequestTest {

  @ParameterizedTest
  @MethodSource("getFilterDefintionByUsageMapRequestArguments")
  void testFilterDefintionByUsageMapRequest(
      Set<Channel> channels, Set<PhaseType> phases, Class<? extends Throwable> expectedException) {

    if (expectedException != null) {
      assertThrows(expectedException, () -> new FilterDefintionByUsageMapRequest(channels, phases));
    } else {
      Assertions.assertDoesNotThrow(() -> new FilterDefintionByUsageMapRequest(channels, phases));
    }
  }

  static Stream<Arguments> getFilterDefintionByUsageMapRequestArguments() {

    var channel1 = ChannelSegmentTestFixtures.getTestChannel("my Channel1");
    var channel2 = ChannelSegmentTestFixtures.getTestChannel("my Channel2");
    var phase1 = PhaseType.I;
    var phase2 = PhaseType.IPx;

    return Stream.of(
        arguments(
            Set.of(channel1.toEntityReference(), channel2.toEntityReference()),
            Set.of(phase1, phase2),
            null),
        arguments(Set.of(channel1.toEntityReference()), Set.of(phase1), null),
        arguments(
            Set.of(channel1.toEntityReference(), channel2.toEntityReference()),
            Set.of(),
            IllegalArgumentException.class),
        arguments(Set.of(), Set.of(phase1), IllegalArgumentException.class),
        arguments(
            Set.of(channel1.toEntityReference(), channel2.toEntityReference()),
            null,
            NullPointerException.class),
        arguments(null, Set.of(phase1), NullPointerException.class),
        arguments(null, null, NullPointerException.class));
  }
}
