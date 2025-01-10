import React from 'react';

import { analystActions } from '../state';
import type { ActionTypes } from '../state/analyst/types';
import { useAppDispatch } from './react-redux-hooks';

export const useSetActionType = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (actionType: ActionTypes) => {
      dispatch(analystActions.setActionType(actionType));
    },
    [dispatch]
  );
};

/**
 * Sets event action targets
 *
 * @param targetIds sd ids
 */
export const useSetEventActionTargets = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (targetIds: string[]) => {
      dispatch(analystActions.setActionTargetEventIds(targetIds));
    },
    [dispatch]
  );
};

/**
 * Sets signal detection action targets
 *
 * @param targetIds sd ids
 */
export const useSetSignalDetectionActionTargets = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (targetIds: string[]) => {
      dispatch(analystActions.setActionTargetSignalDetectionIds(targetIds));
    },
    [dispatch]
  );
};
