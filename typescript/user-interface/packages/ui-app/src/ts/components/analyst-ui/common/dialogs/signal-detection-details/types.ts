import type { SignalDetectionTypes } from '@gms/common-model';
import type { Row } from '@gms/ui-core-components';

/**
 * SignalDetectionDetails Props
 */
export interface SignalDetectionDetailsProps {
  signalDetection: SignalDetectionTypes.SignalDetection;
}

export interface SignalDetectionDetailsData {
  signalDetection: SignalDetectionTypes.SignalDetection;
  color: string;
  assocStatus: string;
  swatchTooltipText: string;
}

/**
 * Interface that describes the Detection history
 * information.
 */
export interface SignalDetectionHistoryRow extends Row {
  id: string;
  versionId: string;
  creationTimestamp: number;
  phase: string;
  arrivalTimeMeasurementFeatureType: string;
  arrivalTimeMeasurementTimestamp: number;
  arrivalTimeMeasurementUncertaintySec: number;
  channelSegmentType: string;
  authorName: string;
  deleted: string;
}
