package gms.shared.event.coi.beam;

import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventHypothesisChannelSegmentsPairTest {

  @Test
  void testSerialization() {

    var UUID_1 = UUID.fromString("12347cc2-8c86-4fa1-a764-c9b9944614b7");

    var eventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            UUID_1,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            3.3,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
            List.of());

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    EventHypothesisChannelSegmentsPair pair =
        new EventHypothesisChannelSegmentsPair(eventHypothesis, List.of(channelSegment));

    JsonTestUtilities.assertSerializes(pair, EventHypothesisChannelSegmentsPair.class);
  }
}
