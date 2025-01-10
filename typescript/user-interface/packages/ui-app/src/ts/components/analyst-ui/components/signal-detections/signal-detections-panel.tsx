import { CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import type { SignalDetectionFetchResult, StationQuery } from '@gms/ui-state';
import {
  selectActionTargetSignalDetectionIds,
  selectDisplaySignalDetectionConfiguration,
  selectOpenEventId,
  selectOpenIntervalName,
  selectSelectedPhasesForSignalDetectionsCurrentHypotheses,
  selectSelectedSdIds,
  selectSignalDetectionToDisplay,
  selectValidActionTargetSignalDetectionIds,
  selectWorkflowTimeRange,
  SignalDetectionColumn,
  signalDetectionsActions,
  useAppDispatch,
  useAppSelector,
  useEffectiveTime,
  useEventStatusQuery,
  useGetEvents,
  useGetProcessingStationGroupNamesConfigurationQuery,
  useGetStationGroupsByNamesQuery,
  useKeyboardShortcutConfigurations,
  useSetSignalDetectionActionTargets,
  useUiTheme,
  useUpdateSignalDetectionPhase
} from '@gms/ui-state';
import { selectSignalDetectionAssociationConflictCount } from '@gms/ui-state/lib/app/state/signal-detections/selectors';
import Immutable from 'immutable';
import defer from 'lodash/defer';
import React from 'react';

import { CreateEventDialog } from '~analyst-ui/common/dialogs/create-event/create-event-dialog';
import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs/phase-selector/phase-selector-dialog';
import { SignalDetectionsHotkeys } from '~analyst-ui/common/hotkey-configs/signal-detection-hotkey-configs';
import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import {
  signalDetectionsNonIdealStateDefinitions,
  stationDefinitionNonIdealStateDefinitions,
  stationGroupQueryNonIdealStateDefinitions,
  timeRangeNonIdealStateDefinitions
} from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { getSignalDetectionStatus } from '~analyst-ui/common/utils/event-util';
import {
  buildSignalDetectionRow,
  setFocusToSignalDetectionDisplay
} from '~analyst-ui/components/signal-detections/table/signal-detections-table-utils';
import { SignalDetectionsToolbar } from '~analyst-ui/components/signal-detections/toolbar/signal-detections-toolbar';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';

import { convertMapToObject } from '../../../common-ui/common/table-utils';
import { signalDetectionPanelNonIdealStates } from './signal-detections-non-ideal-states';
import { SignalDetectionsTable } from './table/signal-detections-table';
import type {
  SignalDetectionCountEntry,
  SignalDetectionCountFilterOptions
} from './toolbar/signal-detection-count-toolbar-item';
import type { SignalDetectionRow } from './types';

export interface SignalDetectionsPanelProps {
  /** Passed through to determine non-ideal state */
  readonly signalDetectionResults: SignalDetectionFetchResult;
  /** Passed through to determine non-ideal state */
  readonly timeRange: Nullable<CommonTypes.TimeRange>;
  /** Passed through to determine non-ideal state */
  readonly stationsQuery: StationQuery;
}

/**
 * Takes the column definition records from redux and converts it to a {@link Immutable.Map}.
 */
const convertObjectToSDColumnMap = (
  columnArguments: Record<string, boolean>
): Immutable.Map<SignalDetectionColumn, boolean> => {
  const notableValues = [...Object.keys(columnArguments)];
  return Immutable.Map<SignalDetectionColumn, boolean>([
    ...Object.values(SignalDetectionColumn)
      .filter(v => notableValues.includes(v))
      .map<[SignalDetectionColumn, boolean]>(v => [v, columnArguments[v]])
  ]);
};

/**
 * Returns a memoized list of {@link SignalDetectionRow}s
 *
 * @param signalDetections Data is used as the basis for each row
 */
const useSignalDetectionRows = (signalDetections: SignalDetectionTypes.SignalDetection[]) => {
  const { data: events } = useGetEvents();
  const { data: eventStatuses } = useEventStatusQuery();
  const openEventId = useAppSelector(selectOpenEventId);
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const sdIdsInConflicts = useAppSelector(selectSignalDetectionAssociationConflictCount);
  const signalDetectionActionTargets = useAppSelector(selectActionTargetSignalDetectionIds);
  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );

  CommonTypes.Util.validateTimeRange(timeRange);

  return React.useMemo(() => {
    if (signalDetections.length === 0) return [];
    return signalDetections.map(sd => {
      const associationStatus = getSignalDetectionStatus(
        sd,
        events ?? [],
        openEventId,
        eventStatuses ?? {},
        openIntervalName
      );
      const sdInConflict = sdIdsInConflicts.includes(sd.id);
      const sdIsActionTarget = signalDetectionActionTargets.includes(sd.id);
      return buildSignalDetectionRow(
        {
          sd,
          associationStatus,
          sdInConflict,
          sdIsActionTarget,
          validActionTargetSignalDetectionIds
        },
        timeRange
      );
    });
  }, [
    signalDetections,
    events,
    eventStatuses,
    openEventId,
    openIntervalName,
    timeRange,
    sdIdsInConflicts,
    signalDetectionActionTargets,
    validActionTargetSignalDetectionIds
  ]);
};

