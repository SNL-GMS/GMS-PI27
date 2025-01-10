package gms.shared.spring.utilities.advice;

import gms.shared.frameworks.configuration.repository.client.ConfigurationResolutionException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class ServiceEventHandler {

  private static final Logger LOGGER = LoggerFactory.getLogger(ServiceEventHandler.class);

  @ExceptionHandler(ConfigurationResolutionException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ResponseEntity<Map<String, String>> handle(ConfigurationResolutionException ex) {
    var logMessage = String.format("%s for context %s", ex.getMessage(), ex.getContext());
    LOGGER.error(logMessage, ex);

    var responseMessage = String.format("Configuration failure for context %s", ex.getContext());
    return ResponseEntity.internalServerError().body(Map.of("errorMessage", responseMessage));
  }
}
