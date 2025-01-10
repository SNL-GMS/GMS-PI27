import type { EventTypes } from '@gms/common-model';

import type { PredictFeatures } from '../../../api/data/event/predict-features-for-event-location';
import { BeamformingError } from './beamforming-error';

export class BeamformingFeaturePredictionsError extends BeamformingError {
  public readonly event: EventTypes.Event | undefined;

  public readonly eventHypothesis: EventTypes.EventHypothesis | undefined;

  public readonly featurePredictions: PredictFeatures | undefined;

  public constructor(
    event: EventTypes.Event | undefined,
    eventHypothesis: EventTypes.EventHypothesis | undefined,
    featurePredictions: PredictFeatures | undefined
  ) {
    super(
      `Cannot create beam. Feature Predictions not found.`,
      'beamforming-invalid-feature-predictions'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.event = event;
    this.eventHypothesis = eventHypothesis;
    this.featurePredictions = featurePredictions;
  }
}
