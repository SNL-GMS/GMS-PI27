package gms.shared.workflow.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class WorkflowDefinitionIdTest {

  private static final WorkflowDefinitionId workflowId = WorkflowDefinitionId.from("AL1");
  private static final WorkflowDefinitionId workflowAL1 = WorkflowDefinitionId.from("AL1");
  private static final WorkflowDefinitionId workflowBefore = WorkflowDefinitionId.from("AL");
  private static final WorkflowDefinitionId workflowAfter = WorkflowDefinitionId.from("AL23");

  @Test
  void testWorkflowDefinitionIdCompareto() {
    assertEquals(0, workflowId.compareTo(workflowAL1));
    assertTrue(0 > workflowId.compareTo(workflowAfter));
    assertTrue(0 < workflowId.compareTo(workflowBefore));
  }
}
