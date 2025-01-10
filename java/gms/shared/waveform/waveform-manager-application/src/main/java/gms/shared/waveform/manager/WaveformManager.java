package gms.shared.waveform.manager;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.beam.ChannelSegmentsByEventHypothesis;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.waveform.api.util.ChannelSegmentDescriptorRequest;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.api.util.EventHypothesesStationsRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.util.WaveformManagerUtility;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/waveform",
    consumes = MediaType.APPLICATION_JSON_VALUE,
    produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
public class WaveformManager {

  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;

  private final WaveformAccessor waveformAccessorImpl;

  @Autowired
  public WaveformManager(WaveformAccessor waveformAccessorImpl) {
    this.waveformAccessorImpl = waveformAccessorImpl;
  }

  /**
   * Returns a collection of {@link ChannelSegment}s for each Channel entity provided in the query
   * parameters (since Channel is faceted, the provided objects may be fully populated or contain
   * only references).
   *
   * <p>The response has a collection of ChannelSegments for each Channel entity since a
   * ChannelSegment is associated to a single Channel object but there may be multiple versions of
   * each Channel entity within the queried time interval.
   *
   * <p>Each ChannelSegment may contain multiple Waveforms to account for gaps in available waveform
   * samples or changes in sample rate, but each Waveform is as long as possible. This operation
   * always returns calibrated waveform samples.
   *
   * @param channelTimeRangeRequest List of channels to and time ranges to query over.
   * @return list of all {@link ChannelSegment} objects for each Channel entity within the queried
   *     time interval
   */
  @PostMapping(value = "/channel-segment/query/channel-timerange")
  @Operation(
      summary = "Loads and returns ChannelSegment<Waveform> based on " + "channel and time range")
  public Collection<ChannelSegment<Waveform>> findWaveformsByChannelsAndTimeRange(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description =
                  "List of channels and time range used to query ChannelSegment<Waveform>")
          @RequestBody
          ChannelTimeRangeRequest channelTimeRangeRequest) {

    Optional<FacetingDefinition> facetingDefinition =
        channelTimeRangeRequest.getFacetingDefinition();
    if (facetingDefinition.isPresent()) {
      return waveformAccessorImpl.findByChannelsAndTimeRange(
          channelTimeRangeRequest.getChannels(),
          channelTimeRangeRequest.getStartTime(),
          channelTimeRangeRequest.getEndTime(),
          facetingDefinition.get());
    }
    return waveformAccessorImpl.findByChannelsAndTimeRange(
        channelTimeRangeRequest.getChannels(),
        channelTimeRangeRequest.getStartTime(),
        channelTimeRangeRequest.getEndTime());
  }

  /**
   * Returns a collection of {@link ChannelSegment}s as it existed at the creation time listed in
   * ChannelSegmentDescriptor, even if newer data samples have since been stored in this
   * WaveformRepository. (since Channel is faceted, the provided objects may be fully populated or
   * contain only references).
   *
   * <p>All of the samples returned for a ChannelSegmentDescriptor must be for the exact Channel
   * version provided in that ChannelSegmentDescriptor. Each returned ChannelSegment may contain
   * multiple Waveforms to account for gaps in available waveform samples or changes in sample rate,
   * but each Waveform is as long as possible.
   *
   * @param channelSegmentDescriptorRequest ChannelName, time ranges, and creation time to query
   *     over.
   * @return list of all {@link ChannelSegment} objects for each Channel entity within the queried
   *     time interval
   */
  @PostMapping(value = "/channel-segment/query/channel-segment-descriptors")
  @Operation(
      summary =
          "Loads and returns ChannelSegment<Waveform> based on "
              + "channel name and segment start, end, and creation times")
  public Collection<ChannelSegment<Waveform>> findWaveformsByChannelSegmentDescriptors(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description =
                  "Channel name and segment start, end, and creation times used to query "
                      + "ChannelSegment<Waveform>")
          @RequestBody
          ChannelSegmentDescriptorRequest channelSegmentDescriptorRequest) {

    Optional<FacetingDefinition> facetingDefinition =
        channelSegmentDescriptorRequest.getFacetingDefinition();
    if (facetingDefinition.isPresent()) {
      return waveformAccessorImpl.findByChannelNamesAndSegmentDescriptor(
          channelSegmentDescriptorRequest.getChannelSegmentDescriptors(), facetingDefinition.get());
    }
    return waveformAccessorImpl.findByChannelSegmentDescriptors(
        channelSegmentDescriptorRequest.getChannelSegmentDescriptors());
  }

  @PostMapping(value = "/event-beams/query/event-beams-by-event-hypotheses-and-stations")
  @Operation(
      summary =
          "Loads and returns ChannelSegmentsByEventHypothesis based on "
              + "collections of EventHypotheses and Stations")
  public ResponseEntity<ChannelSegmentsByEventHypothesis>
      findEventBeamsByEventHypothesesAndStations(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description =
                      "Collections of EventHypotheses and Stations used to query "
                          + "map of EventHypothesis to ChannelSegments")
              @RequestBody
              EventHypothesesStationsRequest eventHypothesesStationsRequest) {

    Optional<FacetingDefinition> facetingDefinition =
        eventHypothesesStationsRequest.facetingDefinition();
    if (facetingDefinition.isPresent()) {

      Pair<Map<EventHypothesis, List<ChannelSegment<Waveform>>>, Boolean> result =
          waveformAccessorImpl.findEventBeamsByEventHypothesesAndStations(
              eventHypothesesStationsRequest.eventHypotheses(),
              eventHypothesesStationsRequest.stations(),
              facetingDefinition.get());

      var responseCode =
          Boolean.TRUE.equals(result.getValue())
              ? CUSTOM_PARTIAL_RESPONSE_CODE
              : HttpStatus.OK.value();

      return ResponseEntity.status(responseCode)
          .body(WaveformManagerUtility.createChannelSegmentsByEventHypothesis(result.getKey()));
    }

    Pair<Map<EventHypothesis, List<ChannelSegment<Waveform>>>, Boolean> result =
        waveformAccessorImpl.findEventBeamsByEventHypothesesAndStations(
            eventHypothesesStationsRequest.eventHypotheses(),
            eventHypothesesStationsRequest.stations());

    var responseCode =
        Boolean.TRUE.equals(result.getValue())
            ? CUSTOM_PARTIAL_RESPONSE_CODE
            : HttpStatus.OK.value();

    return ResponseEntity.status(responseCode)
        .body(WaveformManagerUtility.createChannelSegmentsByEventHypothesis(result.getKey()));
  }

  /**
   * Queries for QcSegments of channels in within the provided time range.
   *
   * @param channelTimeRangeRequest A List of Channels, start time, and end time to query for
   *     QcSegments
   * @return A Collection of {@link QcSegment}s associated with the channels during the requested
   *     interval.
   */
  @PostMapping(value = "/qc-segment/query/channel-timerange/canned")
  @Operation(
      summary =
          "Loads and returns QcSegmentVersion based on channel name"
              + " and segment start, end, and creation times")
  public Collection<QcSegment> findQcSegmentsByChannelsandTimeRangeCanned(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "List of channels and time range used to query QC Segments")
          @RequestBody
          ChannelTimeRangeRequest channelTimeRangeRequest) {
    Optional<FacetingDefinition> facetingDefinition =
        channelTimeRangeRequest.getFacetingDefinition();
    if (facetingDefinition.isPresent()) {
      return waveformAccessorImpl.findQcSegmentsByChannelsandTimeRangeCanned(
          channelTimeRangeRequest.getChannels(),
          channelTimeRangeRequest.getStartTime(),
          channelTimeRangeRequest.getEndTime(),
          facetingDefinition.get());
    }
    return waveformAccessorImpl.findQcSegmentsByChannelsandTimeRangeCanned(
        channelTimeRangeRequest.getChannels(),
        channelTimeRangeRequest.getStartTime(),
        channelTimeRangeRequest.getEndTime());
  }

  /**
   * Queries for QcSegments of channels in within the provided time range.
   *
   * @param channelTimeRangeRequest A List of Channels, start time, and end time to query for
   *     QcSegments
   * @return A Collection of {@link QcSegment}s associated with the channels during the requested
   *     interval.
   */
  @PostMapping(value = "/qc-segment/query/channel-timerange")
  @Operation(
      summary =
          "Loads and returns QcSegmentVersion based on channel name"
              + " and segment start, end, and creation times")
  public Collection<QcSegment> findQcSegmentsByChannelsandTime(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "List of channels and time range used to query QC Segments")
          @RequestBody
          ChannelTimeRangeRequest channelTimeRangeRequest) {
    Optional<FacetingDefinition> facetingDefinition =
        channelTimeRangeRequest.getFacetingDefinition();
    if (facetingDefinition.isPresent()) {
      return waveformAccessorImpl.findQcSegmentsByChannelsandTimeRangeCanned(
          channelTimeRangeRequest.getChannels(),
          channelTimeRangeRequest.getStartTime(),
          channelTimeRangeRequest.getEndTime(),
          facetingDefinition.get());
    }
    return waveformAccessorImpl.findQcSegmentsByChannelsAndTimeRange(
        channelTimeRangeRequest.getChannels(),
        channelTimeRangeRequest.getStartTime(),
        channelTimeRangeRequest.getEndTime());
  }
}
