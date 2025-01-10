package gms.shared.signaldetection.api.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.workflow.coi.WorkflowDefinitionId;

@AutoValue
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class FilterDefinitionsForSignalDetectionsRequest implements Request {

  public abstract ImmutableList<SignalDetection> getSignalDetections();

  @JsonCreator
  public static FilterDefinitionsForSignalDetectionsRequest create(
      @JsonProperty("signalDetections") ImmutableList<SignalDetection> signalDetections,
      @JsonProperty("stageId") WorkflowDefinitionId stageId) {
    Preconditions.checkState(
        !signalDetections.isEmpty(),
        "FilterDefByUsageBySDHRequest requires at least 1 signal detection");

    return new AutoValue_FilterDefinitionsForSignalDetectionsRequest(stageId, signalDetections);
  }
}
