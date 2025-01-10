import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { Draft } from 'immer';

import type { QcSegmentRecord } from '../../../../types';

/**
 * Mutates, applies a qc segment result to an existing qc segment record.
 * ! Mutates the draft in place
 *
 * @param draft the Immer writable qc segment record draft
 * @param channelName the unique channel name to associate to qc segment records
 * @param uiChannelSegment the qc segment to add/update
 */
const mutateQcSegment = (
  draft: Draft<QcSegmentRecord>,
  channelName: string,
  qcSegment: QcSegment
): void => {
  if (channelName && qcSegment) {
    const segmentId = qcSegment.id;
    if (segmentId) {
      // If haven't seen the channel
      if (!draft[channelName]) {
        draft[channelName] = {};
      }

      draft[channelName][qcSegment.id] = qcSegment;
    }
  }
};

/**
 * Builds an immer recipe to apply qc segment results to qc segment record.
 *
 * @param channelName the unique channel name to associate to channel segment records
 * @param uiChannelSegments the qc segments to add/update
 * @returns Immer produce function
 */
export const createRecipeToMutateQcSegmentsRecord = (
  channelName: string,
  qcSegments: QcSegment[]
): ((draft: Draft<QcSegmentRecord>) => void) => {
  return (draft: Draft<Draft<QcSegmentRecord>>) => {
    if (channelName && qcSegments) {
      qcSegments.forEach(qcSegment => {
        mutateQcSegment(draft, channelName, qcSegment);
      });
    }
  };
};
