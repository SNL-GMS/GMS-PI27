package gms.shared.workflow.coi;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;

/** A class representing a workflow definition Id. For example, AL1 or AL2. */
@AutoValue
@JsonSerialize(as = WorkflowDefinitionId.class)
public abstract class WorkflowDefinitionId implements Comparable<WorkflowDefinitionId> {

  public abstract String getName();

  /**
   * Creates and returns a new {@link WorkflowDefinitionId}
   *
   * @param name The workflow Definition Id name (e.g., "AL1", "AL2")
   * @return A new WorkflowDefinitionId
   */
  @JsonCreator
  public static WorkflowDefinitionId from(@JsonProperty("name") String name) {
    return new AutoValue_WorkflowDefinitionId(name);
  }

  @Override
  public int compareTo(WorkflowDefinitionId workflowDefinitionId) {
    return this.getName().compareTo(workflowDefinitionId.getName());
  }
}
