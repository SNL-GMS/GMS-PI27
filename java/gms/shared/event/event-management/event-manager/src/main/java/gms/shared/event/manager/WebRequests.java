package gms.shared.event.manager;

import static java.lang.String.format;

import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.manager.config.EventConfigurationResolver;
import gms.shared.featureprediction.request.PredictForLocationRequest;
import gms.shared.featureprediction.request.PredictForLocationSolutionAndChannelRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.IOException;
import java.net.URI;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * A utility for constructing and sending a request to the {@link
 * gms.shared.event.coi.featureprediction.FeaturePrediction} service
 */
@Component
class WebRequests {

  private static final Logger LOGGER = LoggerFactory.getLogger(WebRequests.class);
  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;
  private static final int MAX_LEN_ERR_MSG = 100;

  private final WebClient webClient;
  private final URI predictForLocationUri;
  private final URI predictForLocationSolutionAndChannelUri;

  @Autowired
  WebRequests(
      EventConfigurationResolver eventManagerConfiguration, WebClient.Builder webClientBuilder) {
    this.predictForLocationUri = eventManagerConfiguration.resolvePredictForLocationUrl();
    this.predictForLocationSolutionAndChannelUri =
        eventManagerConfiguration.resolvePredictForLocationSolutionAndChannelUrl();
    this.webClient = webClientBuilder.build();
  }

  /**
   * Communicates with Feature Prediction Service
   *
   * @param predictForLocationSolutionAndChannelRequest {@link
   *     PredictForLocationSolutionAndChannelRequest} request body to sent to Feature Prediction
   *     Service
   * @return a Pair of{@link LocationSolution} processed by Feature Prediction Service and an
   *     Boolean indication partial results or not
   * @throws FeaturePredictionException When not able to communicate or parse data from Feature
   *     Prediction Service
   */
  Pair<Optional<LocationSolution>, Boolean> fpsWebRequestPredictForLocationSolutionAndChannel(
      PredictForLocationSolutionAndChannelRequest predictForLocationSolutionAndChannelRequest)
      throws FeaturePredictionException {

    var baseLogMsg =
        "Querying FeaturePredictorService endpoint " + predictForLocationSolutionAndChannelUri;
    if (LOGGER.isDebugEnabled()) {
      createPredictForLocationSolutionLogger(
          baseLogMsg, predictForLocationSolutionAndChannelRequest);
    } else {
      LOGGER.info(baseLogMsg);
    }

    var partialResult = new AtomicBoolean(false);
    var locationSolution =
        this.webClient
            .post()
            .uri(predictForLocationSolutionAndChannelUri)
            .bodyValue(predictForLocationSolutionAndChannelRequest)
            .exchangeToMono(response -> handleResponse(response, partialResult))
            .map(body -> readBody(body, LocationSolution.class))
            .blockOptional()
            .orElseThrow(
                () ->
                    new FeaturePredictionException(
                        "Unable to process empty response from FeaturePredictionService"));

    return Pair.of(locationSolution, partialResult.get());
  }

  Pair<Optional<FeaturePredictionContainer>, Boolean> fpsWebRequestPredictForLocation(
      PredictForLocationRequest predictForLocationRequest) throws FeaturePredictionException {

    var baseLogMsg = "Querying FeaturePredictorService endpoint " + predictForLocationUri;
    if (LOGGER.isDebugEnabled()) {
      createPredictForLocationLogger(baseLogMsg, predictForLocationRequest);
    } else {
      LOGGER.info(baseLogMsg);
    }

    var partialResult = new AtomicBoolean(false);
    var featurePredictionContainer =
        this.webClient
            .post()
            .uri(predictForLocationUri)
            .bodyValue(predictForLocationRequest)
            .exchangeToMono(response -> handleResponse(response, partialResult))
            .map(body -> readBody(body, FeaturePredictionContainer.class))
            .onErrorResume(
                FeaturePredictionException.class,
                (FeaturePredictionException e) -> {
                  LOGGER.warn(
                      "Caught FeaturePredictionException, unable to include those predictions in"
                          + " the response",
                      e);
                  return Mono.just(Optional.of(FeaturePredictionContainer.create(Set.of())));
                })
            .blockOptional()
            .orElseThrow(
                () ->
                    new FeaturePredictionException(
                        "Unable to process empty response from FeaturePredictionService"));

    return Pair.of(featurePredictionContainer, partialResult.get());
  }

  private static Mono<String> handleResponse(ClientResponse response, AtomicBoolean partialResult) {

    var statusCode = response.statusCode();
    final Mono<String> responseMono;

    if (statusCode.is4xxClientError()) {
      responseMono =
          Mono.error(
              new FeaturePredictionException("FeaturePredictionService failed with Client Error"));
    } else if (statusCode.is5xxServerError()) {
      responseMono =
          Mono.error(
              new FeaturePredictionException("FeaturePredictionService failed with Server Error"));

    } else if (response.statusCode().value() == CUSTOM_PARTIAL_RESPONSE_CODE) {
      partialResult.set(true);
      responseMono = response.bodyToMono(String.class);
    } else {
      responseMono = response.bodyToMono(String.class);
    }

    return responseMono;
  }

  private static <T> Optional<T> readBody(String jsonBody, Class<T> bodyType) {

    try {
      if (jsonBody.isEmpty() || jsonBody.isBlank()) {
        return Optional.empty();
      } else {
        return Optional.ofNullable(ObjectMappers.jsonReader().readValue(jsonBody, bodyType));
      }
    } catch (IOException e) {
      LOGGER.warn("Caught and dealt with JsonProcessingException", e);
      var trimmedBody =
          jsonBody.length() > MAX_LEN_ERR_MSG
              ? (jsonBody.substring(0, MAX_LEN_ERR_MSG) + "...")
              : jsonBody;
      var errorMessage =
          format("Unable to convert to %s [{%s}]", bodyType.getSimpleName(), trimmedBody);
      throw new FeaturePredictionException(errorMessage);
    }
  }

  private static void createPredictForLocationLogger(
      String baseLogMsg, PredictForLocationRequest predictForLocationRequest) {
    LOGGER.debug(
        "{} with request... "
            + "FeaturePredictionTypes: {}"
            + ", ReceiverLocations: {}"
            + ", SourceLocation: {}"
            + ", Phases: {}"
            + ", EarthModel: {}",
        baseLogMsg,
        predictForLocationRequest.getPredictionTypes(),
        predictForLocationRequest.getReceiverLocations(),
        predictForLocationRequest.getSourceLocation(),
        predictForLocationRequest.getPhases(),
        predictForLocationRequest.getEarthModel());
  }

  private static void createPredictForLocationSolutionLogger(
      String baseLogMsg,
      PredictForLocationSolutionAndChannelRequest predictForLocationSolutionAndChannelRequest) {
    LOGGER.debug(
        "{} with request... "
            + "FeaturePredictionTypes: {}"
            + ", Channels: {}"
            + ", Phases: {}"
            + ", EarthModel: {}"
            + ", EventLocation: {}",
        baseLogMsg,
        predictForLocationSolutionAndChannelRequest.getPredictionTypes(),
        predictForLocationSolutionAndChannelRequest.getReceivingChannels().stream()
            .map(Channel::getName)
            .collect(Collectors.toSet()),
        predictForLocationSolutionAndChannelRequest.getPhases(),
        predictForLocationSolutionAndChannelRequest.getEarthModel(),
        predictForLocationSolutionAndChannelRequest
            .getSourceLocationSolution()
            .getData()
            .orElseThrow()
            .getLocation());
  }
}
