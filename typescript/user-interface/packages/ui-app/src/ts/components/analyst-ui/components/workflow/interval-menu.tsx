import { Menu, MenuItem } from '@blueprintjs/core';
import type { WorkflowTypes } from '@gms/common-model';
import {
  isActivityInterval,
  isInteractiveAnalysisStageInterval,
  isStageInterval
} from '@gms/common-model/lib/workflow/types';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu, useAppSelector } from '@gms/ui-state';
import flatMap from 'lodash/flatMap';
import React from 'react';

import { getWorkflowPanelElement } from './workflow-util';

export interface IntervalMenuProps {
  readonly interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval;
  readonly isSelectedInterval: boolean;
  readonly allActivitiesOpenForSelectedInterval: boolean;

  readonly openCallback: (
    interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
  ) => void;
  readonly closeCallback: (
    interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
  ) => void;
}

/**
 * Component that renders the interval context menu.
 */
export function IntervalMenu(props: IntervalMenuProps) {
  const openIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);
  const {
    interval,
    isSelectedInterval,
    allActivitiesOpenForSelectedInterval,
    openCallback,
    closeCallback
  } = props;

  const userName = useAppSelector(state => state.app.userSession.authenticationStatus.userName);

  const isDisabled =
    (allActivitiesOpenForSelectedInterval &&
      isSelectedInterval &&
      openIntervalName === interval.intervalId.definitionId.name) ||
    (isSelectedInterval && interval.intervalId.definitionId.name !== openIntervalName);

  // determine if the logged in user is an active analyst; if so allow them to close that interval
  let isActiveAnalyst = false;
  if (isStageInterval(interval)) {
    if (isInteractiveAnalysisStageInterval(interval)) {
      isActiveAnalyst = flatMap(interval.activityIntervals.map(a => a.activeAnalysts)).includes(
        userName
      );
    }
  } else if (isActivityInterval(interval)) {
    isActiveAnalyst = interval.activeAnalysts.includes(userName);
  }

  return (
    <Menu>
      <MenuItem
        className="menu-item-open-interval"
        data-cy="open-interval-btn"
        text={isActiveAnalyst && !isDisabled ? 'Reopen interval' : 'Open interval'}
        disabled={isDisabled}
        onClick={() => openCallback(interval)}
      />
      <MenuItem
        className="menu-item-close-interval"
        data-cy="close-interval-btn"
        text="Close interval"
        disabled={!isSelectedInterval && !isActiveAnalyst}
        onClick={() => closeCallback(interval)}
      />
    </Menu>
  );
}

/**
 * Shows the {@link IntervalMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link IntervalMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showIntervalMenu = (
  event: React.MouseEvent | MouseEvent,
  props: IntervalMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: getWorkflowPanelElement(),
    onClose: undefined
  }
) => {
  const {
    allActivitiesOpenForSelectedInterval,
    closeCallback,
    interval,
    isSelectedInterval,
    openCallback
  } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <IntervalMenu
        allActivitiesOpenForSelectedInterval={allActivitiesOpenForSelectedInterval}
        closeCallback={closeCallback}
        interval={interval}
        isSelectedInterval={isSelectedInterval}
        openCallback={openCallback}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
