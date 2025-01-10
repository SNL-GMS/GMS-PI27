package gms.shared.signalenhancement.api.webclient;

import com.fasterxml.jackson.databind.ObjectReader;
import com.google.common.base.Preconditions;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForSignalDetectionHypothesesRequest;
import gms.shared.signalenhancement.api.webclient.config.SignalEnhancementConfigurationClientConfig;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

/** Creates a WebClient for {@link SignalEnhancementConfiguration} */
@Component
public class SignalEnhancementConfigurationClient {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalEnhancementConfigurationClient.class);

  private final WebClient.Builder clientBuilder;

  private final SignalEnhancementConfigurationClientConfig clientConfig;

  private final ObjectReader jsonReader = ObjectMappers.jsonReader();

  @Autowired
  public SignalEnhancementConfigurationClient(
      WebClient.Builder clientBuilder, SignalEnhancementConfigurationClientConfig config) {
    this.clientBuilder =
        clientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
    this.clientConfig = config;
  }

  /**
   * Queries the {@link SignalEnhancementConfiguration} endpoint with a request
   *
   * @param request the query request
   * @return the resulting Mono{@literal <}{@link
   *     FilterDefinitionByUsageBySignalDetectionHypothesis}>
   */
  public Mono<FilterDefinitionByUsageBySignalDetectionHypothesis>
      queryDefaultFilterDefByUsageForSDHs(
          FilterDefinitionByUsageForSignalDetectionHypothesesRequest request) {

    Preconditions.checkNotNull(request, "Cannot query service with null request");

    LOGGER.debug(
        "Querying SignalEnhancementConfiguration endpoint {} with request... {}",
        clientConfig.filterDefsByUsageForSDHsUrl(),
        request);

    return clientBuilder
        .build()
        .post()
        .uri(clientConfig.filterDefsByUsageForSDHsUrl())
        .accept(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .retrieve()
        // TODO: Determine why declaring an specific class type here throws
        // `UnsupportedMediaTypeException`
        .bodyToMono(String.class)
        .retryWhen(
            clientConfig
                .retrySpec()
                .doBeforeRetry(
                    retry ->
                        LOGGER.warn(
                            "Attempt to query for default filter definitions failed. Retrying...",
                            retry.failure()))
                .filter(
                    exception ->
                        !(exception instanceof WebClientResponseException wcre)
                            || !(wcre.getStatusCode().is4xxClientError())))
        .flatMap(
            (String bodyString) -> {
              try {
                return Mono.just(
                    jsonReader.readValue(
                        bodyString, FilterDefinitionByUsageBySignalDetectionHypothesis.class));
              } catch (IOException ex) {
                return Mono.error(ex);
              }
            });
  }
}
