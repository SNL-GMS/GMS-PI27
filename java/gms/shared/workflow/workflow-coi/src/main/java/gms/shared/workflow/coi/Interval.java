package gms.shared.workflow.coi;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;

public interface Interval {

  IntervalId getIntervalId();

  @JsonIgnore
  default String getName() {
    return getIntervalId().getDefinitionId().getName();
  }

  IntervalStatus getStatus();

  @JsonIgnore
  default Instant getStartTime() {
    return getIntervalId().getStartTime();
  }

  Instant getEndTime();

  Instant getProcessingStartTime();

  Instant getProcessingEndTime();

  Instant getStorageTime();

  Instant getModificationTime();

  double getPercentAvailable();

  String getComment();

  @JsonIgnore
  default WorkflowDefinitionId getWorkflowDefinitionId() {
    return getIntervalId().getDefinitionId();
  }
}
