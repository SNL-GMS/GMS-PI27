import { IanDisplays } from '@gms/common-model/lib/displays/types';
import {
  selectDisplaySignalDetectionConfiguration,
  selectWorkflowTimeRange,
  useAppSelector
} from '@gms/ui-state';
import React from 'react';

import { BaseDisplay } from '~common-ui/components/base-display';

import { useVisibleSignalDetections, useWaveformStations } from '../waveform/waveform-hooks';
import { SignalDetectionsPanel } from './signal-detections-panel';
import type { SignalDetectionsComponentProps } from './types';

/**
 * IAN signal detections component.
 */
function IANSignalDetectionsComponent(props: SignalDetectionsComponentProps) {
  const { glContainer } = props;

  const timeRange = useAppSelector(selectWorkflowTimeRange);

  // A dependency of signal detections so we need it for non-ideal state
  const stationsQuery = useWaveformStations();

  const isSynced = useAppSelector(selectDisplaySignalDetectionConfiguration).syncWaveform;
  const signalDetectionResults = useVisibleSignalDetections(isSynced);

  return (
    <BaseDisplay
      glContainer={glContainer}
      tabName={IanDisplays.SIGNAL_DETECTIONS}
      className="ian-signal-detections-gl-container"
      data-cy="ian-signal-detections-container"
    >
      <SignalDetectionsPanel
        timeRange={timeRange}
        signalDetectionResults={signalDetectionResults}
        stationsQuery={stationsQuery}
      />
    </BaseDisplay>
  );
}

export const SignalDetectionsComponent = React.memo(IANSignalDetectionsComponent);
