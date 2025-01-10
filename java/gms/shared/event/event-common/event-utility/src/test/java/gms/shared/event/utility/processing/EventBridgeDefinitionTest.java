package gms.shared.event.utility.processing;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EventBridgeDefinitionTest {

  @Test
  void testEventBridgeDefinitionBuilder() {

    var monitoringOrganization = "MonitoringOrganization";

    var stageOne = WorkflowDefinitionId.from("StageOne");
    var stageOneAccount = "StageOneAccount";

    var stageTwo = WorkflowDefinitionId.from("StageTwo");
    var stageTwoAccount = "StageTwoAccount";

    var orderedStages = List.of(stageOne, stageTwo);

    var databaseAccountsByStage =
        Map.of(
            stageOne, stageOneAccount,
            stageTwo, stageTwoAccount);

    var previousDatabaseAccountsByStage = Map.of(stageTwo, stageOneAccount);

    var eventBridgeDefinition =
        EventBridgeDefinition.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setOrderedStages(orderedStages)
            .setDatabaseUrlByStage(databaseAccountsByStage)
            .setPreviousDatabaseUrlByStage(previousDatabaseAccountsByStage)
            .build();

    assertEquals(monitoringOrganization, eventBridgeDefinition.getMonitoringOrganization());
    assertEquals(orderedStages, eventBridgeDefinition.getOrderedStages());
    assertEquals(databaseAccountsByStage, eventBridgeDefinition.getDatabaseUrlByStage());
    assertEquals(
        previousDatabaseAccountsByStage, eventBridgeDefinition.getPreviousDatabaseUrlByStage());
  }
}
