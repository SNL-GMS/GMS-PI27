import type { HotkeyConfig } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import { QCMaskTypes } from '@gms/common-model/lib/ui-configuration/types';
import type { NestedCheckboxListRecord, ToolbarTypes } from '@gms/ui-core-components';
import { NestedCheckboxDropdownToolbarItem } from '@gms/ui-core-components';
import {
  buildHotkeyConfigArray,
  selectWorkflowTimeRange,
  useAppDispatch,
  useAppSelector,
  useKeyboardShortcutConfigurations,
  waveformActions
} from '@gms/ui-state';
import Immutable from 'immutable';
import * as React from 'react';

import { KeyMark } from '../../../../../common-ui/components/keyboard-shortcuts/key-mark';

const qcCheckboxElements: NestedCheckboxListRecord[] = [
  {
    key: QCMaskTypes.QC_SEGMENTS,
    displayString: 'QC Segments',
    children: [
      { key: QCMaskTypes.ANALYST_DEFINED, displayString: 'Analyst Defined' },
      { key: QCMaskTypes.DATA_AUTHENTICATION, displayString: 'Data Authentication' },
      { key: QCMaskTypes.LONG_TERM, displayString: 'Long Term' },
      { key: QCMaskTypes.REJECTED, displayString: 'Rejected' },
      { key: QCMaskTypes.STATION_SOH, displayString: 'Station SOH' },
      { key: QCMaskTypes.UNPROCESSED, displayString: 'Unprocessed' },
      { key: QCMaskTypes.WAVEFORM, displayString: 'Waveform' }
    ]
  },
  { key: QCMaskTypes.PROCESSING_MASKS, displayString: 'Processing Masks' }
];

const qcMaskDividers = Immutable.Map<string, boolean>([
  [QCMaskTypes.QC_SEGMENTS, true],
  [QCMaskTypes.PROCESSING_MASKS, true]
]);

const buildQcMaskPicker = (
  maskVisibility: Record<string, boolean>,
  setMaskVisibility: (maskVisibilityMap: Record<string, boolean>) => void,
  maskColorRecord: Record<string, string>,
  widthPx: number,
  key: string | number,
  hotKey: string
): ToolbarTypes.ToolbarItemElement => {
  return (
    <NestedCheckboxDropdownToolbarItem
      key={key}
      label="QC Masks"
      tooltip="Show/Hide categories of QC masks"
      widthPx={widthPx}
      onPopoverDismissed={() => {
        // Do nothing
      }}
      checkBoxElements={qcCheckboxElements}
      keyToColorRecord={maskColorRecord}
      keyToCheckedRecord={maskVisibility}
      onChange={setMaskVisibility}
      keysToDividerMap={qcMaskDividers}
    >
      {hotKey ? (
        <div>
          Toggle all:
          {hotKey.split('+').map(hk => (
            <KeyMark key={`${hk}:${hotKey}`}>{hk}</KeyMark>
          ))}
        </div>
      ) : null}
    </NestedCheckboxDropdownToolbarItem>
  );
};

/**
 * QC mask control for the toolbar, or returns the previously created control
 * if none of the parameters have changed.  Handles the storing and retrieving of the redux values
 *
 * @param qcMaskDefaultVisibility The default visibility values from config
 * @param uiTheme the current color theme
 * @returns a toolbar item control for the QC masks
 */
export const useQcMaskControl = (
  qcMaskDefaultVisibility: Record<ConfigurationTypes.QCMaskTypes, boolean>,
  uiTheme: UITheme
): ToolbarTypes.ToolbarItemElement => {
  const widthPx = 110;
  const key = 'qcMaskControl';

  const maskVisibility = useAppSelector(state => state.app.waveform.maskVisibility);

  // start with the mask default visibility and add any changes in redux state
  const maskRecord: Record<string, boolean> = React.useMemo(
    () => ({
      ...qcMaskDefaultVisibility,
      ...maskVisibility
    }),
    [maskVisibility, qcMaskDefaultVisibility]
  );
  const dispatch = useAppDispatch();
  const setMaskVisibility = React.useCallback(
    value => dispatch(waveformActions.setMaskVisibility(value)),
    [dispatch]
  );

  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () =>
      buildQcMaskPicker(
        maskRecord,
        setMaskVisibility,
        uiTheme.colors.qcMaskColors,
        widthPx,
        key,
        // Only show the first hotkey
        keyboardShortcutConfigurations?.hotkeys?.toggleQcMaskVisibility?.combos[0]
      ),
    [
      maskRecord,
      setMaskVisibility,
      uiTheme.colors.qcMaskColors,
      keyboardShortcutConfigurations?.hotkeys?.toggleQcMaskVisibility?.combos
    ]
  );
};

/**
 * Enables the hotkey for toggling the QC Mask visibility.
 */
export const useToggleQcMaskVisibilityHotkeyConfig = (): HotkeyConfig[] => {
  const intervalTimeRange = useAppSelector(selectWorkflowTimeRange);
  const dispatch = useAppDispatch();

  const enabled = React.useMemo(
    () =>
      intervalTimeRange != null &&
      intervalTimeRange.startTimeSecs != null &&
      intervalTimeRange.endTimeSecs != null,
    [intervalTimeRange]
  );

  const callback = React.useCallback(() => {
    dispatch(waveformActions.toggleQcMaskVisibility());
  }, [dispatch]);

  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  const hotkey = React.useMemo(() => {
    return buildHotkeyConfigArray(
      keyboardShortcutConfigurations?.hotkeys?.toggleQcMaskVisibility,
      callback,
      undefined,
      !enabled
    );
  }, [callback, enabled, keyboardShortcutConfigurations]);
  return hotkey;
};
