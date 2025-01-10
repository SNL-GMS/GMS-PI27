import { UILogger } from '@gms/ui-util';
import {
  type Action,
  createListenerMiddleware,
  type ListenerMiddlewareInstance
} from '@reduxjs/toolkit';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import type { ThunkDispatch } from 'redux-thunk';

import { UIStateError } from '../../error-handling/ui-state-error';
import { selectOpenIntervalName } from '../../state';
import type { AppState } from '../../store';
import { addSignalDetections, createSignalDetection } from '../data';
import { selectSignalDetections } from '../data/selectors';
import type { GetFilterDefinitionsForSignalDetectionsQueryArgs } from '../data/signal-detection/get-filter-definitions-for-signal-detections';
import {
  getFilterDefinitionsForSignalDetections,
  getFilterDefinitionsForSignalDetectionsAsyncThunkQuery,
  getFilterDefinitionsForSignalDetectionsQuery,
  reduceSignalDetectionsForFilterDefinitionQuery
} from '../data/signal-detection/get-filter-definitions-for-signal-detections';
import { getSignalDetectionsWithSegmentsByStationAndTime } from '../data/signal-detection/get-signal-detections-segments-by-station-time';
import { dataPopulationOnError, isIntervalOpen, isRejectedAction } from './util';

const logger = UILogger.create(
  'GMS_FETCH_FILTER_DEFINITIONS',
  process.env.GMS_FETCH_FILTER_DEFINITIONS
);

/** rejected actions to listen for to retry the middleware action */
const listenerRejectedActions: string[] = [
  `${getFilterDefinitionsForSignalDetectionsAsyncThunkQuery.typePrefix}/rejected`
];

/** actions to listen for to perform the middleware action */
const listenerActions: string[] = [
  addSignalDetections.type,
  createSignalDetection.type,
  `${getSignalDetectionsWithSegmentsByStationAndTime.typePrefix}/fulfilled`,
  // registered reject action; used for retrying the request on failure
  ...listenerRejectedActions
];

type ActionType = typeof getFilterDefinitionsForSignalDetectionsAsyncThunkQuery;
type MiddlewareListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<ActionType>>,
  unknown
>;

export const populateFilterDefinitionsForSignalDetectionsMiddleware: MiddlewareListener =
  createListenerMiddleware({ onError: dataPopulationOnError, extra: {} });

populateFilterDefinitionsForSignalDetectionsMiddleware.startListening({
  predicate: (action: Action, currentState: AppState): action is Action =>
    includes(listenerActions, action.type) &&
    isIntervalOpen(currentState) &&
    Object.entries(selectSignalDetections(currentState)).length > 0,
  effect: (action: Action, listenerApi) => {
    const state = listenerApi.getState();
    listenerApi.fork(() => {
      const openIntervalName = selectOpenIntervalName(state);
      const signalDetections = selectSignalDetections(state);
      const reducedSDs = reduceSignalDetectionsForFilterDefinitionQuery(signalDetections);

      const args: GetFilterDefinitionsForSignalDetectionsQueryArgs = {
        stageId: {
          name: openIntervalName
        },
        signalDetections: reducedSDs
      };
      // only fetch if the args are valid
      if (getFilterDefinitionsForSignalDetectionsQuery.shouldSkip(args)) {
        return;
      }
      // if the previous request to {@link getFilterDefinitionsForSignalDetections} was rejected
      // and the args have changed then do not allow the retry of the request
      if (isRejectedAction(action, listenerRejectedActions) && !isEqual(args, action.meta.arg)) {
        return;
      }
      listenerApi
        .dispatch(getFilterDefinitionsForSignalDetections(args.stageId, args.signalDetections))
        .catch(error => {
          logger.error(
            `Failed to fetch filter definitions for signal detections`,
            new UIStateError(error)
          );
        });
    });
  }
});
