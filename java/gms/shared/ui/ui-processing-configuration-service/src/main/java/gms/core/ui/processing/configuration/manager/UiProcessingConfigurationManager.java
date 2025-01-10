package gms.core.ui.processing.configuration.manager;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import com.fasterxml.jackson.databind.JsonNode;
import gms.core.ui.processing.configuration.ConfigQuery;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * UI Processing Configuration Spring Manager providing configuration access to the interactive
 * analysis components.
 */
@RestController
public class UiProcessingConfigurationManager {

  private final UiProccesingConfigurationHandler handler;

  @Autowired
  public UiProcessingConfigurationManager(
      ConfigurationConsumerUtility configurationConsumerUtility) {
    handler = new UiProccesingConfigurationHandler(configurationConsumerUtility);
  }

  /**
   * Resolve configuration for the provided query
   *
   * @param query Query to resolve for the given name and selectors
   * @return Resolved configuration field map
   */
  @PostMapping(
      value = "/resolve",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
  @Operation(description = "Resolves a configuration")
  public Map<String, Object> resolve(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "A query",
              required = true)
          @RequestBody
          ConfigQuery query) {

    return handler.resolve(query);
  }

  /**
   * Updates the backing configuration for this manager
   *
   * @return Empty JSON node to comply with expected no-value response behavior
   */
  @PostMapping(
      value = "/update",
      produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
  @Operation(description = "Updates the backing configuration")
  public ResponseEntity<JsonNode> update() {

    return handler.update();
  }
}
