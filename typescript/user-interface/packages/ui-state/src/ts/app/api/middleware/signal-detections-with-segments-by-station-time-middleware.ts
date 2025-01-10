import { convertToEntityReference } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import type { ThunkDispatch } from 'redux-thunk';

import { UIStateError } from '../../error-handling/ui-state-error';
import { selectOpenIntervalName, waveformActions } from '../../state';
import { selectStationsVisibility, selectViewableInterval } from '../../state/waveform/selectors';
import { getVisibleStationNamesFromStationVisibilityChangesDictionary } from '../../state/waveform/util';
import type { AppState } from '../../store';
import {
  getSignalDetectionsWithSegmentsByStationAndTime,
  getSignalDetectionsWithSegmentsByStationAndTimeQuery,
  type GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs
} from '../data/signal-detection/get-signal-detections-segments-by-station-time';
import { dataPopulationOnError, isRejectedAction } from './util';

const logger = UILogger.create(
  'GMS_FETCH_SIGNAL_DETECTION_MIDDLEWARE',
  process.env.GMS_FETCH_SIGNAL_DETECTION_MIDDLEWARE
);

/** rejected actions to listen for to retry the middleware action */
const listenerRejectedActions: string[] = [
  `${getSignalDetectionsWithSegmentsByStationAndTime.typePrefix}/rejected`
];

/** actions to listen for to perform the middleware action */
const listenerActions: string[] = [
  waveformActions.setViewableInterval.type,
  waveformActions.setStationsVisibility.type,
  // registered reject action; used for retrying the request on failure
  ...listenerRejectedActions
];

type ActionType = typeof getSignalDetectionsWithSegmentsByStationAndTime;

type MiddlewareListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<ActionType>>,
  unknown
>;

export const populateSignalDetectionsWithSegmentsByStationTimeMiddleware: MiddlewareListener =
  createListenerMiddleware({ onError: dataPopulationOnError, extra: {} });

populateSignalDetectionsWithSegmentsByStationTimeMiddleware.startListening({
  predicate: (action: Action): action is Action => includes(listenerActions, action.type),
  effect: (action: Action, listenerApi) => {
    const state = listenerApi.getState();

    listenerApi.fork(() => {
      const openIntervalName = selectOpenIntervalName(state);
      const viewableInterval = selectViewableInterval(state);
      const stationsVisibility = selectStationsVisibility(state);
      const visibleStationNames =
        getVisibleStationNamesFromStationVisibilityChangesDictionary(stationsVisibility);
      const visibleStationEntityReferences = visibleStationNames.map(stationName =>
        convertToEntityReference({ name: stationName }, 'name')
      );

      const args: GetSignalDetectionsWithSegmentsByStationsAndTimeQueryArgs = {
        startTime: viewableInterval.startTimeSecs ?? 0,
        endTime: viewableInterval.endTimeSecs ?? 0,
        stageId: {
          name: openIntervalName
        },
        stations: visibleStationEntityReferences,
        excludedSignalDetections: []
      };

      // only fetch if the args are valid
      if (getSignalDetectionsWithSegmentsByStationAndTimeQuery.shouldSkip(args)) {
        return;
      }

      // if the previous request to {@link getSignalDetectionsWithSegmentsByStationAndTime} was rejected
      // and the args have changed then do not allow the retry of the request
      if (isRejectedAction(action, listenerRejectedActions) && !isEqual(args, action.meta.arg)) {
        return;
      }

      listenerApi.dispatch(getSignalDetectionsWithSegmentsByStationAndTime(args)).catch(error => {
        logger.error(
          `Failed to fetch signal detections with segments by station and time`,
          new UIStateError(error)
        );
      });
    });
  }
});
