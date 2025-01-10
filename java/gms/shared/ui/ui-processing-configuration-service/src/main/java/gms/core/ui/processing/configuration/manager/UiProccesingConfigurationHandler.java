package gms.core.ui.processing.configuration.manager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import gms.core.ui.processing.configuration.ConfigQuery;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.util.Map;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

public class UiProccesingConfigurationHandler {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(UiProccesingConfigurationHandler.class);

  private ConfigurationConsumerUtility configurationConsumerUtility;
  private final ReadWriteLock ccuUpdateLock;
  private final Lock writeLock;
  private final Lock readLock;

  UiProccesingConfigurationHandler(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.ccuUpdateLock = new ReentrantReadWriteLock();
    writeLock = ccuUpdateLock.writeLock();
    readLock = ccuUpdateLock.readLock();
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  Map<String, Object> resolve(ConfigQuery query) {
    readLock.lock();
    try {
      return configurationConsumerUtility.resolve(
          query.getConfigurationName(), query.getSelectors());
    } catch (Exception ex) {
      return Map.of();
    } finally {
      readLock.unlock();
    }
  }

  ResponseEntity<JsonNode> update() {
    writeLock.lock();
    try {
      this.configurationConsumerUtility = this.configurationConsumerUtility.toBuilder().build();

      return ResponseEntity.ok(JsonNodeFactory.instance.objectNode());
    } catch (Exception ex) {
      LOGGER.error("Failed to update configuration", ex);
      return ResponseEntity.internalServerError()
          .body(
              JsonNodeFactory.instance.textNode(
                  String.format("Failed to update configuration, Reason: %s", ex)));
    } finally {
      writeLock.unlock();
    }
  }
}
