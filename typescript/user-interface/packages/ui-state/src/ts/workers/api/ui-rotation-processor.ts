import type { ChannelTypes, ProcessingMaskDefinitionTypes, WaveformTypes } from '@gms/common-model';
import type { ProcessingMask } from '@gms/common-model/lib/channel-segment';
import type { TimeRange } from '@gms/common-model/lib/common';
import type { RotationDefinition } from '@gms/common-model/lib/rotation/types';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';

import type { MaskAndRotate2dResult, UiChannelSegmentsPair } from '../../types';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

export const maskAndRotate2d = async (
  rotationDefinition: RotationDefinition,
  station: Station,
  channels: ChannelTypes.Channel[],
  uiChannelSegmentPair: UiChannelSegmentsPair<WaveformTypes.Waveform>,
  rotationTimeInterval: TimeRange,
  processingMasks: Record<string, ProcessingMask[]>,
  maskTaperDefinition?: ProcessingMaskDefinitionTypes.TaperDefinition
): Promise<MaskAndRotate2dResult[]> =>
  waveformWorkerRpc.rpc(WorkerOperations.MASK_AND_ROTATE_2D, {
    rotationDefinition,
    station,
    channels,
    uiChannelSegmentPair,
    rotationTimeInterval,
    processingMasks,
    maskTaperDefinition
  });
