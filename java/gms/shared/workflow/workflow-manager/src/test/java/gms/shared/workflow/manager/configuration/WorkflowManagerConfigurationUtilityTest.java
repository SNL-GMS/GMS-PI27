package gms.shared.workflow.manager.configuration;

import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.BRIDGE_POLLING_PERIOD;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.BRIDGE_POLLING_PERIOD_CONFIG;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.MAX_RETRY_ATTEMPTS;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.NAME_SELECTOR;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.OPERATIONAL_PERIOD_END;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.OPERATIONAL_PERIOD_START;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.OPERATIONAL_TIME_PERIOD_CONFIG;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.RETRY_DELAY_UNITS;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.RETRY_INITIAL_DELAY;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.STAGE_DEFINITION_CONFIG;
import static gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility.WORKFLOW_DEFINITION_CONFIG;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;

import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.workflow.coi.AutomaticProcessingStage;
import gms.shared.workflow.coi.InteractiveAnalysisStage;
import gms.shared.workflow.coi.Stage;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinition;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import net.jodah.failsafe.RetryPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WorkflowManagerConfigurationUtilityTest {

  @Mock SystemConfig mockSystemConfig;

  @Mock ConfigurationConsumerUtility mockProcessingConfig;

  WorkflowManagerConfigurationUtility workflowManagerConfigUtil;

  @BeforeEach
  void setUp() {
    workflowManagerConfigUtil =
        new WorkflowManagerConfigurationUtility(mockSystemConfig, mockProcessingConfig);
  }

  @Test
  void testResolveWorkflowDefinition() {
    String workflowName = "TEST_WORKFLOW";
    Map<String, Stage> expectedStagesByName =
        Stream.of("AUTOMATIC_STAGE1", "INTERACTIVE_STAGE2", "AUTOMATIC_STAGE3")
            .collect(
                toMap(
                    identity(),
                    stageName ->
                        stageName.startsWith("AUTOMATIC")
                            ? AutomaticProcessingStage.from(stageName, Duration.ZERO, List.of())
                            : InteractiveAnalysisStage.from(stageName, Duration.ZERO, List.of())));

    given(
            mockProcessingConfig.resolve(
                WORKFLOW_DEFINITION_CONFIG, List.of(), WorkflowDefinition.class))
        .willReturn(WorkflowDefinition.from(workflowName, expectedStagesByName.keySet()));

    expectedStagesByName.forEach(
        (name, stage) ->
            given(
                    mockProcessingConfig.resolve(
                        STAGE_DEFINITION_CONFIG,
                        List.of(Selector.from(NAME_SELECTOR, name)),
                        Stage.class))
                .willReturn(stage));

    Workflow actualWorkflow = workflowManagerConfigUtil.resolveWorkflowDefinition();

    assertEquals(workflowName, actualWorkflow.getName());
    List<Stage> actualStages = actualWorkflow.getStages();
    assertEquals(expectedStagesByName.size(), actualStages.size());
    actualStages.forEach(
        stage -> {
          assertTrue(expectedStagesByName.containsKey(stage.getName()));
          assertEquals(expectedStagesByName.get(stage.getName()), stage);
        });
  }

  @Test
  void testResolveOperationalPeriod() {
    var testStart = Duration.ofSeconds(10);
    var testEnd = Duration.ofDays(10);
    given(mockProcessingConfig.resolve(OPERATIONAL_TIME_PERIOD_CONFIG, Collections.emptyList()))
        .willReturn(
            Map.of(
                OPERATIONAL_PERIOD_START, testStart.toString(),
                OPERATIONAL_PERIOD_END, testEnd.toString()));

    assertEquals(testStart, workflowManagerConfigUtil.resolveOperationalStartPeriod());
    assertEquals(testEnd, workflowManagerConfigUtil.resolveOperationalEndPeriod());
  }

  @Test
  void testResolveBridgePollingPeriod() {
    var testPeriod = Duration.ofHours(2);
    given(mockProcessingConfig.resolve(BRIDGE_POLLING_PERIOD_CONFIG, Collections.emptyList()))
        .willReturn(Map.of(BRIDGE_POLLING_PERIOD, testPeriod.toString()));
    assertEquals(testPeriod, workflowManagerConfigUtil.resolveBridgePollingPeriod());
  }

  @Test
  void testResolveRetryPolicy() {
    given(mockSystemConfig.getValue(RETRY_DELAY_UNITS)).willReturn(ChronoUnit.MILLIS.name());
    given(mockSystemConfig.getValueAsLong(RETRY_INITIAL_DELAY)).willReturn(5L);
    given(mockSystemConfig.getValueAsInt(MAX_RETRY_ATTEMPTS)).willReturn(3);

    var actualPolicy = workflowManagerConfigUtil.resolveRetryPolicy();
    assertThat(actualPolicy)
        .returns(Duration.ofMillis(5L), RetryPolicy::getDelay)
        .returns(Duration.ofMillis(50L), RetryPolicy::getMaxDelay)
        .returns(3, RetryPolicy::getMaxAttempts);
  }
}
