import type { InvalidChannelsError } from '../../validate-channels';
import { BeamformingError } from './beamforming-error';

export class BeamformingInvalidChannelsError extends BeamformingError {
  public readonly error: InvalidChannelsError;

  public constructor(error: InvalidChannelsError) {
    super(`Unexpected error: ${error.message}`, 'beamforming-invalid-channels');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.error = error;
  }
}
