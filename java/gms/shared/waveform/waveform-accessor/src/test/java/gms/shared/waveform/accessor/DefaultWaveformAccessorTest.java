package gms.shared.waveform.accessor;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.waveform.api.WaveformRepository;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.bridge.repository.QcDataGenerator;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.processingmask.api.ProcessingMaskRepository;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentRepository;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ExtendWith(MockitoExtension.class)
class DefaultWaveformAccessorTest {
  private static final Logger LOGGER = LoggerFactory.getLogger(DefaultWaveformAccessorTest.class);

  @InjectMocks private DefaultWaveformAccessor waveformAccessor;
  @Mock private WaveformRepository waveformRepositoryInterface;
  @Mock private QcSegmentRepository qcSegmentRepositoryInterface;
  @Mock private ProcessingMaskRepository pmRepositoryInterface;
  @Mock private StationDefinitionAccessor stationDefinitionAccessorImpl;
  @Mock private QcDataGenerator qcDataGenerator;

  @Test
  void testFindByChannelsAndTimeRange() {
    var request = WaveformRequestTestFixtures.channelTimeRangeRequest;

    Mockito.when(
            waveformRepositoryInterface.findByChannelsAndTimeRange(
                request.getChannels(), request.getStartTime(), request.getEndTime()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelsAndTimeRange(
            request.getChannels(), request.getStartTime(), request.getEndTime());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(
        returnChannelSegments.contains(
            WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  @ParameterizedTest
  @MethodSource("getFindByChannelsTimeRangeAndFacetingDefinitionArguments")
  void testFindByChannelsTimeRangeAndFacetingDefinition(ChannelTimeRangeRequest request) {

    Mockito.when(
            waveformRepositoryInterface.findByChannelsAndTimeRange(
                request.getChannels(), request.getStartTime(), request.getEndTime()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelsAndTimeRange(
            request.getChannels(),
            request.getStartTime(),
            request.getEndTime(),
            request.getFacetingDefinition().get());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(
        returnChannelSegments.contains(
            WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  static Stream<Arguments> getFindByChannelsTimeRangeAndFacetingDefinitionArguments() {
    return Stream.of(
        arguments(WaveformRequestTestFixtures.facetedChannelTimeRangeRequest),
        arguments(WaveformRequestTestFixtures.facetedChannelTimeRangeRequest2));
  }

  @Test
  void testFindEventBeamsByEventHypothesesAndStations() {
    Collection<Station> stations = List.of(UtilsTestFixtures.STATION);
    Collection<EventHypothesis> eventHypotheses =
        List.of(EventTestFixtures.getTestEventHypothesis());

    Mockito.when(
            waveformRepositoryInterface.findEventBeamsByEventHypothesesAndStations(
                eventHypotheses, stations))
        .thenReturn(Pair.of(EventTestFixtures.getTestEventHypothesisChannelSegmentsMap(), true));

    assertNotNull(
        waveformAccessor.findEventBeamsByEventHypothesesAndStations(eventHypotheses, stations));
  }

  @Test
  void testFindEventBeamsByEventHypothesesAndStationsFaceting() {
    Collection<Station> stations = List.of(UtilsTestFixtures.STATION);
    Collection<EventHypothesis> eventHypotheses =
        List.of(EventTestFixtures.getTestEventHypothesis());

    var facetingDefinition =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.toString())
            .setPopulated(false)
            .build();

    Mockito.when(
            waveformRepositoryInterface.findEventBeamsByEventHypothesesAndStations(
                eventHypotheses, stations))
        .thenReturn(Pair.of(EventTestFixtures.getTestEventHypothesisChannelSegmentsMap(), true));

    assertNotNull(
        waveformAccessor.findEventBeamsByEventHypothesesAndStations(
            eventHypotheses, stations, facetingDefinition));
  }

  @Test
  void testFindByChannelNamesAndSegmentDescriptor() {
    var request = WaveformRequestTestFixtures.channelSegmentDescriptorRequest;

    Mockito.when(
            waveformRepositoryInterface.findByChannelSegmentDescriptors(
                request.getChannelSegmentDescriptors()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelSegmentDescriptors(request.getChannelSegmentDescriptors());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(
        returnChannelSegments.contains(
            WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  @Test
  void testFindByChannelNamesAndSegmentDescriptorAndFacetingDefinition() {
    var request = WaveformRequestTestFixtures.facetedChannelSegmentDescriptorRequest;

    Mockito.when(
            waveformRepositoryInterface.findByChannelSegmentDescriptors(
                request.getChannelSegmentDescriptors()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelNamesAndSegmentDescriptor(
            request.getChannelSegmentDescriptors(), request.getFacetingDefinition().get());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(
        returnChannelSegments.contains(
            WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  @Test
  void testFindQcSegmentsByIds() {
    var expectedQcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentId = expectedQcSegment.getId();

    Mockito.when(qcSegmentRepositoryInterface.findQcSegmentsByIds(List.of(qcSegmentId)))
        .thenReturn(List.of(expectedQcSegment));

    var actualQcSegments = waveformAccessor.findQcSegmentsByIds(List.of(qcSegmentId));
    assertEquals(expectedQcSegment, actualQcSegments.get(0));
  }

  @Test
  void testFindQcSegmentVersionsByIds() {
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var expectedQcSegmentVersion = qcSegment.getData().get().getVersionHistory().last();
    var qcSegmentVersionId = expectedQcSegmentVersion.getId();

    Mockito.when(
            qcSegmentRepositoryInterface.findQcSegmentVersionsByIds(List.of(qcSegmentVersionId)))
        .thenReturn(List.of(expectedQcSegmentVersion));

    var actualQcSegmentVersions =
        waveformAccessor.findQcSegmentVersionsByIds(List.of(qcSegmentVersionId));

    assertEquals(expectedQcSegmentVersion, actualQcSegmentVersions.get(0));
  }

  @Test
  void testFindProcessingMasksByIdsNullCheck() {

    assertThrows(NullPointerException.class, () -> waveformAccessor.findProcessingMasksByIds(null));
  }

  @Test
  void testFindProcessingMasksByIds() {
    var uuid = UUID.fromString("31000000-100-0000-1000-100000000003");
    var pm = ProcessingMask.createEntityReference(uuid);
    var result = List.of(pm);

    Mockito.when(pmRepositoryInterface.findProcessingMasksByIds(any())).thenReturn(result);

    assertEquals(result, waveformAccessor.findProcessingMasksByIds(List.of(uuid)));
  }

  @Test
  void testFacetedFindProcessingMasksByIds() {
    var idOnlyFaceting = ProcessingMaskTestFixtures.PROCESSING_MASK_FACET_ID_ONLY;
    var uuid = UUID.fromString("31000000-100-0000-1000-100000000003");
    var pm =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(CHANNEL), List.of());
    var expectedResult = List.of(pm.toEntityReference());

    Mockito.when(pmRepositoryInterface.findProcessingMasksByIds(any())).thenReturn(List.of(pm));
    assertEquals(
        List.of(pm.toEntityReference()),
        waveformAccessor.findProcessingMasksByIds(List.of(uuid), idOnlyFaceting));
  }
}
