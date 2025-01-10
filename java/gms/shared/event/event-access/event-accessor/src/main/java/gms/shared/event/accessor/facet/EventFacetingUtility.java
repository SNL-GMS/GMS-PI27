package gms.shared.event.accessor.facet;

import static com.google.common.base.Preconditions.checkNotNull;
import static com.google.common.base.Preconditions.checkState;

import com.google.common.collect.ImmutableList;
import gms.shared.event.api.EventAccessor;
import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.NetworkMagnitudeBehavior;
import gms.shared.event.coi.NetworkMagnitudeSolution;
import gms.shared.event.coi.PreferredEventHypothesis;
import gms.shared.event.coi.StationMagnitudeSolution;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.utilities.logging.TimingLogger;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Provides operations to populated faceted objects aggregated by {@link Event} and {@link
 * EventHypothesis} according to a {@link FacetingDefinition}.
 *
 * <p>
 *
 * <p>EventFacetingUtility delegates to {@link StationDefinitionFacetingUtility} when it needs to
 * update {@link Channel} or {@link gms.shared.stationdefinition.coi.station.Station} objects and
 * {@link SignalDetectionFacetingUtility} when it needs to update {@link SignalDetectionHypothesis}
 * objects
 */
@Component
public class EventFacetingUtility {

  private static final Logger LOGGER = LoggerFactory.getLogger(EventFacetingUtility.class);
  private static final TimingLogger<List<SignalDetection>> signalDetectionLogger =
      TimingLogger.create(LOGGER);
  private static final TimingLogger<List<EventHypothesis>> eventHypothesisLogger =
      TimingLogger.create(LOGGER);
  private static final TimingLogger<List<PreferredEventHypothesis>> preferredEventHypothesisLogger =
      TimingLogger.create(LOGGER);
  private static final TimingLogger<Optional<EventHypothesis>> eventHypothesisOptLogger =
      TimingLogger.create(LOGGER);
  private static final String NO_FURTHER_FACET_WARNING =
      "Cannot further facet Event without {} faceting definition. Returning default, faceted Event";
  private static final String EVENT_HYPOTHESIS_VALUE =
      FacetingTypes.EVENT_HYPOTHESIS_KEY.toString();

  private final EventAccessor eventAccessor;
  private final SignalDetectionFacetingUtility signalDetectionFacetingUtility;
  private final StationDefinitionFacetingUtility stationDefinitionFacetingUtility;
  private final WaveformFacetingUtility waveformFacetingUtility;
  private final Environment environment;

  @Autowired
  public EventFacetingUtility(
      EventAccessor eventAccessor,
      SignalDetectionFacetingUtility signalDetectionFacetingUtility,
      StationDefinitionFacetingUtility stationDefinitionFacetingUtility,
      WaveformFacetingUtility waveformFacetingUtility,
      Environment environment) {
    this.eventAccessor = eventAccessor;
    this.signalDetectionFacetingUtility = signalDetectionFacetingUtility;
    this.stationDefinitionFacetingUtility = stationDefinitionFacetingUtility;
    this.waveformFacetingUtility = waveformFacetingUtility;
    this.environment = environment;
  }

