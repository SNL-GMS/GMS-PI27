package gms.shared.featureprediction.plugin.prediction;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.ElevationCorrectionDefinition;
import gms.shared.event.coi.featureprediction.EllipticityCorrectionDefinition;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionCorrectionDefinition;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.ArrivalTimeFeaturePredictionValue;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.featureprediction.plugin.api.FeaturePredictorPlugin;
import gms.shared.featureprediction.plugin.api.correction.ellipticity.EllipticityCorrectorPlugin;
import gms.shared.featureprediction.plugin.api.lookuptable.TravelTimeDepthDistanceLookupTablePlugin;
import gms.shared.featureprediction.plugin.correction.elevation.ElevationCorrector;
import gms.shared.featureprediction.utilities.math.EarthModelUtility;
import gms.shared.featureprediction.utilities.math.GeoMath;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.NotImplementedException;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.exception.InsufficientDataException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Service;

/**
 * Implementation of FeaturePredictorPlugin that uses bicubic spline interpolation to calculate
 * travel times.
 */
@Service
@ComponentScan(
    basePackages = {
      "gms.shared.featureprediction.plugin.lookuptable",
      "gms.shared.featureprediction.utilities.elevationcorrector",
      "gms.shared.featureprediction.plugin.correction.ellipticity'"
    })
public class BicubicSplineFeaturePredictor implements FeaturePredictorPlugin {

  private static final Logger LOGGER = LoggerFactory.getLogger(BicubicSplineFeaturePredictor.class);

  private static final int DF_DY = 3;

  private final BicubicSplineFeaturePredictorDefinition bicubicSplineFeaturePredictorDefinition;

  private final ElevationCorrector elevationCorrector;

  private final Map<String, EllipticityCorrectorPlugin> ellipticityCorrectorMap;

  private final Map<String, TravelTimeDepthDistanceLookupTablePlugin> travelTimeTableMap;

  @Autowired
  public BicubicSplineFeaturePredictor(
      BicubicSplineFeaturePredictorDefinition bicubicSplineFeaturePredictorDefinition,
      ElevationCorrector elevationCorrector,
      Map<String, EllipticityCorrectorPlugin> ellipticityCorrectorMap,
      Map<String, TravelTimeDepthDistanceLookupTablePlugin> travelTimeTableMap) {
    this.bicubicSplineFeaturePredictorDefinition = bicubicSplineFeaturePredictorDefinition;
    this.elevationCorrector = elevationCorrector;
    this.ellipticityCorrectorMap = Map.copyOf(ellipticityCorrectorMap);
    this.travelTimeTableMap = Map.copyOf(travelTimeTableMap);
  }

  /** Initialize our travel time lookup tables. */
  @Override
  public void initialize() {
    LOGGER.info("Initializing the BicubicSplineFeaturePredictor plugin");

    bicubicSplineFeaturePredictorDefinition
        .getTravelTimeDepthDistanceLookupTablePluginNameByEarthModel()
        .values()
        .forEach(
            pluginName ->
                Optional.ofNullable(travelTimeTableMap.get(pluginName))
                    .ifPresent(TravelTimeDepthDistanceLookupTablePlugin::initialize));

    bicubicSplineFeaturePredictorDefinition
        .getEllipticityCorrectorPluginNameByEllipticityCorrectionPluginType()
        .values()
        .forEach(
            pluginName ->
                Optional.ofNullable(ellipticityCorrectorMap.get(pluginName))
                    .ifPresent(EllipticityCorrectorPlugin::initialize));
  }

