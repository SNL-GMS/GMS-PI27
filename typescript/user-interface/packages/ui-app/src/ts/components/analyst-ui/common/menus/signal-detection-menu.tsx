import { SignalDetectionTypes } from '@gms/common-model';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import {
  selectActionTargetSignalDetectionIds,
  selectEvents,
  selectOpenEventId,
  selectOpenIntervalName,
  selectSignalDetections,
  selectWorkflowTimeRange,
  showImperativeReduxContextMenu,
  useAppSelector,
  useEventStatusQuery,
  useGetSdIdsToShowFk,
  useSetSdIdsToShowFk,
  useSetSignalDetectionActionTargets,
  useUiTheme
} from '@gms/ui-state';
import union from 'lodash/union';
import React from 'react';

import { showSignalDetectionDetails } from '../dialogs/signal-detection-details/signal-detection-details';
import type { CreateEventMenuItemProps } from './create-event-menu-item';
import { SignalDetectionMenuContent } from './signal-detection-menu-content';
import { canGenerateFk, getSignalDetectionDetailsProps } from './signal-detection-menu-utils';

export interface SignalDetectionMenuProps {
  readonly measurementMode?: AnalystWorkspaceTypes.MeasurementMode;
  readonly setMeasurementModeEntries?: (entries: Record<string, boolean>) => void;
  readonly setPhaseMenuVisibilityCb?: (visibility: boolean) => void;
  readonly createEventMenuProps?: CreateEventMenuItemProps;
  /**  Default is false. Shows/hides menu options specific to the Azimuth Slowness display */
  readonly isAzimuthSlownessContextMenu?: boolean;
}

export function SignalDetectionMenu({
  setMeasurementModeEntries,
  setPhaseMenuVisibilityCb,
  createEventMenuProps,
  isAzimuthSlownessContextMenu = false
}: SignalDetectionMenuProps) {
  const actionTargetSignalDetectionIds = useAppSelector(selectActionTargetSignalDetectionIds);
  const signalDetections = useAppSelector(selectSignalDetections);

  const actionTargetSds = actionTargetSignalDetectionIds.map(sdId => signalDetections[sdId]);

  let actionTargetSd;
  if (actionTargetSignalDetectionIds[0]) {
    actionTargetSd = Object.values(signalDetections).find(
      sd => sd.id === actionTargetSignalDetectionIds[0]
    );
  }

  const events = useAppSelector(selectEvents);
  const eventStatusQuery = useEventStatusQuery();
  const [uiTheme] = useUiTheme();
  const currentOpenEventId = useAppSelector(selectOpenEventId);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const intervalTimeRange = useAppSelector(selectWorkflowTimeRange);
  const setSdIdsToShowFk = useSetSdIdsToShowFk();
  const sdIdsToShowFk = useGetSdIdsToShowFk();

  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();

  /**
   * Opens the Signal Detections Details context menu
   */
  const signalDetectionDetailsOnClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      showSignalDetectionDetails(
        event,
        getSignalDetectionDetailsProps(
          actionTargetSd,
          Object.values(events),
          currentOpenEventId,
          eventStatusQuery.data,
          openIntervalName,
          intervalTimeRange,
          uiTheme
        ),
        {
          onClose: () => {
            setSignalDetectionActionTargets([]);
          }
        }
      );
    },
    [
      actionTargetSd,
      events,
      currentOpenEventId,
      eventStatusQuery.data,
      openIntervalName,
      intervalTimeRange,
      uiTheme,
      setSignalDetectionActionTargets
    ]
  );

  /**
   * Checks if a SD is deleted
   * Used to prevent showing FK's for deleted SD's
   *
   * @param signalDetection
   * @returns boolean
   */
  const isSDDeleted = (signalDetection: SignalDetectionTypes.SignalDetection) => {
    const signalDetectionHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
      signalDetection.signalDetectionHypotheses
    );
    if (!signalDetectionHypothesis) return false;
    return signalDetectionHypothesis.deleted;
  };

  /**
   * Sets or updates the signal detection ids to show FK based on
   * the selected signal detections.
   */
  const setSdIdsToShowFkOnClick = React.useCallback(() => {
    const selectedSdIdsToShowFk = actionTargetSds
      .filter(sd => sd && !isSDDeleted(sd) && canGenerateFk(sd))
      .map(sd => sd.id);
    if (selectedSdIdsToShowFk && selectedSdIdsToShowFk.length > 0) {
      setSdIdsToShowFk(union(sdIdsToShowFk, selectedSdIdsToShowFk));
    }
  }, [actionTargetSds, sdIdsToShowFk, setSdIdsToShowFk]);

  return (
    <SignalDetectionMenuContent
      setSdIdsToShowFkOnClick={setSdIdsToShowFkOnClick}
      signalDetectionDetailsOnClick={signalDetectionDetailsOnClick}
      setPhaseMenuVisibilityCb={setPhaseMenuVisibilityCb}
      setMeasurementModeEntries={setMeasurementModeEntries}
      createEventMenuProps={createEventMenuProps}
      isAzimuthSlownessContextMenu={isAzimuthSlownessContextMenu}
    />
  );
}

/**
 * Shows the {@link SignalDetectionMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link SignalDetectionMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showSignalDetectionMenu = (
  event: React.MouseEvent | MouseEvent,
  props: SignalDetectionMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const {
    createEventMenuProps,
    measurementMode,
    isAzimuthSlownessContextMenu,
    setMeasurementModeEntries,
    setPhaseMenuVisibilityCb
  } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <SignalDetectionMenu
        createEventMenuProps={createEventMenuProps}
        measurementMode={measurementMode}
        setMeasurementModeEntries={setMeasurementModeEntries}
        setPhaseMenuVisibilityCb={setPhaseMenuVisibilityCb}
        isAzimuthSlownessContextMenu={isAzimuthSlownessContextMenu}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
