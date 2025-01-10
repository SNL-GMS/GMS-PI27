import { EventTypes } from '@gms/common-model';
import { SignalDetectionStatus } from '@gms/common-model/lib/signal-detection';
import { determineActionTargetsFromRightClickAndSetActionTargets } from '@gms/common-util';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import {
  analystActions,
  mapActions,
  selectActionTargetEventIds,
  selectActionType,
  selectIsSyncedWithWaveformZoom,
  selectMapLayerVisibility,
  selectOpenEventId,
  selectOpenGoldenLayoutDisplays,
  selectOpenIntervalName,
  selectSelectedEventIds,
  selectSelectedSdIds,
  selectSelectedStationsAndChannelIds,
  selectWorkflowTimeRange,
  setSelectedStationIds,
  useAppDispatch,
  useAppSelector,
  useAssociateSignalDetections,
  useEventStatusQuery,
  useGetEvents,
  useSetSignalDetectionActionTargets,
  useStationsVisibility,
  useUnassociateSignalDetections
} from '@gms/ui-state';
import { selectEventAssociationConflictIds } from '@gms/ui-state/lib/app/state/events/selectors';
import type Cesium from 'cesium';
import React from 'react';
import type { CesiumMovementEvent, EventTarget } from 'resium';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { showSignalDetectionMenu } from '~analyst-ui/common/menus/signal-detection-menu';

import { useSetCloseEvent } from '../events/events-util';
import {
  buildMapEventSource,
  getEventOnDoubleClickHandlers,
  getMapElement,
  getMousePositionFromCesiumMovement,
  intervalIsSelected,
  updateMapEventSources,
  waveformDisplayIsOpen
} from './map-utils';
import { showStationMenu } from './station-menu';
import type { MapEventSource } from './types';

/**
 * The hide/show station context menu should not be available (currently) unless the following is true:
 *
 * 1: An interval is selected
 *
 * 2: The waveform display is open (this condition may change later)
 *
 * if both of these conditions are true, then canOpenContext menu is set to true, and this function also returns that
 */
export const useHideShowContextMenuState = (): boolean => {
  const [canOpenContextMenu, setCanOpenContextMenu] = React.useState(false);
  const openDisplays = useAppSelector(selectOpenGoldenLayoutDisplays);
  const currentInterval = useAppSelector(selectWorkflowTimeRange);
  //! useEffect updates local state
  React.useEffect(() => {
    if (waveformDisplayIsOpen(openDisplays) && intervalIsSelected(currentInterval)) {
      setCanOpenContextMenu(true);
    } else {
      setCanOpenContextMenu(false);
    }
  }, [currentInterval, openDisplays]);

  return canOpenContextMenu;
};

/**
 * Get the map synced value from redux and return it
 *
 * @returns boolean
 */
export const useIsMapSyncedToWaveformZoom = (): boolean => {
  return useAppSelector(selectIsSyncedWithWaveformZoom);
};

/**
 * Set the map synced value into redux
 *
 * @param isSynced boolean
 * @returns void
 */
export const useSetIsMapSyncedToWaveformZoom = (isSynced: boolean): void => {
  const dispatch = useAppDispatch();
  dispatch(mapActions.setIsMapSyncedWithWaveformZoom(isSynced));
};

/**
 * Uses an array of event sources to produce data for map panel props
 *
 */
export const useMapPreferredEventData = (): MapEventSource[] => {
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const eventQuery = useGetEvents();
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const eventStatusQuery = useEventStatusQuery();
  const openEventId = useAppSelector(selectOpenEventId);
  const emptyArrayRef = React.useRef<MapEventSource[]>([]);
  const eventInConflictIds = useAppSelector(selectEventAssociationConflictIds);
  const layerVisibility = useAppSelector(selectMapLayerVisibility);
  const eventActionTargets = useAppSelector(selectActionTargetEventIds);
  const eventActionType = useAppSelector(selectActionType);

  return React.useMemo(() => {
    const eventsData =
      eventQuery.data.map(event => {
        let preferredEventHypothesis =
          EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(event, openIntervalName);
        if (preferredEventHypothesis?.preferredLocationSolution === undefined) {
          // Fall back to the parent hypothesis of the preferred
          preferredEventHypothesis = EventTypes.findEventHypothesisParent(
            event,
            preferredEventHypothesis
          );
        }
        if (preferredEventHypothesis === undefined) {
          return undefined;
        }
        const locationSolution = EventTypes.findPreferredLocationSolution(
          preferredEventHypothesis.id.hypothesisId,
          event.eventHypotheses
        );

        const eventStatus = eventStatusQuery.data?.[event.id];
        const eventInConflict = eventInConflictIds.includes(event.id);
        const eventIsActionTarget = eventActionTargets?.includes(event.id);
        const mapEventSource = buildMapEventSource(
          {
            event,
            eventStatus,
            eventIsOpen: openEventId === event.id,
            eventInConflict,
            eventIsActionTarget
          },
          locationSolution,
          openIntervalName,
          timeRange,
          eventActionType as AnalystWorkspaceTypes.EventActionTypes
        );

        return mapEventSource;
      }) || emptyArrayRef.current;
    // update the geoOverlappingEvents attribute now that we can compare the whole list of events
    const updatedEventsData: MapEventSource[] = updateMapEventSources(eventsData, layerVisibility);

    return updatedEventsData;
  }, [
    eventQuery.data,
    openIntervalName,
    timeRange,
    eventStatusQuery.data,
    openEventId,
    eventInConflictIds,
    layerVisibility,
    eventActionTargets,
    eventActionType
  ]);
};

