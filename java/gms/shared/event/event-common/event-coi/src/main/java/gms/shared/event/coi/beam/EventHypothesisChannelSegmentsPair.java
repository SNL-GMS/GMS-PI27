package gms.shared.event.coi.beam;

import com.google.common.base.Preconditions;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.List;
import org.apache.commons.lang3.Validate;

/** Record containing an EventHypothesis and Collection of EventHypothesis objects */
public record EventHypothesisChannelSegmentsPair(
    EventHypothesis eventHypothesis, List<ChannelSegment<Waveform>> channelSegments) {

  public EventHypothesisChannelSegmentsPair {
    Preconditions.checkNotNull(eventHypothesis);
    Preconditions.checkNotNull(channelSegments);
    Validate.notEmpty(channelSegments);
  }
}
