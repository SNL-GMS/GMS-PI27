package gms.shared.event.coi.beam;

import gms.shared.event.coi.EventTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ChannelSegmentsByEventHypothesisTest {

  @Test
  void testSerialization() {
    var eventHypothesis = EventTestFixtures.getTestEventHypothesis();

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var pair = new EventHypothesisChannelSegmentsPair(eventHypothesis, List.of(channelSegment));

    ChannelSegmentsByEventHypothesis map = new ChannelSegmentsByEventHypothesis(Set.of(pair));

    JsonTestUtilities.assertSerializes(map, ChannelSegmentsByEventHypothesis.class);
  }
}
