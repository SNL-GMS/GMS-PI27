package gms.shared.waveform.manager;

import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptorRequest;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelTimeRangeRequest;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.facetedChannelSegmentDescriptorRequest;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.facetedChannelTimeRangeRequest;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.unfacetedChannelSegment;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.unfacetedChannelTimeRangeRequest;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.spring.utilities.framework.SpringTestBase;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.waveform.api.util.EventHypothesesStationsRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

@WebMvcTest(WaveformManager.class)
@Import(WaveformManagerTestConfiguration.class)
class WaveformManagerTest extends SpringTestBase {

  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;

  @MockBean private WaveformAccessor waveformAccessorImpl;

  private EventHypothesesStationsRequest eventHypothesesStationsFacetedRequest;

  private EventHypothesesStationsRequest eventHypothesesStationsUnfacetedRequest;

  private Map<EventHypothesis, List<ChannelSegment<Waveform>>> eventHypotheisToChannelSegmentsMap;

  @BeforeEach
  void eventHypothesesStationsRequestSetup() {
    Collection<Station> stations = List.of(EventTestFixtures.STA_STATION);
    Collection<EventHypothesis> eventHypotheses =
        List.of(EventTestFixtures.getTestEventHypothesis());
    Optional<FacetingDefinition> facetingDefinition = Optional.of(unfacetedChannelSegment);

    eventHypothesesStationsFacetedRequest =
        new EventHypothesesStationsRequest(eventHypotheses, stations, facetingDefinition);
    eventHypothesesStationsUnfacetedRequest =
        new EventHypothesesStationsRequest(eventHypotheses, stations, Optional.empty());

    eventHypotheisToChannelSegmentsMap =
        EventTestFixtures.getTestEventHypothesisChannelSegmentsMap();
  }

  @Test
  void testFindWaveformsByChannelsAndTimeRangeWithoutFacet() throws Exception {

    MockHttpServletResponse response =
        postResult(
            "/waveform/channel-segment/query/channel-timerange",
            channelTimeRangeRequest,
            HttpStatus.OK);

    Mockito.verify(waveformAccessorImpl, times(1))
        .findByChannelsAndTimeRange(
            channelTimeRangeRequest.getChannels(),
            channelTimeRangeRequest.getStartTime(),
            channelTimeRangeRequest.getEndTime());
  }

  @Test
  void testFindWaveformsByChannelsAndTimeRangeWithFacet() throws Exception {

    MockHttpServletResponse response =
        postResult(
            "/waveform/channel-segment/query/channel-timerange",
            facetedChannelTimeRangeRequest,
            HttpStatus.OK);

    Mockito.verify(waveformAccessorImpl, times(1))
        .findByChannelsAndTimeRange(
            facetedChannelTimeRangeRequest.getChannels(),
            facetedChannelTimeRangeRequest.getStartTime(),
            facetedChannelTimeRangeRequest.getEndTime(),
            facetedChannelTimeRangeRequest.getFacetingDefinition().get());
  }

  @Test
  void testFindWaveformsByChannelSegmentDescriptorsWithoutFacet() throws Exception {
    MockHttpServletResponse response =
        postResult(
            "/waveform/channel-segment/query/channel-segment-descriptors",
            channelSegmentDescriptorRequest,
            HttpStatus.OK);

    Mockito.verify(waveformAccessorImpl, times(1))
        .findByChannelSegmentDescriptors(
            channelSegmentDescriptorRequest.getChannelSegmentDescriptors());
  }

  @Test
  void testFindWaveformsByChannelSegmentDescriptorsWithFacet() throws Exception {
    MockHttpServletResponse response =
        postResult(
            "/waveform/channel-segment/query/channel-segment-descriptors",
            facetedChannelSegmentDescriptorRequest,
            HttpStatus.OK);

    Mockito.verify(waveformAccessorImpl, times(1))
        .findByChannelNamesAndSegmentDescriptor(
            facetedChannelSegmentDescriptorRequest.getChannelSegmentDescriptors(),
            facetedChannelSegmentDescriptorRequest.getFacetingDefinition().get());
  }

  @Test
  void testFindQcSegmentsByChannelsandTimeRangeCanned() throws Exception {
    MockHttpServletResponse response =
        postResult(
            "/waveform/qc-segment/query/channel-timerange/canned",
            channelTimeRangeRequest,
            HttpStatus.OK);

    Mockito.verify(waveformAccessorImpl, times(1))
        .findQcSegmentsByChannelsandTimeRangeCanned(
            channelTimeRangeRequest.getChannels(),
            channelTimeRangeRequest.getStartTime(),
            channelTimeRangeRequest.getEndTime());
  }

