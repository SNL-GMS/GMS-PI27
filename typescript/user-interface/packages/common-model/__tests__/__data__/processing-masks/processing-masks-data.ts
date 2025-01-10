import type { ProcessingMask } from '../../../src/ts/channel-segment/types';
import { ProcessingOperation } from '../../../src/ts/channel-segment/types';
import { qcSegmentVersion } from '../qc-segment';
import { PD01Channel } from '../station-definitions';

export const pd01ProcessingMask: ProcessingMask = {
  id: 'processing mask',
  effectiveAt: 0,
  startTime: 100,
  endTime: 200,
  appliedToRawChannel: { name: PD01Channel.name },
  processingOperation: ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM,
  maskedQcSegmentVersions: [qcSegmentVersion]
};

export const pd01ProcessingMaskRecord: Record<string, ProcessingMask[]> = {
  [PD01Channel.name]: [pd01ProcessingMask]
};
