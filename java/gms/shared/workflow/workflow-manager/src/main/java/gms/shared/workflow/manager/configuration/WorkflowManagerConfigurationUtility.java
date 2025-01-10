package gms.shared.workflow.manager.configuration;

import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.system.events.SystemEvent;
import gms.shared.workflow.coi.Stage;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinition;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import net.jodah.failsafe.RetryPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Utility component for managing Workflow processing configuration. */
@Component
public class WorkflowManagerConfigurationUtility {

  private static final int DELAY_SCALING = 10;

  static final String WORKFLOW_DEFINITION_CONFIG = "workflow-manager.workflow-definition";
  static final String STAGE_DEFINITION_CONFIG = "workflow-manager.stage-definition";
  static final String NAME_SELECTOR = "name";

  static final String BRIDGE_POLLING_PERIOD_CONFIG = "workflow-manager.bridge-polling-period";
  static final String BRIDGE_POLLING_PERIOD = "bridgePollingPeriod";

  static final String OPERATIONAL_TIME_PERIOD_CONFIG = "global.operational-time-period";
  static final String OPERATIONAL_PERIOD_START = "operationalPeriodStart";
  static final String OPERATIONAL_PERIOD_END = "operationalPeriodEnd";

  static final String SYSTEM_MESSAGE_EVENT_TYPE = "intervals";

  static final String RETRY_INITIAL_DELAY = "retry-initial-delay";
  static final String RETRY_DELAY_UNITS = "retry-delay-units";
  static final String MAX_RETRY_ATTEMPTS = "retry-max-attempts";

  final SystemConfig systemConfig;
  final ConfigurationConsumerUtility processingConfigUtil;

  @Autowired
  public WorkflowManagerConfigurationUtility(
      SystemConfig systemConfig, ConfigurationConsumerUtility configurationConsumerUtility) {
    this.systemConfig = systemConfig;
    this.processingConfigUtil = configurationConsumerUtility;
  }

  /**
   * Creates and returns a {@link Workflow} from a configured {@link WorkflowDefinition} and {@link
   * Stage}s
   *
   * @return A Workflow generated from configuration
   */
  public Workflow resolveWorkflowDefinition() {
    var workflowDefinition =
        processingConfigUtil.resolve(
            WORKFLOW_DEFINITION_CONFIG, List.of(), WorkflowDefinition.class);
    List<Stage> stages =
        workflowDefinition.getStageNames().stream()
            .map(
                stageName ->
                    processingConfigUtil.resolve(
                        STAGE_DEFINITION_CONFIG,
                        List.of(Selector.from(NAME_SELECTOR, stageName)),
                        Stage.class))
            .toList();

    return Workflow.from(workflowDefinition.getName(), stages);
  }

  /**
   * @return Operational start offset {@link Duration}
   */
  public Duration resolveOperationalStartPeriod() {
    var operationalTimeConfig =
        processingConfigUtil.resolve(OPERATIONAL_TIME_PERIOD_CONFIG, Collections.emptyList());
    return Duration.parse(operationalTimeConfig.get(OPERATIONAL_PERIOD_START).toString());
  }

  /**
   * @return Operational end offset {@link Duration}
   */
  public Duration resolveOperationalEndPeriod() {
    var operationalTimeConfig =
        processingConfigUtil.resolve(OPERATIONAL_TIME_PERIOD_CONFIG, Collections.emptyList());
    return Duration.parse(operationalTimeConfig.get(OPERATIONAL_PERIOD_END).toString());
  }

  public Duration resolveBridgePollingPeriod() {
    var bridgedPollingPeriodConfig =
        processingConfigUtil.resolve(BRIDGE_POLLING_PERIOD_CONFIG, List.of());
    return Duration.parse(bridgedPollingPeriodConfig.get(BRIDGE_POLLING_PERIOD).toString());
  }

  /**
   * @return Retry policy used for retrieving {@link StageInterval}s to populate the cache
   */
  public RetryPolicy<Map<String, List<StageInterval>>> resolveRetryPolicy() {
    var delayUnit = ChronoUnit.valueOf(systemConfig.getValue(RETRY_DELAY_UNITS));
    var initialDelay = systemConfig.getValueAsLong(RETRY_INITIAL_DELAY);
    var maxRetries = systemConfig.getValueAsInt(MAX_RETRY_ATTEMPTS);

    return new RetryPolicy<Map<String, List<StageInterval>>>()
        .withBackoff(initialDelay, initialDelay * DELAY_SCALING, delayUnit)
        .withMaxAttempts(maxRetries);
  }

  /**
   * @return Type of {@link SystemEvent} to send for workflow updates
   */
  public String getSystemMessageEventType() {
    return SYSTEM_MESSAGE_EVENT_TYPE;
  }
}
