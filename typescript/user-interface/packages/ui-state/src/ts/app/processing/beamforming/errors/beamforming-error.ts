import type { BeamformingErrorCodes } from './beamforming-error-codes';

export class BeamformingError extends Error {
  public readonly id: BeamformingErrorCodes;

  public constructor(message: string, id: BeamformingErrorCodes = 'beamforming-error') {
    super(message);
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.id = id;
  }
}
