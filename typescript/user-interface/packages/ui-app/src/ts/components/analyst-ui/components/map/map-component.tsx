import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type GoldenLayout from '@gms/golden-layout';
import {
  selectSelectedPhasesForSignalDetectionsCurrentHypotheses,
  selectSelectedSdIds,
  selectValidActionTargetSignalDetectionIds,
  useAllStations,
  useAppSelector,
  useKeyboardShortcutConfigurations,
  useSetSignalDetectionActionTargets,
  useUpdateSignalDetectionPhase
} from '@gms/ui-state';
import React from 'react';

import { CreateEventDialog } from '~analyst-ui/common/dialogs/create-event/create-event-dialog';
import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs/phase-selector/phase-selector-dialog';
import { MapHotkeys } from '~analyst-ui/common/hotkey-configs/map-hotkey-configs';
import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { BaseDisplay } from '~common-ui/components/base-display';

import { useVisibleSignalDetections } from '../waveform/waveform-hooks';
import {
  useIsMapSyncedToWaveformZoom,
  useMapNonPreferredEventData,
  useMapPreferredEventData
} from './map-hooks';
import { MapPanel } from './map-panel';

export interface MapComponentProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
}

/**
 * Map component. Renders a Cesium map and queries for Station Groups
 */
function MapComponent(props: MapComponentProps) {
  const { glContainer } = props;
  const keyboardShortcuts = useKeyboardShortcutConfigurations();
  const stationData = useAllStations();
  const signalDetectionQuery = useVisibleSignalDetections(useIsMapSyncedToWaveformZoom());
  const preferredEventData = useMapPreferredEventData();
  const nonPreferredEventData = useMapNonPreferredEventData();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);

  // CreateEventDialog setup
  const [createEventMenuState, setCreateEventMenuState] = React.useState<CreateEventMenuState>({
    visibility: false
  });

  // PhaseSelectorDialog setup
  const [phaseMenuVisibility, setPhaseMenuVisibility] = React.useState(false);

  const selectedPhases = useAppSelector(selectSelectedPhasesForSignalDetectionsCurrentHypotheses);

  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();

  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );

  const phaseSelectorCallback = React.useCallback(
    async (phases: string[]) => {
      await signalDetectionPhaseUpdate(validActionTargetSignalDetectionIds ?? [], phases[0]);
    },
    [signalDetectionPhaseUpdate, validActionTargetSignalDetectionIds]
  );

  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();
  return (
    <BaseDisplay
      glContainer={glContainer}
      tabName={IanDisplays.MAP}
      className="ian-map-gl-container"
      data-cy="ian-map-container"
    >
      <MapHotkeys
        selectedSignalDetectionsIds={selectedSdIds}
        setPhaseMenuVisibility={setPhaseMenuVisibility}
        setCreateEventMenuState={setCreateEventMenuState}
      >
        <MapPanel
          stationsResult={stationData}
          signalDetections={signalDetectionQuery?.data}
          preferredEventsResult={preferredEventData}
          nonPreferredEventsResult={nonPreferredEventData}
          setPhaseMenuVisibilityCb={setPhaseMenuVisibility}
          setCreateEventMenuState={setCreateEventMenuState}
        />
      </MapHotkeys>
      <PhaseSelectorDialog
        isOpen={phaseMenuVisibility}
        title="Set Phase"
        selectedPhases={selectedPhases}
        phaseSelectorCallback={phaseSelectorCallback}
        closeCallback={() => {
          setPhaseMenuVisibility(false);
          setSignalDetectionActionTargets([]);
        }}
        hotkeyCombo={keyboardShortcuts?.hotkeys?.toggleSetPhaseMenu?.combos[0]}
      />
      {/* Placed outside of MapHotkeys to retain focus */}
      <CreateEventDialog
        isOpen={createEventMenuState.visibility}
        onClose={() => {
          setCreateEventMenuState({ visibility: false, latitude: 0, longitude: 0 });
        }}
        latitude={createEventMenuState.latitude}
        longitude={createEventMenuState.longitude}
      />
    </BaseDisplay>
  );
}

export const IANMap = React.memo(MapComponent);
