import { MenuItem } from '@blueprintjs/core';
import { setDecimalPrecision, setDecimalPrecisionAsNumber } from '@gms/common-util';
import { hideImperativeContextMenu } from '@gms/ui-core-components';
import type { Coordinates } from '@gms/ui-state';
import {
  mapActions,
  selectSelectedSdIds,
  selectSelectedSignalDetectionsCurrentHypotheses,
  useAppDispatch,
  useAppSelector,
  useCreateNewEvent,
  useViewableInterval
} from '@gms/ui-state';
import React from 'react';
import { toast } from 'react-toastify';

import { useGetEventKeyboardShortcut } from '~analyst-ui/common/hotkey-configs/event-hotkey-configs';
import { formatHotkeyString } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

export interface CreateEventMenuState {
  visibility: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CreateEventMenuItemProps {
  /** In degrees */
  readonly latitude: number;
  /** In degrees */
  readonly longitude: number;
  /** set the create event menu state (visibility, latitude, longitude) */
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}

/**
 * Hook to wrap redux setCoordinates
 *
 * @returns a function to update the coordinates
 */
const useSetCoordinates = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (coordinates: Coordinates) => {
      dispatch(mapActions.setCoordinates(coordinates));
    },
    [dispatch]
  );
};

/**
 * Custom menu item for creating a new event on the Map display.
 * Displays the provided lat/lon to 3 decimal precision.
 */
export function CreateEventMenuItem(props: CreateEventMenuItemProps) {
  const { latitude, longitude, setCreateEventMenuState } = props;
  const createEventHotkeyConfig = useGetEventKeyboardShortcut().createNewEvent;
  const [viewableInterval] = useViewableInterval();
  const setCoordinates = useSetCoordinates();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const selectedSDHypos = useAppSelector(selectSelectedSignalDetectionsCurrentHypotheses);
  const createNewEvent = useCreateNewEvent();

  const createEventOnClick = React.useCallback(async () => {
    if (latitude !== undefined && longitude !== undefined) {
      if (selectedSdIds?.length === 0) {
        hideImperativeContextMenu({
          callback: () => {
            setCreateEventMenuState({ visibility: true, latitude, longitude });
          }
        });
      } else {
        try {
          await createNewEvent(selectedSdIds);
        } catch (e) {
          toast.warn((e as Error).message, {
            toastId: 'toast-failed-to-create-event'
          });
        }
      }
    }
  }, [createNewEvent, latitude, longitude, selectedSdIds, setCreateEventMenuState]);

  // disable create event context menu option if all selected sd's are deleted
  const allSDsAreDeleted: boolean =
    selectedSDHypos.length > 0 ? selectedSDHypos.filter(sd => !sd.deleted).length === 0 : false;

  // Events cannot be created if there is no open interval
  const noOpenInterval = !(viewableInterval?.startTimeSecs && viewableInterval?.endTimeSecs);

  let tooltipText: string;
  if (noOpenInterval) tooltipText = 'Select an interval to create an event';
  if (allSDsAreDeleted)
    tooltipText = 'Cannot create event. All selected signal detections are deleted.';

  return (
    <>
      <MenuItem
        className="menu-item-create-event"
        text={
          selectedSdIds.length > 0 ? (
            `Create event`
          ) : (
            <>
              Create event at{' '}
              <span className="menu-item-create-event__lat">
                {setDecimalPrecision(latitude, 3)}°/
              </span>
              <span className="menu-item-create-event__lon">
                {setDecimalPrecision(longitude, 3)}°
              </span>
            </>
          )
        }
        // Display purposes, so use only the first hotkey entry
        label={
          createEventHotkeyConfig?.combos && createEventHotkeyConfig.combos[0]
            ? formatHotkeyString(createEventHotkeyConfig.combos[0])
            : null
        }
        onClick={createEventOnClick}
        disabled={noOpenInterval || allSDsAreDeleted}
        title={tooltipText}
      />
      <MenuItem
        className="copy-lat-long-create-event"
        text="Copy Latitude/Longitude"
        onClick={async () => {
          setCoordinates({
            latitudeDegrees: setDecimalPrecisionAsNumber(latitude, 3),
            longitudeDegrees: setDecimalPrecisionAsNumber(longitude, 3)
          });
          await navigator.clipboard.writeText(
            `${setDecimalPrecision(latitude, 3)}/${setDecimalPrecision(longitude, 3)}`
          );
        }}
      />
    </>
  );
}
