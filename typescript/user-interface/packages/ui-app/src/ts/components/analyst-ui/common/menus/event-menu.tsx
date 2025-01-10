import { Menu, MenuItem } from '@blueprintjs/core';
import type { Depth, EventHypothesis } from '@gms/common-model/lib/event';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import type { ArrivalTime } from '@gms/ui-state';
import {
  selectActionTargetEventIds,
  selectSelectedEventIds,
  selectValidActionTargetEventIds,
  showImperativeReduxContextMenu,
  useAppSelector,
  useGetPreferredEventHypothesesByEventIds,
  useKeyboardShortcutConfigurations,
  useSetActionType,
  useSetEventActionTargets,
  useSetSelectedEventIds
} from '@gms/ui-state';
import type { ActionTypes } from '@gms/ui-state/lib/app/state/analyst/types';
import React from 'react';

import {
  formatHotkeyString,
  getKeyboardShortcutCombos
} from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { showEventDetails } from '../dialogs/event-details/event-details';
import type { CreateEventMenuState } from './create-event-menu-item';
import { CreateEventMenuItem } from './create-event-menu-item';

export interface EventMenuProps {
  readonly selectedEventId: string;
  readonly isOpen: boolean;
  readonly includeEventDetailsMenuItem: boolean;
  readonly isMapContextMenu: boolean;
  readonly entityProperties: {
    readonly time: ArrivalTime;
    readonly latitudeDegrees: number;
    readonly longitudeDegrees: number;
    readonly depthKm: Depth;
  };
  /** In degrees, used for map display */
  readonly latitude: number;
  /** In degrees, used for map display */
  readonly longitude: number;
  readonly openCallback: (eventId: string) => void;
  readonly closeCallback: (eventId: string) => void;
  readonly duplicateCallback: () => void;
  readonly deleteCallback: () => void;
  readonly rejectCallback: () => void;
  readonly setEventIdCallback?: (eventId: string) => void;
  /** set the create event menu state (visibility, latitude, longitude) */
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}
/**
 * Event context menu Duplicate Option props
 */
interface DuplicateMenuItemProps {
  readonly numberOfEventsAffectedByAction: number;
  readonly handleDuplicate: () => void;
  readonly setActionType: (actionType: ActionTypes) => void;
}

/**
 * Component that renders the duplicate option on the Event context menu.
 */
function DuplicateMenuItem(props: DuplicateMenuItemProps) {
  const { numberOfEventsAffectedByAction, handleDuplicate, setActionType } = props;

  return (
    <MenuItem
      className="menu-item-duplicate-event"
      data-testid="menu-item-duplicate-event"
      text={`Duplicate ${numberOfEventsAffectedByAction} selected event${
        numberOfEventsAffectedByAction === 1 ? '' : 's'
      }`}
      disabled={numberOfEventsAffectedByAction === 0}
      onClick={handleDuplicate}
      onMouseEnter={() => setActionType('duplicate')}
      onMouseLeave={() => setActionType(null)}
    />
  );
}

/**
 * Component that renders the interval context menu.
 */
