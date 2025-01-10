package gms.shared.signaldetection.api.facet;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility responsible for populating the faceted attributes of {@link SignalDetection} and {@link
 * SignalDetectionHypothesis} objects.
 */
public final class SignalDetectionFacetingUtility {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalDetectionFacetingUtility.class);

  private static final String SIGNAL_DETECTION_HYPOTHESES = "signalDetectionHypotheses";
  private static final String PARENT_SIGNAL_DETECTION_HYPOTHESIS =
      "parentSignalDetectionHypothesis";
  private static final String STATION = "station";
  private static final String FEATURE_MEASUREMENTS = "featureMeasurements";
  private static final String CHANNEL = "channel";
  private static final String MEASURED_CHANNEL_SEGMENT = "measuredChannelSegment";
  private static final String AW_CHANNEL_SEGMENT = "analysisWaveformChannelSegment";
  public static final String NULL_FACETING_DEFINITION_MESSAGE = "FacetingDefinition cannot be null";
  private final SignalDetectionAccessor signalDetectionAccessor;
  private final WaveformFacetingUtility waveformFacetingUtility;
  private final StationDefinitionFacetingUtility stationDefinitionFacetingUtility;

  private SignalDetectionFacetingUtility(
      SignalDetectionAccessor signalDetectionAccessor,
      WaveformFacetingUtility waveformFacetingUtility,
      StationDefinitionFacetingUtility stationDefinitionFacetingUtility) {
    this.signalDetectionAccessor = signalDetectionAccessor;
    this.waveformFacetingUtility = waveformFacetingUtility;
    this.stationDefinitionFacetingUtility = stationDefinitionFacetingUtility;
  }

  /**
   * Creates a new {@link SignalDetectionFacetingUtility}
   *
   * @param signalDetectionAccessor the {@link SignalDetectionRepositoryInterface} that will be used
   *     to retrieve extra data
   * @param waveformFacetingUtility the {@link WaveformFacetingUtility} to populate waveform
   *     components
   * @param stationDefinitionFacetingUtility the {@link StationDefinitionFacetingUtility} to
   *     populate station definition components
   * @return a new {@link SignalDetectionFacetingUtility}
   */
  public static SignalDetectionFacetingUtility create(
      SignalDetectionAccessor signalDetectionAccessor,
      WaveformFacetingUtility waveformFacetingUtility,
      StationDefinitionFacetingUtility stationDefinitionFacetingUtility) {
    Objects.requireNonNull(signalDetectionAccessor, "SignalDetectionAccessor cannot be null");
    Objects.requireNonNull(waveformFacetingUtility, "WaveformFacetingUtility cannot be null");
    Objects.requireNonNull(
        stationDefinitionFacetingUtility, "StationDefinitionFacetingUtility cannot be null");

    return new SignalDetectionFacetingUtility(
        signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  /**
   * Populates the provided {@link SignalDetection} based on the faceting definition and stage.
   * Returns null if there was any error in faceting.
   *
   * @param initial the initial {@link SignalDetection} to populate
   * @param facetingDefinition the {@link FacetingDefinition} defining how to populate the {@link
   *     SignalDetection}
   * @param stageId the {@link WorkflowDefinitionId} from where the {@link SignalDetection} was
   *     found
   * @return the faceted {@link SignalDetection}
   */
  public SignalDetection populateFacets(
      SignalDetection initial,
      FacetingDefinition facetingDefinition,
      WorkflowDefinitionId stageId) {

    Objects.requireNonNull(initial, "Initial SignalDetection cannot be null");
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Objects.requireNonNull(stageId, "StageId cannot be null");
    Preconditions.checkState(
        facetingDefinition.getClassType().equals(SignalDetection.class.getSimpleName()),
        "FacetingDefinition must be present for SignalDetection");

    if (!facetingDefinition.isPopulated()) {
      return initial.isPresent() ? initial.toEntityReference() : initial;
    } else {
      var sdhDefinition =
          facetingDefinition.getFacetingDefinitionByName(SIGNAL_DETECTION_HYPOTHESES).orElse(null);
      var stationDefinition = facetingDefinition.getFacetingDefinitionByName(STATION).orElse(null);

      var facetedSD = getFacetedSignalDetection(stationDefinition, sdhDefinition, initial, stageId);
      if (facetedSD == null) {
        return null;
      }

      return populateSignalDetection(facetedSD, sdhDefinition, stationDefinition);
    }
  }

  private SignalDetection populateSignalDetection(
      SignalDetection facetedSD,
      FacetingDefinition sdhDefinition,
      FacetingDefinition stationDefinition) {
    // ensure that data exists within the faceted SignalDetection object
    var facetedData = facetedSD.getData();
    var data = facetedData.orElse(null);
    if (data == null) {
      LOGGER.debug("Retrieved data is not populated");
      return null;
    }

    // if data exists continue with population of signal detection hypotheses
    var dataBuilder = data.toBuilder();
    List<SignalDetectionHypothesis> facetedHypotheses =
        data.getSignalDetectionHypotheses().stream()
            .map(hypothesis -> populateFacets(hypothesis, sdhDefinition))
            .filter(Objects::nonNull)
            .toList();
    if (facetedHypotheses.isEmpty()) {
      LOGGER.debug("Signal detection hypotheses cannot be empty");
      return null;
    }

    dataBuilder.setSignalDetectionHypotheses(facetedHypotheses);

    // Because of the check above, we know that the hypothesis is populated
    Instant effectiveTime;
    if (!stationDefinition.isPopulated()) {
      effectiveTime = Instant.EPOCH;
    } else {
      ArrivalTimeMeasurementValue arrivalTime = getEffectiveTimeForHypothesis(facetedHypotheses);
      effectiveTime = arrivalTime.getArrivalTime().getValue();
    }

    dataBuilder.setStation(
        stationDefinitionFacetingUtility
            .populateFacets(data.getStation(), stationDefinition, effectiveTime)
            .toEntityReference());

    return facetedSD.toBuilder().setData(dataBuilder.build()).build();
  }

  private SignalDetection getFacetedSignalDetection(
      FacetingDefinition stationDefinition,
      FacetingDefinition sdhDefinition,
      SignalDetection initial,
      WorkflowDefinitionId stageId) {
    if (checkForProblems(stationDefinition, sdhDefinition)) {
      return null;
    }
    return checkInitialPresent(initial, stageId);
  }

  private SignalDetection checkInitialPresent(
      SignalDetection initial, WorkflowDefinitionId stageId) {
    if (initial.isPresent()) {
      return initial;
    } else {
      List<SignalDetection> signalDetections =
          signalDetectionAccessor.findByIds(List.of(initial.getId()), stageId);

      var hasProblem = false;
      if (signalDetections.isEmpty()) {
        LOGGER.debug("No signal detection found with provided ID");
        hasProblem = true;
      }

      if (signalDetections.size() > 1) {
        LOGGER.debug("Multiple signal detection found for provided ID");
        hasProblem = true;
      }

      return hasProblem ? null : signalDetections.get(0);
    }
  }

  private static boolean checkForProblems(
      FacetingDefinition stationDefinition, FacetingDefinition sdhDefinition) {
    if (stationDefinition == null) {
      LOGGER.debug("Cannot populate station without station faceting definition");
      return true;
    }

    boolean hasProblem;
    if (sdhDefinition == null) {
      LOGGER.debug(
          "Cannot populate station without signal detection hypothesis faceting definition");
      hasProblem = true;
    } else if (!sdhDefinition.isPopulated()) {
      LOGGER.debug(
          "Cannot populate station without an arrival measurement to provide effective time");
      hasProblem = true;
    } else {
      hasProblem = false;
    }
    return hasProblem;
  }

  private static ArrivalTimeMeasurementValue getEffectiveTimeForHypothesis(
      List<SignalDetectionHypothesis> facetedHypotheses) {
    SignalDetectionHypothesis hypothesis = facetedHypotheses.get(0);
    return (ArrivalTimeMeasurementValue)
        hypothesis
            .getData()
            .map(SignalDetectionHypothesis.Data::getFeatureMeasurementsByType)
            .map(
                featureMeasurmentsByType ->
                    featureMeasurmentsByType.get(FeatureMeasurementTypes.ARRIVAL_TIME))
            .map(FeatureMeasurement::getMeasurementValue)
            .orElseThrow(
                () ->
                    new NoSuchElementException(
                        "No ArrivalTimeMeasurement is present to provide EffectiveTime"));
  }

  /**
   * populates the provided {@link SignalDetectionHypothesis} based on the faceting definition and
   * stage. Returns null if there was any error in faceting.
   *
   * @param initial the initial {@link SignalDetectionHypothesis} to populate
   * @param facetingDefinition the {@link FacetingDefinition} defining how to populate the {@link
   *     SignalDetectionHypothesis}
   * @return the faceted {@link SignalDetectionHypothesis}
   */
  public SignalDetectionHypothesis populateFacets(
      SignalDetectionHypothesis initial, FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(initial, "Initial SignalDetectionHypothesis cannot be null");
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Preconditions.checkState(
        facetingDefinition.getClassType().equals(SignalDetectionHypothesis.class.getSimpleName()),
        "FacetingDefinition must be present for SignalDetectionHypothesis");

    if (!facetingDefinition.isPopulated()) {
      return initial.isPresent() ? initial.toEntityReference() : initial;
    } else {
      SignalDetectionHypothesis faceted = findInitialHypothesis(initial);
      return (faceted == null) ? null : buildHypothesis(faceted, facetingDefinition);
    }
  }

  private SignalDetectionHypothesis buildHypothesis(
      SignalDetectionHypothesis faceted, FacetingDefinition facetingDefinition) {
    // ensure that data exists within the faceted SignalDetectionHypothesis object
    var initialDataOptional = faceted.getData();
    var initialData = initialDataOptional.orElse(null);
    if (initialData == null) {
      LOGGER.debug("Retrieved data is not populated");
      return null;
    }
    var dataBuilder = setDataBuilder(initialData, facetingDefinition, faceted);

    if (dataBuilder == null) {
      return null;
    }

    return faceted.toBuilder().setData(dataBuilder.build()).build();
  }

  private SignalDetectionHypothesis.Data.Builder setDataBuilder(
      SignalDetectionHypothesis.Data initialData,
      FacetingDefinition facetingDefinition,
      SignalDetectionHypothesis faceted) {

    var dataBuilder = initialData.toBuilder();
    Optional<FeatureMeasurement<ArrivalTimeMeasurementValue>> arrivalMeasurementOptional =
        initialData.getFeatureMeasurement(FeatureMeasurementTypes.ARRIVAL_TIME);
    FeatureMeasurement<ArrivalTimeMeasurementValue> arrivalMeasurement =
        arrivalMeasurementOptional.orElse(null);
    if (arrivalMeasurement == null) {
      LOGGER.debug(
          "Arrival Time Feature Measurement is missing from faceted SignalDetectionHypothesis"
              + " Data");
      return null;
    }

    Instant effectiveTime = arrivalMeasurement.getMeasurementValue().getArrivalTime().getValue();

    facetingDefinition
        .getFacetingDefinitionByName(STATION)
        .ifPresent(
            statFacetDef ->
                dataBuilder.setStation(
                    stationDefinitionFacetingUtility.populateFacets(
                        initialData.getStation(), statFacetDef, effectiveTime)));

    facetingDefinition
        .getFacetingDefinitionByName(FEATURE_MEASUREMENTS)
        .ifPresent(
            (FacetingDefinition featMeasFacetdef) -> {
              Set<FeatureMeasurement<?>> facetedFeatureMeasurements =
                  faceted.getFeatureMeasurements().stream()
                      .map(
                          featureMeasurement ->
                              populateFacets(featureMeasurement, featMeasFacetdef, effectiveTime))
                      .collect(Collectors.toSet());
              dataBuilder.setFeatureMeasurements(facetedFeatureMeasurements);
            });

    var facetedParent = faceted.getParentSignalDetectionHypothesis();
    // Check to see if there is a faceting definition corresponding to the parent signal detection
    // hypothesis and call populateFacets using this faceting definition and the parent signal
    // detection
    // hypothesis. Set the parent signal detection hypothesis to the result of the populateFacets
    // call.
    // Only do this if a parent signal detection hypothesis is present.

    facetedParent.ifPresent(
        parentSignalDetectionHypothesis ->
            facetingDefinition
                .getFacetingDefinitionByName(PARENT_SIGNAL_DETECTION_HYPOTHESIS)
                .ifPresent(
                    facet ->
                        dataBuilder.setParentSignalDetectionHypothesis(
                            populateFacets(parentSignalDetectionHypothesis, facet))));
    return dataBuilder;
  }

  /**
   * Finds the initial hypothesis, if one exists.
   *
   * @param initial
   * @return the initial hypothesis, or null, if none exists.
   */
  private SignalDetectionHypothesis findInitialHypothesis(SignalDetectionHypothesis initial) {
    if (initial.isPresent()) {
      return initial;
    } else {
      List<SignalDetectionHypothesis> signalDetectionHypotheses =
          signalDetectionAccessor.findHypothesesByIds(List.of(initial.getId()));

      var hasProblem = false;
      if (signalDetectionHypotheses.isEmpty()) {
        LOGGER.debug("No signal detection hypotheses found with provided ID");
        hasProblem = true;
      }
      if (signalDetectionHypotheses.size() > 1) {
        LOGGER.debug("Multiple signal detection hypotheses found for provided ID");
        hasProblem = true;
      }

      return hasProblem ? null : signalDetectionHypotheses.get(0);
    }
  }

  /**
   * populates the provided {@link FeatureMeasurement} based on the faceting definition and stage
   *
   * @param initial the initial {@link FeatureMeasurement} to populate
   * @param facetingDefinition the {@link FacetingDefinition} defining how to populate the {@link
   *     FeatureMeasurement}
   * @param effectiveTime the time of the {@link SignalDetection} the {@link FeatureMeasurement}
   *     measures
   * @return the faceted {@link FeatureMeasurement}
   */
  public <T> FeatureMeasurement<T> populateFacets(
      FeatureMeasurement<T> initial, FacetingDefinition facetingDefinition, Instant effectiveTime) {
    Objects.requireNonNull(initial, "Initial FeatureMeasurement cannot be null");
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Objects.requireNonNull(effectiveTime, "EffectiveTime cannot be null");
    Preconditions.checkState(
        facetingDefinition.getClassType().equals(FeatureMeasurement.class.getSimpleName()),
        "FacetingDefinition must be for FeatureMeasurement");
    Preconditions.checkState(
        facetingDefinition.isPopulated(), "FeatureMeasurement parent must be populated");

    var channelFacetDefinition = facetingDefinition.getFacetingDefinitionByName(CHANNEL);
    var facetedFmChannel = initial.getChannel();
    if (channelFacetDefinition.isPresent()) {
      facetedFmChannel =
          stationDefinitionFacetingUtility.populateFacets(
              initial.getChannel(), channelFacetDefinition.get(), effectiveTime);
    }

    var measChanSegFacetDefinition =
        facetingDefinition.getFacetingDefinitionByName(MEASURED_CHANNEL_SEGMENT);
    var facetMCSegmentOpt =
        initial
            .getMeasuredChannelSegment()
            .map(
                facetMCSegment ->
                    (measChanSegFacetDefinition.isPresent())
                        ? waveformFacetingUtility.populateFacets(
                            facetMCSegment, measChanSegFacetDefinition.get())
                        : facetMCSegment);

    var facetedAw =
        initial
            .getAnalysisWaveform()
            .map(
                aw ->
                    (facetingDefinition.getFacetingDefinitionByName(AW_CHANNEL_SEGMENT).isPresent())
                        ? aw.toBuilder()
                            .setWaveform(
                                (ChannelSegment<Waveform>)
                                    waveformFacetingUtility.populateFacets(
                                        aw.getWaveform(),
                                        facetingDefinition
                                            .getFacetingDefinitionByName(AW_CHANNEL_SEGMENT)
                                            .get()))
                            .build()
                        : aw);

    return FeatureMeasurement.<T>builder()
        .setChannel(facetedFmChannel)
        .setMeasuredChannelSegment(facetMCSegmentOpt)
        .setFeatureMeasurementType(initial.getFeatureMeasurementType())
        .setMeasurementValue(initial.getMeasurementValue())
        .setSnr(initial.getSnr())
        .setAnalysisWaveform(facetedAw)
        .build();
  }
}
