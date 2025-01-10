package gms.shared.event.coi.beam;

import com.google.common.base.Preconditions;
import java.util.Set;

/** Record containing a list of ChannelSegment by EventHypothesis items */
public record ChannelSegmentsByEventHypothesis(
    Set<EventHypothesisChannelSegmentsPair> eventHypothesisChannelSegmentsPairs) {

  public ChannelSegmentsByEventHypothesis {
    Preconditions.checkNotNull(eventHypothesisChannelSegmentsPairs);
  }
}
