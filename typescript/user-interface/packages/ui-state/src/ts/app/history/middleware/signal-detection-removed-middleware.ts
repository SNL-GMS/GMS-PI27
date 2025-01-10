import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type {
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  ListenerErrorInfo
} from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import includes from 'lodash/includes';
import intersection from 'lodash/intersection';
import without from 'lodash/without';
import { batch } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';

import { analystActions, fksActions } from '../../state';
import type { AppState } from '../../store';
import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import { undoRedo } from '../reducers';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

const INFO = 'Signal Detection Removed Middleware:' as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

type SignalDetectionRemovedActions =
  | typeof analystActions.setSelectedSdIds.type
  | typeof fksActions.setSdIdsToShowFk.type;

type SignalDetectionRemovedListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<SignalDetectionRemovedActions>>,
  unknown
>;

/** returns the signal detection ids that were removed (no longer in the current state) */
const determineRemovedSignalDetections = (original: AppState, state: AppState) => {
  return without(
    Object.keys(original.data.signalDetections),
    ...Object.keys(state.data.signalDetections)
  );
};

const signalDetectionRemovedMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/** the signal detection remove middleware - responsible updating state when signal detections are removed (e.g. selections) */
export const signalDetectionRemovedMiddleware: SignalDetectionRemovedListener =
  createListenerMiddleware(signalDetectionRemovedMiddlewareOptions);

signalDetectionRemovedMiddleware.startListening({
  type: undoRedo.type,
  effect: async function SignalDetectionRemovedMiddlewareEffect(action, listenerApi) {
    const original = listenerApi.getOriginalState();
    const state = listenerApi.getState();

    const task = listenerApi.fork(() => determineRemovedSignalDetections(original, state));
    const result = await task.result;

    if (result.status === 'ok') {
      logger.debug(`${INFO} completed`, action, result);
      const { value } = result;
      if (value.length > 0) {
        batch(() => {
          if (intersection(value, state.app.analyst.selectedSdIds).length > 0) {
            // removed signal detections can no longer be marked as selected
            listenerApi.dispatch(
              analystActions.setSelectedSdIds(
                state.app.analyst.selectedSdIds.filter(id => !includes(value, id))
              )
            );
          }

          if (intersection(value, state.app.fks.sdIdsToShowFk).length > 0) {
            // removed signal detections can no longer be marked as show fk
            listenerApi.dispatch(
              fksActions.setSdIdsToShowFk(
                state.app.fks.sdIdsToShowFk.filter(id => !includes(value, id))
              )
            );
          }
        });
      }
    } else if (result.status === 'cancelled') {
      logger.debug(`${INFO} canceled`, action, result);
    } else {
      logger.error(`${INFO} rejected`, action, result.error);
    }
  }
});
