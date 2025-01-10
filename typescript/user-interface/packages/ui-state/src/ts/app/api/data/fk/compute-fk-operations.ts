import type {
  ChannelSegmentTypes,
  ChannelTypes,
  FkTypes,
  ProcessingMaskDefinitionTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';

import type { UiChannelSegment } from '../../../../types';
import { computeFkApi, getPeakFkAttributesApi } from '../../../../workers/api';
import type { ComputeFkSpectraArgs } from './types';

interface ComputeFkParams {
  fkSpectraDefinition: FkTypes.FkSpectraDefinition;
  station: StationTypes.Station;
  inputChannels: ChannelTypes.Channel[];
  detectionTime: number;
  startTime: number;
  endTime: number;
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
  processingMasksByChannel: {
    channel: ChannelTypes.Channel;
    processingMasks: ChannelSegmentTypes.ProcessingMask[];
  }[];
  maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined;
  expandedTimeBufferSeconds: number;
}

export async function computeFk(
  params: ComputeFkParams
): Promise<ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectraCOI>> {
  const {
    fkSpectraDefinition,
    detectionTime,
    startTime,
    endTime,
    station,
    inputChannels,
    uiChannelSegments,
    processingMasksByChannel,
    maskTaperDefinition,
    expandedTimeBufferSeconds
  } = params;

  const computeFkSpectraArgs: ComputeFkSpectraArgs = {
    fkSpectraDefinition,
    station,
    inputChannels,
    detectionTime,
    startTime,
    endTime,
    uiChannelSegments,
    processingMasksByChannel,
    maskTaperDefinition,
    expandedTimeBufferSeconds
  };

  // Call FK worker
  return computeFkApi(computeFkSpectraArgs);
}

export async function getPeakFkAttributes(
  fkSpectra: FkTypes.FkSpectraCOI
): Promise<FkTypes.FkAttributes> {
  // Call FK worker
  return getPeakFkAttributesApi(fkSpectra);
}
