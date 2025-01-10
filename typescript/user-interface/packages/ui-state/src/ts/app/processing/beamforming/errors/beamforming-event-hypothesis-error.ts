import type { EventTypes } from '@gms/common-model';

import { BeamformingError } from './beamforming-error';

export class BeamformingEventHypothesisError extends BeamformingError {
  public readonly event: EventTypes.Event | undefined;

  public readonly eventHypothesis: EventTypes.EventHypothesis | undefined;

  public constructor(
    event: EventTypes.Event | undefined,
    eventHypothesis: EventTypes.EventHypothesis | undefined
  ) {
    super(
      `Cannot create beam. Event hypothesis not found.`,
      'beamforming-invalid-event-hypothesis'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.event = event;
    this.eventHypothesis = eventHypothesis;
  }
}
