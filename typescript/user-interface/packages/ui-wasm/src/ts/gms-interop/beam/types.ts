import type { FacetedTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import type { BeamDefinition } from '@gms/common-model/lib/beamforming-templates/types';
import type { ChannelSegment, ProcessingMask } from '@gms/common-model/lib/channel-segment';
import type { TaperDefinition } from '@gms/common-model/lib/processing-mask-definitions/types';
import type { RelativePosition } from '@gms/common-model/lib/station-definitions/channel-definitions';

/** Prop object for {@link maskAndBeamWaveforms} */
export interface MaskAndBeamWaveformProps {
  station:
    | StationTypes.Station
    | FacetedTypes.VersionReference<'name'>
    | FacetedTypes.EntityReference<'name', StationTypes.Station>;
  beamDefinition: BeamDefinition;
  channelSegments: ChannelSegment<WaveformTypes.Waveform>[];
  relativePositionsByChannel: Record<string, RelativePosition>;
  beamStartTime: number;
  beamEndTime: number;
  processingMasks: Record<string, ProcessingMask[]>;
  mediumVelocity?: number;
  taperDefinition?: TaperDefinition;
}
