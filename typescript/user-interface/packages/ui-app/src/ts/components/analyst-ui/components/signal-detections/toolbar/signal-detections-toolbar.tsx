import { Displays } from '@gms/common-model';
import { CheckboxDropdownToolbarItem, Toolbar } from '@gms/ui-core-components';
import type { AppDispatch } from '@gms/ui-state';
import {
  DisplayedSignalDetectionConfigurationEnum,
  selectDisplaySignalDetectionConfiguration,
  SignalDetectionColumn,
  signalDetectionsActions,
  useAppDispatch,
  useAppSelector
} from '@gms/ui-state';
import Immutable from 'immutable';
import React from 'react';

import { useCreateEventControl } from '~analyst-ui/common/toolbar-items/create-event-control';
import type { SignalDetectionsToolbarProps } from '~analyst-ui/components/signal-detections/types';
import {
  signalDetectionColumnDisplayStrings,
  signalDetectionSyncDisplayStrings,
  signalDetectionSyncLabelStrings,
  signalDetectionSyncRenderDividers
} from '~analyst-ui/components/signal-detections/types';
import { useSelectionInformationControl } from '~common-ui/common/selection-information';
import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { systemConfig } from '../../../config/system-config';
import { setFocusToSignalDetectionDisplay } from '../table/signal-detections-table-utils';
import { useSignalDetectionsCountToolbarItem } from './signal-detection-count-toolbar-item';

/**
 * Referentially-stable onChange handler function for the "Show Detections"
 * checkbox item
 */
export const showDetectionsOnChange =
  (reduxDispatch: AppDispatch) =>
  (event: any): void => {
    const eventObjectString = JSON.stringify(event);
    reduxDispatch(
      signalDetectionsActions.updateDisplayedSignalDetectionConfiguration(
        JSON.parse(eventObjectString)
      )
    );
  };

/**
 * Toolbar for the Signal Detections list display. Contains intractable elements
 * like buttons, checkboxes that can change the behavior/appearance of the display.
 */
export function SignalDetectionsToolbar(props: SignalDetectionsToolbarProps) {
  const {
    countEntryRecord,
    selectedSDColumnsToDisplay,
    setSelectedSDColumnsToDisplay,
    setCreateEventMenuState
  } = props;

  const [displayWidthPx] = useBaseDisplaySize();
  const dispatch = useAppDispatch();
  const displayedSignalDetectionConfigurationObject = useAppSelector(
    selectDisplaySignalDetectionConfiguration
  );

  const signalDetectionsCountToolbarItem = useSignalDetectionsCountToolbarItem(
    'signal detections count',
    countEntryRecord
  );
  const createEventControl = useCreateEventControl(setCreateEventMenuState, 'sdcreateevent');
  const selectionInformation = useSelectionInformationControl(
    'sdselectioninfo',
    Displays.IanDisplays.SIGNAL_DETECTIONS,
    setFocusToSignalDetectionDisplay
  );

  // Map of values to pass to the checkbox dropdown toolbar item
  const displayedSignalDetectionConfigurationMap: Immutable.Map<
    DisplayedSignalDetectionConfigurationEnum,
    boolean
  > = React.useMemo(
    () => Immutable.fromJS(displayedSignalDetectionConfigurationObject),
    [displayedSignalDetectionConfigurationObject]
  );

  const itemsLeft: JSX.Element[] = React.useMemo(
    () => [signalDetectionsCountToolbarItem, selectionInformation],
    [signalDetectionsCountToolbarItem, selectionInformation]
  );

  const itemRight: JSX.Element[] = React.useMemo(
    () => [
      <CheckboxDropdownToolbarItem
        key="SDdetections"
        label="Show Detections"
        menuLabel="Show Detections"
        tooltip="Set which detections are visible"
        cyData="sd-table-detections-toggle"
        enumToCheckedMap={displayedSignalDetectionConfigurationMap}
        checkboxEnum={DisplayedSignalDetectionConfigurationEnum}
        enumKeysToDisplayStrings={signalDetectionSyncDisplayStrings}
        enumKeysToDividerMap={signalDetectionSyncRenderDividers}
        enumKeysToLabelMap={signalDetectionSyncLabelStrings}
        onChange={showDetectionsOnChange(dispatch)}
      />,
      <CheckboxDropdownToolbarItem
        key="SDcolumns"
        label="Show Columns"
        menuLabel="Show Columns"
        tooltip="Set which columns are visible"
        onChange={setSelectedSDColumnsToDisplay}
        cyData="sd-table-column-picker"
        enumToCheckedMap={selectedSDColumnsToDisplay}
        checkboxEnum={SignalDetectionColumn}
        enumKeysToDisplayStrings={signalDetectionColumnDisplayStrings}
        itemSide="LEFT"
      />,
      createEventControl
    ],
    [
      createEventControl,
      dispatch,
      displayedSignalDetectionConfigurationMap,
      selectedSDColumnsToDisplay,
      setSelectedSDColumnsToDisplay
    ]
  );

  return (
    <Toolbar
      toolbarWidthPx={displayWidthPx}
      parentContainerPaddingPx={systemConfig.marginForToolbarPx}
      itemsLeft={itemsLeft}
      itemsRight={itemRight}
    />
  );
}
