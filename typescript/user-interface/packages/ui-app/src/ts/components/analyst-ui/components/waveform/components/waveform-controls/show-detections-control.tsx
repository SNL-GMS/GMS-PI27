import type { ToolbarTypes } from '@gms/ui-core-components';
import { CheckboxDropdownToolbarItem } from '@gms/ui-core-components';
import type { AppDispatch } from '@gms/ui-state';
import { useAppDispatch, useAppSelector, waveformActions } from '@gms/ui-state';
import { WaveformDisplayedSignalDetectionConfigurationEnum } from '@gms/ui-state/lib/app/state/waveform/types';
import Immutable from 'immutable';
import * as React from 'react';

import {
  signalDetectionSyncDisplayStrings,
  signalDetectionSyncLabelStrings,
  signalDetectionSyncRenderDividers
} from './types';

export const onChangeHandler =
  (reduxDispatch: AppDispatch) =>
  (event: any): void => {
    const eventObjectString = JSON.stringify(event);
    reduxDispatch(
      waveformActions.updateDisplayedSignalDetectionConfiguration(JSON.parse(eventObjectString))
    );
  };

/**
 * Builds toolbar item for waveform Show SDs button
 *
 * @param displayedSignalDetectionConfigurationMap Filter options
 * @param reduxDispatch
 */
export const buildShowDetectionsDropdown = (
  displayedSignalDetectionConfigurationMap: Immutable.Map<
    WaveformDisplayedSignalDetectionConfigurationEnum,
    boolean
  >,
  reduxDispatch: AppDispatch,
  key: string | number
): ToolbarTypes.ToolbarItemElement => (
  <CheckboxDropdownToolbarItem
    key={key}
    label="Show Detections"
    tooltip="Control visibility of signal detections"
    enumToCheckedMap={displayedSignalDetectionConfigurationMap}
    checkboxEnum={WaveformDisplayedSignalDetectionConfigurationEnum}
    enumKeysToDisplayStrings={signalDetectionSyncDisplayStrings}
    enumKeysToDividerMap={signalDetectionSyncRenderDividers}
    enumKeysToLabelMap={signalDetectionSyncLabelStrings}
    onChange={onChangeHandler(reduxDispatch)}
  />
);

/**
 * Hook to add Show SDs button in waveform toolbar
 */
export const useShowDetectionsControl = (key: string): ToolbarTypes.ToolbarItemElement => {
  const dispatch = useAppDispatch();
  const displayedSignalDetectionConfigurationObject = useAppSelector(
    state => state.app.waveform.displayedSignalDetectionConfiguration
  );

  const displayedSignalDetectionConfigurationMap: Immutable.Map<
    WaveformDisplayedSignalDetectionConfigurationEnum,
    boolean
  > = React.useMemo(
    () => Immutable.fromJS(displayedSignalDetectionConfigurationObject),
    [displayedSignalDetectionConfigurationObject]
  );

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () => buildShowDetectionsDropdown(displayedSignalDetectionConfigurationMap, dispatch, key),
    [dispatch, displayedSignalDetectionConfigurationMap, key]
  );
};