/**
 * Uses an array of event sources to produce data for map panel props
 *
 */
export const useMapNonPreferredEventData = (): MapEventSource[] => {
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const eventQuery = useGetEvents();
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const eventStatusQuery = useEventStatusQuery();
  const openEventId = useAppSelector(selectOpenEventId);
  const emptyArrayRef = React.useRef<MapEventSource[]>([]);
  const eventInConflictIds = useAppSelector(selectEventAssociationConflictIds);
  const layerVisibility = useAppSelector(selectMapLayerVisibility);
  const eventActionTargets = useAppSelector(selectActionTargetEventIds);
  const eventActionType = useAppSelector(selectActionType);

  return React.useMemo(() => {
    const mapEventSources: MapEventSource[] = [];

    eventQuery.data.forEach(event => {
      const preferredEventHypothesis =
        EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(event, openIntervalName);
      const eventStatus = eventStatusQuery.data?.[event.id];
      const eventInConflict = eventInConflictIds?.includes(event.id) ?? false;
      const eventIsActionTarget = eventActionTargets?.includes(event.id);
      preferredEventHypothesis.locationSolutions.forEach(locationSolution => {
        if (locationSolution.id !== preferredEventHypothesis.preferredLocationSolution.id) {
          mapEventSources.push(
            buildMapEventSource(
              {
                event,
                eventStatus,
                eventIsOpen: openEventId === event.id,
                eventInConflict,
                eventIsActionTarget
              },
              locationSolution,
              openIntervalName,
              timeRange,
              eventActionType as AnalystWorkspaceTypes.EventActionTypes
            )
          );
        }
      });
    });
    // update the geoOverlappingEvents attribute now that we can compare the whole list of events
    const updatedMapEventSources: MapEventSource[] = updateMapEventSources(
      mapEventSources,
      layerVisibility
    );
    return updatedMapEventSources.length === 0 ? emptyArrayRef.current : updatedMapEventSources;
  }, [
    eventQuery.data,
    layerVisibility,
    openIntervalName,
    eventStatusQuery.data,
    eventInConflictIds,
    eventActionTargets,
    openEventId,
    timeRange,
    eventActionType
  ]);
};

/**
 * The on-left-click handler for station entities displayed on the map, defined as a custom hook.
 */
export const useStationOnClickHandler = (): ((targetEntity: Cesium.Entity) => () => void) => {
  const selectedStations = useAppSelector(selectSelectedStationsAndChannelIds);
  const dispatch = useAppDispatch();
  return React.useCallback(
    (targetEntity: Cesium.Entity) => () => {
      if (targetEntity?.properties?.type?.getValue() === 'Station') {
        if (selectedStations.includes(targetEntity.id) && selectedStations.length === 1) {
          dispatch(setSelectedStationIds([]));
        } else {
          dispatch(setSelectedStationIds([targetEntity.id]));
        }
      }
    },
    [selectedStations, dispatch]
  );
};

/**
 * The on-left-click handler for event entities displayed on the map, defined as a custom hook.
 */
export const useEventOnClickHandler = (): ((targetEntity: Cesium.Entity) => () => void) => {
  const dispatch = useAppDispatch();
  const selectedEvents = useAppSelector(selectSelectedEventIds);
  return React.useCallback(
    (targetEntity: Cesium.Entity) => () => {
      if (targetEntity?.properties?.type?.getValue() === 'Event location') {
        if (selectedEvents.includes(targetEntity.id) && selectedEvents.length === 1) {
          dispatch(analystActions.setSelectedEventIds([]));
        } else {
          dispatch(analystActions.setSelectedEventIds([targetEntity.id]));
        }
      }
    },
    [dispatch, selectedEvents]
  );
};
// */

/**
 * Returns the left-click handler for signal detections on the map display
 *
 * @param
 * @param targetEntity
 */
