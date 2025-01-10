import { BeamformingError } from './beamforming-error';

export class BeamformingUnknownError extends BeamformingError {
  public readonly error: Error;

  public constructor(error: Error) {
    super(`Cannot create beam. Unexpected error: ${error.message}`, 'beamforming-unknown');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.error = error;
  }
}