/**
 * IAN signal detections component.
 */
export function SignalDetectionsPanelComponent({
  signalDetectionResults
}: Omit<SignalDetectionsPanelProps, 'timeRange' | 'stationsQuery'>) {
  const [uiTheme] = useUiTheme();
  const keyboardShortcuts = useKeyboardShortcutConfigurations();
  const dispatch = useAppDispatch();
  const isSynced = useAppSelector(selectDisplaySignalDetectionConfiguration).syncWaveform;

  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const effectiveTime = useEffectiveTime();
  const processingStationGroupNamesConfigurationQuery =
    useGetProcessingStationGroupNamesConfigurationQuery();
  const stationsGroupsByNamesQuery = useGetStationGroupsByNamesQuery({
    effectiveTime,
    stationGroupNames: processingStationGroupNamesConfigurationQuery?.data?.stationGroupNames ?? []
  });

  const [phaseMenuVisibility, setPhaseMenuVisibility] = React.useState(false);
  const [createEventMenuState, setCreateEventMenuState] = React.useState<CreateEventMenuState>({
    visibility: false
  });

  const selectedSDColumnsToDisplayObject = useAppSelector(selectSignalDetectionToDisplay);

  const selectedSDColumnsToDisplay = React.useMemo(
    () => convertObjectToSDColumnMap(selectedSDColumnsToDisplayObject),
    [selectedSDColumnsToDisplayObject]
  );
  const setSelectedSDColumnsToDisplay = React.useCallback(
    (cols: Immutable.Map<SignalDetectionColumn, boolean>) =>
      dispatch(signalDetectionsActions.updateSignalDetectionColumns(convertMapToObject(cols))),
    [dispatch]
  );

  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();
  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();
  const rowData: SignalDetectionRow[] = useSignalDetectionRows(signalDetectionResults.data ?? []);

  const displayedSignalDetectionConfigurationObject = useAppSelector(
    selectDisplaySignalDetectionConfiguration
  );

  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );
  const selectedPhases = useAppSelector(selectSelectedPhasesForSignalDetectionsCurrentHypotheses);

  /**
   * Stable call for closing the create event dialog
   */
  const closeCreateEventDialog = () => {
    setCreateEventMenuState({ visibility: false });
    defer(() => {
      setFocusToSignalDetectionDisplay();
    });
  };

  const countEntryRecord: Record<SignalDetectionCountFilterOptions, SignalDetectionCountEntry> =
    React.useMemo(
      () => ({
        Total: {
          count: rowData.length,
          color: uiTheme.colors.gmsMain,
          isShown: true,
          tooltip: 'Total number of events'
        },
        Open: {
          count: rowData.filter(
            s => s.assocStatus === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED
          ).length,
          color: uiTheme.colors.openEventSDColor,
          isShown: displayedSignalDetectionConfigurationObject.signalDetectionAssociatedToOpenEvent,
          tooltip: 'Number of signal detections associated to open event'
        },
        Completed: {
          count: rowData.filter(
            s => s.assocStatus === SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED
          ).length,
          color: uiTheme.colors.completeEventSDColor,
          isShown:
            displayedSignalDetectionConfigurationObject.signalDetectionAssociatedToCompletedEvent,
          tooltip: 'Number of signal detections associated to completed event'
        },
        Other: {
          count: rowData.filter(
            s => s.assocStatus === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED
          ).length,
          color: uiTheme.colors.otherEventSDColor,
          isShown:
            displayedSignalDetectionConfigurationObject.signalDetectionAssociatedToOtherEvent,
          tooltip: 'Number of signal detections associated to other event'
        },
        Conflicts: {
          count: rowData.filter(s => s.conflict).length,
          color: uiTheme.colors.conflict,
          isShown: displayedSignalDetectionConfigurationObject.signalDetectionConflicts,
          tooltip: 'Number of signal detections with conflicts'
        },
        Deleted: {
          count: rowData.filter(s => s.deleted === 'True').length,
          color: uiTheme.colors.deletedEventColor,
          isShown: displayedSignalDetectionConfigurationObject.signalDetectionDeleted,
          tooltip: 'Number of deleted signal detections'
        },
        Unassociated: {
          count: rowData.filter(
            s => s.assocStatus === SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED
          ).length,
          color: uiTheme.colors.unassociatedSDColor,
          isShown: displayedSignalDetectionConfigurationObject.signalDetectionUnassociated,
          tooltip: 'Number of unassociated signal detections'
        }
      }),
      [
        displayedSignalDetectionConfigurationObject.signalDetectionAssociatedToCompletedEvent,
        displayedSignalDetectionConfigurationObject.signalDetectionAssociatedToOpenEvent,
        displayedSignalDetectionConfigurationObject.signalDetectionAssociatedToOtherEvent,
        displayedSignalDetectionConfigurationObject.signalDetectionConflicts,
        displayedSignalDetectionConfigurationObject.signalDetectionDeleted,
        displayedSignalDetectionConfigurationObject.signalDetectionUnassociated,
        rowData,
        uiTheme.colors.completeEventSDColor,
        uiTheme.colors.conflict,
        uiTheme.colors.deletedEventColor,
        uiTheme.colors.gmsMain,
        uiTheme.colors.openEventSDColor,
        uiTheme.colors.otherEventSDColor,
        uiTheme.colors.unassociatedSDColor
      ]
    );

  const phaseSelectorCallback = async (phases: string[]) => {
    await signalDetectionPhaseUpdate(validActionTargetSignalDetectionIds ?? [], phases[0]);
  };

  return (
    <SignalDetectionsHotkeys
      selectedSignalDetectionsIds={selectedSdIds}
      setPhaseMenuVisibility={setPhaseMenuVisibility}
      setCreateEventMenuState={setCreateEventMenuState}
    >
      <div className="signal-detection-panel" data-cy="signal-detection-panel">
        <SignalDetectionsToolbar
          key="sdtoolbar"
          countEntryRecord={countEntryRecord}
          selectedSDColumnsToDisplay={selectedSDColumnsToDisplay}
          setSelectedSDColumnsToDisplay={setSelectedSDColumnsToDisplay}
          setCreateEventMenuState={setCreateEventMenuState}
        />
        <SignalDetectionsTable
          key="sdtable"
          isSynced={isSynced}
          signalDetectionResults={signalDetectionResults}
          data={rowData}
          columnsToDisplay={selectedSDColumnsToDisplay}
          setPhaseMenuVisibility={setPhaseMenuVisibility}
          stationsGroupsByNamesQuery={stationsGroupsByNamesQuery}
        />
        <PhaseSelectorDialog
          isOpen={phaseMenuVisibility}
          title="Set Phase"
          selectedPhases={selectedPhases}
          phaseSelectorCallback={phaseSelectorCallback}
          closeCallback={() => {
            setSignalDetectionActionTargets([]);
            setPhaseMenuVisibility(false);
          }}
          hotkeyCombo={keyboardShortcuts?.hotkeys?.toggleSetPhaseMenu?.combos[0]}
        />
        <CreateEventDialog
          isOpen={createEventMenuState.visibility}
          onClose={closeCreateEventDialog}
        />
      </div>
    </SignalDetectionsHotkeys>
  );
}

const SignalDetectionsPanelOrNonIdealState = WithNonIdealStates<SignalDetectionsPanelProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...timeRangeNonIdealStateDefinitions('signal detections'),
    ...stationGroupQueryNonIdealStateDefinitions,
    ...stationDefinitionNonIdealStateDefinitions,
    ...signalDetectionsNonIdealStateDefinitions,
    ...signalDetectionPanelNonIdealStates
  ],
  SignalDetectionsPanelComponent
);

export const SignalDetectionsPanel = React.memo(SignalDetectionsPanelOrNonIdealState);
