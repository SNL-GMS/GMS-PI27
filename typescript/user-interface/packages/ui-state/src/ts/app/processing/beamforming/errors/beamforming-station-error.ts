import { BeamformingError } from './beamforming-error';

export class BeamformingStationError extends BeamformingError {
  public readonly name: string;

  public constructor(name: string) {
    super('Cannot create beam. Could not find station.', 'beamforming-invalid-station');
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.name = name;
  }
}
