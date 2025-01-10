import {
  selectSelectedSdIds,
  useAppSelector,
  useCreateNewEvent,
  useViewableInterval
} from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import React from 'react';
import { toast } from 'react-toastify';

import type { CreateEventMenuState } from '../menus/create-event-menu-item';

const logger = UILogger.create('GMS_EVENT_HOOKS', process.env.GMS_EVENT_HOOKS);

/**
 * @param setCreateEventMenuState state-setter for displaying the
 * Create Virtual Event dialog
 *
 * @returns function that determines whether to create a new event (when
 * signal detections are selected) or open the Create Event dialog (when
 * no SDs are selected)
 */
export function useCreateEventInteractionHandler(
  setCreateEventMenuState: (value: CreateEventMenuState) => void
) {
  const [viewableInterval] = useViewableInterval();
  // Events cannot be created if there is no open interval
  const disabled = React.useMemo(
    () => !(viewableInterval?.startTimeSecs && viewableInterval?.endTimeSecs),
    [viewableInterval?.endTimeSecs, viewableInterval?.startTimeSecs]
  );

  const createNewEvent = useCreateNewEvent();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);

  return React.useCallback(async () => {
    if (disabled) {
      logger.info('Events cannot be created without an open interval');
      return;
    }
    if (selectedSdIds?.length === 0) setCreateEventMenuState({ visibility: true });
    else {
      await createNewEvent(selectedSdIds).catch(e =>
        toast.warn((e as Error).message, {
          toastId: 'toast-failed-to-create-event'
        })
      );
    }
  }, [createNewEvent, disabled, selectedSdIds, setCreateEventMenuState]);
}
