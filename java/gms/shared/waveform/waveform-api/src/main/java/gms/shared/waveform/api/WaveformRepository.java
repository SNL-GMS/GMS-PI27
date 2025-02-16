package gms.shared.waveform.api;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.lang3.tuple.Pair;

/** Repository interface for caching {@link Waveform} {@link ChannelSegment}s */
public interface WaveformRepository {

  /**
   * Returns a collection of {@link ChannelSegment} for each Channel entity provided in the query
   * parameters (since Channel is faceted, the provided objects may be fully populated or contain
   * only references).
   *
   * <p>
   *
   * <p>The response has a collection of ChannelSegments for each Channel entity since a
   * ChannelSegment is associated to a single Channel object but there may be multiple versions of
   * each Channel entity within the queried time interval.
   *
   * <p>
   *
   * <p>Each ChannelSegment may contain multiple Waveforms to account for gaps in available waveform
   * samples or changes in sample rate, but each Waveform is as long as possible. This operation
   * always returns calibrated waveform samples.
   *
   * @param channels List of channels to return the list of ChannelSegments for.
   * @param startTime beginning time of waveforms to query over
   * @param endTime end time of waveforms to query over
   * @return list of all {@link ChannelSegment} objects for each Channel entity within the queried
   *     time interval
   */
  Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
      Set<Channel> channels, Instant startTime, Instant endTime);

  /**
   * Returns a collection of {@link ChannelSegment} as it existed at the creation time listed in
   * ChannelSegmentDescriptor, even if newer data samples have since been stored in this
   * WaveformRepository. (since Channel is faceted, the provided objects may be fully populated or
   * contain only references).
   *
   * <p>
   *
   * <p>All of the samples returned for a ChannelSegmentDescriptor must be for the exact Channel
   * version provided in that ChannelSegmentDescriptor. Each returned ChannelSegment may contain
   * multiple Waveforms to account for gaps in available waveform samples or changes in sample rate,
   * but each Waveform is as long as possible.
   *
   * @param channelSegmentDescriptors list of {@link ChannelSegmentDescriptor}
   * @return list of all {@link ChannelSegment} objects for each Channel entity within the queried
   *     time interval
   */
  Collection<ChannelSegment<Waveform>> findByChannelSegmentDescriptors(
      Collection<ChannelSegmentDescriptor> channelSegmentDescriptors);

  /**
   * Returns a map of EventHpothesis to associated list of ChannelSegments
   *
   * @param eventHypotheses list of {@link eventHypothesis}
   * @param stations list of {@link station}
   * @return map of {@link EventHypothesis} to collection of {@link ChannelSegment}
   */
  Pair<Map<EventHypothesis, List<ChannelSegment<Waveform>>>, Boolean>
      findEventBeamsByEventHypothesesAndStations(
          Collection<EventHypothesis> eventHypotheses, Collection<Station> stations);
}
