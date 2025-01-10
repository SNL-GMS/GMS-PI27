package gms.shared.signaldetection.manager;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import gms.shared.signaldetection.accessor.CannedSignalDetectionAccessor;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByIdsRequest;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.request.FilterDefinitionsForSignalDetectionsRequest;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import io.swagger.v3.oas.annotations.Operation;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(
    value = "/signal-detection",
    consumes = MediaType.APPLICATION_JSON_VALUE,
    produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
public class SignalDetectionManager {

  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;

  private final SignalDetectionAccessor signalDetectionAccessorImpl;
  private final CannedSignalDetectionAccessor cannedSignalDetectionAccessor;

  @Autowired
  public SignalDetectionManager(
      @Qualifier("bridgedSignalDetectionAccessor") SignalDetectionAccessor signalDetectionAccessorImpl,
      CannedSignalDetectionAccessor cannedSignalDetectionAccessor) {
    this.signalDetectionAccessorImpl = signalDetectionAccessorImpl;
    this.cannedSignalDetectionAccessor = cannedSignalDetectionAccessor;
  }

  /**
   * Retrieves {@link SignalDetectionsWithChannelSegments} based on the stations, time range, stage
   * id and excluded {@link SignalDetection}s in the request.
   *
   * @param request The {@link DetectionsWithSegmentsByStationsAndTimeRequest} defining the request
   *     parameters
   * @return The {@link SignalDetectionsWithChannelSegments} satisfying the request parameters
   */
  @PostMapping("/signal-detections-with-channel-segments/query/stations-timerange")
  @Operation(
      summary =
          "retrieves all signal detections and associated "
              + "with channel segments specified by the provided "
              + "stations, time range, stage, and excluding all signal detections having "
              + "any of the provided signal detection ids")
  public SignalDetectionsWithChannelSegments findDetectionsWithSegmentsByStationsAndTime(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description =
                  "A list of "
                      + "stations, a time range, stage id, and signal detection ids to exclude")
          @RequestBody
          DetectionsWithSegmentsByStationsAndTimeRequest request) {

    return signalDetectionAccessorImpl.findWithSegmentsByStationsAndTime(
        request.getStations(),
        request.getStartTime(),
        request.getEndTime(),
        request.getStageId(),
        request.getExcludedSignalDetections());
  }

  /**
   * Retrieves {@link SignalDetectionsWithChannelSegments} based on the SignalDetection uuids and
   * stage id in the request
   *
   * @param request The {@link DetectionsWithSegmentsByIdsRequest} defining the request parameters
   * @return The {@link SignalDetectionsWithChannelSegments} satisfying the request parameters
   */
  @PostMapping("/signal-detections-with-channel-segments/query/ids")
  @Operation(
      summary =
          "retrieves all signal detections and associated"
              + " with channel segments specified by the provided "
              + "signal detections ids and stage id")
  public SignalDetectionsWithChannelSegments findDetectionsWithSegmentsByIds(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "A list of signal detection" + " ids and a stage id")
          @RequestBody
          DetectionsWithSegmentsByIdsRequest request) {

    return signalDetectionAccessorImpl.findWithSegmentsByIds(
        request.getDetectionIds(), request.getStageId());
  }

  @PostMapping("/filter-definitions-by-usage/query/signal-detections/canned")
  @Operation(
      summary =
          "retrieves all filter definitions keyed by usage, "
              + "keyed additionally by the provided signal detection hypotheses")
  public Mono<ResponseEntity<FilterDefinitionByUsageBySignalDetectionHypothesis>>
      findCannedFilterDefinitionsForSignalDetections(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description =
                      "A list of signal detection hypotheses"
                          + " with an optional event hypothesis")
              @RequestBody
              FilterDefinitionsForSignalDetectionsRequest request) {
    return cannedSignalDetectionAccessor
        .findFilterDefinitionsForSignalDetections(
            request.getSignalDetections(), request.getStageId())
        .map(p -> ResponseEntity.status(HttpStatus.OK.value()).body(p.getLeft()))
        .onErrorMap(
            IllegalArgumentException.class::isInstance,
            err ->
                new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request propagated to resolve to invalid arguments",
                    err));
  }

  @PostMapping("/filter-definitions-by-usage/query/signal-detections")
  @Operation(
      summary =
          "retrieves all filter definitions keyed by usage, "
              + "keyed additionally by the provided signal detection hypotheses")
  public Mono<ResponseEntity<FilterDefinitionByUsageBySignalDetectionHypothesis>>
      findFilterDefinitionsForSignalDetections(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description =
                      "A list of signal detection hypotheses"
                          + " with an optional event hypothesis")
              @RequestBody
              FilterDefinitionsForSignalDetectionsRequest request) {

    return signalDetectionAccessorImpl
        .findFilterDefinitionsForSignalDetections(
            request.getSignalDetections(), request.getStageId())
        .map(
            (Pair<FilterDefinitionByUsageBySignalDetectionHypothesis, Boolean> pair) -> {
              var responseCode =
                  pair.getRight().booleanValue()
                      ? CUSTOM_PARTIAL_RESPONSE_CODE
                      : HttpStatus.OK.value();
              return ResponseEntity.status(responseCode).body(pair.getLeft());
            })
        .onErrorMap(
            IllegalArgumentException.class::isInstance,
            err ->
                new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request propagated to resolve to invalid arguments",
                    err));
  }
}
