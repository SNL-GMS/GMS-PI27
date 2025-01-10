package gms.shared.event.analysis.relocation.locoo3d.utility;

import static java.lang.Math.toRadians;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsInput;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.LocationUncertainty;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gov.sandia.gmp.baseobjects.Source;
import gov.sandia.gmp.baseobjects.observation.Observation;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

/** Converts LocOo3D outputs to GMS COI objects */
public final class GmsOutputConverter {

  private static final int THREE_PER_OBSERVATION = 3;
  static final double TOLERANCE = 1E-3;

  /**
   * A reference to the input data. Used to retrieve the input feature measurements so a reference
   * to the input feature measurements can be copied to the output LocationSolution.
   */
  private final GmsInput dataInput;

  /**
   * Stores the UUIDs used for outputLocationSolutions; stays permanent even after map is cleared
   */
  private final Collection<UUID> usedUuids;

  /** Container to receive the output LocationSolutions */
  private final Map<UUID, LocationSolution> outputLocationSolutions;

  /** Stores the parameters used to scale Ellipses and Ellipsoids from HyperEllipses */
  private Collection<LocationUncertaintyDefinition> ellipseParameters;

  /**
   * Converts LocOo3d Output to GMS COI Objects
   *
   * @param dataInput contains the original {@link EventHypothesis}(es) and {@link
   *     SignalDetectionHypothesis}(es)
   */
  public GmsOutputConverter(GmsInput dataInput) {
    usedUuids = new HashSet<>();
    outputLocationSolutions = new TreeMap<>();
    this.ellipseParameters = new ArrayList<>();
    this.dataInput = dataInput;
  }

  /**
   * Sets the parameters to modify the HyperEllipse for each {@link LocationUncertainty}
   *
   * @param ellipseParameters contains the modifications to the LocOo3d HyperEllipse for each {@link
   *     LocationUncertainty}
   */
  public void setEllipseParameters(Collection<LocationUncertaintyDefinition> ellipseParameters) {
    if (ellipseParameters != null) {
      this.ellipseParameters = new ArrayList<>(ellipseParameters);
    }
  }

  /**
   * Retrieve a copy of the output location solutions.
   *
   * @return an immutable copy of outputLocationSolutions
   */
  public Map<UUID, LocationSolution> getOutputLocationSolutions() {
    return Map.copyOf(outputLocationSolutions);
  }

  /**
   * Clears the output location solutions map, so that the caller can avoid retrieving the same
   * solutions multiple times.
   */
  public void clearOutputLocationSolutions() {
    outputLocationSolutions.clear();
  }

  /**
   * Converts a source into an output {@link LocationSolution} and adds it to the solution map
   *
   * @param source a valid {@link Source}
   * @throws IllegalArgumentException if the underlying HyperEllipse does not have an Ellipse or
   *     Ellipsoid
   */
  public void addSourceToMap(Source source) throws IllegalArgumentException {

    // generate new EventLocation populated with the source location.
    var newEventLocation =
        EventLocation.from(
            source.getLatDegrees(),
            source.getLonDegrees(),
            source.getDepth(),
            GmsOutputConverter.instantFromSeconds(source.getTime()));

    // instantiate a new LocationSolution which will be populated with information from the
    // Source object returned by LocOO
    var locationBehaviors = getLocationBehaviors(source, newEventLocation);
    var featurePredictions = getFeaturePredictions(locationBehaviors);
    var outputLocationSolutionDataBuilder =
        LocationSolution.Data.builder()
            .setLocation(newEventLocation)
            .setLocationRestraint(dataInput.getRestraints().get(source.getSourceId()))
            .setLocationBehaviors(locationBehaviors)
            .setNetworkMagnitudeSolutions(Collections.emptyList())
            .setFeaturePredictions(featurePredictions);

    if (!Objects.isNull(source.getHyperEllipse())) {
      outputLocationSolutionDataBuilder.setLocationUncertainty(
          GmsLocationUncertaintyFactory.create(source, ellipseParameters));
    }

    var outputLocationSolutionData = outputLocationSolutionDataBuilder.build();

    var id = UUID.randomUUID();
    while (usedUuids.contains(id)) {
      id = UUID.randomUUID();
    }

    var outputLocationSolution =
        LocationSolution.builder().setId(id).setData(outputLocationSolutionData).build();

    outputLocationSolutions.put(id, outputLocationSolution);
    usedUuids.add(id);
  }

  /**
   * Provides a collection of {@link LocationBehavior}s for the output {@link LocationSolution}. Up
   * to three {@link LocationBehavior}s are generated for each {@link SignalDetectionHypothesis} in
   * the source.
   *
   * @param source
   * @param newEventLocation
   * @return a collection of {@link LocationBehavior}s
   */
  private Collection<LocationBehavior> getLocationBehaviors(
      Source source, EventLocation newEventLocation) {

    Collection<LocationBehavior> behaviors =
        new ArrayList<>(source.getObservations().size() * THREE_PER_OBSERVATION);

    source.getObservations().values().stream()
        .forEach(observation -> addBehaviors(observation, newEventLocation, behaviors));

    return behaviors;
  }

