import type { DataState } from '../api';
import type { AppStateKeys } from '../store';
import type { EventAndSignalDetectionKeys } from './history-slice';

/** the maximum number of history entires undo/redo */
export const maxHistory = 500;

/** the unique key for the app state */
export const appKey: AppStateKeys = 'app' as const;

/** the unique key for the events state for the data slice */
export const eventsKey: EventAndSignalDetectionKeys = 'events' as const;

/** the unique key for the signal detections state for the data slice */
export const signalDetectionsKey: EventAndSignalDetectionKeys = 'signalDetections' as const;

/**
 * the unique keys for for any associated data related to to signal detections and events of the data slice
 * ! assumes that the keys refer to true Record type objects; other object types will
 * ! require additional logic for capturing undo/redo changes properly and efficiently
 */
export const additionalEventAndSignalDetectionDataKeys: (keyof Pick<
  Omit<DataState, typeof eventsKey | typeof signalDetectionsKey>,
  'uiChannelSegments' | 'eventBeams'
>)[] = ['uiChannelSegments', 'eventBeams'] as const;
