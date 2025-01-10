import { determineActionTargetsFromRightClickAndSetActionTargets } from '@gms/common-util';
import {
  selectOpenEventId,
  selectSelectedEventIds,
  useAppDispatch,
  useAppSelector,
  useDeleteEvents,
  useDuplicateEvents,
  useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected,
  useRejectEvents,
  useSetEventActionTargets,
  useSetSelectedEventIds
} from '@gms/ui-state';
import type Cesium from 'cesium';
import React from 'react';
import type { CesiumMovementEvent } from 'resium';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { showEventMenu } from '~analyst-ui/common/menus/event-menu';

import { useSetCloseEvent } from '../events/events-util';
import type { EventRow } from '../events/types';
import { dispatchSetEventId, getMapElement, getMousePositionFromCesiumMovement } from './map-utils';
import type { MapRightClickHandler } from './types';

/**
 * Return the right-click handler for an event on the map.
 */
export const useEventRightClickHandler = (
  setEventId: (eventId: string) => void,
  setCreateEventMenuState: (value: CreateEventMenuState) => void
): MapRightClickHandler => {
  const closeEvent = useSetCloseEvent();
  const openEventId = useAppSelector(selectOpenEventId);
  const dispatch = useAppDispatch();

  const selectedEventIds = useAppSelector(selectSelectedEventIds);

  const setSelectedEventIds = useSetSelectedEventIds();
  const duplicateEvents = useDuplicateEvents();
  const rejectEvents = useRejectEvents();
  const deleteEvents = useDeleteEvents();
  const getQualifiedAndUnqualifiedEventActionTargetIdsFromSelected =
    useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected();
  const setEventActionTargets = useSetEventActionTargets();

  return React.useCallback(
    (movement: CesiumMovementEvent, target: Cesium.Entity, latitude: number, longitude: number) => {
      const menuPosition = getMousePositionFromCesiumMovement(movement);
      const entityProperties = target?.properties?.event?.getValue() as EventRow;

      const { actionTargets: eventIdsForAction } =
        determineActionTargetsFromRightClickAndSetActionTargets(
          selectedEventIds,
          entityProperties.id,
          setEventActionTargets
        );

      const eventActionTargetIdsFromSelected =
        getQualifiedAndUnqualifiedEventActionTargetIdsFromSelected();

      showEventMenu(
        new MouseEvent('contextmenu', { clientX: menuPosition.x, clientY: menuPosition.y }),
        {
          latitude,
          longitude,
          selectedEventId: target.properties.id.getValue(),
          isOpen: target.properties.id.getValue() === openEventId,
          entityProperties,
          includeEventDetailsMenuItem: true,
          isMapContextMenu: true,
          openCallback: eventId => {
            dispatchSetEventId(eventId, dispatch, setEventId);
          },
          closeCallback: closeEvent,
          duplicateCallback: () => {
            duplicateEvents(eventIdsForAction);
          },
          rejectCallback: () => {
            rejectEvents(eventIdsForAction);
            // unqualified action targets remain selected after reject
            setSelectedEventIds(eventActionTargetIdsFromSelected.unqualified);
          },
          deleteCallback: () => {
            // filter out the event id's which are qualified action targets
            deleteEvents(eventIdsForAction);
            // unqualified action targets remain selected after delete
            setSelectedEventIds(eventActionTargetIdsFromSelected.unqualified);
          },
          setEventIdCallback: setEventId,
          setCreateEventMenuState
        },
        {
          activeElementOnClose: getMapElement(),
          onClose: () => {
            setEventActionTargets([]);
          }
        }
      );
    },
    [
      closeEvent,
      deleteEvents,
      dispatch,
      duplicateEvents,
      getQualifiedAndUnqualifiedEventActionTargetIdsFromSelected,
      openEventId,
      rejectEvents,
      selectedEventIds,
      setCreateEventMenuState,
      setEventActionTargets,
      setEventId,
      setSelectedEventIds
    ]
  );
};
