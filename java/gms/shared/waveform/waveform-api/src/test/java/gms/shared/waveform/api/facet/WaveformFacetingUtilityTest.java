package gms.shared.waveform.api.facet;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT_NO_CHANNEL_DATA;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.SEGMENT_START;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.epochStart100RandomSamples;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gms.shared.event.coi.EventTestFixtures;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.apache.commons.lang3.NotImplementedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WaveformFacetingUtilityTest {

  private static String CHANNEL_PRECONDITION_STR =
      "Test Precondition: Channel data must start test as populated";
  private static String PROCMASK_PRECONDITION_STR =
      "Test Precondition: ProcessingMask data field must start test as populated";

  @Mock private WaveformAccessor waveformAccessor;

  @Mock private StationDefinitionAccessor stationDefinitionAccessorImpl;

  WaveformFacetingUtility facetingUtil;

  @BeforeEach
  void setup() {
    facetingUtil = new WaveformFacetingUtility(waveformAccessor, stationDefinitionAccessorImpl);
  }

  @ParameterizedTest
  @MethodSource("getPopulateChannelSegmentFacetsValidationArguments")
  void testPopulateChannelSegmentFacetsValidation(
      Class<? extends Exception> expectedException,
      ChannelSegment<Waveform> initialChannelSegment,
      FacetingDefinition facetingDefinition) {

    assertThrows(
        expectedException,
        () -> facetingUtil.populateFacets(initialChannelSegment, facetingDefinition));
  }

  static Stream<Arguments> getPopulateChannelSegmentFacetsValidationArguments() {
    var invalidBase =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
            .setPopulated(true)
            .build();
    var invalidPopulatedState =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
            .setPopulated(false)
            .build();
    var invalidInnerState =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .setFacetingDefinitions(
                Map.of(
                    FacetingTypes.ID_CHANNEL_KEY.getValue(),
                    FacetingDefinition.builder()
                        .setClassType("ChannelBlah")
                        .setPopulated(true)
                        .build()))
            .build();
    var invalidFacetingKey =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .setFacetingDefinitions(
                Map.of(
                    "Blah",
                    FacetingDefinition.builder()
                        .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                        .setPopulated(true)
                        .build()))
            .build();
    var invalidNumberFacetingDef =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .setFacetingDefinitions(
                Map.of(
                    FacetingTypes.ID_CHANNEL_KEY.getValue(),
                    FacetingDefinition.builder()
                        .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                        .setPopulated(true)
                        .build(),
                    "id.Channel2",
                    FacetingDefinition.builder()
                        .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                        .setPopulated(true)
                        .build()))
            .build();

    return Stream.of(
        arguments(NullPointerException.class, null, mock(FacetingDefinition.class)),
        arguments(NullPointerException.class, mock(ChannelSegment.class), null),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidBase),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidPopulatedState),
        arguments(
            IllegalStateException.class, mock(ChannelSegment.class), invalidNumberFacetingDef));
  }

  @ParameterizedTest
  @MethodSource("getPopulateChannelSegmentFacetsArguments")
  void testPopulateFacets(
      ChannelSegment<Waveform> initialChannelSegment,
      FacetingDefinition facetingDefinition,
      boolean expectedResult) {

    var resultChannelSegment =
        (ChannelSegment<Waveform>)
            facetingUtil.populateFacets(initialChannelSegment, facetingDefinition);

    assertEquals(expectedResult, resultChannelSegment.getId().getChannel().isPresent());
  }

  static Stream<Arguments> getPopulateChannelSegmentFacetsArguments() {
    return Stream.of(
        arguments(
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            WaveformRequestTestFixtures.channelSegmentFacetingDefinition,
            true),
        arguments(
            CHANNEL_SEGMENT_NO_CHANNEL_DATA,
            WaveformRequestTestFixtures.channelSegmentFacetingDefinition2,
            false));
  }

  @Test
  void testQcSegmentNotPopulated() {

    var notPopulated =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_TYPE.getValue())
            .setPopulated(false)
            .build();

    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcFaceted = facetingUtil.populateFacets(qcSegment, notPopulated);

    assertTrue(qcFaceted.getData().isEmpty());
  }

  @Test
  void testQcSegmentDataPopulatedNoFacetNestedClasses() {

    var notPopulated =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .build();

    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcFaceted = facetingUtil.populateFacets(qcSegment, notPopulated);

    assertTrue(qcFaceted.getData().isPresent());
    assertEquals(
        qcSegment.getData().get().getChannel().toEntityReference(),
        qcFaceted.getData().get().getChannel());

    assertEquals(
        qcSegment.getData().get().getVersionHistory().last(),
        qcFaceted.getData().get().getVersionHistory().last());
    assertEquals(
        qcSegment.getData().get().getVersionHistory().first(),
        qcFaceted.getData().get().getVersionHistory().first());
  }

  @Test
  void testQcSegmentDataPopulatedFacetChannel() {

    var notPopulated =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .addFacetingDefinitions(
                FacetingTypes.CHANNEL_KEY.getValue(),
                FacetingDefinition.builder()
                    .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                    .setPopulated(true)
                    .build())
            .build();

    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var channelName = qcSegment.getData().get().getChannel().getName();
    var startTime = qcSegment.getData().get().getChannel().getEffectiveAt().get();
    var facetedChannel = DefaultCoiTestFixtures.getDefaultChannel(channelName);
    when(stationDefinitionAccessorImpl.findChannelsByNameAndTime(List.of(channelName), startTime))
        .thenReturn(List.of(facetedChannel));

    var qcFaceted = facetingUtil.populateFacets(qcSegment, notPopulated);

    assertTrue(qcFaceted.getData().isPresent());
    assertEquals(facetedChannel, qcFaceted.getData().get().getChannel());

    assertEquals(
        qcSegment.getData().get().getVersionHistory().last(),
        qcFaceted.getData().get().getVersionHistory().last());
  }

  @Test
  void testQcSegmentDataPopulatedFacetSegmentVersions() {

    var notPopulated =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .addFacetingDefinitions(
                FacetingTypes.QC_SEGMENT_VERSIONS.getValue(),
                FacetingDefinition.builder()
                    .setClassType(FacetingTypes.QC_SEGMENT_VERSION_TYPE.getValue())
                    .setPopulated(true)
                    .build())
            .build();

    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    assertThrows(
        UnsupportedOperationException.class,
        () -> facetingUtil.populateFacets(qcSegment, notPopulated));
  }

  @Test
  void testQcSegmentNoDataThrows() {

    var notPopulated =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .build();

    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var emptyQcSegment = qcSegment.toEntityReference();

    assertThrows(
        NotImplementedException.class,
        () -> facetingUtil.populateFacets(emptyQcSegment, notPopulated));
  }

  @Test
  void testChannelSegmentsByEventHypothesisFaceting() {
    var eventHypothesisChannelSegmentsMap =
        EventTestFixtures.getTestEventHypothesisChannelSegmentsMap();
    var facetDefinition =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.toString())
            .setPopulated(true)
            .build();

    for (var entry : eventHypothesisChannelSegmentsMap.entrySet()) {
      var eventHypothesis = entry.getKey();
      var channelSegments = entry.getValue();

      var facetedEventHypothesis =
          facetingUtil.populateEventHypothesisFacets(eventHypothesis, facetDefinition);
      assertFalse(facetedEventHypothesis.isPresent());

      // loop through channel segments and check population
      for (var channelSegment : channelSegments) {
        var facetedChannelSegment =
            facetingUtil.populateChannelSegmentFacets(channelSegment, facetDefinition);

        assertTrue(facetedChannelSegment.getId().getChannel().getEffectiveAt().isPresent());
        for (var channelKey : facetedChannelSegment.getMissingInputChannels().keySet()) {
          assertTrue(channelKey.getEffectiveAt().isPresent());
        }
        if (facetedChannelSegment.getData().isPresent()) {
          var data = facetedChannelSegment.getData().get();
          for (var mask : data.getMaskedBy()) {
            assertFalse(mask.isPresent());
          }
        }
      }
    }
  }

  @Test
  void testChannelSegmentsEmptyFaceting() {
    var eventHypothesisChannelSegmentsMap =
        EventTestFixtures.getTestEventHypothesisChannelSegmentsMap();
    var facetDefinition =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.toString())
            .setPopulated(false)
            .build();

    // loop through the event hypothesis and channel segment map then run faceting
    for (var entry : eventHypothesisChannelSegmentsMap.entrySet()) {
      var eventyHypothesis = entry.getKey();
      var channelSegments = entry.getValue();

      // faceted event hypothesis isn't populated
      var facetedEventHypothesis =
          facetingUtil.populateEventHypothesisFacets(eventyHypothesis, facetDefinition);
      assertFalse(facetedEventHypothesis.isPresent());

      for (var channelSegment : channelSegments) {
        var facetedChannelSegment =
            facetingUtil.populateChannelSegmentFacets(channelSegment, facetDefinition);

        // check the nested channels segments for population
        assertFalse(facetedChannelSegment.isPresent());
      }
    }
  }

  @ParameterizedTest
  @MethodSource("getPopulateQcSegmentVersionFacetsArguments")
  void testPopulateQcSegmentVersionFacetsValidation(
      Class<? extends Exception> expectedException,
      QcSegmentVersion initialQcSegmentVersion,
      FacetingDefinition facetingDefinition) {

    assertThrows(
        expectedException,
        () -> facetingUtil.populateFacets(initialQcSegmentVersion, facetingDefinition));
  }

  static Stream<Arguments> getPopulateQcSegmentVersionFacetsArguments() {
    var invalidBase =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
            .setPopulated(true)
            .build();

    var invalidInnerChannelSegmentDefinitionState =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_VERSION_TYPE.getValue())
            .setPopulated(true)
            .setFacetingDefinitions(
                Map.of(
                    FacetingTypes.CHANNEL_SEGMENTS_KEY.getValue(),
                    FacetingDefinition.builder()
                        .setClassType("badChannelSegmentType")
                        .setPopulated(true)
                        .build()))
            .build();

    var invalidInnerChannelDefinitionState =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.QC_SEGMENT_VERSION_TYPE.getValue())
            .setPopulated(true)
            .setFacetingDefinitions(
                Map.of(
                    FacetingTypes.CHANNEL_SEGMENTS_KEY.getValue(),
                    FacetingDefinition.builder()
                        .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
                        .setPopulated(true)
                        .build(),
                    FacetingTypes.CHANNELS_KEY.getValue(),
                    FacetingDefinition.builder()
                        .setClassType("badChannelType")
                        .setPopulated(true)
                        .build()))
            .build();

    return Stream.of(
        arguments(NullPointerException.class, null, mock(FacetingDefinition.class)),
        arguments(NullPointerException.class, mock(QcSegmentVersion.class), null),
        arguments(IllegalStateException.class, getMockQcSegmentVersion(), invalidBase),
        arguments(
            IllegalStateException.class,
            createQcSegmentVersion(),
            invalidInnerChannelSegmentDefinitionState),
        arguments(
            IllegalStateException.class,
            createQcSegmentVersion(),
            invalidInnerChannelDefinitionState));
  }

  @Test
  void testPopulateQcSegmentVersionFacets() {

    var qcSegmentVersionResults =
        facetingUtil.populateFacets(
            createQcSegmentVersion(), createValidFacetingDefinitionForFalseInnerChannel());

    assertTrue(qcSegmentVersionResults.getData().isPresent());

    assertEquals(1, qcSegmentVersionResults.getData().get().getDiscoveredOn().size());
  }

  private FacetingDefinition createValidFacetingDefinitionForFalseInnerChannel() {
    return FacetingDefinition.builder()
        .setClassType(FacetingTypes.QC_SEGMENT_VERSION_TYPE.getValue())
        .setPopulated(true)
        .setFacetingDefinitions(
            Map.of(
                FacetingTypes.CHANNEL_SEGMENTS_KEY.getValue(),
                FacetingDefinition.builder()
                    .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
                    .setPopulated(true)
                    .setFacetingDefinitions(
                        Map.of(
                            FacetingTypes.ID_CHANNEL_KEY.getValue(),
                            FacetingDefinition.builder()
                                .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                                .setPopulated(false)
                                .build()))
                    .build(),
                FacetingTypes.CHANNELS_KEY.getValue(),
                FacetingDefinition.builder()
                    .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                    .setPopulated(true)
                    .build()))
        .build();
  }

  private static QcSegmentVersion createQcSegmentVersion() {

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(WaveformTestFixtures.FRAME_ID)
            .build();

    var qcSegmentVersion =
        QcSegmentVersion.instanceBuilder()
            .setId(qcSegmentVersionId)
            .setData(
                QcSegmentVersion.Data.instanceBuilder()
                    .setChannels(List.of(channel))
                    .setDiscoveredOn(List.of(channelSegment))
                    .setCreatedBy("The Creator")
                    .setRationale("Seemed like a good idea")
                    .setStartTime(Instant.MIN)
                    .setEndTime(Instant.MIN.plusSeconds(1))
                    .setRejected(false)
                    .setCategory(QcSegmentCategory.WAVEFORM)
                    .setType(QcSegmentType.FLAT)
                    .build())
            .build();

    return qcSegmentVersion;
  }

  private static QcSegmentVersion getMockQcSegmentVersion() {
    var qcSegmentVersionMock = mock(QcSegmentVersion.class);
    var dataMock = mock(QcSegmentVersion.Data.class);
    when(qcSegmentVersionMock.getData()).thenReturn(Optional.of(dataMock));

    return qcSegmentVersionMock;
  }

  @Test
  void testProcessingMaskIncorrectNullObject() {

    var exceptionThrown =
        assertThrows(
            NullPointerException.class,
            () -> facetingUtil.populateFacets((ProcessingMask) null, null));
    assertEquals("Initial ProcessingMask cannot be null", exceptionThrown.getMessage());
  }

  @Test
  void testProcessingMaskIncorrectNullFacetingDefinition() {

    var pmMock = mock(ProcessingMask.class);
    var exceptionThrown =
        assertThrows(NullPointerException.class, () -> facetingUtil.populateFacets(pmMock, null));
    assertEquals(
        "FacetingDefinition for ProcessingMask cannot be null", exceptionThrown.getMessage());
  }

  @Test
  void testProcessingMaskIncorrectFacetingDefinition() {

    var INVALID_FACET_DEF =
        FacetingDefinition.builder().setClassType("Invalid Class").setPopulated(false).build();

    var pmMock = mock(ProcessingMask.class);

    var exceptionThrown =
        assertThrows(
            IllegalStateException.class,
            () -> facetingUtil.populateFacets(pmMock, INVALID_FACET_DEF));
    assertEquals(
        "FacetingDefinition must be for the ProcessingMask class. Found: Invalid Class",
        exceptionThrown.getMessage());
  }

  @Test
  void testProcessingMaskNoDataThrows() {

    var pmMock = mock(ProcessingMask.class);

    var exceptionThrown =
        assertThrows(
            NotImplementedException.class,
            () ->
                facetingUtil.populateFacets(
                    pmMock, ProcessingMaskTestFixtures.PROCESSING_MASK_FACET_ID_ONLY));
    assertEquals(
        "waveformAccessor methods to retrieve processingmask not yet implemented",
        exceptionThrown.getMessage());
  }

  @Test
  void testProcessingMaskIDOnlyFacet() {

    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(CHANNEL), List.of());
    assertTrue(pm1.getData().isPresent(), PROCMASK_PRECONDITION_STR);
    var pmfacetResults =
        facetingUtil.populateFacets(pm1, ProcessingMaskTestFixtures.PROCESSING_MASK_FACET_ID_ONLY);
    assertFalse(pmfacetResults.getData().isPresent(), "Data field found when it must be empty");
  }

  @Test
  void testProcessingMaskDataDefaultFacetMethod() {
    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(CHANNEL), List.of());
    assertTrue(pm1.getData().isPresent(), PROCMASK_PRECONDITION_STR);
    assertTrue(CHANNEL.getData().isPresent(), CHANNEL_PRECONDITION_STR);
    var pmfacetResults = facetingUtil.populateFacets(pm1);
    assertTrue(pmfacetResults.getData().isPresent(), "Data field found when should NOT be empty");
    var pmData = pmfacetResults.getData().get();
    var channelResult = pmData.getAppliedToRawChannel();
    assertFalse(
        channelResult.getData().isPresent(),
        "Expected Id-only Channel. Channel data field found when it must be empty");

    var qcmaskResult = pmData.getMaskedQcSegmentVersions();
    qcmaskResult.stream()
        .forEach(
            qcmask ->
                assertFalse(
                    qcmask.getData().isPresent(),
                    "Expected Id-only QcSegmentVersions. QcSegmentVersions data field found when it"
                        + " must be empty"));
  }

  @Test
  void testProcessingMaskDataDefaultFacetCustom() {
    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(CHANNEL), List.of());
    assertTrue(pm1.getData().isPresent(), PROCMASK_PRECONDITION_STR);
    assertTrue(CHANNEL.getData().isPresent(), CHANNEL_PRECONDITION_STR);
    var pmfacetResults =
        facetingUtil.populateFacets(pm1, ProcessingMaskTestFixtures.PROCESSING_MASK_FACET_DEFAULT);
    assertTrue(pmfacetResults.getData().isPresent(), "Data field found when should NOT be empty");
    var pmData = pmfacetResults.getData().get();
    var channelResult = pmData.getAppliedToRawChannel();
    assertFalse(
        channelResult.getData().isPresent(),
        "Expected Id-only Channel. Channel data field found when it must be empty");

    var qcmaskResult = pmData.getMaskedQcSegmentVersions();
    qcmaskResult.stream()
        .forEach(
            qcmask ->
                assertFalse(
                    qcmask.getData().isPresent(),
                    "Expected Id-only QcSegmentVersions. QcSegmentVersions data field found when it"
                        + " must be empty"));
  }

  @Test
  void testProcessingMaskDataPopulatedFacetChannel() {
    var channelName = "ProcessingMaskChannel";
    var defaultfacetedChannel = DefaultCoiTestFixtures.getDefaultChannel(channelName);
    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM,
            List.of(defaultfacetedChannel),
            List.of());
    assertTrue(pm1.getData().isPresent(), PROCMASK_PRECONDITION_STR);
    assertTrue(defaultfacetedChannel.getData().isPresent(), CHANNEL_PRECONDITION_STR);

    var startTime = pm1.getData().get().getEffectiveAt();
    when(stationDefinitionAccessorImpl.findChannelsByNameAndTime(List.of(channelName), startTime))
        .thenReturn(List.of(defaultfacetedChannel));

    var pmfacetResults =
        facetingUtil.populateFacets(
            pm1, ProcessingMaskTestFixtures.PROCESSING_MASK_FACET__CHANNEL_POPULATED);
    assertTrue(pmfacetResults.getData().isPresent(), "Data field found when should NOT be empty");
    var pmData = pmfacetResults.getData().get();
    var channelResult = pmData.getAppliedToRawChannel();
    assertTrue(
        channelResult.getData().isPresent(),
        "Expected fully populated channel. Channel data field empty when it must be populated");
  }

  @Test
  void testProcessingMaskPopulatedFacetQcSegmentVersion() {
    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(CHANNEL), List.of());
    assertTrue(
        pm1.getData().isPresent(),
        "Test Precondition: ProcessingMask data field must start test as populated");
    var pmfacetResults =
        facetingUtil.populateFacets(
            pm1, ProcessingMaskTestFixtures.PROCESSING_MASK_FACET__QCSEGVERS_POPULATED);
    assertTrue(pmfacetResults.getData().isPresent(), "Data field found when should NOT be empty");
    var pmData = pmfacetResults.getData().get();
    var qcmaskResult = pmData.getMaskedQcSegmentVersions();
    qcmaskResult.stream()
        .forEach(
            qcmask ->
                assertTrue(
                    qcmask.getData().isPresent(),
                    "Expected Id-only QcSegmentVersions. QcSegmentVersions data field empty when it"
                        + " must be populated"));
  }

  @Test
  void testPopulateProcessingMaskViaChannelSegmentFacetsDefault() {

    var tempChannelSegment =
        ChannelSegment.from(
            CHANNEL,
            CHANNEL.getUnits(),
            List.of(epochStart100RandomSamples(CHANNEL.getNominalSampleRateHz())),
            SEGMENT_START.minus(1, ChronoUnit.MINUTES),
            List.of(),
            Map.of());
    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM,
            List.of(CHANNEL),
            List.of(tempChannelSegment));
    var channelSegment =
        ChannelSegment.from(
            CHANNEL,
            CHANNEL.getUnits(),
            List.of(epochStart100RandomSamples(CHANNEL.getNominalSampleRateHz())),
            SEGMENT_START.minus(1, ChronoUnit.MINUTES),
            List.of(pm1),
            Map.of());

    var channelSegmentDefinition =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .build();
    var chanSegFacetResponse =
        facetingUtil.populateFacets(channelSegment, channelSegmentDefinition);
    // should return processing masks as populated with data field
    assertTrue(chanSegFacetResponse.getData().isPresent(), "ChannelSegment data is populated");
    var channelSegmentData = chanSegFacetResponse.getData().get();
    assertEquals(1, channelSegmentData.getMaskedBy().size(), "One processing mask expected");
    // TODO verify default faceting
    channelSegmentData.getMaskedBy().stream()
        .forEach(
            procMask -> {
              assertTrue(
                  procMask.getData().isPresent(),
                  "ProcessingMask data expected populated ProcessingMask Data");
            });
  }

  @Test
  void testPopulateProcessingMaskViaChannelSegmentFacetsCustom() {

    var tempChannelSegment =
        ChannelSegment.from(
            CHANNEL,
            CHANNEL.getUnits(),
            List.of(epochStart100RandomSamples(CHANNEL.getNominalSampleRateHz())),
            SEGMENT_START.minus(1, ChronoUnit.MINUTES),
            List.of(),
            Map.of());
    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM,
            List.of(CHANNEL),
            List.of(tempChannelSegment));
    var channelSegment =
        ChannelSegment.from(
            CHANNEL,
            CHANNEL.getUnits(),
            List.of(epochStart100RandomSamples(CHANNEL.getNominalSampleRateHz())),
            SEGMENT_START.minus(1, ChronoUnit.MINUTES),
            List.of(pm1),
            Map.of());

    var maskedByMap =
        Map.of(
            FacetingTypes.MASKED_BY_KEY.toString(),
            ProcessingMaskTestFixtures.PROCESSING_MASK_FACET_ID_ONLY);
    var channelSegmentDefinition =
        FacetingDefinition.builder()
            .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
            .setPopulated(true)
            .addFacetingDefinitions(
                FacetingTypes.MASKED_BY_KEY.toString(),
                ProcessingMaskTestFixtures.PROCESSING_MASK_FACET_ID_ONLY)
            .build();
    var chanSegFacetResponse =
        facetingUtil.populateFacets(channelSegment, channelSegmentDefinition);
    // should return processing masks as populated with id only field
    assertTrue(chanSegFacetResponse.getData().isPresent(), "ChannelSegment data is populated");
    var channelSegmentData = chanSegFacetResponse.getData().get();
    assertEquals(1, channelSegmentData.getMaskedBy().size(), "One processing mask expected");
    // TODO verify id only faceting
    channelSegmentData.getMaskedBy().stream()
        .forEach(
            procMask -> {
              assertFalse(procMask.getData().isPresent(), "ProcessingMask data expected id-only");
            });
  }
}
