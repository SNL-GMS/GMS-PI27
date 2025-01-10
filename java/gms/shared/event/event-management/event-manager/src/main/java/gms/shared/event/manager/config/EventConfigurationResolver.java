package gms.shared.event.manager.config;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Provides configuration utilities for the {@link gms.shared.event.manager.EventManager} */
@Component
public class EventConfigurationResolver {

  private static final String PREDICTIONS_FOR_LOCATION_SOLUTION_DEFINITION =
      "event-manager.predictions-for-location-solution-definition";
  private static final String PREDICT_FEATURES_FOR_LOCATION_DEFINITION =
      "event-manager.predict-features-for-location-definition";

  @Value("${featurePredictorService.hostname}")
  private String featurePredictionServiceHostname;

  @Value("${featurePredictorService.contextPath}")
  private String featurePredictionContextPath;

  @Value("${featurePredictorService.port:8080}")
  private long featurePredictionServicePort;

  @Value("${featurePredictorService.urlPaths.predictForLocation}")
  private String predictForLocationUrlPath;

  @Value("${featurePredictorService.urlPaths.predictForLocationSolutionAndChannel}")
  private String predictForLocationSolutionAndChannelUrlPath;

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  @Autowired
  public EventConfigurationResolver(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  public URI resolvePredictForLocationUrl() {
    var predictForLocationUrlString =
        String.format(
            "http://%s:%d%s%s",
            featurePredictionServiceHostname,
            featurePredictionServicePort,
            featurePredictionContextPath,
            predictForLocationUrlPath);
    try {
      return new URL(predictForLocationUrlString).toURI();
    } catch (MalformedURLException | URISyntaxException e) {
      throw new IllegalStateException(
          String.format("Configured URL %s is malformed", predictForLocationUrlString), e);
    }
  }

  public URI resolvePredictForLocationSolutionAndChannelUrl() {
    var predictForLocationSolutionAndChannelUrlString =
        String.format(
            "http://%s:%d%s%s",
            featurePredictionServiceHostname,
            featurePredictionServicePort,
            featurePredictionContextPath,
            predictForLocationSolutionAndChannelUrlPath);
    try {
      return new URL(predictForLocationSolutionAndChannelUrlString).toURI();
    } catch (MalformedURLException | URISyntaxException e) {
      throw new IllegalStateException(
          String.format(
              "Configured URL %s is malformed", predictForLocationSolutionAndChannelUrlString),
          e);
    }
  }

  public List<FeaturePredictionsDefinitions> resolvePredictionDefinitions() {

    return configurationConsumerUtility
        .resolve(
            PREDICTIONS_FOR_LOCATION_SOLUTION_DEFINITION,
            List.of(),
            FeaturePredictionDefinitionConfigurationOption.class)
        .getPredictionsForLocationSolutionDefinitions();
  }

  public List<FeaturePredictionsDefinitions> resolvePredictionDefinitions(
      String stationName, String channelName, PhaseType phaseType, double distance) {
    var stationNameSelector = Selector.from("stationName", stationName);
    var channelNameSelector = Selector.from("channelName", channelName);
    var phaseTypeSelector = Selector.from("phaseType", phaseType.toString());
    var distanceSelector = Selector.from("distance", distance);

    return configurationConsumerUtility
        .resolve(
            PREDICTIONS_FOR_LOCATION_SOLUTION_DEFINITION,
            List.of(stationNameSelector, channelNameSelector, phaseTypeSelector, distanceSelector),
            FeaturePredictionDefinitionConfigurationOption.class)
        .getPredictionsForLocationSolutionDefinitions();
  }

  public List<FeaturePredictionsDefinitions> resolvePredictionDefinitions(
      PhaseType phaseType,
      double distance,
      Optional<ChannelDataType> receiverDataType,
      Optional<ChannelBandType> receiverBandType) {

    var selectors = new ArrayList<Selector<?>>();

    selectors.add(Selector.from("phaseType", phaseType.toString()));
    selectors.add(Selector.from("distance", distance));

    receiverDataType.ifPresent(
        dt -> selectors.add(Selector.from("receiverDataType", dt.toString())));
    receiverBandType.ifPresent(
        bt -> selectors.add(Selector.from("receiverBandType", bt.toString())));

    return configurationConsumerUtility
        .resolve(
            PREDICT_FEATURES_FOR_LOCATION_DEFINITION,
            selectors,
            FeaturePredictionDefinitionConfigurationOption.class)
        .getPredictionsForLocationSolutionDefinitions();
  }
}