  /**
   * Goes through the collection of input {@link SignalDetectionHypothesis} to find the {@link
   * FeatureMeasurement}s. For each FM, a {@link LocationBehavior} is generated if the FM is of a
   * type of interest.
   *
   * @param observation
   * @param newEventLocation
   * @param behaviors
   */
  private void addBehaviors(
      Observation observation,
      EventLocation newEventLocation,
      Collection<LocationBehavior> behaviors) {

    var sdh = dataInput.getSignalDetectionHypotheses().get(observation.getObservationId());

    sdh.getFeatureMeasurements().stream()
        .forEach(fm -> addBehaviorIfOfInterest(sdh, fm, observation, newEventLocation, behaviors));
  }

  /**
   * Generates a {@link LocationBehavior} for a {@link FeatureMeasurement} of type ARRIVAL_TIME,
   * RECEIVER_TO_SOURCE_AZIMUTH, and SLOWNESS. Other FM types do not generate a location behavior.
   *
   * @param sdh
   * @param fm
   * @param observation
   * @param newEventLocation
   * @param behaviors
   */
  private static void addBehaviorIfOfInterest(
      SignalDetectionHypothesis sdh,
      FeatureMeasurement<?> fm,
      Observation observation,
      EventLocation newEventLocation,
      Collection<LocationBehavior> behaviors) {

    if (Objects.isNull(observation.getPredictions())) {
      return;
    }

    var stationLocation = sdh.getStation().getLocation();

    switch (fm.getFeatureMeasurementType().getFeatureMeasurementTypeName()) {
      case "ARRIVAL_TIME" -> behaviors.addAll(
          GmsArrivalBehaviorFactory.create(fm, observation, newEventLocation, stationLocation));
      case "RECEIVER_TO_SOURCE_AZIMUTH" -> behaviors.addAll(
          GmsAzimuthBehaviorFactory.create(fm, observation, newEventLocation, stationLocation));
      case "SLOWNESS" -> behaviors.addAll(
          GmsSlownessBehaviorFactory.create(fm, observation, newEventLocation, stationLocation));
      default -> {
        // take no action
      }
    }
  }

  /**
   * Adds the {@link FeatureMeasurements} from the behaviors to a {@link FeaturePredictionContainer}
   *
   * @param locationBehaviors
   * @return
   */
  private static FeaturePredictionContainer getFeaturePredictions(
      Collection<LocationBehavior> locationBehaviors) {
    Collection<FeaturePrediction<? extends FeaturePredictionValue<?, ?, ?>>> featurePredictions =
        new ArrayList<>();

    locationBehaviors.stream()
        .map(LocationBehavior::getPrediction)
        .flatMap(Optional::stream)
        .forEach(featurePredictions::add);

    return FeaturePredictionContainer.create(featurePredictions);
  }

  /**
   * Verifies that a prediction is not null and is a number
   *
   * @param prediction
   * @return
   */
  static boolean isValidPrediction(Double prediction) {
    return prediction != null
        && !Double.isNaN(prediction)
        && !ConverterUtility.isNaValue(prediction);
  }

  /**
   * Verifies that neither of two values are the global NA_VALUE
   *
   * @param valueA
   * @param valueB
   * @return True if both valueA and valueB are NOT the NA_VALUE; False otherwise
   */
  static boolean areValid(double valueA, double valueB) {
    return !ConverterUtility.isNaValue(valueA) && !ConverterUtility.isNaValue(valueB);
  }

  /**
   * Converts a value with units (1/radians) to a value with units (1/degrees)
   *
   * @param inverseRadians a value with units of 1/radians
   * @return the corresponding value with units of 1/degrees
   */
  public static double toInverseDegrees(double inverseRadians) {
    return toRadians(inverseRadians);
  }

  /**
   * Converts a time value with units of decimal seconds since January 1, 1970 into an Instant with
   * resolution of milliseconds
   *
   * @param seconds
   * @return
   */
  static Instant instantFromSeconds(double seconds) {
    return Instant.ofEpochMilli(millisFromSeconds(seconds));
  }

  /**
   * Converts a time range with units of decimal seconds into a Duration with resolution of
   * milliseconds
   *
   * @param seconds
   * @return
   */
  static Duration durationFromSeconds(double seconds) {
    return Duration.ofMillis(millisFromSeconds(seconds));
  }

  /**
   * Converts seconds into milliseconds, rounding up for decimal values {@literal >=} 0.5
   * milliseconds
   *
   * @param seconds
   * @return
   */
  private static long millisFromSeconds(double seconds) {
    return Math.round(seconds * ConverterUtility.MILLISECOND_FACTOR);
  }
}