export const useSdOnClickHandler = (): ((targetEntity: Cesium.Entity) => () => void) => {
  const dispatch = useAppDispatch();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  return React.useCallback(
    (targetEntity: Cesium.Entity) => () => {
      if (targetEntity?.properties?.type?.getValue() === 'Signal detection') {
        if (selectedSdIds.includes(targetEntity.id) && selectedSdIds.length === 1) {
          dispatch(analystActions.setSelectedSdIds([]));
        } else {
          dispatch(analystActions.setSelectedSdIds([targetEntity.id]));
        }
      }
    },
    [dispatch, selectedSdIds]
  );
};

/**
 * @return the signal detection double-click handler, which will associate or unassociate
 * the SD that has been double-clicked.
 */
export const useSdOnDoubleClickHandler = () => {
  const unassociateSignalDetections = useUnassociateSignalDetections();
  const associateSignalDetections = useAssociateSignalDetections();
  return React.useCallback(
    (movement: CesiumMovementEvent, targetEntity: EventTarget) => {
      return !targetEntity?.id.properties?.associated?.getValue() ||
        targetEntity?.id.properties?.status?.getValue() === SignalDetectionStatus.OTHER_ASSOCIATED
        ? associateSignalDetections([targetEntity.id.id])
        : unassociateSignalDetections([targetEntity.id.id]);
    },
    [associateSignalDetections, unassociateSignalDetections]
  );
};

/**
 * Returns all click handlers related to signal detections
 */
export const useSignalDetectionClickHandlers = () => {
  const sdOnClickHandler = useSdOnClickHandler();
  const sdOnDoubleClickHandler = useSdOnDoubleClickHandler();

  return {
    sdOnClickHandler,
    sdOnDoubleClickHandler
  };
};

/**
 * Returns the right-click handler for signal detections on the map display
 *
 * @param setPhaseMenuVisibilityCb the callbacks for for setting the phase menu visible
 */
export const useSignalDetectionOnRightClickHandler = (
  setPhaseMenuVisibilityCb: (visibility: boolean) => void,
  setCreateEventMenuState: (value: CreateEventMenuState) => void
) => {
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();

  return React.useCallback(
    (
      movement: CesiumMovementEvent,
      target: Cesium.Entity,
      latitude: number,
      longitude: number
    ): void => {
      const menuPosition = getMousePositionFromCesiumMovement(movement);

      // set action target(s)
      determineActionTargetsFromRightClickAndSetActionTargets(
        selectedSdIds,
        target.id,
        setSignalDetectionActionTargets
      );

      showSignalDetectionMenu(
        new MouseEvent('contextmenu', {
          clientX: menuPosition.x,
          clientY: menuPosition.y
        }),
        {
          createEventMenuProps: {
            latitude,
            longitude,
            setCreateEventMenuState
          },
          setPhaseMenuVisibilityCb
        },
        {
          activeElementOnClose: getMapElement(),
          onClose: () => {
            setSignalDetectionActionTargets([]);
          }
        }
      );
    },
    [
      selectedSdIds,
      setCreateEventMenuState,
      setPhaseMenuVisibilityCb,
      setSignalDetectionActionTargets
    ]
  );
};

/**
 * returns the onRightClickHandler function used for bringing up a context menu on the map
 */
export const useStationOnRightClickHandler = (
  setCreateEventMenuState: (value: CreateEventMenuState) => void
) => {
  const canShowContextMenu = useHideShowContextMenuState();
  const { setStationVisibility, isStationVisible } = useStationsVisibility();

  return React.useCallback(
    (
      movement: CesiumMovementEvent,
      target: Cesium.Entity,
      latitude: number,
      longitude: number
    ): void => {
      const menuPosition = getMousePositionFromCesiumMovement(movement);
      showStationMenu(
        new MouseEvent('contextmenu', { clientX: menuPosition.x, clientY: menuPosition.y }),
        {
          target,
          canShowContextMenu,
          latitude,
          longitude,
          setCreateEventMenuState,
          setStationVisibility,
          isStationVisible
        },
        { activeElementOnClose: getMapElement() }
      );
    },
    [canShowContextMenu, setCreateEventMenuState, setStationVisibility, isStationVisible]
  );
};

/**
 * Return the double-click handler for an event on the map.
 */
export const useEventDoubleClickHandler = (setEventId: (eventId: string) => void) => {
  const dispatch = useAppDispatch();
  const closeEvent = useSetCloseEvent();
  const openEventId = useAppSelector(selectOpenEventId);

  return React.useMemo(
    () => getEventOnDoubleClickHandlers(dispatch, openEventId, closeEvent, setEventId),
    [dispatch, openEventId, closeEvent, setEventId]
  );
};
