package gms.shared.featureprediction.framework;

import com.google.common.base.Functions;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.FeaturePredictionCorrectionDefinition;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.featureprediction.configuration.FeaturePredictorDefinition;
import gms.shared.featureprediction.plugin.api.FeaturePredictorPlugin;
import gms.shared.featureprediction.plugin.api.InitializablePlugin;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.stereotype.Component;

/** Utility class for calculating feature predictions. */
@Component
@ComponentScan(
    basePackages = "gms.shared.featureprediction.plugin.featurepredictorplugin",
    includeFilters = {
      @ComponentScan.Filter(
          type = FilterType.ASSIGNABLE_TYPE,
          classes = {FeaturePredictorPlugin.class})
    })
public class FeaturePredictor {

  private static final Consumer<Object> NOOP = (Object any) -> {};

  private static final Logger LOGGER = LoggerFactory.getLogger(FeaturePredictor.class);

  private static final String LOG_PREFIX = "FeaturePredictor predict endpoint for ";

  private final FeaturePredictorDefinition definition;

  private final Map<String, FeaturePredictorPlugin> featurePredictorMap;

  @Autowired
  public FeaturePredictor(
      FeaturePredictorDefinition definition,
      Map<String, FeaturePredictorPlugin> featurePredictorMap) {
    this.definition = definition;
    this.featurePredictorMap = Map.copyOf(featurePredictorMap);
  }

  /** Initializes the feature predictor plugins. */
  @PostConstruct
  public void init() {
    // call init on all configured plugins

    definition.getPluginByPredictionTypeMap().getPluginNames().stream()
        .map(featurePredictorMap::get)
        .forEach(InitializablePlugin::initialize);
  }

  /**
   * Calculate some predictions. This version of the method takes pure location data.
   *
   * @param predictionTypes What types of predictions to calculate
   * @param sourceLocation The source location, or location of the event
   * @param receiverLocations Set of receiver locations
   * @param phaseTypes Which phases to predict for
   * @param earthModel Which model to use
   * @param featurePredictionCorrectionDefinitions List of correction definitions specifying which
   *     corrections to perform and how to perform them.
   * @return A set of feature prediction, wrapped in a FeaturePredictionContainer.
   */
  public Pair<FeaturePredictionContainer, Boolean> predict(
      List<FeaturePredictionType<?>> predictionTypes,
      EventLocation sourceLocation,
      List<Location> receiverLocations,
      List<PhaseType> phaseTypes,
      String earthModel,
      List<FeaturePredictionCorrectionDefinition> featurePredictionCorrectionDefinitions) {

    LOGGER.info(LOG_PREFIX + "PredictForLocationRequest starting");

    // Doing this the "non-streamy" way, because the "streamy" way creates a
    // List<FeaturePrediction<? capture of....  which will not work with
    // FeturePedictorContainer.create
    List<FeaturePrediction<?>> featurePredictionList = new ArrayList<>();

    // Collect list of Feature Predictor Plugins
    var optionalFeaturePredictionList =
        receiverLocations.stream()
            .map(
                receiverLocation ->
                    predictionTypes.stream()
                        .map(
                            predictionType ->
                                phaseTypes.stream()
                                    .map(
                                        phaseType ->
                                            getFeaturePredictionOptional(
                                                predictionType,
                                                sourceLocation,
                                                receiverLocation,
                                                phaseType,
                                                earthModel,
                                                featurePredictionCorrectionDefinitions))))
            .flatMap(Functions.identity())
            .flatMap(Functions.identity())
            .toList();

    // Determine if it is a partial response
    var isPartialResponse = optionalFeaturePredictionList.stream().anyMatch(Optional::isEmpty);

    // Add present Feature Prediction objects into a list
    optionalFeaturePredictionList.stream()
        .flatMap(Optional::stream)
        .forEach(featurePredictionList::add);

    LOGGER.info(LOG_PREFIX + "PredictForLocationRequest complete");

    return Pair.of(FeaturePredictionContainer.create(featurePredictionList), isPartialResponse);
  }

