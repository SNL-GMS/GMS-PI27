import type { MaskAndBeamWaveformProps } from './types';

export class MaskAndBeamError extends Error {
  public readonly id: string;

  public readonly props: MaskAndBeamWaveformProps;

  public constructor(message: string, props: MaskAndBeamWaveformProps) {
    super(message);
    Object.setPrototypeOf(this, MaskAndBeamError.prototype);
    this.id = 'mask-and-beam-algorithm-error';
    this.props = props;
  }
}
