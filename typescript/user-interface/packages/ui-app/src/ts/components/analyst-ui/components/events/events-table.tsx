import type { KeyboardShortcutConfigurations } from '@gms/common-model/lib/ui-configuration/types';
import { determineActionTargetsFromRightClickAndSetActionTargets } from '@gms/common-util';
import { AgGridReact } from '@gms/ui-core-components';
import type { AppDispatch } from '@gms/ui-state';
import {
  analystActions,
  EventsColumn,
  selectSelectedEventIds,
  selectUsername,
  useAppDispatch,
  useAppSelector,
  useDeleteEvents,
  useDuplicateEvents,
  useKeyboardShortcutConfigurations,
  useRejectEvents,
  useSetEventActionTargets,
  useSetSelectedEventIds
} from '@gms/ui-state';
import { isHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import type {
  CellContextMenuEvent,
  ColumnResizedEvent,
  GridReadyEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  SelectionChangedEvent
} from 'ag-grid-community';
import classNames from 'classnames';
import type Immutable from 'immutable';
import isEqual from 'lodash/isEqual';
import * as React from 'react';

import { showEventDetails } from '~analyst-ui/common/dialogs/event-details/event-details';
import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { useSyncDisplaySelection } from '~common-ui/common/table-hooks';
import { defaultColumnDefinition } from '~common-ui/common/table-types';
import {
  getMultiLineHeaderHeight,
  getRowHeightWithBorder,
  handleSelection,
  onGridReady,
  updateColumns
} from '~common-ui/common/table-utils';

import { showEventMenu } from '../../common/menus/event-menu';
import { useSetCloseEvent, useSetOpenEvent } from './events-util';
import { getEventsTableColumnDefs } from './table/column-definitions';
import type { EventRow } from './types';
import { EventFilterOptions } from './types';

export interface EventsTableProps {
  readonly columnsToDisplay: Immutable.Map<EventsColumn, boolean>;
  readonly data: EventRow[];
  readonly setEventId: (eventId: string) => void;
  /** set the create event menu state (visibility, latitude, longitude) */
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}

// parameter object to clean up onRowDoubleClicked code smell
export interface RowDblClickEventActions {
  openEvent: (id: string) => Promise<void>;
  closeEvent: (id: string) => Promise<void>;
  setEventId: (eventId: string) => void;
}

/**
 * Closes the selected event
 *
 * @param eventId The event id for the clicked event
 */
export const onCloseEvent = async (
  eventId: string,
  closeEvent: (id: string) => Promise<void>
): Promise<void> => {
  await closeEvent(eventId);
};

/**
 * Set open event triggered from events list and call the setEventId callback
 *
 * @param eventId event id
 * @param dispatch AppDispatch
 * @param setEventId set event id callback from parent component
 */
export const dispatchSetEventId = (
  eventId: string,
  dispatch: AppDispatch,
  setEventId: (eventId: string) => void
): void => {
  dispatch(analystActions.setEventListOpenTriggered(true));
  setEventId(eventId);
};

/**
 * Opens or closes the event associated with the selected row depending on open/closed event
 *
 * @param event The click event for the row
 */
export const onRowDoubleClicked = async (
  dispatch: AppDispatch,
  event: RowDoubleClickedEvent,
  eventActions: RowDblClickEventActions,
  userName: string
): Promise<void> => {
  const { openEvent, closeEvent, setEventId } = eventActions;
  if (event.data.isOpen) {
    // current user already has the event open so co close it
    await closeEvent(event.data.id);
    setEventId('');
  } else if (
    // no other analysts currently have the event open
    event.data.activeAnalysts.length === 0 ||
    (event.data.activeAnalysts.length === 1 && event.data.activeAnalysts?.includes(userName))
  ) {
    await openEvent(event.data.id);
  } else {
    // at least one other analyst has the event open, so show the popup
    dispatch(analystActions.setEventListOpenTriggered(true));
    setEventId(event.data.id);
  }
};

/**
 * Determines the color of the event table row.  Exported for testing purposes
 *
 * @param params RowClassParams to determine row styling for open and edge events
 * @returns string class name
 */
export const rowClassRules: {
  'open-event-row': (params: { data: EventRow }) => boolean;
  'edge-event-row': (params: { data: EventRow }) => boolean;
  'deleted-event-row': (params: { data: EventRow }) => boolean;
  'rejected-event-row': (params: { data: EventRow }) => boolean;
  'action-target-row': (params: { data: EventRow }) => boolean;
  'unqualified-action-target-row': (params: { data: EventRow }) => boolean;
} = {
  'open-event-row': (params: { data: EventRow }) => params.data.isOpen,
  'edge-event-row': (params: { data: EventRow }) =>
    !params.data.eventFilterOptions.includes(EventFilterOptions.INTERVAL),
  'deleted-event-row': (params: { data: EventRow }) => params.data.deleted,
  'rejected-event-row': (params: { data: EventRow }) => params.data.rejected,
  'action-target-row': (params: { data: EventRow }) => params.data.isActionTarget,
  'unqualified-action-target-row': (params: { data: EventRow }) =>
    params.data.isUnqualifiedActionTarget
};

/**
 * Handles row click events for the table.
 *
 * @param event the row clicked event
 * @param keyboardShortcutConfigurations the configured keyboard shortcuts
 * @param setEventActionTargets operation to set event action targets
 */
export const handleOnRowClickEvent = (
  event: RowClickedEvent,
  keyboardShortcutConfigurations: KeyboardShortcutConfigurations | undefined,
  setEventActionTargets: (targetIds: string[]) => void
): void => {
  const { event: nativeEvent } = event;
  const eventRow = event.data as EventRow;

  const showEventDetailsHotKeys =
    keyboardShortcutConfigurations?.clickEvents?.showEventDetails.combos ?? [];
  if (isHotKeyCommandSatisfied(nativeEvent as MouseEvent, showEventDetailsHotKeys)) {
    setEventActionTargets([eventRow.id]);
    showEventDetails(
      nativeEvent as MouseEvent,
      {
        eventId: eventRow.id,
        depthKm: eventRow.depthKm,
        latitudeDegrees: eventRow.latitudeDegrees,
        longitudeDegrees: eventRow.longitudeDegrees,
        time: eventRow.time
      },
      {
        onClose: () => {
          setEventActionTargets([]);
        }
      }
    );
  }
  handleSelection(event);
};

export function EventsTable({
  columnsToDisplay,
  data,
  setEventId,
  setCreateEventMenuState
}: EventsTableProps) {
  const tableRef = React.useRef<AgGridReact>(null);

  React.useEffect(() => {
    if (tableRef && tableRef.current) {
      updateColumns<EventsColumn>(tableRef, columnsToDisplay);
    }
  }, [columnsToDisplay]);

  const openEvent = useSetOpenEvent();
  const closeEvent = useSetCloseEvent();
  const setEventActionTargets = useSetEventActionTargets();
  const dispatch = useAppDispatch();

  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  const selectedEventIds = useAppSelector(selectSelectedEventIds);

  const userName = useAppSelector(selectUsername);
  const defaultColDef = React.useMemo(() => defaultColumnDefinition<EventRow>(), []);

  const columnDefs = React.useMemo(() => getEventsTableColumnDefs(), []);

  const setSelectedEventIds = useSetSelectedEventIds();
  const duplicateEvents = useDuplicateEvents();
  const rejectEvents = useRejectEvents();
  const deleteEvents = useDeleteEvents();

  const onCellContextMenuCallback = React.useCallback(
    (event: CellContextMenuEvent) => {
      const eventRow = event.data as EventRow;

      // if provided && not already selected, set the current selection to just the context-menu'd detection
      const actionTarget = determineActionTargetsFromRightClickAndSetActionTargets(
        selectedEventIds,
        eventRow.id,
        setEventActionTargets
      );

      showEventMenu(
        event.event as MouseEvent,
        {
          selectedEventId: event.data.id,
          isOpen: event.data.isOpen,
          openCallback: eventId => {
            dispatchSetEventId(eventId, dispatch, setEventId);
          },
          closeCallback: async eventId => onCloseEvent(eventId, closeEvent),
          duplicateCallback: () => {
            duplicateEvents(actionTarget.actionTargets);
          },
          rejectCallback: () => {
            rejectEvents(actionTarget.actionTargets);
          },
          deleteCallback: () => {
            deleteEvents(actionTarget.actionTargets);
          },
          setEventIdCallback: setEventId,
          setCreateEventMenuState,
          includeEventDetailsMenuItem: true,
          isMapContextMenu: false,
          entityProperties: {
            depthKm: eventRow.depthKm,
            latitudeDegrees: eventRow.latitudeDegrees,
            longitudeDegrees: eventRow.longitudeDegrees,
            time: eventRow.time
          },
          latitude: eventRow.latitudeDegrees,
          longitude: eventRow.longitudeDegrees
        },
        {
          onClose: () => {
            setEventActionTargets([]);
          }
        }
      );
    },
    [
      selectedEventIds,
      setEventActionTargets,
      setEventId,
      setCreateEventMenuState,
      dispatch,
      closeEvent,
      duplicateEvents,
      rejectEvents,
      deleteEvents
    ]
  );

  const onColumnResizedCallback = React.useCallback((event: ColumnResizedEvent) => {
    if (event.column?.getId() === EventsColumn.activeAnalysts) {
      // refresh the single column
      event.api.refreshCells({ columns: [EventsColumn.activeAnalysts], force: true });
    }
  }, []);

  const onRowDoubleClickedCallback = React.useCallback(
    async (event: RowDoubleClickedEvent) =>
      onRowDoubleClicked(
        dispatch,
        event,
        {
          openEvent,
          closeEvent,
          setEventId
        },
        userName
      ),
    [dispatch, openEvent, closeEvent, setEventId, userName]
  );

  /**
   * Fires when an AG Grid {@link RowNode} has been clicked
   *
   * !This function should NOT handle GMS "selection." For GMS selection, see {@link onSelectionChanged}
   */
  const onRowClickedCallback = React.useCallback(
    (event: RowClickedEvent) =>
      handleOnRowClickEvent(event, keyboardShortcutConfigurations, setEventActionTargets),
    [keyboardShortcutConfigurations, setEventActionTargets]
  );

  /**
   * Fires when an AG Grid {@link RowNode}'s selection has changed.
   *
   * !This function should handle GMS "selection," not AG Grid selection.
   * !For AG Grid selection see {@link onRowClicked}
   */
  const onSelectionChanged = React.useCallback(
    (event: SelectionChangedEvent) => {
      const selectedRows: EventRow[] = event.api.getSelectedRows();
      const updatedSelectedEvents = selectedRows.map(e => e.id);
      if (!isEqual(updatedSelectedEvents, selectedEventIds)) {
        setSelectedEventIds(updatedSelectedEvents);
      }
    },
    [selectedEventIds, setSelectedEventIds]
  );

  /**
   * Fires when the grid has initialized and is ready for most API calls.
   * May not be fully rendered yet.
   */
  const stableOnGridReady = React.useCallback(
    (event: GridReadyEvent) => {
      onGridReady<EventsColumn>(event, columnsToDisplay);
    },
    [columnsToDisplay]
  );

  useSyncDisplaySelection(tableRef, selectedEventIds, data);

  return (
    <div className={classNames(['event-table', 'ag-theme-dark', 'with-separated-rows-color'])}>
      <AgGridReact
        ref={tableRef}
        rowClassRules={rowClassRules}
        context={{}}
        onGridReady={stableOnGridReady}
        defaultColDef={defaultColDef}
        columnDefs={columnDefs}
        rowData={data}
        enableCellChangeFlash={false}
        getRowId={node => node.data.id}
        rowSelection="multiple"
        rowHeight={getRowHeightWithBorder()}
        headerHeight={getMultiLineHeaderHeight(2)}
        suppressCellFocus
        suppressDragLeaveHidesColumns
        overlayNoRowsTemplate="No Events to display"
        preventDefaultOnContextMenu
        suppressContextMenu
        onRowClicked={onRowClickedCallback}
        onRowDoubleClicked={onRowDoubleClickedCallback}
        onCellContextMenu={onCellContextMenuCallback}
        onSelectionChanged={onSelectionChanged}
        onColumnResized={onColumnResizedCallback}
        enableBrowserTooltips
        suppressRowClickSelection
      />
    </div>
  );
}
