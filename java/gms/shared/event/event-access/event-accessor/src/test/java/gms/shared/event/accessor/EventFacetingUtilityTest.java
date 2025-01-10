package gms.shared.event.accessor;

import static gms.shared.event.accessor.facet.FacetingTypes.ASSOCIATED_SDH_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.CHANNEL_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.CHANNEL_SEGMENT_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.CHANNEL_SEGMENT_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.CHANNEL_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.DEFAULT_FACETED_EVENT_HYPOTHESIS_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.EVENT_HYPOTHESIS_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.EVENT_HYPOTHESIS_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.EVENT_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.FEATURE_MEASUREMENTS_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.FEATURE_MEASUREMENT_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.FEATURE_PREDICTIONS_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.FEATURE_PREDICTION_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.FINAL_EH_HISTORY_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.LOCATION_SOLUTION_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.LOCATION_SOLUTION_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.NETWORK_MAGNITUDE_SOLUTIONS_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.OVERALL_PREFERRED_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.PREFERRED_EH_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.PREFERRED_EH_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.PREFERRED_LOCATION_SOLUTION_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.REJECTED_SD_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.SDH_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.SD_HYPOTHESES_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.SIGNAL_DETECTION_TYPE;
import static gms.shared.event.accessor.facet.FacetingTypes.STATION_KEY;
import static gms.shared.event.accessor.facet.FacetingTypes.STATION_TYPE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static java.util.Objects.requireNonNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.accessor.facet.EventFacetingDefinitions;
import gms.shared.event.accessor.facet.EventFacetingUtility;
import gms.shared.event.api.EventAccessor;
import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.NetworkMagnitudeSolution;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

@ExtendWith(MockitoExtension.class)
class EventFacetingUtilityTest {

  private static final FacetingDefinition channelFacetDefinition =
      FacetingDefinition.builder().setClassType(CHANNEL_TYPE.getValue()).setPopulated(true).build();

  private static final FacetingDefinition channelNotPopulatedFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(CHANNEL_TYPE.getValue())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition channelSegmentFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(CHANNEL_SEGMENT_TYPE.getValue())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition featureMeasurementFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FEATURE_MEASUREMENT_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(CHANNEL_KEY.toString(), channelFacetDefinition)
          .addFacetingDefinitions(CHANNEL_SEGMENT_KEY.toString(), channelSegmentFacetDefinition)
          .build();

  private static final FacetingDefinition featurePredictionFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FEATURE_PREDICTION_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(CHANNEL_KEY.toString(), channelFacetDefinition)
          .addFacetingDefinitions(CHANNEL_SEGMENT_KEY.toString(), channelSegmentFacetDefinition)
          .build();

