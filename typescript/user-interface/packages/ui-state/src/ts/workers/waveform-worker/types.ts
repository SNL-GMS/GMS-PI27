import type { ChannelTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import type { BeamDefinition } from '@gms/common-model/lib/beamforming-templates/types';
import type { ProcessingMask, TimeRangesByChannel } from '@gms/common-model/lib/channel-segment';
import type { TimeRange } from '@gms/common-model/lib/common';
import type { AxiosRequestConfig } from 'axios';

import type { GetChannelSegmentsByChannelQueryArgs } from '../../app/api/data/waveform/get-channel-segments-by-channel';
import type { UiChannelSegment } from '../../types';

/**
 * The colors to use when building the weavess channel segments
 */
export interface ChannelSegmentColorOptions {
  waveformColor: string;
  labelTextColor: string;
}

export interface AmplitudeBounds {
  amplitudeMax: number;
  amplitudeMin: number;
  amplitudeTotal?: number;
  totalSamplesCount?: number;
  amplitudeMaxSecs?: number;
  amplitudeMinSecs?: number;
}

/**
 * An axios request known to have a waveform query request in its data.
 */
export type WaveformAxiosRequestConfig = AxiosRequestConfig & {
  data: GetChannelSegmentsByChannelQueryArgs;
};

// Props for the ui-beam-processor maskAndBeamWaveforms operation
export interface MaskAndBeamWaveformWorkerProps {
  beamDefinition: BeamDefinition;
  beamStartTime: number;
  beamEndTime: number;
  station: StationTypes.Station;
  filteredChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
  processingMasksByChannel: {
    channel: ChannelTypes.Channel;
    processingMasks: ProcessingMask[];
  }[];
  currentInterval: TimeRange;
  missingInputChannels: TimeRangesByChannel[];
}

export interface MaskAndBeamWaveformResult {
  channel: ChannelTypes.Channel;
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>;
}
