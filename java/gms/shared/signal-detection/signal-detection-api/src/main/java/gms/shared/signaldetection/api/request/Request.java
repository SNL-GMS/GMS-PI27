package gms.shared.signaldetection.api.request;

import gms.shared.workflow.coi.WorkflowDefinitionId;

/** Interface for Signal Detection requests */
public interface Request {
  WorkflowDefinitionId getStageId();
}