  private static final FacetingDefinition stationFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(STATION_TYPE.getValue())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition signalDetectionHypothesisFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(SDH_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(STATION_KEY.toString(), stationFacetDefinition)
          .addFacetingDefinitions(
              FEATURE_MEASUREMENTS_KEY.toString(), featureMeasurementFacetDefinition)
          .build();

  private static final FacetingDefinition rejectedSignalDetectionAssociationsFacetDef =
      FacetingDefinition.builder()
          .setClassType(SIGNAL_DETECTION_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              SD_HYPOTHESES_KEY.toString(), signalDetectionHypothesisFacetDefinition)
          .addFacetingDefinitions(STATION_KEY.toString(), stationFacetDefinition)
          .build();

  private static final FacetingDefinition preferredEventHypothesesFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(PREFERRED_EH_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition overallPreferredFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(SIGNAL_DETECTION_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition finalEventHypothesisHistoryFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition defaultHypothesesFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(DEFAULT_FACETED_EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition associatedSignalDetectionHypothesisFacetDefinition =
      FacetingDefinition.builder().setClassType(SDH_TYPE.toString()).setPopulated(true).build();

  private static final FacetingDefinition preferredLocationSolutionFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(LOCATION_SOLUTION_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition networkMagnitudeSolutionsFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(NetworkMagnitudeSolution.class.getCanonicalName())
          .setPopulated(true)
          .addFacetingDefinitions(CHANNEL_KEY.toString(), channelNotPopulatedFacetDefinition)
          .build();
  ;

  private static final FacetingDefinition locationSolutionFacetDefinitionWithNullInnerDefinitions =
      FacetingDefinition.builder()
          .setClassType(LOCATION_SOLUTION_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition locationSolutionFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(LOCATION_SOLUTION_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              FEATURE_MEASUREMENTS_KEY.toString(), featureMeasurementFacetDefinition)
          .addFacetingDefinitions(
              FEATURE_PREDICTIONS_KEY.toString(), featurePredictionFacetDefinition)
          .addFacetingDefinitions(
              NETWORK_MAGNITUDE_SOLUTIONS_KEY.toString(), networkMagnitudeSolutionsFacetDefinition)
          .build();

  private static final FacetingDefinition hypothesisFacetDefinitionPopulateLocationSolution =
      FacetingDefinition.builder()
          .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              ASSOCIATED_SDH_KEY.toString(), associatedSignalDetectionHypothesisFacetDefinition)
          .addFacetingDefinitions(
              PREFERRED_LOCATION_SOLUTION_KEY.toString(), preferredLocationSolutionFacetDefinition)
          .addFacetingDefinitions(LOCATION_SOLUTION_KEY.toString(), locationSolutionFacetDefinition)
          .build();

  private static final FacetingDefinition hypothesesFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              ASSOCIATED_SDH_KEY.toString(), associatedSignalDetectionHypothesisFacetDefinition)
          .addFacetingDefinitions(
              PREFERRED_LOCATION_SOLUTION_KEY.toString(), preferredLocationSolutionFacetDefinition)
          .addFacetingDefinitions(
              LOCATION_SOLUTION_KEY.toString(),
              locationSolutionFacetDefinitionWithNullInnerDefinitions)
          .build();

  private static final FacetingDefinition eventFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(EVENT_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              REJECTED_SD_KEY.toString(), rejectedSignalDetectionAssociationsFacetDef)
          .addFacetingDefinitions(EVENT_HYPOTHESIS_KEY.toString(), defaultHypothesesFacetDefinition)
          .addFacetingDefinitions(
              PREFERRED_EH_KEY.toString(), preferredEventHypothesesFacetDefinition)
          .addFacetingDefinitions(OVERALL_PREFERRED_KEY.toString(), overallPreferredFacetDefinition)
          .addFacetingDefinitions(
              FINAL_EH_HISTORY_KEY.toString(), finalEventHypothesisHistoryFacetDefinition)
          .build();

  private static final FacetingDefinition
      rejectedSignalDetectionAssociationsFacetDefinitionNotPopulated =
          FacetingDefinition.builder()
              .setClassType(SIGNAL_DETECTION_TYPE.toString())
              .setPopulated(false)
              .build();

  private static final FacetingDefinition preferredEventHypothesesFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(PREFERRED_EH_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition overallPreferredFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(SIGNAL_DETECTION_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition finalEventHypothesisHistoryFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition
      associatedSignalDetectionHypothesisFacetDefinitionNotPopulated =
          FacetingDefinition.builder()
              .setClassType(SDH_TYPE.toString())
              .setPopulated(false)
              .build();

  private static final FacetingDefinition preferredLocationSolutionFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(LOCATION_SOLUTION_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition locationSolutionFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(LOCATION_SOLUTION_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition hypothesesFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              ASSOCIATED_SDH_KEY.toString(),
              associatedSignalDetectionHypothesisFacetDefinitionNotPopulated)
          .addFacetingDefinitions(
              PREFERRED_LOCATION_SOLUTION_KEY.toString(),
              preferredLocationSolutionFacetDefinitionNotPopulated)
          .addFacetingDefinitions(
              LOCATION_SOLUTION_KEY.toString(), locationSolutionFacetDefinitionNotPopulated)
          .build();

  private static final FacetingDefinition eventFacetDefinitionNotPopulated =
      FacetingDefinition.builder()
          .setClassType(EVENT_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              REJECTED_SD_KEY.toString(),
              rejectedSignalDetectionAssociationsFacetDefinitionNotPopulated)
          .addFacetingDefinitions(
              EVENT_HYPOTHESIS_KEY.toString(),
              FacetingDefinition.builder()
                  .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
                  .setPopulated(false)
                  .build())
          .addFacetingDefinitions(
              PREFERRED_EH_KEY.toString(), preferredEventHypothesesFacetDefinitionNotPopulated)
          .addFacetingDefinitions(
              OVERALL_PREFERRED_KEY.toString(), overallPreferredFacetDefinitionNotPopulated)
          .addFacetingDefinitions(
              FINAL_EH_HISTORY_KEY.toString(),
              finalEventHypothesisHistoryFacetDefinitionNotPopulated)
          .build();

  private static final FacetingDefinition eventFacetDefinitionEntityOnly =
      FacetingDefinition.builder().setClassType(EVENT_TYPE.toString()).setPopulated(false).build();

  private static final FacetingDefinition eventFacetDefinitionNullHypothesis =
      FacetingDefinition.builder().setClassType(EVENT_TYPE.toString()).setPopulated(true).build();

  private static final FacetingDefinition hypothesesFacetDefinitionEntityOnly =
      FacetingDefinition.builder()
          .setClassType(EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(false)
          .build();

  @InjectMocks private EventFacetingUtility eventFacetingUtility;

  @Mock private EventAccessor mockEventAccessor;

  @Mock private SignalDetectionFacetingUtility mockSignalDetectionFacetingUtility;

  @Mock private StationDefinitionFacetingUtility mockStationDefinitionFacetingUtility;

  @Mock private WaveformFacetingUtility mockWaveformFacetingUtility;

  @Mock private Environment environment;

  @Test
  void testPopulateFacetsForEvents() {

    var stageId = WorkflowDefinitionId.from("AL1");
    var eventId = UUID.fromString("10000000-100-0000-1000-100000000087");
    var dummyEvent =
        EventTestFixtures.generateDummyEvent(
            eventId, stageId, "Org", "analyst", Instant.EPOCH, 1.0, MagnitudeType.MB);

    var signalDetection =
        SignalDetection.createEntityReference(
            UUID.fromString("10000000-100-0000-1000-100000000088"));
    var event =
        Event.builder()
            .setId(eventId)
            .setData(
                dummyEvent.getData().orElseThrow().toBuilder()
                    .setRejectedSignalDetectionAssociations(List.of(signalDetection))
                    .build())
            .build();
    doReturn(new String[] {}).when(environment).getActiveProfiles();

    when(mockSignalDetectionFacetingUtility.populateFacets(
            signalDetection, rejectedSignalDetectionAssociationsFacetDef, stageId))
        .thenReturn(signalDetection);

    assertDoesNotThrow(
        () ->
            eventFacetingUtility.populateFacets(
                event, stageId, eventFacetDefinitionNullHypothesis));
    assertDoesNotThrow(
        () -> eventFacetingUtility.populateFacets(event, stageId, eventFacetDefinition));

    var notPopulatedEvent =
        eventFacetingUtility.populateFacets(event, stageId, eventFacetDefinitionNotPopulated);

    assertTrue(notPopulatedEvent.getData().isPresent());
    var notPopulatedEventData = notPopulatedEvent.getData().orElseThrow();
    assertTrue(
        notPopulatedEventData.getEventHypotheses().stream()
            .allMatch(eventHypothesis1 -> eventHypothesis1.getData().isEmpty()));

    assertTrue(
        notPopulatedEventData.getFinalEventHypothesisHistory().stream()
            .allMatch(eventHypothesis1 -> eventHypothesis1.getData().isEmpty()));

    assertTrue(
        notPopulatedEventData.getRejectedSignalDetectionAssociations().stream()
            .allMatch(eventHypothesis1 -> eventHypothesis1.getData().isEmpty()));

    assertTrue(
        notPopulatedEventData.getOverallPreferred().stream()
            .allMatch(eventHypothesis1 -> eventHypothesis1.getData().isEmpty()));

    assertTrue(
        notPopulatedEventData.getPreferredEventHypothesisByStage().stream()
            .allMatch(
                preferredEventHypothesis ->
                    preferredEventHypothesis.getPreferred().getData().isEmpty()));

    assertTrue(
        eventFacetingUtility
            .populateFacets(event, stageId, eventFacetDefinitionEntityOnly)
            .getData()
            .isEmpty());
  }

  @Test
  void testPopulateFacetsForEventHypotheses() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000089");
    var eventHypothesisId = EventHypothesis.Id.from(uuid, uuid);
    var dummyEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            uuid,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            1.0,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(2.0, Optional.of(3.0), Units.DEGREES),
            List.of(EventHypothesis.builder().setId(eventHypothesisId).build()));

    var dummyEventHypothesisIdOnly = EventHypothesis.builder().setId(eventHypothesisId).build();

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.builder()
            .setId(SignalDetectionHypothesisId.from(uuid, uuid))
            .setData(SignalDetectionHypothesis.Data.builder().build())
            .build();

    var eventHypothesis =
        dummyEventHypothesis.toBuilder()
            .setId(eventHypothesisId)
            .setData(
                dummyEventHypothesis.getData().orElseThrow().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(List.of(signalDetectionHypothesis))
                    .build())
            .build();

    when(mockSignalDetectionFacetingUtility.populateFacets(
            signalDetectionHypothesis, associatedSignalDetectionHypothesisFacetDefinition))
        .thenReturn(signalDetectionHypothesis);

    when(mockEventAccessor.findHypothesesByIds(List.of(dummyEventHypothesisIdOnly.getId())))
        .thenReturn(List.of(eventHypothesis));

    assertDoesNotThrow(
        () ->
            eventFacetingUtility.populateFacets(
                dummyEventHypothesisIdOnly, hypothesesFacetDefinition));

    assertDoesNotThrow(
        () -> eventFacetingUtility.populateFacets(eventHypothesis, hypothesesFacetDefinition));

    when(mockSignalDetectionFacetingUtility.populateFacets(
            signalDetectionHypothesis,
            associatedSignalDetectionHypothesisFacetDefinitionNotPopulated))
        .thenReturn(signalDetectionHypothesis.toEntityReference());

    var notPopulatedEventHypothesis =
        eventFacetingUtility.populateFacets(eventHypothesis, hypothesesFacetDefinitionNotPopulated);

    assertEquals(1, notPopulatedEventHypothesis.size());
    var notPopulatedEventHypothesisData = notPopulatedEventHypothesis.get(0).getData();
    assertTrue(
        notPopulatedEventHypothesis
            .get(0)
            .getData()
            .orElseThrow()
            .getAssociatedSignalDetectionHypotheses()
            .stream()
            .allMatch(associatedSDH -> associatedSDH.getData().isEmpty()));

    assertTrue(
        notPopulatedEventHypothesisData.orElseThrow().getPreferredLocationSolution().stream()
            .allMatch(preferredLocationSolution -> preferredLocationSolution.getData().isEmpty()));

    assertTrue(
        notPopulatedEventHypothesisData.orElseThrow().getLocationSolutions().stream()
            .allMatch(locationSolution -> locationSolution.getData().isEmpty()));

    assertEquals(
        1,
        eventFacetingUtility
            .populateFacets(eventHypothesis, hypothesesFacetDefinitionEntityOnly)
            .size());
    assertTrue(
        eventFacetingUtility
            .populateFacets(eventHypothesis, hypothesesFacetDefinitionEntityOnly)
            .get(0)
            .getData()
            .isEmpty());
  }

  @Test
  void testPopulateFacetsForRejectedEventHypotheses() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000090");
    var eventHypothesisId = EventHypothesis.Id.from(uuid, uuid);
    var dummyEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            uuid,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            1.0,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(2.0, Optional.of(3.0), Units.DEGREES),
            List.of(EventHypothesis.builder().setId(eventHypothesisId).build()));

    var dummyEventHypothesisIdOnly = EventHypothesis.builder().setId(eventHypothesisId).build();

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.builder()
            .setId(SignalDetectionHypothesisId.from(uuid, uuid))
            .setData(SignalDetectionHypothesis.Data.builder().build())
            .build();

    var eventHypothesis =
        dummyEventHypothesis.toBuilder()
            .setId(eventHypothesisId)
            .setData(
                dummyEventHypothesis.getData().orElseThrow().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(List.of(signalDetectionHypothesis))
                    .build())
            .build();

    // add here
    // test rejected EH
    var rejectedEventData =
        eventHypothesis.getData().orElseThrow().toBuilder()
            .setRejected(true)
            .setDeleted(false)
            .setAssociatedSignalDetectionHypotheses(Set.of())
            .setLocationSolutions(Set.of())
            .setPreferredLocationSolution(null)
            .build();
    var rejectedEventHypothesis = eventHypothesis.toBuilder().setData(rejectedEventData).build();

    when(mockSignalDetectionFacetingUtility.populateFacets(
            signalDetectionHypothesis, associatedSignalDetectionHypothesisFacetDefinition))
        .thenReturn(signalDetectionHypothesis);

    when(mockEventAccessor.findHypothesesByIds(List.of(dummyEventHypothesisIdOnly.getId())))
        .thenReturn(List.of(eventHypothesis, rejectedEventHypothesis));

    assertDoesNotThrow(
        () ->
            eventFacetingUtility.populateFacets(
                dummyEventHypothesisIdOnly, hypothesesFacetDefinition));

    assertDoesNotThrow(
        () -> eventFacetingUtility.populateFacets(eventHypothesis, hypothesesFacetDefinition));

    when(mockSignalDetectionFacetingUtility.populateFacets(
            signalDetectionHypothesis,
            associatedSignalDetectionHypothesisFacetDefinitionNotPopulated))
        .thenReturn(signalDetectionHypothesis.toEntityReference());
    var eventHypothesisList =
        eventFacetingUtility.populateFacets(
            dummyEventHypothesisIdOnly, hypothesesFacetDefinitionNotPopulated);

    assertEquals(2, eventHypothesisList.size());
    var notPopulatedEventHypothesisData = eventHypothesisList.get(0).getData();
    assertTrue(
        eventHypothesisList
            .get(0)
            .getData()
            .orElseThrow()
            .getAssociatedSignalDetectionHypotheses()
            .stream()
            .allMatch(associatedSDH -> associatedSDH.getData().isEmpty()));

    assertTrue(
        notPopulatedEventHypothesisData.orElseThrow().getPreferredLocationSolution().stream()
            .allMatch(preferredLocationSolution -> preferredLocationSolution.getData().isEmpty()));

    assertTrue(
        notPopulatedEventHypothesisData.orElseThrow().getLocationSolutions().stream()
            .allMatch(locationSolution -> locationSolution.getData().isEmpty()));

    var rejectedEventHypothesisData = eventHypothesisList.get(1).getData().orElseThrow();
    assertTrue(rejectedEventHypothesisData.isRejected());
    assertTrue(rejectedEventHypothesisData.getLocationSolutions().isEmpty());
    assertTrue(rejectedEventHypothesisData.getPreferredLocationSolution().isEmpty());
  }

  @Test
  void testPopulateFacetsForLocationSolution() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000091");
    var eventHypothesisId = EventHypothesis.Id.from(uuid, uuid);
    var dummyEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            uuid,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            1.0,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(2.0, Optional.of(3.0), Units.DEGREES),
            List.of(EventHypothesis.builder().setId(eventHypothesisId).build()));

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.builder()
            .setId(SignalDetectionHypothesisId.from(uuid, uuid))
            .setData(SignalDetectionHypothesis.Data.builder().build())
            .build();

    var channelSegment = createChannelSegment();
    var featureMeasurement = EventTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
    var featurePrediction = createFeaturePrediction(uuid, channelSegment);
    var locationSolution = createLocationSolution(uuid, featurePrediction, featureMeasurement);

    var eventHypothesis =
        dummyEventHypothesis.toBuilder()
            .setId(eventHypothesisId)
            .setData(
                dummyEventHypothesis.getData().orElseThrow().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(List.of(signalDetectionHypothesis))
                    .setLocationSolutions(List.of(locationSolution))
                    .setPreferredLocationSolution(locationSolution)
                    .build())
            .build();

    var featureMeasurementNonArrival = EventTestFixtures.SLOWNESS_FEATURE_MEASUREMENT;

    var locationBehaviorNonArrival =
        LocationBehavior.from(1.0, 2.0, true, featurePrediction, featureMeasurementNonArrival);

    var locationSolutionNonArrival =
        LocationSolution.builder()
            .setId(uuid)
            .setData(
                EventTestFixtures.LOCATION_SOLUTION_DATA.toBuilder()
                    .setLocationBehaviors(List.of(locationBehaviorNonArrival))
                    .setFeaturePredictions(FeaturePredictionContainer.of(featurePrediction))
                    .build())
            .build();

    var eventHypothesisNonArrival =
        dummyEventHypothesis.toBuilder()
            .setId(eventHypothesisId)
            .setData(
                dummyEventHypothesis.getData().get().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(List.of(signalDetectionHypothesis))
                    .setLocationSolutions(List.of(locationSolutionNonArrival))
                    .setPreferredLocationSolution(locationSolutionNonArrival)
                    .build())
            .build();

    when(mockSignalDetectionFacetingUtility.populateFacets(
            any(), eq(associatedSignalDetectionHypothesisFacetDefinition)))
        .thenReturn(signalDetectionHypothesis);

    when(mockSignalDetectionFacetingUtility.populateFacets(eq(featureMeasurement), any(), any()))
        .thenReturn(featureMeasurement);

    when(mockStationDefinitionFacetingUtility.populateFacets(
            eq(EventTestFixtures.FEATURE_PREDICTION.getChannel().orElseThrow()), any(), any()))
        .thenReturn(EventTestFixtures.FEATURE_PREDICTION.getChannel().orElseThrow());

    doReturn(channelSegment)
        .when(mockWaveformFacetingUtility)
        .populateFacets(eq(channelSegment), any());

    assertDoesNotThrow(
        () ->
            eventFacetingUtility.populateFacets(
                eventHypothesis, hypothesisFacetDefinitionPopulateLocationSolution));

    assertDoesNotThrow(
        () ->
            eventFacetingUtility.populateFacets(
                eventHypothesisNonArrival, hypothesisFacetDefinitionPopulateLocationSolution));
  }

  @Test
  void testDefaultFacetingDefinition() {

    var uuid = UUID.fromString("00000000-000-0000-0000-000000000001");
    var eventHypothesisId = EventHypothesis.Id.from(uuid, uuid);
    var dummyEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            uuid,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            1.0,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(2.0, Optional.of(3.0), Units.DEGREES),
            List.of(EventHypothesis.builder().setId(eventHypothesisId).build()));

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.builder()
            .setId(SignalDetectionHypothesisId.from(uuid, uuid))
            .setData(SignalDetectionHypothesis.Data.builder().build())
            .build();

    var locationSolution =
        LocationSolution.builder()
            .setId(uuid)
            .setData(EventTestFixtures.LOCATION_SOLUTION_DATA)
            .build();

    var eventHypothesis =
        dummyEventHypothesis.toBuilder()
            .setId(eventHypothesisId)
            .setData(
                dummyEventHypothesis.getData().orElseThrow().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(List.of(signalDetectionHypothesis))
                    .setLocationSolutions(List.of(locationSolution))
                    .setPreferredLocationSolution(locationSolution)
                    .build())
            .build();

    List<EventHypothesis> eventHypothesisList =
        eventFacetingUtility.populateFacets(
            eventHypothesis, EventFacetingDefinitions.defaultHypothesesFacetDefinition);

    Stream<LocationSolution> locationSolutions =
        eventHypothesisList.get(0).getData().get().locationSolutions();
    locationSolutions.forEach(
        ls ->
            ls.getData().get().getNetworkMagnitudeSolutions().stream()
                .forEach(
                    nms ->
                        nms.getMagnitudeBehaviors()
                            .forEach(
                                mb ->
                                    assertEquals(
                                        Channel.createVersionReference(CHANNEL),
                                        mb.getStationMagnitudeSolution()
                                            .getMeasurement()
                                            .get()
                                            .getChannel()))));
  }

  private ChannelSegment<Timeseries> createChannelSegment() {
    return ChannelSegment.builder()
        .setId(
            ChannelSegmentDescriptor.from(
                Channel.builder().setName("test").autoBuild(),
                Instant.MIN,
                Instant.MAX,
                Instant.EPOCH))
        .build();
  }

  private FeaturePrediction createFeaturePrediction(
      UUID uuid, ChannelSegment<Timeseries> channelSegment) {

    return FeaturePrediction.<NumericFeaturePredictionValue>builder()
        .setPredictionValue(
            NumericFeaturePredictionValue.from(
                FeatureMeasurementTypes.SLOWNESS,
                EventTestFixtures.NUMERIC_MEASUREMENT_VALUE,
                Map.of(),
                Set.of(EventTestFixtures.FEATURE_PREDICTION_COMPONENT)))
        .setChannel(CHANNEL)
        .setSourceLocation(EventTestFixtures.EVENT_LOCATION)
        .setPhase(PhaseType.P)
        .setPredictionType(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE)
        .setPredictionChannelSegment(channelSegment)
        .setReceiverLocation(CHANNEL.getLocation())
        .setExtrapolated(false)
        .build();
  }

  private <T> LocationSolution createLocationSolution(
      UUID uuid, FeaturePrediction<?> featurePrediction, FeatureMeasurement<T> featureMeasurement) {

    var locationBehavior =
        LocationBehavior.from(1.0, 2.0, true, featurePrediction, featureMeasurement);

    var locationSolution =
        LocationSolution.builder()
            .setId(uuid)
            .setData(
                requireNonNull(EventTestFixtures.LOCATION_SOLUTION_DATA).toBuilder()
                    .setLocationBehaviors(List.of(locationBehavior))
                    .setFeaturePredictions(FeaturePredictionContainer.of(featurePrediction))
                    .build())
            .build();

    return locationSolution;
  }
}