  /**
   * Calculate a feature prediction.Uses bicubic spline interpolation on the data tables.
   *
   * @param predictionType Which type of prediction to calculate.
   * @param sourceLocation The event location
   * @param receiverLocation The receiver location.
   * @param phaseType The phase to predict for.
   * @param earthModel The earth model to use.
   * @param correctionDefinitions List of corrections to use; each
   *     bicubicSplineFeaturePredictorDefinition contains correction-specific parameters.
   * @param <T> Class that will hold the feature prediction information. Must extend
   *     FeaturePredictionValue
   * @return A new feature prediction.
   */
  @Override
  public <T extends FeaturePredictionValue<?, ?, ?>> Optional<FeaturePrediction<T>> predict(
      FeaturePredictionType<T> predictionType,
      EventLocation sourceLocation,
      Location receiverLocation,
      PhaseType phaseType,
      String earthModel,
      List<FeaturePredictionCorrectionDefinition> correctionDefinitions) {

    LOGGER.info("BicubicSplineFeaturePredictor predict starting");

    var pluginName = getPluginName(earthModel);

    var travelTimePlugin =
        Optional.ofNullable(travelTimeTableMap.get(pluginName))
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "There is no FeaturePredictor travelTimePlugin for earth model "
                            + earthModel
                            + " (tried travelTimePlugin name "
                            + pluginName
                            + ")"));

    double[][] travelTimesAsDoubles;
    try {
      //
      // Do a try catch here so when the earth model is missing the phase
      // this can be caught properly and fed back to the user without crashing
      //
      travelTimesAsDoubles = getTravelTimesAsDoubles(travelTimePlugin, phaseType);
    } catch (IllegalArgumentException | EarthModelMissingPhaseTypeException e) {
      LOGGER.info(
          "No travel time files found for phase {} and earthmodel {} - "
              + "cannot predict arrival time",
          phaseType,
          earthModel);
      return Optional.empty();
    }

    var utility = getEarthModelUtility(travelTimePlugin, phaseType, travelTimesAsDoubles);

    double[] travelTimeAndDerivatives;

    try {
      //
      // Do a try catch here. Want the legacy code to just throw an exception
      // instead of returning an optional; we will create the empty optional
      // here.
      //
      travelTimeAndDerivatives =
          utility.interpolateEarthModel(
              sourceLocation.getDepthKm(),
              GeoMath.greatCircleAngularSeparation(
                  sourceLocation.getLatitudeDegrees(),
                  sourceLocation.getLongitudeDegrees(),
                  receiverLocation.getLatitudeDegrees(),
                  receiverLocation.getLongitudeDegrees()));
    } catch (InsufficientDataException | ArrayIndexOutOfBoundsException e) {
      LOGGER.info(
          "Interpolator threw an InsufficientDataException or "
              + "ArrayIndexOutOfBoundsException for phase {}, prediction "
              + "type {}, source location {}, reciever location {}"
              + "\nThis usually indicates that table data could not be extrapolated.",
          phaseType,
          predictionType,
          sourceLocation,
          receiverLocation);
      return Optional.empty();
    }

    return getOptionalPredictionByType(
        predictionType,
        Pair.of(sourceLocation, receiverLocation),
        phaseType,
        earthModel,
        correctionDefinitions,
        utility,
        travelTimeAndDerivatives);
  }

  private <T extends FeaturePredictionValue<?, ?, ?>>
      Optional<FeaturePrediction<T>> getOptionalPredictionByType(
          FeaturePredictionType<T> predictionType,
          Pair<EventLocation, Location> location,
          PhaseType phaseType,
          String earthModel,
          List<FeaturePredictionCorrectionDefinition> correctionDefinitions,
          EarthModelUtility utility,
          double[] travelTimeAndDerivatives) {

    FeaturePredictionValue<?, ?, ?> predictedValue = null;

    if (predictionType == FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE) {

      var basePredictedTravelTime = travelTimeAndDerivatives[0];
      if (!Double.isNaN(basePredictedTravelTime)) {
        var basePredictedTravelDuration = getPredictedTravelDuration(basePredictedTravelTime);

        var componentSet =
            getFeaturePredictionComponents(
                location.getLeft(),
                location.getRight(),
                phaseType,
                earthModel,
                travelTimeAndDerivatives,
                correctionDefinitions);

        var correctedTravelDuration =
            basePredictedTravelDuration.plus(
                componentSet.stream()
                    .map(component -> component.getValue().getValue())
                    .reduce(Duration.ZERO, Duration::plus));

        componentSet.add(
            FeaturePredictionComponent.from(
                DurationValue.from(basePredictedTravelDuration, null),
                utility.wasExtrapolated(),
                FeaturePredictionComponentType.BASEMODEL_PREDICTION));

        predictedValue =
            getPredictedValue(location.getLeft(), correctedTravelDuration, componentSet);
      }

    } else if (predictionType == FeaturePredictionType.SLOWNESS_PREDICTION_TYPE) {

      var slownessValue = travelTimeAndDerivatives[DF_DY];
      var doubleValue = DoubleValue.from(slownessValue, Optional.empty(), Units.SECONDS_PER_DEGREE);

      predictedValue =
          getNumericPredictedValue(
              doubleValue,
              FeatureMeasurementTypes.SLOWNESS,
              createPredictionComponents(doubleValue, utility));

    } else if (predictionType == FeaturePredictionType.SOURCE_TO_RECEIVER_AZIMUTH_PREDICTION_TYPE) {
      double azimuthVal = getSourceToReceiverAzimuthValue(location.getLeft(), location.getRight());
      var doubleValue = DoubleValue.from(azimuthVal, Optional.empty(), Units.DEGREES);

      predictedValue =
          getNumericPredictedValue(
              doubleValue,
              FeatureMeasurementTypes.SOURCE_TO_RECEIVER_AZIMUTH,
              createPredictionComponents(doubleValue, utility));
    } else if (predictionType == FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE) {
      double azimuthVal = getReceiverToSourceAzimuthValue(location.getRight(), location.getLeft());
      var doubleValue = DoubleValue.from(azimuthVal, Optional.empty(), Units.DEGREES);

      predictedValue =
          getNumericPredictedValue(
              doubleValue,
              FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
              createPredictionComponents(doubleValue, utility));
    } else {
      throw new NotImplementedException(
          "BicubicSplineFeaturePredictor is not implemented for " + predictionType);
    }

    return buildFeaturePredictionOptional(
        predictionType,
        location.getLeft(),
        location.getRight(),
        phaseType,
        utility,
        predictedValue);
  }

  private static <T extends FeaturePredictionValue<?, ?, ?>>
      Optional<FeaturePrediction<T>> buildFeaturePredictionOptional(
          FeaturePredictionType<T> predictionType,
          EventLocation sourceLocation,
          Location receiverLocation,
          PhaseType phaseType,
          EarthModelUtility utility,
          FeaturePredictionValue<?, ?, ?> predictedValue) {

    Optional<FeaturePrediction<T>> featurePredictionOptional = Optional.empty();

    if (predictedValue != null) {
      featurePredictionOptional =
          Optional.of(
              FeaturePrediction.<T>builder()
                  .setPredictionType(predictionType)
                  .noChannel()
                  .setExtrapolated(utility.wasExtrapolated())
                  .setPhase(phaseType)
                  .noPredictionChannelSegment()
                  .setPredictionValue(
                      predictionType
                          .getTypeValueClass()
                          .cast(predictionType.getTypeValueClass().cast(predictedValue)))
                  .setReceiverLocation(receiverLocation)
                  .setSourceLocation(sourceLocation)
                  .build());
    }

    return featurePredictionOptional;
  }

  /**
   * Get source to receiver azimuth value
   *
   * @param sourceLocation
   * @param receiverLocation
   * @return double azimuth
   */
  protected double getSourceToReceiverAzimuthValue(
      EventLocation sourceLocation, Location receiverLocation) {
    return GeoMath.azimuth(
        sourceLocation.getLatitudeDegrees(),
        sourceLocation.getLongitudeDegrees(),
        receiverLocation.getLatitudeDegrees(),
        receiverLocation.getLongitudeDegrees());
  }

  /**
   * Get receiver to source azimuth value
   *
   * @param receiverLocation
   * @param sourceLocation
   * @return double azimuth
   */
  protected double getReceiverToSourceAzimuthValue(
      Location receiverLocation, EventLocation sourceLocation) {
    return GeoMath.azimuth(
        receiverLocation.getLatitudeDegrees(),
        receiverLocation.getLongitudeDegrees(),
        sourceLocation.getLatitudeDegrees(),
        sourceLocation.getLongitudeDegrees());
  }

  /**
   * Create feature prediction components for predicted numeric values
   *
   * @param predictedValue {@link DoubleValue}
   * @param utility {@link EarthModelUtility}
   */
  private static Set<FeaturePredictionComponent<DoubleValue>> createPredictionComponents(
      DoubleValue predictedValue, EarthModelUtility utility) {
    var extrapolated = utility.wasExtrapolated();
    var featureComponentType = FeaturePredictionComponentType.BASEMODEL_PREDICTION;
    Set<FeaturePredictionComponent<DoubleValue>> predictionComponents = new HashSet<>();
    predictionComponents.add(
        FeaturePredictionComponent.from(predictedValue, extrapolated, featureComponentType));
    return predictionComponents;
  }

  private double[][] getTravelTimesAsDoubles(
      TravelTimeDepthDistanceLookupTablePlugin travelTimePlugin, PhaseType phaseType) {
    double[][] travelTimesAsDoubles;

    var values = travelTimePlugin.getValues(phaseType);
    if (values != null) {
      travelTimesAsDoubles =
          Arrays.stream(travelTimePlugin.getValues(phaseType).copyOf())
              .map(
                  durationArray ->
                      Arrays.stream(durationArray)
                          .mapToDouble(
                              duration ->
                                  Optional.ofNullable(duration)
                                      .map(d -> d.toNanos() / 1_000_000_000.0)
                                      .orElse(Double.NaN))
                          .toArray())
              .toArray(double[][]::new);

    } else {
      throw new EarthModelMissingPhaseTypeException();
    }

    return travelTimesAsDoubles;
  }

  /**
   * Get {@param ArrivalTimeFeaturePredictionValue} arrival predicted value
   *
   * @param sourceLocation {@link EventLocation}
   * @param correctedTravelDuration {@link Duration}
   * @param componentSet set of {@link FeaturePredictionComponent}
   * @return {@link ArrivalTimeFeaturePredictionValue}
   */
  private static ArrivalTimeFeaturePredictionValue getPredictedValue(
      EventLocation sourceLocation,
      Duration correctedTravelDuration,
      Set<FeaturePredictionComponent<DurationValue>> componentSet) {
    return ArrivalTimeFeaturePredictionValue.create(
        ArrivalTimeMeasurementValue.from(
            InstantValue.from(
                sourceLocation.getTime().plus(correctedTravelDuration), Duration.ZERO),
            Optional.of(DurationValue.from(correctedTravelDuration, Duration.ZERO))),
        Map.of(),
        componentSet);
  }

  /**
   * Get the {@link NumericFeaturePredictionValue} for the given predicted value
   *
   * @param predictedValue {@link DoubleValue}
   */
  private static NumericFeaturePredictionValue getNumericPredictedValue(
      DoubleValue predictedValue,
      FeatureMeasurementType<NumericMeasurementValue> featureMeasurementType,
      Set<FeaturePredictionComponent<DoubleValue>> componentSet) {

    var numericMeasureValue = NumericMeasurementValue.from(Optional.empty(), predictedValue);
    return NumericFeaturePredictionValue.from(
        featureMeasurementType, numericMeasureValue, Map.of(), componentSet);
  }

  private static Duration getPredictedTravelDuration(double basePredictedTravelTime) {
    return Duration.ofSeconds((long) Math.floor(basePredictedTravelTime))
        .plusNanos(
            (long)
                ((basePredictedTravelTime - Math.floor(basePredictedTravelTime)) * 1_000_000_000L));
  }

  private EarthModelUtility getEarthModelUtility(
      TravelTimeDepthDistanceLookupTablePlugin travelTimePlugin,
      PhaseType phaseType,
      double[][] travelTimesAsDoubles) {

    return new EarthModelUtility(
        travelTimePlugin.getDepthsKmForData(phaseType).toArray(),
        travelTimePlugin.getDistancesDegForData(phaseType).toArray(),
        travelTimesAsDoubles,
        bicubicSplineFeaturePredictorDefinition.isExtrapolate());
  }

  private String getPluginName(String earthModel) {
    return bicubicSplineFeaturePredictorDefinition
        .getTravelTimeDepthDistanceLookupTablePluginNameByEarthModel()
        .get(earthModel);
  }

  private Set<FeaturePredictionComponent<DurationValue>> getFeaturePredictionComponents(
      EventLocation sourceLocation,
      Location receiverLocation,
      PhaseType phaseType,
      String earthModel,
      double[] travelTimeAndDerivatives,
      List<FeaturePredictionCorrectionDefinition> correctionDefinitions) {

    return getStreamFeaturePredictionComponents(
            sourceLocation,
            receiverLocation,
            phaseType,
            earthModel,
            travelTimeAndDerivatives,
            correctionDefinitions)
        .flatMap(Optional::stream)
        .collect(Collectors.toSet());
  }

  private Stream<Optional<FeaturePredictionComponent<DurationValue>>>
      getStreamFeaturePredictionComponents(
          EventLocation sourceLocation,
          Location receiverLocation,
          PhaseType phaseType,
          String earthModel,
          double[] travelTimeAndDerivatives,
          List<FeaturePredictionCorrectionDefinition> correctionDefinitions) {

    return correctionDefinitions.stream()
        .map(
            (FeaturePredictionCorrectionDefinition definition) -> {
              switch (definition.getCorrectionType()) {
                case ELEVATION_CORRECTION:
                  return getElevationCorrectorFeatureComponent(
                      definition, receiverLocation, phaseType, travelTimeAndDerivatives);

                case ELLIPTICITY_CORRECTION:
                  return getEllipcityCorrectionFeatureComponent(
                      definition, sourceLocation, receiverLocation, phaseType, earthModel);

                default:
                  LOGGER.info(
                      "A correction is being asked for that is not implemented: {}",
                      definition.getCorrectionType());
                  return Optional.<FeaturePredictionComponent<DurationValue>>empty();
              }
            });
  }

  private Optional<FeaturePredictionComponent<DurationValue>>
      getEllipcityCorrectionFeatureComponent(
          FeaturePredictionCorrectionDefinition definition,
          EventLocation sourceLocation,
          Location receiverLocation,
          PhaseType phaseType,
          String earthModel) {

    return Optional.ofNullable(
            ellipticityCorrectorMap.get(
                this.bicubicSplineFeaturePredictorDefinition
                    .getEllipticityCorrectorPluginNameByEllipticityCorrectionPluginType()
                    .get(
                        ((EllipticityCorrectionDefinition) definition)
                            .getEllipticityCorrectionType())))
        .map(plugin -> plugin.correct(earthModel, sourceLocation, receiverLocation, phaseType))
        .flatMap(Function.identity());
  }

  private Optional<FeaturePredictionComponent<DurationValue>> getElevationCorrectorFeatureComponent(
      FeaturePredictionCorrectionDefinition definition,
      Location receiverLocation,
      PhaseType phaseType,
      double[] travelTimeAndDerivatives) {

    return elevationCorrector.correct(
        ((ElevationCorrectionDefinition) definition).getMediumVelocityEarthModel(),
        receiverLocation,
        // The third element is df/dy, travel time wrt distance
        travelTimeAndDerivatives[DF_DY],
        phaseType);
  }
}