  /**
   * Calculates some feature predictions, that places them inside the provided LocationSolution
   * (that is, makes a copy of the LocationSolution with the new feature predictions added.)
   *
   * <p>If the provided LocationSolution already contains a FeaturePrediction where the prediction
   * type matches one of the provided prediction types AND the channel matches one of the provided
   * channels, no prediction is calculated for that type/channel combination. In other words,this
   * will only calculate predictions for prediction type/channel pairs that don't exist in the
   * location solution.
   *
   * @param predictionTypes What type of predictions to calculate
   * @param sourceLocationSolution The LocationSolution to update with new predictions. Contains the
   *     event location
   * @param receivingChannels The channels whose location to calculate the prediction for
   * @param phaseTypes Which phases to predict for
   * @param model Which Earth model to use
   * @param featurePredictionCorrectionDefinitions List of correction definitions specifying which
   *     corrections to perform and how to perform them.
   * @return A Pair of the copy of the sourceLocationSolution, updated with the new feature
   *     predictions, and a Boolean representing if partial results were found
   */
  public Pair<LocationSolution, Boolean> predict(
      List<FeaturePredictionType<?>> predictionTypes,
      LocationSolution sourceLocationSolution,
      List<Channel> receivingChannels,
      List<PhaseType> phaseTypes,
      String model,
      List<FeaturePredictionCorrectionDefinition> featurePredictionCorrectionDefinitions) {

    var partial = new AtomicBoolean(false);
    LOGGER.info(LOG_PREFIX + "PredictForLocationSolutionAndChannelRequest starting");
    //
    // Can't do anything if there is no data object in the LocationSolution,
    // because it has the event location.
    //
    var data =
        sourceLocationSolution
            .getData()
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "The source location solution " + "has no data object!"));

    var oldFeaturePredictionContainer = data.getFeaturePredictions();

    List<? extends FeaturePrediction<?>> featurePredictionList;

    var mapTypeEntryList =
        predictionTypes.stream()
            //
            // Create a stream of Map.entry(predictionType, channel). Map.entry
            // is just used for conveniene here, no map will  be created.
            //
            .map(
                predictionType ->
                    receivingChannels.stream().map(channel -> Map.entry(predictionType, channel)))
            // The above actually created a stream of streams, so flatmap it
            .flatMap(Functions.identity())
            //
            // If the source location solution already has a FeaturePrediction
            // with this predictionType/Channel pair, filter
            // the pair out so that we dont create a new feature prediction.
            //
            .filter(
                entry ->
                    !oldFeaturePredictionContainer.anyMatch(
                        featurePrediction ->
                            entry.getValue().equals(featurePrediction.getChannel().orElse(null))
                                && entry.getKey() == featurePrediction.getPredictionType()))
            .toList();

    if (mapTypeEntryList.isEmpty()) {
      featurePredictionList = List.of();
    } else {
      featurePredictionList =
          mapTypeEntryList.stream()
              .map(
                  entry ->
                      phaseTypes.stream()
                          .map(
                              (PhaseType pt) -> {
                                //
                                // For each phasetype, perform the actual feature prediction
                                // calculation.
                                //
                                var fp =
                                    getFeaturePredictionOptional(
                                            entry.getKey(),
                                            sourceLocationSolution.getData().get().getLocation(),
                                            entry.getValue().getLocation(),
                                            pt,
                                            model,
                                            featurePredictionCorrectionDefinitions)
                                        .map(
                                            featurePrediction ->
                                                featurePrediction.toBuilder()
                                                    .setChannel(entry.getValue())
                                                    .build());
                                fp.ifPresentOrElse(NOOP, () -> logEmpty(pt, model, partial));
                                return fp;
                              }))
              // Flatmap one more time, because by now we have combined three
              // seperate streams: predictionTypes, channels, phasetypes.
              .flatMap(Functions.identity())
              .flatMap(Optional::stream)
              .toList();
    }

    var newFeaturePredictionContainer =
        FeaturePredictionContainer.create((List<FeaturePrediction<?>>) featurePredictionList);

    var featurePredictionContainer =
        oldFeaturePredictionContainer.union(newFeaturePredictionContainer);

    var newData =
        LocationSolution.Data.builder()
            .setFeaturePredictions(featurePredictionContainer)
            .setLocation(data.getLocation())
            .setLocationRestraint(data.getLocationRestraint())
            .setLocationUncertainty(data.getLocationUncertainty().orElse(null))
            .setNetworkMagnitudeSolutions(data.getNetworkMagnitudeSolutions())
            .setLocationBehaviors(data.getLocationBehaviors())
            .build();

    var newLocationSolution =
        LocationSolution.builder().setId(sourceLocationSolution.getId()).setData(newData).build();

    LOGGER.info(LOG_PREFIX + "PredictForLocationSolutionAndChannelRequest complete");

    return Pair.of(newLocationSolution, partial.get());
  }

  private static void logEmpty(
      PhaseType phaseType, String earthModel, AtomicBoolean partialResponse) {
    LOGGER.info(
        "No travel time files found for phase {} and earthmodel {} - cannot predict arrival time",
        phaseType,
        earthModel);
    partialResponse.set(true);
  }

  private <T extends FeaturePredictionValue<?, ?, ?>>
      Optional<FeaturePrediction<T>> getFeaturePredictionOptional(
          FeaturePredictionType<T> predictionType,
          EventLocation sourceLocation,
          Location receiverLocation,
          PhaseType phaseType,
          String earthModel,
          List<FeaturePredictionCorrectionDefinition> featurePredictionCorrectionDefinitions) {

    return Optional.ofNullable(
            featurePredictorMap.get(definition.getPluginNameByType(predictionType)))
        .orElseThrow(
            () -> new IllegalArgumentException("No plugin configured for " + predictionType))
        .predict(
            predictionType,
            sourceLocation,
            receiverLocation,
            phaseType,
            earthModel,
            featurePredictionCorrectionDefinitions);
  }
}
