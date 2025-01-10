package gms.shared.signalenhancement.coi.filter;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.workflow.coi.WorkflowDefinitionId;

@AutoValue
public abstract class WorkflowDefinitionIdStringPair {

  public abstract WorkflowDefinitionId getWorkflowDefinitionId();

  public abstract String getName();

  @JsonCreator
  public static WorkflowDefinitionIdStringPair create(
      @JsonProperty("workflowDefinitionId") WorkflowDefinitionId workflowDefinitionId,
      @JsonProperty("name") String name) {

    return new AutoValue_WorkflowDefinitionIdStringPair(workflowDefinitionId, name);
  }
}
