import type { Row } from '@gms/ui-core-components';

/**
 * Interface that describes the QC Mask history information.
 */
export interface QcMaskHistoryRow extends Row {
  author: string;
  category: string;
  type: string;
  startTime: number;
  channelName: string[];
  endTime: number;
  rationale: string;
  effectiveAt: number;
  rejected: string;
}
