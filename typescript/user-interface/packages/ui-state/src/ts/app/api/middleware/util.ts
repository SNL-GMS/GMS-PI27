import { UILogger } from '@gms/ui-util';
import type { SerializedAxiosError } from '@gms/ui-workers';
import type { Action } from '@reduxjs/toolkit';
import type {
  ListenerErrorHandler,
  ListenerErrorInfo
} from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import includes from 'lodash/includes';

import { selectOpenIntervalName } from '../../state/workflow/selectors';
import type { AppState } from '../../store';

/** returns the environment variable string that is used for data population logging and debugging */
export const GMS_DATA_POPULATION = 'GMS_DATA_POPULATION' as const;

/** returns environment variable setting for the data population logging and debugging  */
export const ENV_GMS_DATA_POPULATION = process.env[GMS_DATA_POPULATION];

export const dataPopulationLogger = UILogger.create(GMS_DATA_POPULATION, ENV_GMS_DATA_POPULATION);

const INFO = 'Data Population Middleware:' as const;

export const dataPopulationOnError: ListenerErrorHandler = (
  error: unknown,
  errorInfo: ListenerErrorInfo
) => {
  dataPopulationLogger.error(`${INFO} error occurred`, error, errorInfo);
};

export function isIntervalOpen(state: AppState) {
  const openIntervalName = selectOpenIntervalName(state);

  return openIntervalName != null && openIntervalName !== '';
}

/**
 * @example isRejectedAction(action,
 *                           [`${getEventsWithDetectionsAndSegmentsByTime.typePrefix}/rejected`])
 *
 * @param action to be checked for failure
 * @param rejectedActions array of all rejected actions that the caller wants to identify
 * @returns true if {action} is included in {rejectedActions} array
 */
export function isRejectedAction<T = unknown>(
  action: Action,
  rejectedActions: string[]
): action is {
  type: string;
  payload: SerializedAxiosError;
  error: { message: string };
  meta: { arg: T };
} {
  return includes(rejectedActions, action.type);
}
