package gms.shared.event.analysis.relocation.service;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.StationDefinitionObject;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EventRelocationConfigurationResolver {
  private static final String PHASE_TYPE_SELECTOR = "phaseType";
  private static final String PREDICTOR_SELECTOR = "predictor";
  private static final String STATION_NAME_SELECTOR = "station";
  private static final String CHANNEL_NAME_SELECTOR = "channel";

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  private final String eventRelocationProcessingDefinitionConfig;

  private final String eventRelocationPredictorForPhaseConfig;

  private final String eventRelocationEarthModelForPredictorConfig;

  private final String eventRelocationDefiningFeatureMeasurementConfig;

  private record PredictorForPhase(String predictor) {}

  private record EarthModelForPredictor(String earthModel) {}

  /**
   * Construct an instance using a ConfigurationConsumerUtiltiy and config strings that point to the
   * location of configuration.
   *
   * <p>Note: More config strings will be added as configuration endpoints are implemeted.
   *
   * @param configurationConsumerUtility The CCU to use
   * @param eventRelocationProcessingDefinitionConfig The location of the
   *     EventRelocationProcessingDefinition configuration.
   * @param eventRelocationPredictorForPhaseConfig The location of the "predictor for phase"
   *     configuration.
   * @param eventRelocationEarthModelForPredictorConfig The location of the "earth model for
   *     predictor" configuration.
   * @param eventRelocationDefiningFeatureMeasurementConfig
   */
  @Autowired
  public EventRelocationConfigurationResolver(
      ConfigurationConsumerUtility configurationConsumerUtility,
      @Value("${eventRelocationProcessingDefinitionConfig}")
          String eventRelocationProcessingDefinitionConfig,
      @Value("${eventRelocationPredictorForPhaseConfig}")
          String eventRelocationPredictorForPhaseConfig,
      @Value("${eventRelocationEarthModelForPredictorConfig}")
          String eventRelocationEarthModelForPredictorConfig,
      @Value("${eventRelocationDefiningFeatureMeasurementConfig}")
          String eventRelocationDefiningFeatureMeasurementConfig) {
    this.configurationConsumerUtility = configurationConsumerUtility;
    this.eventRelocationProcessingDefinitionConfig = eventRelocationProcessingDefinitionConfig;
    this.eventRelocationPredictorForPhaseConfig = eventRelocationPredictorForPhaseConfig;
    this.eventRelocationEarthModelForPredictorConfig = eventRelocationEarthModelForPredictorConfig;
    this.eventRelocationDefiningFeatureMeasurementConfig =
        eventRelocationDefiningFeatureMeasurementConfig;
  }

  /**
   * Resolve the default EventRelocationProcessingDefinition from configuration.
   *
   * @return Resolved EventRelocationProcessingDefinition
   */
  public EventRelocationProcessingDefinition getDefaultEventRelocationProcessingDefinition() {
    return configurationConsumerUtility.resolve(
        eventRelocationProcessingDefinitionConfig,
        List.of(),
        EventRelocationProcessingDefinition.class);
  }

  /**
   * Resolved the {@link EventRelocationPredictorDefinition} associated with the provided {@link
   * PhaseType}
   *
   * @param phaseType the phaseType type to resolve configuration against
   * @return The configured predictor definition
   */
  public EventRelocationPredictorDefinition getEventRelocationPredictorDefinition(
      PhaseType phaseType) {
    return configurationConsumerUtility.resolve(
        eventRelocationPredictorForPhaseConfig,
        List.of(Selector.from(PHASE_TYPE_SELECTOR, String.valueOf(phaseType.getLabel()))),
        PredictorForPhase.class,
        predConfig ->
            new EventRelocationPredictorDefinition(
                predConfig.predictor(),
                configurationConsumerUtility
                    .resolve(
                        eventRelocationEarthModelForPredictorConfig,
                        List.of(Selector.from(PREDICTOR_SELECTOR, predConfig.predictor())),
                        EarthModelForPredictor.class)
                    .earthModel()));
  }

  /**
   * Resolved the {@link DefiningFeatureByFeatureMeasurementType} associated with the provided
   * {@link Channel} and {@link PhaseType}
   *
   * @param channel the channel to resolve configuration
   * @param phaseType the phaseType type to resolve configuration
   * @return The defining feature by feature measurement type
   */
  public DefiningFeatureByFeatureMeasurementType getDefaultDefiningFeatures(
      StationDefinitionObject channel, PhaseType phaseType) {

    var siteChanKey = StationDefinitionIdUtility.getCssKeyFromName(channel.getName());

    var stationSelector = Selector.from(STATION_NAME_SELECTOR, siteChanKey.getStationCode());
    var channelSelector = Selector.from(CHANNEL_NAME_SELECTOR, siteChanKey.getChannelCode());
    var phaseSelector = Selector.from(PHASE_TYPE_SELECTOR, phaseType.getLabel());

    return configurationConsumerUtility.resolve(
        eventRelocationDefiningFeatureMeasurementConfig,
        List.of(stationSelector, channelSelector, phaseSelector),
        DefiningFeatureByFeatureMeasurementType.class);
  }
}
