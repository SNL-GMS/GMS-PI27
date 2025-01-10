package gms.shared.waveform.api;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.processingmask.api.ProcessingMaskRepository;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.apache.commons.lang3.tuple.Pair;

/** Waveform accessor interface for processing waveform operations */
public interface WaveformAccessor
    extends WaveformRepository, ProcessingMaskRepository, QcSegmentRepository {

  /**
   * Implements a query to generate a list of {@link ChannelSegment}{@literal <}Waveform{@literal
   * >}s, given a set of {@link Channel}s and a time range
   *
   * @param channels List of channels to return the list of ChannelSegments for.
   * @param startTime beginning time of waveforms to query over
   * @param endTime end time of waveforms to query over
   * @param facetingDefinition used to determine how to populate the Channel object
   * @return list of all {@link ChannelSegment} objects for each Channel entity within the queried
   *     time interval
   */
  Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
      Set<Channel> channels,
      Instant startTime,
      Instant endTime,
      FacetingDefinition facetingDefinition);

  /**
   * Implements the same query as the findWaveformsByChannelsAndTimeRange operation described above,
   * but uses the provided FacetingDefinition to determine how to populate the Channel object
   * associated by each ChannelSegment{@literal <}Waveform{@literal >}
   *
   * @param channelSegmentDescriptors list of {@link ChannelSegmentDescriptor}
   * @param facetingDefinition used to determine how to populate the Channel object
   * @return list of all {@link ChannelSegment} objects for each Channel entity within the queried
   *     time interval
   */
  Collection<ChannelSegment<Waveform>> findByChannelNamesAndSegmentDescriptor(
      Collection<ChannelSegmentDescriptor> channelSegmentDescriptors,
      FacetingDefinition facetingDefinition);

  /**
   * Implements a query to return a faceted collection of {@link ProcessingMasks} based on a
   * collection of UUIDs
   *
   * @param uuids the UUIDs of interest
   * @param facetingDefinition the {@link FacetingDefinition} used to determine how to populate the
   *     {@link ProcessingMask}s
   * @return a faceted list of matching {@link ProcessingMask}s
   */
  Collection<ProcessingMask> findProcessingMasksByIds(
      Collection<UUID> uuids, FacetingDefinition facetingDefinition);

  /**
   * Returns a map of EventHpothesis to associated list of ChannelSegments populated using the input
   * FacetingDefinition
   *
   * @param eventHypotheses list of {@link eventHypothesis}
   * @param stations list of {@link station}
   * @param facetingDefinition {@link FacetingDefinition}
   * @return map of {@link EventHypothesis} to {@link ChannelSegment} objects
   */
  Pair<Map<EventHypothesis, List<ChannelSegment<Waveform>>>, Boolean>
      findEventBeamsByEventHypothesesAndStations(
          Collection<EventHypothesis> eventHypotheses,
          Collection<Station> stations,
          FacetingDefinition facetingDefinition);
}