export function EventMenu(props: EventMenuProps) {
  const {
    selectedEventId,
    isOpen,
    includeEventDetailsMenuItem,
    isMapContextMenu,
    entityProperties,
    openCallback,
    closeCallback,
    duplicateCallback,
    setEventIdCallback,
    rejectCallback,
    deleteCallback,
    setCreateEventMenuState,
    latitude,
    longitude
  } = props;

  const eventActionTargets = useAppSelector(selectActionTargetEventIds);
  const preferredEventHypotheses: EventHypothesis[] =
    useGetPreferredEventHypothesesByEventIds(eventActionTargets); // !The way this is being used is not reference stable but deemed ok due to context menu
  // !performance not taking a hit

  const setActionType = useSetActionType();

  const selectedEventIds = useAppSelector(selectSelectedEventIds);
  const setSelectedEventIds = useSetSelectedEventIds();
  const validActionTargetEventIds = useAppSelector(selectValidActionTargetEventIds);

  const keyboardShortcutConfigs = useKeyboardShortcutConfigurations();

  /** Click handler for duplicating events */
  const handleDuplicate = React.useCallback(() => {
    const eventIdsToReselect = selectedEventIds.filter(
      id => !validActionTargetEventIds.includes(id)
    );
    duplicateCallback();
    setSelectedEventIds(eventIdsToReselect);
  }, [duplicateCallback, selectedEventIds, setSelectedEventIds, validActionTargetEventIds]);

  /** Click handler for rejecting events */
  const handleReject = React.useCallback(() => {
    const eventIdsToReselect = selectedEventIds.filter(
      id => !validActionTargetEventIds.includes(id)
    );
    rejectCallback();
    // unqualified action targets remain selected after reject
    setSelectedEventIds(eventIdsToReselect);
  }, [rejectCallback, selectedEventIds, setSelectedEventIds, validActionTargetEventIds]);

  /** Click handler for deleting events */
  const handleDelete = React.useCallback(() => {
    const eventIdsToReselect = selectedEventIds.filter(
      id => !validActionTargetEventIds.includes(id)
    );
    deleteCallback();
    // unqualified action targets remain selected after reject
    setSelectedEventIds(eventIdsToReselect);
  }, [deleteCallback, selectedEventIds, setSelectedEventIds, validActionTargetEventIds]);

  const setEventActionTargets = useSetEventActionTargets();

  // get the number of events which can be affected the the action
  const numberOfEventsAffectedByAction: number = React.useMemo(() => {
    const affectedEventHypos = preferredEventHypotheses?.filter(eventHypo => {
      return !eventHypo?.deleted && !eventHypo?.rejected;
    });
    return affectedEventHypos?.length;
  }, [preferredEventHypotheses]);

  return (
    <Menu>
      {isMapContextMenu && (
        <CreateEventMenuItem
          latitude={latitude}
          longitude={longitude}
          setCreateEventMenuState={setCreateEventMenuState}
        />
      )}

      <MenuItem
        className="menu-item-open-event"
        data-cy="menu-item-open-event"
        text="Open event"
        disabled={eventActionTargets?.length > 1 || isOpen}
        onClick={() => openCallback(selectedEventId)}
        onMouseEnter={() => setActionType('open')}
        onMouseLeave={() => setActionType(null)}
      />
      <MenuItem
        className="menu-item-close-event"
        data-cy="menu-item-close-event"
        text="Close event"
        disabled={!isOpen}
        onClick={() => {
          if (setEventIdCallback) setEventIdCallback('');
          closeCallback(selectedEventId);
        }}
        onMouseEnter={() => setActionType('close')}
        onMouseLeave={() => setActionType(null)}
      />
      {/* position of Duplicate option is different in Events list from the Map */}
      {!isMapContextMenu ? (
        <DuplicateMenuItem
          numberOfEventsAffectedByAction={numberOfEventsAffectedByAction}
          handleDuplicate={handleDuplicate}
          setActionType={setActionType}
        />
      ) : undefined}
      {includeEventDetailsMenuItem ? (
        <MenuItem
          className="menu-item-event-details"
          text="Open event details"
          disabled={validActionTargetEventIds.length !== 1}
          label={
            keyboardShortcutConfigs?.clickEvents?.showEventDetails
              ? formatHotkeyString(
                  getKeyboardShortcutCombos(
                    keyboardShortcutConfigs?.clickEvents?.showEventDetails,
                    keyboardShortcutConfigs
                  )[0]
                )
              : ''
          }
          onClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
            showEventDetails(
              event,
              {
                time: entityProperties?.time,
                latitudeDegrees: entityProperties?.latitudeDegrees,
                longitudeDegrees: entityProperties?.longitudeDegrees,
                depthKm: entityProperties?.depthKm,
                eventId: selectedEventId
              },
              {
                onClose: () => {
                  setEventActionTargets([]);
                }
              }
            );
          }}
          onMouseEnter={() => setActionType('details')}
          onMouseLeave={() => setActionType(null)}
        />
      ) : undefined}
      {/* position of Duplicate option is different in Map from the Events list */}
      {isMapContextMenu ? (
        <DuplicateMenuItem
          numberOfEventsAffectedByAction={numberOfEventsAffectedByAction}
          handleDuplicate={handleDuplicate}
          setActionType={setActionType}
        />
      ) : undefined}
      <MenuItem
        className="menu-item-delete-event"
        data-cy="menu-item-delete-event"
        text={`Delete ${numberOfEventsAffectedByAction} selected event${
          numberOfEventsAffectedByAction === 1 ? '' : 's'
        }`}
        disabled={numberOfEventsAffectedByAction === 0}
        onClick={handleDelete}
        onMouseEnter={() => setActionType('delete')}
        onMouseLeave={() => setActionType(null)}
      />
      <MenuItem
        className="menu-item-reject-event"
        data-cy="menu-item-reject-event"
        text={`Reject ${numberOfEventsAffectedByAction} selected event${
          numberOfEventsAffectedByAction === 1 ? '' : 's'
        }`}
        disabled={numberOfEventsAffectedByAction === 0}
        onClick={handleReject}
        onMouseEnter={() => setActionType('reject')}
        onMouseLeave={() => setActionType(null)}
      />
    </Menu>
  );
}

/**
 * Shows the {@link EventMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link EventMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showEventMenu = (
  event: React.MouseEvent | MouseEvent,
  props: EventMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const {
    closeCallback,
    deleteCallback,
    duplicateCallback,
    includeEventDetailsMenuItem,
    isMapContextMenu,
    isOpen,
    openCallback,
    rejectCallback,
    selectedEventId,
    setCreateEventMenuState,
    entityProperties,
    latitude,
    longitude,
    setEventIdCallback
  } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <EventMenu
        closeCallback={closeCallback}
        deleteCallback={deleteCallback}
        duplicateCallback={duplicateCallback}
        includeEventDetailsMenuItem={includeEventDetailsMenuItem}
        isMapContextMenu={isMapContextMenu}
        isOpen={isOpen}
        openCallback={openCallback}
        rejectCallback={rejectCallback}
        selectedEventId={selectedEventId}
        setCreateEventMenuState={setCreateEventMenuState}
        entityProperties={entityProperties}
        latitude={latitude}
        longitude={longitude}
        setEventIdCallback={setEventIdCallback}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
