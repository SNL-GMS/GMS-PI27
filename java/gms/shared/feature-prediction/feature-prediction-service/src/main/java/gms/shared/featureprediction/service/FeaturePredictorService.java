package gms.shared.featureprediction.service;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.featureprediction.framework.FeaturePredictor;
import gms.shared.featureprediction.request.PredictForLocationRequest;
import gms.shared.featureprediction.request.PredictForLocationSolutionAndChannelRequest;
import io.swagger.v3.oas.annotations.Operation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

/** Predict endpoint for FeaturePrediction results, */
@RestController
@RequestMapping(
    value = "/feature",
    consumes = MediaType.APPLICATION_JSON_VALUE,
    produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
public class FeaturePredictorService {

  private static final Logger LOGGER = LoggerFactory.getLogger(FeaturePredictorService.class);

  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;

  private static final String LOG_PREFIX = "FeaturePredictorService predict processing of ";

  private final FeaturePredictor featurePredictorUtility;

  public FeaturePredictorService(@Autowired FeaturePredictor predictor) {

    featurePredictorUtility = predictor;
  }

  @PostMapping(value = "/predict-for-location")
  @Operation(summary = "Predict using a location request")
  @ResponseBody
  public ResponseEntity<FeaturePredictionContainer> predict(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "PredictForLocationRequest request endpoint.")
          @RequestBody
          PredictForLocationRequest lrpRequest) {

    LOGGER.info(
        "FeaturePredictorService predict endpoint for " + "PredictForLocationRequest starting");

    // unpack the PredictForLocationRequest and call
    // featurePredictorUtility.predict
    var predictions =
        featurePredictorUtility.predict(
            lrpRequest.getPredictionTypes(),
            lrpRequest.getSourceLocation(),
            lrpRequest.getReceiverLocations(),
            lrpRequest.getPhases(),
            lrpRequest.getEarthModel(),
            lrpRequest.getCorrectionDefinitions());

    LOGGER.info(LOG_PREFIX + "PredictForLocationRequest complete");

    var responseCode =
        Boolean.TRUE.equals(predictions.getValue())
            ? CUSTOM_PARTIAL_RESPONSE_CODE
            : HttpStatus.OK.value();

    return ResponseEntity.status(responseCode).body(predictions.getKey());
  }

  @Operation(summary = "Predict using a location solution and channel request")
  @PostMapping(value = "/predict-for-location-solution-and-channel")
  public ResponseEntity<LocationSolution> predict(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "PredictForLocationSolutionAndChannelRequest request endpoint.")
          @RequestBody
          PredictForLocationSolutionAndChannelRequest lscRequest) {

    LOGGER.info(
        "FeaturePredictorService predict processing of PredictForLocationSolutionAndChannelRequest"
            + " starting");

    // unpack the PredictForLocationSolutionAndChannelRequest and call
    // featurePredictorUtility.predict
    var locationSolutionPair =
        featurePredictorUtility.predict(
            lscRequest.getPredictionTypes(),
            lscRequest.getSourceLocationSolution(),
            lscRequest.getReceivingChannels(),
            lscRequest.getPhases(),
            lscRequest.getEarthModel(),
            lscRequest.getCorrectionDefinitions());

    LOGGER.info(LOG_PREFIX + "PredictForLocationSolutionAndChannelRequest complete");

    var responseCode =
        Boolean.TRUE.equals(locationSolutionPair.getRight())
            ? CUSTOM_PARTIAL_RESPONSE_CODE
            : HttpStatus.OK.value();

    return ResponseEntity.status(responseCode).body(locationSolutionPair.getLeft());
  }
}
