import type { ChannelTypes } from '@gms/common-model';

import type { MaskAndBeamWaveformProps } from '../../../util/ui-beam-processor';
import { BeamformingError } from './beamforming-error';
import { BeamformingWithStationChannelsError } from './beamforming-with-station-channels-error';

export class BeamformingNoWaveformDataError extends BeamformingWithStationChannelsError {
  public readonly props: MaskAndBeamWaveformProps | undefined;

  public constructor(
    channels: ChannelTypes.Channel[],
    props: MaskAndBeamWaveformProps | undefined
  ) {
    super(
      `Cannot create beam. No valid waveforms found for beaming.`,
      undefined,
      channels,
      'beamforming-invalid-waveform-data'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.props = props;
  }
}
