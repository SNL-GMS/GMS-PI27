package gms.shared.event.coi.featureprediction;

import com.fasterxml.jackson.annotation.JsonTypeName;
import gms.shared.event.coi.EventHypothesis;

/**
 * Represents corrections made to feature predictions based on event that has been located to a high
 * degree of certainty.
 *
 * @param masterEventHypothesis - the EventHypothesis where the preferred location solution is the
 *     location solution of such an event.
 */
@JsonTypeName("MASTER_EVENT_CORRECTION")
public record MasterEventCorrectionDefinition(EventHypothesis masterEventHypothesis)
    implements FeaturePredictionCorrectionDefinition {

  /** Returns the type of correction, which is MASTER_EVENT_CORRECTION. */
  @Override
  public FeaturePredictionComponentType getCorrectionType() {
    return FeaturePredictionComponentType.MASTER_EVENT_CORRECTION;
  }
}
