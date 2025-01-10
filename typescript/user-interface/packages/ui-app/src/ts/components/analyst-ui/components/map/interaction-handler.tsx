import {
  selectSelectedEventIds,
  selectSelectedSdIds,
  selectSelectedStationsAndChannelIds,
  selectSignalDetections,
  useAppDispatch,
  useAppSelector,
  useSetEventActionTargets,
  useSetSignalDetectionActionTargets
} from '@gms/ui-state';
import * as Cesium from 'cesium';
import * as React from 'react';
import { ScreenSpaceEvent, ScreenSpaceEventHandler } from 'resium';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import type { MapHandlerProps } from '~common-ui/components/map/types';

import { useEventRightClickHandler } from './event-right-click-handler';
import {
  eventTooltipLabel,
  handleControlClick,
  handleRightClick,
  stationTooltipLabel,
  tooltipHandleAltClick,
  tooltipHandleMouseMove
} from './interaction-utils';
import { useSignalDetectionOnRightClickHandler, useStationOnRightClickHandler } from './map-hooks';
import { setFocusToMap } from './map-utils';

/**
 * This component creates and ScreenSpaceEventHandler along with a ScreenSpaceEvent of type mousemove
 * so that when an entity on the map has been hovered over a tooltip will appear.
 */
export const useInteractionHandler = (
  setPhaseMenuVisibilityCb: (visibility: boolean) => void,
  setEventId: (eventId: string) => void,
  setCreateEventMenuState: (value: CreateEventMenuState) => void
) => {
  // Get entity right-click handlers
  const stationRightClickHandler = useStationOnRightClickHandler(setCreateEventMenuState);
  const sdRightClickHandler = useSignalDetectionOnRightClickHandler(
    setPhaseMenuVisibilityCb,
    setCreateEventMenuState
  );
  const eventRightClickHandler = useEventRightClickHandler(setEventId, setCreateEventMenuState);

  const dispatch = useAppDispatch();
  const signalDetections = useAppSelector(selectSignalDetections);
  const selectedStationsAndChannelIds = useAppSelector(selectSelectedStationsAndChannelIds);
  const selectedEventIds = useAppSelector(selectSelectedEventIds);
  const selectedSignalDetectionIds = useAppSelector(selectSelectedSdIds);

  const setEventActionTargets = useSetEventActionTargets();
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();

  return React.useCallback(
    function InteractionHandler({ viewer }: MapHandlerProps) {
      if (viewer) {
        // check to see if we have a station tooltip entity to work with if not we add it
        if (!viewer.entities.getById('hoverLabelEntity')) {
          viewer.entities.add(stationTooltipLabel);
        }
        // check to see if we have an event tooltip entity to work with if not we add it
        if (!viewer.entities.getById('eventLabelEntity')) {
          viewer.entities.add(eventTooltipLabel);
        }
        return (
          <ScreenSpaceEventHandler key="IMTHandlers">
            <ScreenSpaceEvent
              action={event =>
                handleRightClick(
                  event,
                  viewer,
                  sdRightClickHandler,
                  stationRightClickHandler,
                  eventRightClickHandler,
                  setCreateEventMenuState
                )
              }
              type={Cesium.ScreenSpaceEventType.RIGHT_CLICK}
            />
            <ScreenSpaceEvent
              action={event =>
                tooltipHandleAltClick(
                  event,
                  viewer,
                  Object.values(signalDetections),
                  setEventActionTargets,
                  setSignalDetectionActionTargets
                )
              }
              type={Cesium.ScreenSpaceEventType.LEFT_DOWN}
              modifier={Cesium.KeyboardEventModifier.ALT}
            />
            <ScreenSpaceEvent
              action={event =>
                handleControlClick(
                  event,
                  viewer,
                  dispatch,
                  selectedStationsAndChannelIds,
                  selectedEventIds,
                  selectedSignalDetectionIds
                )
              }
              type={Cesium.ScreenSpaceEventType.LEFT_DOWN}
              modifier={Cesium.KeyboardEventModifier.CTRL}
            />
            <ScreenSpaceEvent
              action={event => tooltipHandleMouseMove(event, viewer)}
              type={Cesium.ScreenSpaceEventType.MOUSE_MOVE}
            />
            <ScreenSpaceEvent
              action={() => setFocusToMap()}
              type={Cesium.ScreenSpaceEventType.WHEEL}
            />
          </ScreenSpaceEventHandler>
        );
      }
      return null;
    },
    [
      dispatch,
      eventRightClickHandler,
      sdRightClickHandler,
      selectedEventIds,
      selectedSignalDetectionIds,
      selectedStationsAndChannelIds,
      setCreateEventMenuState,
      setEventActionTargets,
      setSignalDetectionActionTargets,
      signalDetections,
      stationRightClickHandler
    ]
  );
};
