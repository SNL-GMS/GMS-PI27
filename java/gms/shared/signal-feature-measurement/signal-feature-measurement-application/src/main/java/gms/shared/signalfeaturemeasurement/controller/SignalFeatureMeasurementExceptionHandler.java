package gms.shared.signalfeaturemeasurement.controller;

import gms.shared.frameworks.configuration.repository.client.ConfigurationResolutionException;
import gms.shared.frameworks.service.InvalidInputException;
import java.util.Map;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.client.HttpServerErrorException;

/**
 * Provides utilities for handling exceptions encountered with incoming requests. Called internally
 * by Spring
 */
@ControllerAdvice
public class SignalFeatureMeasurementExceptionHandler {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalFeatureMeasurementExceptionHandler.class);
  private static final String BASE_ERROR_MSG = "Exception occurred: {}";
  public static final String INPUT_ERROR_MSG =
      "Could not parse request, check your inputs and try again";
  public static final String ERROR_MSG_KEY = "errorMessage";
  public static final String ERROR_INFO_KEY = "errorInformation";

  @ExceptionHandler(InvalidInputException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<Map<String, String>> handle(InvalidInputException ex) {
    var errorMessage = ex.getMessage();

    LOGGER.warn("InvalidInputException occurred: {}", errorMessage, ex);
    return ResponseEntity.badRequest()
        .body(Map.of(SignalFeatureMeasurementExceptionHandler.ERROR_MSG_KEY, errorMessage));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<Map<String, String>> handle(HttpMessageNotReadableException ex) {
    var regexString = ".+?(?=; nested)";
    var simpleErrorRegex = Pattern.compile(regexString);
    var matcher =
        ex.getLocalizedMessage() != null
            ? simpleErrorRegex.matcher(ex.getLocalizedMessage())
            : null;
    var errorMessage = matcher != null && matcher.find() ? matcher.group(0) : INPUT_ERROR_MSG;

    LOGGER.warn(BASE_ERROR_MSG, errorMessage, ex);
    return ResponseEntity.badRequest().body(Map.of(ERROR_MSG_KEY, errorMessage));
  }

  @ExceptionHandler(HttpServerErrorException.InternalServerError.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ResponseEntity<Map<String, String>> handle(
      HttpServerErrorException.InternalServerError ex) {
    LOGGER.warn(BASE_ERROR_MSG, ex);
    return constructGeneralError();
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handle(IllegalArgumentException ex) {
    LOGGER.warn(BASE_ERROR_MSG, ex);
    return constructGeneralError();
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, String>> handle(RuntimeException ex) {
    LOGGER.warn(BASE_ERROR_MSG, ex);
    return constructGeneralError();
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, String>> handle(IllegalStateException ex) {
    LOGGER.warn(BASE_ERROR_MSG, ex);
    return constructGeneralError();
  }

  private static ResponseEntity<Map<String, String>> constructGeneralError() {
    var errorMessage = "Internal error occurred while processing request";
    return ResponseEntity.internalServerError().body(Map.of(ERROR_MSG_KEY, errorMessage));
  }

  @ExceptionHandler(ConfigurationResolutionException.class)
  public ResponseEntity<Map<String, String>> handle(ConfigurationResolutionException ex) {
    LOGGER.warn(BASE_ERROR_MSG, ex);
    var errorMessage = "Error occured processing configuration request";
    return ResponseEntity.internalServerError().body(Map.of(ERROR_MSG_KEY, errorMessage));
  }
}
