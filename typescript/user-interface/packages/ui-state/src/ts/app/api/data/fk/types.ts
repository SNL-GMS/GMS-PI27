/**
 * Input type for Compute FK service call. This input
 * is compatible with the COI input i.e. start/end are strings
 */
import type {
  ChannelTypes,
  FkTypes,
  ProcessingMaskDefinitionTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';

import type { UiChannelSegment } from '../../../../types';
import type { AsyncFetchHistory } from '../../../query';

/**
 * Defines the history record type for the getChannelSegmentsByChannel query
 */
export type ComputeFkSpectraHistory = AsyncFetchHistory<FkTypes.FkInputWithConfiguration>;

/**
 * Arguments required for the ComputeFkSpectra operation
 */
export interface ComputeFkSpectraArgs {
  readonly fkSpectraDefinition: FkTypes.FkSpectraDefinition;
  readonly station: StationTypes.Station;
  readonly inputChannels: ChannelTypes.Channel[];
  readonly detectionTime: number;
  readonly startTime: number;
  readonly endTime: number;
  readonly uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
  readonly processingMasksByChannel: FkTypes.ProcessingMasksByChannel[];
  readonly maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined;
  readonly expandedTimeBufferSeconds: number;
}
