package gms.shared.signalenhancement.api.webclient;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectWriter;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForSignalDetectionHypothesesRequest;
import gms.shared.signalenhancement.api.webclient.config.SignalEnhancementConfigurationClientConfig;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.retry.Retry;

@ExtendWith(MockitoExtension.class)
class SignalEnhancementConfigurationClientTest {

  SignalEnhancementConfigurationClientTest() throws URISyntaxException {}

  private SignalEnhancementConfigurationClient secConfigClient;

  @Mock SignalEnhancementConfigurationClientConfig clientConfig;

  private final ExchangeFunction exchangeFunction = Mockito.mock(ExchangeFunction.class);

  private final WebClient webClient =
      WebClient.builder().exchangeFunction(exchangeFunction).build();

  private final String FD_BY_USER_FOR_SDHS_ROUTE =
      "/signal-enhancement-configuration-service/signal-enhancement-configuration/default-filter-definitions-for-signal-detection-hypotheses";
  private final URI FD_BY_USER_FOR_SDHS_URI =
      new URI("http://localhost:8080" + FD_BY_USER_FOR_SDHS_ROUTE);

  private final ObjectWriter jsonWriter = ObjectMappers.jsonWriter();

  @BeforeEach
  void setUp() {
    Mockito.when(clientConfig.filterDefsByUsageForSDHsUrl()).thenReturn(FD_BY_USER_FOR_SDHS_URI);
    Mockito.when(clientConfig.retrySpec()).thenReturn(Retry.backoff(1, Duration.ZERO));
    secConfigClient = new SignalEnhancementConfigurationClient(webClient.mutate(), clientConfig);
  }

  @Test
  void testFdByUsageForSDHsReturnsValidWhenSuccessful() throws JsonProcessingException {
    var expectedValue =
        FilterDefinitionByUsageBySignalDetectionHypothesis.from(Collections.emptyList());

    var response =
        ClientResponse.create(HttpStatus.OK)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .body(jsonWriter.writeValueAsString(expectedValue))
            .build();

    when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(response));

    var hypotheses =
        List.of(
            SignalDetectionHypothesis.createEntityReference(
                UUID.fromString("10000000-100-0000-1000-100000000055"),
                UUID.fromString("10000000-100-0000-1000-100000000056")));
    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setSignalDetectionsHypotheses(hypotheses)
            .build();

    StepVerifier.create(secConfigClient.queryDefaultFilterDefByUsageForSDHs(request))
        .expectNext(expectedValue)
        .verifyComplete();
  }

  @Test
  void testFdByUsageForSDHsNoRetryOnQuery4xx() {
    var status = HttpStatus.NOT_FOUND;
    var response =
        ClientResponse.create(status)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
            .body("NAH")
            .build();

    when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(response));

    var hypotheses =
        List.of(
            SignalDetectionHypothesis.createEntityReference(
                UUID.fromString("10000000-100-0000-1000-100000000057"),
                UUID.fromString("10000000-100-0000-1000-100000000058")));
    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setSignalDetectionsHypotheses(hypotheses)
            .build();

    StepVerifier.create(secConfigClient.queryDefaultFilterDefByUsageForSDHs(request))
        .verifyErrorMatches(
            error ->
                error instanceof WebClientResponseException
                    && ((WebClientResponseException) error).getStatusCode().equals(status));

    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }

  @Test
  void testFdByUsageForSDHsRetryOnQuery5xx() throws JsonProcessingException {
    var retries = 2;
    Mockito.when(clientConfig.retrySpec())
        .thenReturn(Retry.backoff(retries, Duration.ZERO).maxBackoff(Duration.ofNanos(1)));

    var failStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    var failResponse =
        ClientResponse.create(failStatus)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
            .body("OOPS")
            .build();

    var successValue =
        FilterDefinitionByUsageBySignalDetectionHypothesis.from(Collections.emptyList());
    var successResponse =
        ClientResponse.create(HttpStatus.OK)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .body(jsonWriter.writeValueAsString(successValue))
            .build();

    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(failResponse), Mono.just(failResponse), Mono.just(successResponse));

    var hypotheses =
        List.of(
            SignalDetectionHypothesis.createEntityReference(
                UUID.fromString("10000000-100-0000-1000-100000000059"),
                UUID.fromString("10000000-100-0000-1000-100000000060")));
    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setSignalDetectionsHypotheses(hypotheses)
            .build();

    StepVerifier.create(secConfigClient.queryDefaultFilterDefByUsageForSDHs(request))
        .expectNext(successValue)
        .verifyComplete();

    verify(exchangeFunction, times(retries + 1)).exchange(any(ClientRequest.class));
  }

  @Test
  void testFdByUsageForSDHsThrowsOnQueryBadResponse() {
    var status = HttpStatus.OK;
    var response =
        ClientResponse.create(status)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .body("STOP!!! CAN'T READ THIS")
            .build();

    when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(response));

    var hypotheses =
        List.of(
            SignalDetectionHypothesis.createEntityReference(
                UUID.fromString("10000000-100-0000-1000-100000000061"),
                UUID.fromString("10000000-100-0000-1000-100000000062")));
    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setSignalDetectionsHypotheses(hypotheses)
            .build();

    StepVerifier.create(secConfigClient.queryDefaultFilterDefByUsageForSDHs(request))
        .verifyErrorMatches(error -> error instanceof JsonProcessingException);
  }
}
