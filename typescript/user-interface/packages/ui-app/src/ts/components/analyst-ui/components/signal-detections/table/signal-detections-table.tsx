import type { EventTypes } from '@gms/common-model';
import { ArrayUtil, CommonTypes, Endpoints, SignalDetectionTypes } from '@gms/common-model';
import {
  capitalizeFirstLetters,
  dateStringIsValid,
  setDecimalPrecisionAsNumber,
  toEpochSeconds
} from '@gms/common-util';
import type { RowNode } from '@gms/ui-core-components';
import { AgGridReact, nonIdealStateWithError, WithNonIdealStates } from '@gms/ui-core-components';
import type {
  EventStatus,
  SignalDetectionFetchResult,
  StationGroupsByNamesQueryProps,
  UpdateSignalDetectionArrivalTimeArgs
} from '@gms/ui-state';
import {
  selectDisplaySignalDetectionConfiguration,
  selectOpenEvent,
  selectOpenEventId,
  selectOpenIntervalName,
  SignalDetectionColumn,
  useAppSelector,
  useAssociateSignalDetections,
  useEventStatusQuery,
  useGetSelectedSdIds,
  useKeyboardShortcutConfigurations,
  useSetSelectedSdIds,
  useSetSignalDetectionActionTargets,
  useUnassociateSignalDetections,
  useUpdateSignalDetectionArrivalTime,
  useViewableInterval
} from '@gms/ui-state';
import { isHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import type { WeavessTypes } from '@gms/weavess-core';
import type {
  CellClickedEvent,
  CellContextMenuEvent,
  CellEditRequestEvent,
  GridReadyEvent,
  RowClickedEvent,
  SelectionChangedEvent
} from 'ag-grid-community';
import classNames from 'classnames';
import difference from 'lodash/difference';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { toast } from 'react-toastify';

import { showSignalDetectionDetails } from '~analyst-ui/common/dialogs/signal-detection-details/signal-detection-details';
import { showSignalDetectionMenu } from '~analyst-ui/common/menus/signal-detection-menu';
import {
  signalDetectionsNonIdealStateDefinitions,
  stationGroupQueryNonIdealStateDefinitions
} from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { EventUtils } from '~analyst-ui/common/utils';
import {
  agGridDoesExternalFilterPass,
  agGridIsExternalFilterPresent,
  isValidSdListStdDev,
  sdRowClassRules,
  setFocusToSignalDetectionDisplay
} from '~analyst-ui/components/signal-detections/table/signal-detections-table-utils';
import { useSyncDisplaySelection } from '~common-ui/common/table-hooks';
import { defaultColumnDefinition } from '~common-ui/common/table-types';
import {
  getHeaderHeight,
  getRowHeightWithBorder,
  handleSelection,
  onGridReady,
  updateColumns
} from '~common-ui/common/table-utils';

import { systemConfig } from '../../../config/system-config';
import { signalDetectionTableNonIdealStates } from '../signal-detections-non-ideal-states';
import type { SignalDetectionRow, SignalDetectionsTableProps } from '../types';
import { getSignalDetectionTableColumnDefs } from './column-definitions';

export const STATUS_CODE_404 = '404';
export const STATUS_CODE_503 = '503';

interface CellDoubleClickParams {
  event: CellClickedEvent;
  signalDetectionResults: SignalDetectionFetchResult;
  currentOpenEventId: string;
  currentOpenEvent: EventTypes.Event;
  currentOpenInterval: string;
  eventStatusQuery: Record<string, EventStatus>;
  associateSignalDetectionFn: (signalDetectionIds: string[]) => void;
  unassociateSignalDetectionFn: (
    signalDetectionIds: string[],
    rejectAssociations?: boolean
  ) => void;
}

/**
 * Cell Event and other parameters used in cell editor callback
 */
export interface CellEditParams {
  event: CellEditRequestEvent;
  viewableInterval: NonNullable<WeavessTypes.TimeRange>;
  signalDetectionResults: SignalDetectionFetchResult;
  updateSignalDetectionArrivalTime: (args: UpdateSignalDetectionArrivalTimeArgs) => void;
}

/**
 * Associates or Unassociates the double-clicked row's SD to the currently open event
 *
 * @param params: CellDoubleClickParams
 * @param params.event: CellClickedEvent
 * @param params.signalDetectionResults: SignalDetectionFetchResult
 * @param params.currentOpenEventId: string
 * @param params.currentOpenEvent: EventTypes.Event
 * @param params.currentOpenInterval: string
 * @param params.eventStatusQuery: Record<string, EventStatus>
 * @param params.associateSignalDetectionFn: (signalDetectionIds: string[]) => void
 * @param params.unassociateSignalDetectionFn: (signalDetectionIds: string[], rejectAssociations?: boolean) => void
 */
export const onCellDoubleClicked = (params: CellDoubleClickParams) => {
  // If double click occurred on a editable or deleted cell then ignore associate/unassociate call
  if (params.event.colDef.editable || params.event.data.deleted === 'True') return;
  if (
    params.currentOpenEventId === '' ||
    params.currentOpenEventId === undefined ||
    params.currentOpenEventId === null
  )
    return;

  const signalDetection = ArrayUtil.findOrThrow(
    params.signalDetectionResults.data ?? [],
    sd => sd.id === params.event.data.id
  );
  const assocStatus = EventUtils.getSignalDetectionStatus(
    signalDetection,
    [params.currentOpenEvent],
    params.currentOpenEventId ?? undefined,
    params.eventStatusQuery,
    params.currentOpenInterval
  );

  // Should associate to the open event
  if (
    assocStatus === SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED ||
    assocStatus === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED
  ) {
    params.associateSignalDetectionFn([signalDetection.id]);
  }
  // Should unassociate from the open event
  else if (assocStatus === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED) {
    params.unassociateSignalDetectionFn([signalDetection.id]);
  }
};

/**
 * Parse and validate the arrival time string
 *
 * @param stringToProcess date/time string
 * @returns epoch seconds or undefined
 */
function parseArrivalTime(stringToProcess: string): number | undefined {
  let timeString = stringToProcess;
  const regex: RegExp = /\.$/;
  // Remove trailing periods, if any
  timeString = timeString.replace(regex, '');

  if (!timeString.toLowerCase().endsWith('z')) {
    timeString = `${timeString}Z`;
  }

  if (dateStringIsValid(timeString)) {
    return toEpochSeconds(timeString);
  }
  return undefined;
}

/**
 * Update values in UI state if uncertainty or arrival time have updated
 *
 * @param arrivalTime
 * @param uncertaintySecs
 * @param params
 * @param sd
 * @param arrivalTimeFmValue
 */
function maybeUpdateEditedCells(
  arrivalTime: number,
  uncertaintySecs: number,
  params: CellEditParams,
  arrivalTimeFmValue: SignalDetectionTypes.ArrivalTimeFeatureMeasurement
): void {
  if (
    arrivalTime !== arrivalTimeFmValue.measurementValue.arrivalTime.value ||
    uncertaintySecs !== arrivalTimeFmValue.measurementValue.arrivalTime.standardDeviation
  ) {
    const args: UpdateSignalDetectionArrivalTimeArgs = {
      signalDetectionId: params.event.data.id,
      arrivalTime: {
        value: arrivalTime,
        uncertainty:
          setDecimalPrecisionAsNumber(uncertaintySecs, systemConfig.sdUncertainty.fractionDigits) ??
          0
      }
    };
    params.updateSignalDetectionArrivalTime(args);
  }
}

/**
 * Arrival time and uncertainty cell edit calls update SD if value is valid
 *
 * @param params CellEditParams
 */
export function onCellEditCallback(params: CellEditParams): void {
  const signalDetection = ArrayUtil.findOrThrow(
    params.signalDetectionResults.data ?? [],
    sd => sd.id === params.event.data.id
  );
  const arrivalTimeFmValue =
    SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementUsingSignalDetection(
      signalDetection
    );

  // Get the arrival time
  let arrivalTime: number | undefined = arrivalTimeFmValue.measurementValue.arrivalTime.value;
  if (params.event.colDef.field === SignalDetectionColumn.time) {
    arrivalTime = parseArrivalTime(params.event.newValue);
    // Check parsed time string
    if (!arrivalTime) {
      toast.warn(`Arrival time ${params.event.newValue} is not a valid date`, {
        toastId: `toast-invalid-arrival-time`
      });
      return;
    }
  }

  // Get the arrival time standard deviation
  let uncertaintySecs: number | undefined =
    arrivalTimeFmValue.measurementValue.arrivalTime.standardDeviation;

  if (params.event.colDef.field === SignalDetectionColumn.timeStandardDeviation) {
    const newUncertaintyStr = String(params.event.newValue).replace(/,/g, '');
    // If uncertainty field was cleared (empty string), revert to original value
    const newUncertainty: number | undefined =
      newUncertaintyStr === '' ? uncertaintySecs : parseFloat(newUncertaintyStr);
    if (isValidSdListStdDev(newUncertaintyStr)) {
      uncertaintySecs = newUncertainty;
      if (uncertaintySecs < systemConfig.sdUncertainty.minUncertainty) {
        toast.warn(
          `Adjusting value entered ${newUncertainty || ''} to minimum standard deviation of ${
            systemConfig.sdUncertainty.minUncertainty
          }.`,
          {
            toastId: `toast-invalid-uncertainty`
          }
        );
        uncertaintySecs = systemConfig.sdUncertainty.minUncertainty;
      }
    } else {
      toast.warn(`Standard deviation value entered ${newUncertainty || ''} is invalid.`, {
        toastId: `toast-invalid-standard-deviation`
      });
      return;
    }
  }

  // Check the arrival time ± uncertainty is within the viewable interval
  if (
    arrivalTime - uncertaintySecs < params.viewableInterval.startTimeSecs ||
    arrivalTime + uncertaintySecs > params.viewableInterval.endTimeSecs
  ) {
    toast.warn(`Arrival time ± standard deviation is not within open interval.`, {
      toastId: `toast-invalid-arrival-time-standard-deviation`
    });
    return;
  }

  // If either value changed update SD in UI state
  maybeUpdateEditedCells(arrivalTime, uncertaintySecs, params, arrivalTimeFmValue);
}

export function SignalDetectionsTableComponent({
  signalDetectionResults,
  data,
  columnsToDisplay,
  setPhaseMenuVisibility
}: SignalDetectionsTableProps) {
  const tableRef = React.useRef<AgGridReact | null>(null);
  const selectedSdIds = useGetSelectedSdIds();
  const currentOpenEventId = useAppSelector(selectOpenEventId);
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const openInterval = useAppSelector(selectOpenIntervalName);
  const eventStatusQuery = useEventStatusQuery();
  const associateSignalDetection = useAssociateSignalDetections();
  const unassociateSignalDetection = useUnassociateSignalDetections();
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();
  const setSelectedSdIds = useSetSelectedSdIds();
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  const displayedSignalDetectionConfigurationObject = useAppSelector(
    selectDisplaySignalDetectionConfiguration
  );

  const defaultColDef = React.useMemo(() => defaultColumnDefinition<SignalDetectionRow>(), []);
  const columnDefs = React.useMemo(getSignalDetectionTableColumnDefs, []);

  /**
   * Required by {@link isExternalFilterPresent} and {@link doesExternalFilterPass} due to
   * the way ag-grid creates closures for those respective functions.
   */
  const filterStateRef = React.useRef(displayedSignalDetectionConfigurationObject);

  React.useEffect(() => {
    updateColumns<SignalDetectionColumn>(tableRef, columnsToDisplay);
  }, [columnsToDisplay]);

  React.useEffect(() => {
    filterStateRef.current = displayedSignalDetectionConfigurationObject;
    // Notifies the grid that the filter conditions have changed.
    tableRef.current?.api?.onFilterChanged();
  }, [displayedSignalDetectionConfigurationObject]);

  const onCellContextMenuCallback = React.useCallback(
    (event: CellContextMenuEvent) => {
      const actionTargetIds =
        event && selectedSdIds.indexOf(event.data.id) === -1 ? [event.data.id] : selectedSdIds;
      setSignalDetectionActionTargets(actionTargetIds);

      showSignalDetectionMenu(
        event.event as MouseEvent,
        {
          setPhaseMenuVisibilityCb: setPhaseMenuVisibility
        },
        {
          onClose: () => {
            setSignalDetectionActionTargets([]);
          }
        }
      );
    },
    [selectedSdIds, setPhaseMenuVisibility, setSignalDetectionActionTargets]
  );

  /**
   * Called by ag-grid to determine if an external filter is present/active.
   */
  const isExternalFilterPresent = React.useCallback(
    () => agGridIsExternalFilterPresent(filterStateRef.current),
    []
  );

  /**
   * Called by ag-grid once for each {@link RowNode}. Should return true if external filter
   * passes, otherwise false.
   */
  const doesExternalFilterPass = React.useCallback(
    (node: RowNode): boolean => agGridDoesExternalFilterPass(node, filterStateRef.current),
    []
  );

  const onCellDoubleClickedCallback = React.useCallback(
    (event: CellClickedEvent) => {
      const dblClickParams: CellDoubleClickParams = {
        event,
        signalDetectionResults,
        currentOpenEventId,
        currentOpenEvent,
        currentOpenInterval: openInterval,
        eventStatusQuery: eventStatusQuery.data ?? {},
        associateSignalDetectionFn: associateSignalDetection,
        unassociateSignalDetectionFn: unassociateSignalDetection
      };
      onCellDoubleClicked(dblClickParams);
    },
    [
      signalDetectionResults,
      currentOpenEventId,
      currentOpenEvent,
      eventStatusQuery.data,
      openInterval,
      associateSignalDetection,
      unassociateSignalDetection
    ]
  );

  const updateSignalDetectionArrivalTime = useUpdateSignalDetectionArrivalTime();
  const [viewableInterval] = useViewableInterval();

  const onCellEdit = React.useCallback(
    (event: CellEditRequestEvent) => {
      // This should never be invalid
      CommonTypes.Util.validateTimeRange(viewableInterval);

      const cellEditParams: CellEditParams = {
        event,
        viewableInterval,
        signalDetectionResults,
        updateSignalDetectionArrivalTime
      };

      onCellEditCallback(cellEditParams);
    },
    [signalDetectionResults, updateSignalDetectionArrivalTime, viewableInterval]
  );

  /**
   * Fires when an AG Grid {@link RowNode} has been clicked
   *
   * !This function should NOT handle GMS "selection." For GMS selection, see {@link onSelectionChanged}
   */
  const onRowClickedCallback = React.useCallback(
    (event: RowClickedEvent) => {
      const { event: nativeEvent } = event;
      // Open Signal Detection Details
      const sdRow = event.data as SignalDetectionRow;

      const showSdDetailsHotkeys =
        keyboardShortcutConfigurations?.clickEvents?.showSignalDetectionDetails.combos ?? [];
      if (isHotKeyCommandSatisfied(nativeEvent as MouseEvent, showSdDetailsHotkeys)) {
        setSignalDetectionActionTargets([sdRow.id]);

        // Find SD to be shown in the query result
        const signalDetection = ArrayUtil.findOrThrow(
          signalDetectionResults.data ?? [],
          sd => sd.id === sdRow.id
        );
        showSignalDetectionDetails(
          nativeEvent as MouseEvent,
          { signalDetection },
          {
            onClose: () => {
              setSignalDetectionActionTargets([]);
              setFocusToSignalDetectionDisplay();
            }
          }
        );
        return;
      }
      handleSelection(event);
    },
    [
      keyboardShortcutConfigurations?.clickEvents?.showSignalDetectionDetails.combos,
      setSignalDetectionActionTargets,
      signalDetectionResults.data
    ]
  );

  /**
   * Fires when an AG Grid {@link RowNode}'s selection has changed.
   *
   * !This function should handle GMS "selection," not AG Grid selection.
   * !For AG Grid selection see {@link onRowClicked}
   */
  const onSelectionChanged = React.useCallback(
    (event: SelectionChangedEvent) => {
      // Get signal detections visible in the display
      const visibleIds = [];
      event.api.forEachNode(rowNode => visibleIds.push(rowNode.id));

      const selectedRows: SignalDetectionRow[] = event.api.getSelectedRows();
      const selectedRowSdIds = selectedRows.map(sdRow => sdRow.id);

      // Find signal detections that might be offscreen
      const offScreenSignalDetections = difference(selectedSdIds, visibleIds);
      // Offscreen signal detections were not deselected, add them back into the selected rows
      selectedRowSdIds.push(...offScreenSignalDetections);

      if (!isEqual(selectedRowSdIds, selectedSdIds)) {
        setSelectedSdIds(selectedRowSdIds);
      }
    },
    [selectedSdIds, setSelectedSdIds]
  );

  /**
   * Fires when the grid has initialized and is ready for most API calls.
   * May not be fully rendered yet.
   */
  const stableOnGridReady = React.useCallback(
    (event: GridReadyEvent) => {
      onGridReady<SignalDetectionColumn>(event, columnsToDisplay);
    },
    [columnsToDisplay]
  );

  useSyncDisplaySelection(tableRef, selectedSdIds, data);

  return (
    <div
      className={classNames([
        'signal-detection-table-wrapper',
        'ag-theme-dark',
        'with-separated-rows-color'
      ])}
    >
      <AgGridReact
        ref={tableRef}
        rowClassRules={sdRowClassRules}
        context={{}}
        onGridReady={stableOnGridReady}
        isExternalFilterPresent={isExternalFilterPresent}
        doesExternalFilterPass={doesExternalFilterPass}
        defaultColDef={defaultColDef}
        columnDefs={columnDefs}
        rowData={data}
        enableCellChangeFlash={false}
        getRowId={node => node.data.id}
        rowSelection="multiple"
        rowHeight={getRowHeightWithBorder()}
        headerHeight={getHeaderHeight()}
        suppressCellFocus
        suppressContextMenu
        preventDefaultOnContextMenu
        suppressDragLeaveHidesColumns
        overlayNoRowsTemplate="No Signal Detections to display"
        enableBrowserTooltips
        onCellContextMenu={onCellContextMenuCallback}
        onCellEditRequest={onCellEdit}
        onCellDoubleClicked={onCellDoubleClickedCallback}
        onRowClicked={onRowClickedCallback}
        onSelectionChanged={onSelectionChanged}
        readOnlyEdit
        stopEditingWhenCellsLoseFocus
        suppressRowClickSelection
      />
    </div>
  );
}

const SignalDetectionsTableComponentOrNonIdealState =
  WithNonIdealStates<SignalDetectionsTableProps>(
    [
      {
        condition: (props: StationGroupsByNamesQueryProps): boolean => {
          return (
            props.stationsGroupsByNamesQuery?.isError &&
            (props.stationsGroupsByNamesQuery?.error?.message?.includes(STATUS_CODE_404) ||
              props.stationsGroupsByNamesQuery?.error?.message?.includes(STATUS_CODE_503))
          );
        },
        element: nonIdealStateWithError(
          'Error',
          `Unable to communicate with ${capitalizeFirstLetters(
            Endpoints.StationDefinitionUrls.getStationGroupsByNames.friendlyName
          )} Service`
        )
      },
      ...stationGroupQueryNonIdealStateDefinitions,
      ...signalDetectionsNonIdealStateDefinitions,
      ...signalDetectionTableNonIdealStates
    ],
    SignalDetectionsTableComponent
  );

export const sdPanelMemoCheck = (
  prev: SignalDetectionsTableProps,
  next: SignalDetectionsTableProps
): boolean => {
  // if false, reload
  // If anything in the query changes except for pending/isLoading/isError/data.length
  if (prev.stationsGroupsByNamesQuery.isError !== next.stationsGroupsByNamesQuery.isError)
    return false;
  if (prev.signalDetectionResults.isError !== next.signalDetectionResults.isError) return false;
  if (prev.signalDetectionResults.isLoading !== next.signalDetectionResults.isLoading) return false;
  if (prev.signalDetectionResults.pending !== next.signalDetectionResults.pending) return false;
  if (
    (prev.signalDetectionResults.data?.length === 0) !==
    (next.signalDetectionResults.data?.length === 0)
  )
    return false;

  if (!isEqual(prev.data, next.data)) return false;

  if (prev.isSynced !== next.isSynced) return false;

  if (!isEqual(prev.columnsToDisplay, next.columnsToDisplay)) return false;

  // Default, do not reload
  return true;
};

export const SignalDetectionsTable = React.memo(
  SignalDetectionsTableComponentOrNonIdealState,
  sdPanelMemoCheck
);
