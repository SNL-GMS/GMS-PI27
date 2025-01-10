package gms.shared.waveform.util;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.beam.ChannelSegmentsByEventHypothesis;
import gms.shared.event.coi.beam.EventHypothesisChannelSegmentsPair;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

public final class WaveformManagerUtility {

  private WaveformManagerUtility() {
    // hide the public constructor
  }

  /**
   * Create the {@link ChannelSegmentsByEventHypothesis} from the {@link EventHypothesis} to {@link
   * ChannelSegment}s map
   *
   * @param eventHypothesisChannelSegmentsMap {@link EventHypothesis} to {@link ChannelSegment}s map
   * @return {@link ChannelSegmentsByEventHypothesis}
   */
  public static ChannelSegmentsByEventHypothesis createChannelSegmentsByEventHypothesis(
      Map<EventHypothesis, List<ChannelSegment<Waveform>>> eventHypothesisChannelSegmentsMap) {

    var eventHypothesisChannelSegmentsPairs = new HashSet<EventHypothesisChannelSegmentsPair>();
    for (var entry : eventHypothesisChannelSegmentsMap.entrySet()) {
      var eventHypothesis = entry.getKey();
      var channelSegments = entry.getValue();
      eventHypothesisChannelSegmentsPairs.add(
          new EventHypothesisChannelSegmentsPair(eventHypothesis, channelSegments));
    }

    return new ChannelSegmentsByEventHypothesis(eventHypothesisChannelSegmentsPairs);
  }
}