  /**
   * Returns a populated {@link Event} based on the {@link FacetingDefinition} that is passed into
   * the method.
   *
   * @param initial The {@link Event} to populate
   * @param stageId The {@link WorkflowDefinitionId} representing the current stage
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a populated {@link Event}
   */
  public Event populateFacets(
      Event initial, WorkflowDefinitionId stageId, FacetingDefinition facetingDefinition) {

    facetingNullCheck(initial, facetingDefinition, Event.class.getSimpleName());

    // If the event was not populated with data attempt to populate it
    var initialEventData =
        initial
            .getData()
            .orElseGet(
                () ->
                    eventAccessor.findByIds(List.of(initial.getId()), stageId).stream()
                        .findFirst()
                        .orElseThrow(
                            () ->
                                new IllegalStateException(
                                    String.format(
                                        "Could not find an Event with ID:%s", initial.getId())))
                        .getData()
                        .orElseThrow(
                            () ->
                                new IllegalStateException(
                                    "No Event data was found, cannot continue")));

    var rejectedSignalDetectionAssociationsDefinition =
        facetingDefinition.getFacetingDefinitionByName(FacetingTypes.REJECTED_SD_KEY.toString());
    var hypothesesDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.EVENT_HYPOTHESIS_KEY.toString());
    var preferredEventHypothesesDefinition =
        facetingDefinition.getFacetingDefinitionByName(FacetingTypes.PREFERRED_EH_KEY.toString());
    var overallPreferredDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.OVERALL_PREFERRED_KEY.toString());
    var finalEventHypothesisHistoryDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.FINAL_EH_HISTORY_KEY.toString());

    if (!facetingDefinition.isPopulated()) {
      return initial.toEntityReference();
    }

    var populatedEventDataBuilder = initialEventData.toBuilder();

    var rejectedSdhAssociations =
        getDataUsingNullableFacetingDefinition(
            rejectedSignalDetectionAssociationsDefinition,
            () ->
                signalDetectionLogger.apply(
                    this.getClass().getSimpleName()
                        + "::retrieveRejectedSignalDetectionAssociations",
                    () ->
                        retrieveRejectedSignalDetectionAssociations(
                            stageId,
                            initialEventData,
                            rejectedSignalDetectionAssociationsDefinition.get()),
                    environment.getActiveProfiles()),
            initialEventData::getRejectedSignalDetectionAssociations,
            SignalDetection.class.getSimpleName());

    if (hypothesesDefinition.isEmpty()) {
      LOGGER.warn(NO_FURTHER_FACET_WARNING, EVENT_HYPOTHESIS_VALUE);
      hypothesesDefinition = Optional.of(EventFacetingDefinitions.defaultHypothesesFacetDefinition);
    }

    var finalHypothesesDefinition = hypothesesDefinition.get();
    var facetedEventHypotheses =
        eventHypothesisLogger.apply(
            this.getClass().getSimpleName() + "::populateFacetsForEventHypothesis",
            () -> populateFacetsForEventHypothesis(initialEventData, finalHypothesesDefinition),
            environment.getActiveProfiles());

    var preferredEventHypotheses =
        getDataUsingNullableFacetingDefinition(
            preferredEventHypothesesDefinition,
            () ->
                preferredEventHypothesisLogger.apply(
                    this.getClass().getSimpleName() + "::buildPreferredEventHypothesis",
                    () ->
                        buildPreferredEventHypothesis(
                            initialEventData,
                            preferredEventHypothesesDefinition.get(),
                            facetedEventHypotheses),
                    environment.getActiveProfiles()),
            initialEventData::getPreferredEventHypothesisByStage,
            PreferredEventHypothesis.class.getSimpleName());

    var overallPreferred =
        getDataUsingNullableFacetingDefinition(
            overallPreferredDefinition,
            () ->
                eventHypothesisOptLogger.apply(
                    this.getClass().getSimpleName() + "::buildOverallPreferred",
                    () ->
                        buildOverallPreferred(
                            initialEventData,
                            overallPreferredDefinition.get(),
                            facetedEventHypotheses),
                    environment.getActiveProfiles()),
            initialEventData::getOverallPreferred,
            EventHypothesis.class.getSimpleName());

    var finalEventHypothesesHistory =
        getDataUsingNullableFacetingDefinition(
            finalEventHypothesisHistoryDefinition,
            () ->
                eventHypothesisLogger.apply(
                    this.getClass().getSimpleName() + "::buildFinalEventHypothesisHistory",
                    () ->
                        buildFinalEventHypothesisHistory(
                            initialEventData,
                            finalEventHypothesisHistoryDefinition.get(),
                            facetedEventHypotheses),
                    environment.getActiveProfiles()),
            initialEventData::getFinalEventHypothesisHistory,
            EventHypothesis.class.getSimpleName());

    populatedEventDataBuilder
        .setEventHypotheses(facetedEventHypotheses)
        .setPreferredEventHypothesisByStage(preferredEventHypotheses)
        .setOverallPreferred(overallPreferred.orElse(null))
        .setRejectedSignalDetectionAssociations(rejectedSdhAssociations)
        .setFinalEventHypothesisHistory(finalEventHypothesesHistory);

    return Event.builder()
        .setId(initial.getId())
        .setData(populatedEventDataBuilder.build())
        .autobuild();
  }

  private List<EventHypothesis> populateFacetsForEventHypothesis(
      Event.Data initialEventData, FacetingDefinition finalHypothesesDefinition) {
    return initialEventData.getEventHypotheses().stream()
        .parallel()
        .map(eh -> populateFacets(eh, finalHypothesesDefinition))
        .flatMap(List::stream)
        .toList();
  }

  /**
   * Returns a list of populated {@link EventHypothesis} based on the {@link FacetingDefinition}
   * that is passed into the method.
   *
   * <p>
   *
   * <p>Accounts for a rejected {@link Event} having two {@link EventHypothesis}
   *
   * @param initial The {@link EventHypothesis} to populate
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a list of populated {@link EventHypothesis} (2 objects when EH is rejected)
   */
  public List<EventHypothesis> populateFacets(
      EventHypothesis initial, FacetingDefinition facetingDefinition) {
    return (initial.getData().isEmpty())
        ? eventAccessor.findHypothesesByIds(List.of(initial.getId())).stream()
            .map(ehResult -> populateFacet(ehResult, facetingDefinition))
            .collect(Collectors.toList())
        : List.of(populateFacet(initial, facetingDefinition));
  }

  /**
   * Returns a populated {@link EventHypothesis} based on the {@link FacetingDefinition} that is
   * passed into the method.
   *
   * <p>
   *
   * <p>Accounts for a rejected {@link Event} having two {@link EventHypothesis}
   *
   * @param initial The {@link EventHypothesis} to populate
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a populated {@link EventHypothesis}
   */
  private EventHypothesis populateFacet(
      EventHypothesis initial, FacetingDefinition facetingDefinition) {

    var initialEventHypothesisData =
        initial
            .getData()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "No EventHypothesis data was found, cannot continue"));

    if (facetingDefinition
        .getClassType()
        .equals(FacetingTypes.DEFAULT_FACETED_EVENT_HYPOTHESIS_TYPE.toString())) {
      return EventHypothesis.builder()
          .setId(initial.getId())
          .setData(initialEventHypothesisData.toBuilder().build())
          .autobuild();
    }

    facetingNullCheck(initial, facetingDefinition, EventHypothesis.class.getSimpleName());

    var parentEventHypothesisDefinition =
        facetingDefinition.getFacetingDefinitionByName(FacetingTypes.PARENT_EH_KEY.toString());
    var associatedSignalDetectionHypothesisDefinition =
        facetingDefinition.getFacetingDefinitionByName(FacetingTypes.ASSOCIATED_SDH_KEY.toString());
    var preferredLocationSolutionDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.PREFERRED_LOCATION_SOLUTION_KEY.toString());
    var locationSolutionsDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.LOCATION_SOLUTION_KEY.toString());

    if (!facetingDefinition.isPopulated()) {
      return initial.toEntityReference();
    }
    var populatedEventHypothesisDataBuilder = initialEventHypothesisData.toBuilder();

    var parentEventHypotheses =
        getDataUsingNullableFacetingDefinition(
            parentEventHypothesisDefinition,
            () ->
                initialEventHypothesisData.getParentEventHypotheses().stream()
                    .map(
                        parentEh -> populateFacets(parentEh, parentEventHypothesisDefinition.get()))
                    .flatMap(List::stream)
                    .collect(Collectors.toList()),
            initialEventHypothesisData::getParentEventHypotheses,
            EventHypothesis.class.getSimpleName());

    LOGGER.debug(
        "Querying for associatedSignalDetectionHypotheses Input Data [{}]",
        initialEventHypothesisData.getAssociatedSignalDetectionHypotheses().size());
    var associatedSignalDetectionHypotheses =
        getDataUsingNullableFacetingDefinition(
            associatedSignalDetectionHypothesisDefinition,
            () ->
                initialEventHypothesisData.getAssociatedSignalDetectionHypotheses().stream()
                    .map(
                        signalDetectionHypothesis ->
                            signalDetectionFacetingUtility.populateFacets(
                                signalDetectionHypothesis,
                                associatedSignalDetectionHypothesisDefinition.get()))
                    .collect(Collectors.toList()),
            initialEventHypothesisData::getAssociatedSignalDetectionHypotheses,
            SignalDetectionHypothesis.class.getSimpleName());
    LOGGER.debug(
        "Found[{} entries] for associatedSignalDetectionHypotheses",
        associatedSignalDetectionHypotheses.size());

    var locationSolutions =
        getDataUsingNullableFacetingDefinition(
            locationSolutionsDefinition,
            () ->
                initialEventHypothesisData.getLocationSolutions().stream()
                    .map(ls -> populateFacets(ls, locationSolutionsDefinition.get()))
                    .collect(Collectors.toList()),
            initialEventHypothesisData::getLocationSolutions,
            LocationSolution.class.getSimpleName());

    populatedEventHypothesisDataBuilder
        .setParentEventHypotheses(parentEventHypotheses)
        .setAssociatedSignalDetectionHypotheses(associatedSignalDetectionHypotheses)
        .setLocationSolutions(locationSolutions);

    initialEventHypothesisData
        .getPreferredLocationSolution()
        .ifPresent(
            (LocationSolution preferredLocationSolution) -> {
              if (preferredLocationSolutionDefinition.isEmpty()
                  || !preferredLocationSolutionDefinition.get().isPopulated()) {
                populatedEventHypothesisDataBuilder.setPreferredLocationSolution(
                    preferredLocationSolution.toEntityReference());
              } else {
                populatedEventHypothesisDataBuilder.setPreferredLocationSolution(
                    locationSolutions.stream()
                        .filter(
                            ls ->
                                ls.getId()
                                    .equals(
                                        initialEventHypothesisData
                                            .getPreferredLocationSolution()
                                            .get()
                                            .getId()))
                        .findFirst()
                        .orElseThrow());
              }
            });

    return EventHypothesis.builder()
        .setId(initial.getId())
        .setData(populatedEventHypothesisDataBuilder.build())
        .autobuild();
  }

  /**
   * Returns a populated {@link LocationSolution} based on the {@link FacetingDefinition} that is
   * passed into the method.
   *
   * @param initial The {@link LocationSolution} to populate
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a populated {@link LocationSolution}
   */
  private LocationSolution populateFacets(
      LocationSolution initial, FacetingDefinition facetingDefinition) {
    facetingNullCheck(initial, facetingDefinition, LocationSolution.class.getSimpleName());

    var initialLocationSolutionData =
        initial
            .getData()
            .orElseThrow(
                () -> new IllegalStateException("Cannot process an ID-only LocationSolution"));

    var featurePredictionDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.FEATURE_PREDICTIONS_KEY.toString());
    var featureMeasurementDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.FEATURE_MEASUREMENTS_KEY.toString());

    if (!facetingDefinition.isPopulated()) {
      LOGGER.warn(
          "LocationSolution set to be not populated so returning original LocationSolution");
      return initial.toEntityReference();
    }
    var populatedLocationSolutionDataBuilder = initialLocationSolutionData.toBuilder();
    Instant arrivalTime = null;

    if (featureMeasurementDefinition.isPresent()) {
      var arrivalLocationBehavior =
          initialLocationSolutionData.getLocationBehaviors().stream()
              .filter(
                  lb ->
                      lb.getMeasurement()
                          .getFeatureMeasurementType()
                          .equals(FeatureMeasurementTypes.ARRIVAL_TIME))
              .findFirst()
              .orElseGet(
                  () -> {
                    LOGGER.warn(
                        "Arrival Time Feature Measurement is missing from faceted LocationSolution"
                            + " Data. Returning original FeatureMeasurement");
                    return null;
                  });
      if (arrivalLocationBehavior != null) {
        var arrivalMeasurement =
            (FeatureMeasurement<ArrivalTimeMeasurementValue>)
                arrivalLocationBehavior.getMeasurement();
        arrivalTime = arrivalMeasurement.getMeasurementValue().getArrivalTime().getValue();
      }
    }

    final Instant finalArrivalTime = arrivalTime;
    var newLocationBehaviors =
        initialLocationSolutionData.getLocationBehaviors().stream()
            .map(
                locationBehavior ->
                    populateFacets(
                        locationBehavior,
                        featurePredictionDefinition.orElse(null),
                        featureMeasurementDefinition.orElse(null),
                        finalArrivalTime))
            .collect(Collectors.toList());

    var networkMagnitudeDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.NETWORK_MAGNITUDE_SOLUTIONS_KEY.toString());
    if (networkMagnitudeDefinition.isEmpty()) {
      LOGGER.error("Oh No!!!!! networkMagnitudeDefinition empty");
    } else {
      populatedLocationSolutionDataBuilder.setNetworkMagnitudeSolutions(
          populateFacets(
              initialLocationSolutionData.getNetworkMagnitudeSolutions(),
              networkMagnitudeDefinition.get()));
    }

    populatedLocationSolutionDataBuilder
        .setLocationBehaviors(newLocationBehaviors)
        .setFeaturePredictions(
            FeaturePredictionContainer.create(
                newLocationBehaviors.stream()
                    .map(LocationBehavior::getPrediction)
                    .flatMap(Optional::stream)
                    .collect(Collectors.toList())));

    return LocationSolution.builder()
        .setId(initial.getId())
        .setData(populatedLocationSolutionDataBuilder.build())
        .autobuild();
  }

  private Collection<NetworkMagnitudeSolution> populateFacets(
      ImmutableList<NetworkMagnitudeSolution> networkMagnitudeSolutions,
      FacetingDefinition facetingDefinition) {

    if (facetingDefinition != null && facetingDefinition.isPopulated()) {
      var channelFacetingDefinition =
          facetingDefinition.getFacetingDefinitionByName(FacetingTypes.CHANNEL_KEY.toString());

      var facetedNetworkMagnitudeSolutions = new ArrayList<NetworkMagnitudeSolution>();

      networkMagnitudeSolutions.forEach(
          (NetworkMagnitudeSolution networkMagnitudeSolution) -> {
            List<NetworkMagnitudeBehavior> newBehaviors =
                networkMagnitudeSolution.getMagnitudeBehaviors().stream()
                    .map(
                        magnitudeBehavior ->
                            createMagnitudeBehavior(
                                magnitudeBehavior, channelFacetingDefinition.orElse(null)))
                    .collect(Collectors.toList());

            facetedNetworkMagnitudeSolutions.add(
                networkMagnitudeSolution.toBuilder().setMagnitudeBehaviors(newBehaviors).build());
          });
      return facetedNetworkMagnitudeSolutions;
    }

    return networkMagnitudeSolutions;
  }

  private NetworkMagnitudeBehavior createMagnitudeBehavior(
      NetworkMagnitudeBehavior magnitudeBehavior, FacetingDefinition channelFacetingDefinition) {

    // create an optional feature measurement
    var featureMeasurement =
        createFeatureMeasurement(
            magnitudeBehavior.getStationMagnitudeSolution(), channelFacetingDefinition);

    var magnitudeBehaviorBuilder = magnitudeBehavior.toBuilder();

    featureMeasurement.ifPresent(
        fm ->
            magnitudeBehaviorBuilder.setStationMagnitudeSolution(
                magnitudeBehavior.getStationMagnitudeSolution().toBuilder()
                    .setMeasurement(fm)
                    .build()));

    return magnitudeBehaviorBuilder.build();
  }

  /**
   * Create an optional feature measurement based on previous optional feature measurement
   *
   * @param stationMagnitudeSolution input {@link StationMagnitudeSolution}
   * @param channelFacetingDefinition channel facet def for feature measurement
   * @return optional feature measurement
   */
  private Optional<FeatureMeasurement<AmplitudeMeasurementValue>> createFeatureMeasurement(
      StationMagnitudeSolution stationMagnitudeSolution,
      FacetingDefinition channelFacetingDefinition) {
    var optionalFeatureMeasurement = stationMagnitudeSolution.getMeasurement();

    // check if we have a feature measurement and build the channel
    if (optionalFeatureMeasurement.isPresent()) {
      var featureMeasurement = optionalFeatureMeasurement.get();
      var channel = this.buildChannel(featureMeasurement.getChannel(), channelFacetingDefinition);

      return channel.isPresent()
          ? Optional.of(featureMeasurement.toBuilder().setChannel(channel.get()).build())
          : Optional.empty();
    }

    return Optional.empty();
  }

  private LocationBehavior populateFacets(
      LocationBehavior locationBehavior,
      FacetingDefinition featurePredictionDefinition,
      FacetingDefinition featureMeasurementDefinition,
      Instant finalArrivalTime) {

    FeatureMeasurement<?> featureMeasurement =
        getDataUsingNullableFacetingDefinition(
            Optional.ofNullable(featureMeasurementDefinition),
            () -> {
              if (featureMeasurementDefinition.isPopulated() && finalArrivalTime != null) {
                return signalDetectionFacetingUtility.populateFacets(
                    locationBehavior.getMeasurement(),
                    featureMeasurementDefinition,
                    finalArrivalTime);
              } else {
                return locationBehavior.getMeasurement();
              }
            },
            locationBehavior::getMeasurement,
            FeatureMeasurement.class.getSimpleName());

    var initialFeaturePrediction = locationBehavior.getPrediction();
    var featurePrediction =
        initialFeaturePrediction.isEmpty()
            ? Optional.empty()
            : Optional.of(
                getDataUsingNullableFacetingDefinition(
                    Optional.ofNullable(featurePredictionDefinition),
                    () ->
                        populateFacets(initialFeaturePrediction.get(), featurePredictionDefinition),
                    initialFeaturePrediction::get,
                    FeaturePrediction.class.getSimpleName()));
    return LocationBehavior.from(
        locationBehavior.getResidual().orElse(null),
        locationBehavior.getWeight().orElse(null),
        locationBehavior.isDefining(),
        ((Optional<FeaturePrediction<? extends FeaturePredictionValue<?, ?, ?>>>) featurePrediction)
            .orElse(null),
        featureMeasurement);
  }

  /**
   * Returns a populated {@link FeaturePrediction} based on the {@link FacetingDefinition} that is
   * passed into the method.
   *
   * @param initial The {@link FeaturePrediction} to populate
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a populated {@link FeaturePrediction}
   */
  private <T extends FeaturePredictionValue<?, ?, ?>> FeaturePrediction<T> populateFacets(
      FeaturePrediction<T> initial, FacetingDefinition facetingDefinition) {
    facetingNullCheck(initial, facetingDefinition, FeaturePrediction.class.getSimpleName());

    var channelDefinition =
        facetingDefinition.getFacetingDefinitionByName(FacetingTypes.CHANNEL_KEY.toString());
    var channelSegmentDefinition =
        facetingDefinition.getFacetingDefinitionByName(
            FacetingTypes.CHANNEL_SEGMENT_KEY.toString());

    var finalChannel =
        initial.getChannel().isPresent() && channelDefinition.isPresent()
            ? buildChannel(initial.getChannel().orElseThrow(), channelDefinition.get())
            : initial.getChannel();
    var finalChannelSegment =
        initial.getPredictionChannelSegment().isPresent() && channelSegmentDefinition.isPresent()
            ? buildChannelSegment(
                initial.getPredictionChannelSegment().orElseThrow(), channelSegmentDefinition.get())
            : initial.getPredictionChannelSegment();

    return FeaturePrediction.<T>builder()
        .setPredictionValue(initial.getPredictionValue())
        .setPredictionType(initial.getPredictionType())
        .setPhase(initial.getPhase())
        .setExtrapolated(initial.isExtrapolated())
        .setSourceLocation(initial.getSourceLocation())
        .setChannel(finalChannel.orElse(null))
        .setPredictionChannelSegment(finalChannelSegment.orElse(null))
        .setReceiverLocation(initial.getReceiverLocation())
        .build();
  }

  /**
   * Returns a populated {@link Channel} based on the {@link FacetingDefinition} that is passed into
   * the method. Calls the {@link StationDefinitionFacetingUtility} to facet channel.
   *
   * @param channel The {@link Channel} to populate
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a populated {@link Channel}
   */
  private Optional<Channel> buildChannel(Channel channel, FacetingDefinition facetingDefinition) {
    facetingNullCheck(channel, facetingDefinition, Channel.class.getSimpleName());

    if (!facetingDefinition.isPopulated()) {
      return Optional.ofNullable(Channel.createVersionReference(channel));
    }
    return Optional.ofNullable(
        stationDefinitionFacetingUtility.populateFacets(
            channel,
            facetingDefinition,
            channel
                .getEffectiveAt()
                .orElseThrow(
                    () ->
                        new IllegalStateException(
                            "Cannot facet a channel without an EffectiveAt time"))));
  }

  /**
   * Returns a populated {@link ChannelSegment} based on the {@link FacetingDefinition} that is
   * passed into the method. Calls the {@link WaveformFacetingUtility} to facet channel segment.
   *
   * @param channelSegment The {@link ChannelSegment} to populate
   * @param facetingDefinition The {@link FacetingDefinition} defining which fields to populate
   * @return a populated {@link ChannelSegment}
   */
  private <T extends Timeseries> Optional<ChannelSegment<T>> buildChannelSegment(
      ChannelSegment<T> channelSegment, FacetingDefinition facetingDefinition) {
    facetingNullCheck(channelSegment, facetingDefinition, ChannelSegment.class.getSimpleName());

    if (!facetingDefinition.isPopulated()) {
      return Optional.of(channelSegment);
    }
    return Optional.of(
        (ChannelSegment<T>)
            waveformFacetingUtility.populateFacets(channelSegment, facetingDefinition));
  }

  /**
   * Returns a list of {@link EventHypothesis} history based on the initial {@link Event.Data},
   * {@link FacetingDefinition} and any provided EventHypotheses that are passed into the method.
   *
   * @param initialEventData The {@link Event.Data} of interest
   * @param finalEventHypothesisHistoryDefinition The {@link FacetingDefinition} defining which
   *     fields to populate
   * @param bridgedEventHypotheses The list of bridged EventHypotheses related to the provided event
   * @return a populated {@link List} of {@link EventHypothesis}
   */
  private static List<EventHypothesis> buildFinalEventHypothesisHistory(
      Event.Data initialEventData,
      FacetingDefinition finalEventHypothesisHistoryDefinition,
      Collection<EventHypothesis> bridgedEventHypotheses) {
    if (!finalEventHypothesisHistoryDefinition.isPopulated()) {
      return initialEventData.getFinalEventHypothesisHistory().stream()
          .map(EventHypothesis::toEntityReference)
          .collect(Collectors.toList());
    }

    List<EventHypothesis> eventHypothesesList = new ArrayList<>();

    initialEventData
        .getFinalEventHypothesisHistory()
        .forEach(
            (EventHypothesis eventHypothesis) -> {
              var bridgedEventHypothesisOpt =
                  bridgedEventHypotheses.stream()
                      .filter(
                          eventHypothesis2 ->
                              eventHypothesis2.getId().equals(eventHypothesis.getId()))
                      .findFirst();
              bridgedEventHypothesisOpt.ifPresentOrElse(
                  eventHypothesesList::add,
                  () ->
                      LOGGER.warn(
                          "EventHypothesis with ID:[{}] from EventHypothesisHistory list was not"
                              + " found, cannot add to Event history",
                          eventHypothesis.getId()));
            });
    return eventHypothesesList;
  }

  /**
   * Returns an {@link Optional} {@link EventHypothesis} based on the provided initial {@link
   * Event.Data}, {@link FacetingDefinition} and any provided EventHypotheses that are passed into
   * the method.
   *
   * @param initialEventData The {@link Event.Data} of interest
   * @param overallPreferredDefinition The {@link FacetingDefinition} defining which fields to
   *     populate
   * @param bridgedEventHypotheses The list of bridged EventHypotheses related to the provided event
   * @return a populated {@link List} of {@link EventHypothesis}
   */
  private static Optional<EventHypothesis> buildOverallPreferred(
      Event.Data initialEventData,
      FacetingDefinition overallPreferredDefinition,
      Collection<EventHypothesis> bridgedEventHypotheses) {

    var eventHypothesisOpt = initialEventData.getOverallPreferred();
    EventHypothesis eventHypothesis;
    if (eventHypothesisOpt.isPresent()) {
      eventHypothesis = eventHypothesisOpt.get();
    } else {
      return Optional.empty();
    }

    if (overallPreferredDefinition.isPopulated()) {
      var foundEventHypothesisOpt =
          bridgedEventHypotheses.stream()
              .filter(eventHypothesis1 -> eventHypothesis1.getId().equals(eventHypothesis.getId()))
              .findFirst();

      if (foundEventHypothesisOpt.isEmpty()) {
        LOGGER.warn(
            "EventHypothesis with id:[{}] was not found.  The Overall Preferred EventHypothesis"
                + " will not be added to the event",
            eventHypothesis.getId());
      }

      return foundEventHypothesisOpt;

    } else {
      return Optional.of(eventHypothesis.toEntityReference());
    }
  }

  /**
   * Returns a {@link List} of {@link EventHypothesis} based on the initial {@link Event.Data},
   * {@link FacetingDefinition} and any provided EventHypotheses that are passed into the method.
   *
   * <p>
   *
   * <p>Searches the bridgedEventHypotheses for objects with the IDs found in
   * `initialEventData::preferredEventHypotheses`
   *
   * @param initialEventData The {@link Event.Data} of interest
   * @param preferredEventHypothesesDefinition The {@link FacetingDefinition} defining which fields
   *     to populate
   * @param bridgedEventHypotheses The list of bridged EventHypotheses related to the provided event
   * @return a populated {@link List} of {@link EventHypothesis}
   */
  private static List<PreferredEventHypothesis> buildPreferredEventHypothesis(
      Event.Data initialEventData,
      FacetingDefinition preferredEventHypothesesDefinition,
      Collection<EventHypothesis> bridgedEventHypotheses) {

    if (!preferredEventHypothesesDefinition.isPopulated()) {
      return initialEventData.getPreferredEventHypothesisByStage().stream()
          .map(
              preferredEventHypothesis ->
                  PreferredEventHypothesis.from(
                      preferredEventHypothesis.getStage(),
                      preferredEventHypothesis.getPreferredBy(),
                      preferredEventHypothesis.getPreferred().toEntityReference()))
          .collect(Collectors.toList());
    }

    List<PreferredEventHypothesis> preferredEventHypotheses = new ArrayList<>();
    initialEventData
        .getPreferredEventHypothesisByStage()
        .forEach(
            (PreferredEventHypothesis preferredEventHypothesis) -> {
              var facetedEventHypothesis = preferredEventHypothesis.getPreferred();
              var bridgedEventHypothesisOpt =
                  bridgedEventHypotheses.stream()
                      .filter(
                          eventHypothesis ->
                              eventHypothesis.getId().equals(facetedEventHypothesis.getId()))
                      .findFirst();

              bridgedEventHypothesisOpt.ifPresentOrElse(
                  eventHypothesis ->
                      preferredEventHypotheses.add(
                          PreferredEventHypothesis.from(
                              preferredEventHypothesis.getStage(),
                              preferredEventHypothesis.getPreferredBy(),
                              eventHypothesis)),
                  () -> preferredEventHypotheses.add(preferredEventHypothesis));
            });

    return preferredEventHypotheses;
  }

  /**
   * Returns a {@link List} of {@link SignalDetection} based on the initial {@link Event.Data},
   * {@link FacetingDefinition} and {@link WorkflowDefinitionId}
   *
   * @param stageId The {@link WorkflowDefinitionId} of interest
   * @param initialEventData The {@link Event.Data} of interest
   * @param rejectedSignalDetectionAssociationsDefinition The {@link FacetingDefinition} defining
   *     which fields to populate
   * @return a populated {@link List} of {@link SignalDetection}
   */
  private List<SignalDetection> retrieveRejectedSignalDetectionAssociations(
      WorkflowDefinitionId stageId,
      Event.Data initialEventData,
      FacetingDefinition rejectedSignalDetectionAssociationsDefinition) {
    if (!rejectedSignalDetectionAssociationsDefinition.isPopulated()) {
      return initialEventData.getRejectedSignalDetectionAssociations().stream()
          .map(SignalDetection::toEntityReference)
          .filter(Objects::nonNull)
          .collect(Collectors.toList());
    }
    return initialEventData.getRejectedSignalDetectionAssociations().stream()
        .parallel()
        .map(
            signalDetection ->
                signalDetectionFacetingUtility.populateFacets(
                    signalDetection, rejectedSignalDetectionAssociationsDefinition, stageId))
        .filter(Objects::nonNull)
        .collect(Collectors.toList());
  }

  /**
   * Encapsulates assertions of state before faceting
   *
   * @param initialObject The {@link Object} to be faceted
   * @param facetingDefinition The {@link FacetingDefinition} declaring how to populate
   *     initialObject
   * @param className A {@link String} representing the class of initialObject
   */
  private static void facetingNullCheck(
      Object initialObject, FacetingDefinition facetingDefinition, String className) {
    checkNotNull(initialObject, "Initial %s cannot be null", className);
    checkNotNull(facetingDefinition, "FacetingDefinition for %s cannot be null", className);
    checkState(
        facetingDefinition.getClassType().equals(className),
        "FacetingDefinition must be for the %s class",
        className);
  }

  /**
   * Returns Data based on the {@link FacetingDefinition} that is passed into the method. If the
   * {@link FacetingDefinition} is null, logs a warning and returns the facetingDefinitionNull
   * result. If non-null, returns the FacetingDefinitionNonNull result.
   *
   * @param facetingDefinition The {@link FacetingDefinition} to check for a non-null state
   * @param facetingDefinitionNonNull The function to execute if there is a {@link
   *     FacetingDefinition}
   * @param facetingDefinitionNull The function to execute if there is not a {@link
   *     FacetingDefinition}
   * @return Data of the type associated with the {@link FacetingDefinition}
   */
  private static <T> T getDataUsingNullableFacetingDefinition(
      Optional<FacetingDefinition> facetingDefinition,
      Supplier<T> facetingDefinitionNonNull,
      Supplier<T> facetingDefinitionNull,
      String className) {

    if (facetingDefinition.isPresent()) {
      return facetingDefinitionNonNull.get();
    } else {
      LOGGER.debug(
          "No {} FacetingDefinition provided, returning original {}", className, className);
      return facetingDefinitionNull.get();
    }
  }
}