  @Test
  void testFindQcSegmentsByChannelsandTimeRangeCannedWithFacet() throws Exception {
    MockHttpServletResponse response =
        postResult(
            "/waveform/qc-segment/query/channel-timerange/canned",
            facetedChannelTimeRangeRequest,
            HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());

    Mockito.verify(waveformAccessorImpl, times(1))
        .findQcSegmentsByChannelsandTimeRangeCanned(
            facetedChannelTimeRangeRequest.getChannels(),
            facetedChannelTimeRangeRequest.getStartTime(),
            facetedChannelTimeRangeRequest.getEndTime(),
            facetedChannelTimeRangeRequest.getFacetingDefinition().get());
  }

  @Test
  void testFindQcSegmentsByChannelsandTimeRangeWitFacet() throws Exception {
    MockHttpServletResponse response =
        postResult(
            "/waveform/qc-segment/query/channel-timerange",
            facetedChannelTimeRangeRequest,
            HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());

    Mockito.verify(waveformAccessorImpl, times(1))
        .findQcSegmentsByChannelsandTimeRangeCanned(
            facetedChannelTimeRangeRequest.getChannels(),
            facetedChannelTimeRangeRequest.getStartTime(),
            facetedChannelTimeRangeRequest.getEndTime(),
            facetedChannelTimeRangeRequest.getFacetingDefinition().get());
  }

  @Test
  void testFindQcSegmentsByChannelsandTimeRangeWithoutFacet() throws Exception {
    MockHttpServletResponse response =
        postResult(
            "/waveform/qc-segment/query/channel-timerange",
            unfacetedChannelTimeRangeRequest,
            HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());

    Mockito.verify(waveformAccessorImpl, times(1))
        .findQcSegmentsByChannelsAndTimeRange(
            unfacetedChannelTimeRangeRequest.getChannels(),
            unfacetedChannelTimeRangeRequest.getStartTime(),
            unfacetedChannelTimeRangeRequest.getEndTime());
  }

  @Test
  void testFindEventBeamsByEventHypothesesAndStationsWithoutFacet() throws Exception {
    given(
            waveformAccessorImpl.findEventBeamsByEventHypothesesAndStations(
                eventHypothesesStationsUnfacetedRequest.eventHypotheses(),
                eventHypothesesStationsUnfacetedRequest.stations()))
        .willReturn(Pair.of(eventHypotheisToChannelSegmentsMap, Boolean.FALSE));

    MockHttpServletResponse response =
        postResult(
            "/waveform/event-beams/query/event-beams-by-event-hypotheses-and-stations",
            eventHypothesesStationsUnfacetedRequest,
            HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());
  }

  @Test
  void testFindEventBeamsByEventHypothesesAndStationsWithoutFacetPartialResponse()
      throws Exception {
    given(
            waveformAccessorImpl.findEventBeamsByEventHypothesesAndStations(
                eventHypothesesStationsUnfacetedRequest.eventHypotheses(),
                eventHypothesesStationsUnfacetedRequest.stations()))
        .willReturn(Pair.of(eventHypotheisToChannelSegmentsMap, Boolean.TRUE));

    MockHttpServletResponse response =
        postResult(
            "/waveform/event-beams/query/event-beams-by-event-hypotheses-and-stations",
            eventHypothesesStationsUnfacetedRequest,
            CUSTOM_PARTIAL_RESPONSE_CODE);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, response.getStatus());
  }

  @Test
  void testFindEventBeamsByEventHypothesesAndStationsWitFacet() throws Exception {
    given(
            waveformAccessorImpl.findEventBeamsByEventHypothesesAndStations(
                eventHypothesesStationsFacetedRequest.eventHypotheses(),
                eventHypothesesStationsFacetedRequest.stations(),
                eventHypothesesStationsFacetedRequest.facetingDefinition().get()))
        .willReturn(Pair.of(eventHypotheisToChannelSegmentsMap, Boolean.FALSE));

    MockHttpServletResponse response =
        postResult(
            "/waveform/event-beams/query/event-beams-by-event-hypotheses-and-stations",
            eventHypothesesStationsFacetedRequest,
            HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());
  }

  @Test
  void testFindEventBeamsByEventHypothesesAndStationsWitFacetPartialResponse() throws Exception {
    given(
            waveformAccessorImpl.findEventBeamsByEventHypothesesAndStations(
                eventHypothesesStationsFacetedRequest.eventHypotheses(),
                eventHypothesesStationsFacetedRequest.stations(),
                eventHypothesesStationsFacetedRequest.facetingDefinition().get()))
        .willReturn(Pair.of(eventHypotheisToChannelSegmentsMap, Boolean.TRUE));

    MockHttpServletResponse response =
        postResult(
            "/waveform/event-beams/query/event-beams-by-event-hypotheses-and-stations",
            eventHypothesesStationsFacetedRequest,
            CUSTOM_PARTIAL_RESPONSE_CODE);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, response.getStatus());
  }
}
