import type { SignalDetectionTypes } from '@gms/common-model';

/**
 * Arguments to modify existing Signal Detection
 */
export interface UpdateSignalDetectionArrivalTimeArgs {
  readonly signalDetectionId: SignalDetectionTypes.SignalDetectionIdString;
  readonly arrivalTime: {
    readonly value: number;
    readonly uncertainty: number;
  };
}

/**
 * Arguments to delete a signal detection
 */
export interface DeleteSignalDetectionArgs {
  readonly signalDetectionIds: string[];
}
