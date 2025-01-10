import type { NonIdealStateDefinition } from '@gms/ui-core-components';
import { nonIdealStateWithNoSpinner, nonIdealStateWithSpinner } from '@gms/ui-core-components';
import type { SignalDetectionFetchResult } from '@gms/ui-state';

import type { SignalDetectionsPanelProps } from './signal-detections-panel';
import type { SignalDetectionsTableProps } from './types';

/**
 * Non ideal state definitions for signal detections table
 */
export const signalDetectionTableNonIdealStates: NonIdealStateDefinition<SignalDetectionsTableProps>[] =
  [
    {
      condition: (SignalDetectionsTableProps): boolean => {
        return (
          !SignalDetectionsTableProps.signalDetectionResults.isLoading &&
          !SignalDetectionsTableProps.signalDetectionResults.isError &&
          SignalDetectionsTableProps.signalDetectionResults.data?.length === 0 &&
          !SignalDetectionsTableProps.isSynced
        );
      },
      element: nonIdealStateWithNoSpinner(
        'No Data',
        'No signal detection data available for this interval',
        'exclude-row'
      )
    },
    {
      condition: (SignalDetectionsTableProps): boolean => {
        return (
          !SignalDetectionsTableProps.signalDetectionResults.isLoading &&
          !SignalDetectionsTableProps.signalDetectionResults.isError &&
          SignalDetectionsTableProps.signalDetectionResults.data?.length === 0 &&
          SignalDetectionsTableProps.isSynced
        );
      },
      element: nonIdealStateWithNoSpinner(
        'No Data',
        'No signal detections found in the synced time range',
        'exclude-row'
      )
    }
  ];

export const signalDetectionPanelNonIdealStates: NonIdealStateDefinition<SignalDetectionsPanelProps>[] =
  [
    // Only need to check loading.  Error is handled in the shared non-ideal state
    {
      condition: (props: { signalDetectionResults: SignalDetectionFetchResult }): boolean => {
        return props.signalDetectionResults.isLoading;
      },
      element: nonIdealStateWithSpinner('Loading', 'Signal detections')
    }
  ];
