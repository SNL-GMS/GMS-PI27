import { Menu, MenuItem } from '@blueprintjs/core';
import { recordLength } from '@gms/common-util';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import type { UIChannelSegmentRecord } from '@gms/ui-state';
import {
  showImperativeReduxContextMenu,
  useKeyboardShortcutConfigurationsWithValidation
} from '@gms/ui-state';
import type { WaveformLoadingState } from '@gms/ui-state/lib/app/state/waveform/types';
import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessUtil } from '@gms/weavess-core';
import React from 'react';

import { HideStationMenuItem } from '~analyst-ui/common/menus/hide-station-menu-item';
import { WaveformChannelExportMenuItem } from '~analyst-ui/common/menus/waveform-channel-export-menu-item';
import { formatHotkeyString } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { AmplitudeScalingOptions } from './components/waveform-controls/scaling-options';

export interface WaveformLabelMenuProps {
  readonly isDefaultChannel: boolean;
  readonly isMeasureWindow: boolean;
  readonly channelId: string;
  readonly selectedStationIds: string[];
  readonly manuallyScaledChannelIds: string[];
  readonly channelSegments: UIChannelSegmentRecord;
  readonly waveformClientState: WaveformLoadingState;
  readonly weavessStations: WeavessTypes.Station[];
  readonly amplitudeScaleOption: AmplitudeScalingOptions;
  readonly amplitudeMinValue: number;
  readonly amplitudeMaxValue: number;
  readonly showAllChannels: (stationName: string) => void;
  readonly hideStationOrChannel: (stationOrChannelName: string) => void;
  readonly scaleAllAmplitudes: (
    channelName: string,
    amplitudeMinValue: number,
    amplitudeMaxValue: number
  ) => void;
  readonly resetAmplitudeSelectedChannels: (channelIds: string[], isMeasureWindow: boolean) => void;
}

export const WaveformLabelMenu = React.memo(function WaveformLabelMenu(
  props: WaveformLabelMenuProps
): JSX.Element {
  const {
    isDefaultChannel,
    isMeasureWindow,
    channelId,
    selectedStationIds,
    manuallyScaledChannelIds,
    channelSegments,
    weavessStations,
    waveformClientState,
    amplitudeScaleOption,
    amplitudeMinValue,
    amplitudeMaxValue,
    showAllChannels,
    hideStationOrChannel,
    scaleAllAmplitudes,
    resetAmplitudeSelectedChannels
  } = props;

  const keyboardShortcuts = useKeyboardShortcutConfigurationsWithValidation();
  const scaleAllWaveformAmplitudeHotkey =
    keyboardShortcuts.hotkeys.scaleAllWaveformAmplitude.combos[0];
  const resetSelectedWaveformAmplitudeScalingHotkey =
    keyboardShortcuts.hotkeys.resetSelectedWaveformAmplitudeScaling.combos[0];

  // Target channels is the channel id if not in selected station ids
  // unless channel id is in the list of selected station ids
  const targetChannels = selectedStationIds.includes(channelId) ? selectedStationIds : [channelId];
  const manuallyScaledTargetChannels = selectedStationIds.filter(stationId =>
    manuallyScaledChannelIds.includes(stationId)
  );
  const showHideMenuItem = (
    <HideStationMenuItem
      stationName={channelId}
      hideStationCallback={() => {
        hideStationOrChannel(channelId);
      }}
    />
  );

  const hideSelectedStationMenuItem = (
    <MenuItem
      disabled={!selectedStationIds?.length}
      data-cy="hide-selected"
      className="hide-selected-stations-menu-item"
      onClick={() => {
        selectedStationIds.forEach(sta => {
          hideStationOrChannel(sta);
        });
      }}
      text="Hide selected stations/channels"
    />
  );

  /** Find the WeavessChannel to check if a waveform is loaded */
  const weavessChannel = WeavessUtil.findChannelInStations(weavessStations, channelId);

  // Check to see if there is a waveform loaded
  let disabledScaleAllChannel = true;
  if (weavessChannel) {
    disabledScaleAllChannel = recordLength(weavessChannel?.waveform?.channelSegmentsRecord) === 0;
  }

  const scaleAmplitudeChannelMenuItem = (
    <MenuItem
      data-cy="scale-all-channels"
      text="Scale all channels to match this one"
      // Only show the first hotkey
      labelElement={formatHotkeyString(scaleAllWaveformAmplitudeHotkey)}
      disabled={disabledScaleAllChannel}
      onClick={() => {
        scaleAllAmplitudes(channelId, amplitudeMinValue, amplitudeMaxValue);
      }}
    />
  );

  const numChannelText =
    (manuallyScaledTargetChannels.length === 1 && selectedStationIds.length === 1) ||
    isMeasureWindow
      ? `this channel`
      : `${manuallyScaledTargetChannels.length} selected channel(s)`;
  const resetSelectedText = `Reset manual amplitude scaling for ${numChannelText}`;
  const resetAmplitudeSelectedChannelsMenuItem = (
    <MenuItem
      data-cy="reset-amplitude-selected-channels"
      text={resetSelectedText}
      // Show first hotkey if not measure window or more than one target channels
      labelElement={
        targetChannels.length === 1 || isMeasureWindow
          ? ''
          : formatHotkeyString(resetSelectedWaveformAmplitudeScalingHotkey)
      }
      disabled={
        amplitudeScaleOption === AmplitudeScalingOptions.FIXED ||
        manuallyScaledTargetChannels.length === 0
      }
      onClick={() => resetAmplitudeSelectedChannels(targetChannels, isMeasureWindow)}
    />
  );

  const exportMenuItem = (
    <WaveformChannelExportMenuItem
      channelId={channelId}
      selectedStationIds={targetChannels}
      channelSegmentsRecord={channelSegments}
      disabled={waveformClientState.isLoading}
    />
  );

  const hideChannelMenuItem = (
    <MenuItem
      data-cy={`hide-${channelId}`}
      text={`Hide ${channelId}`}
      onClick={() => {
        hideStationOrChannel(channelId);
      }}
    />
  );

  const showAllHiddenChannelsMenuItem = (
    <MenuItem
      data-cy="show-hidden-channels"
      text="Show all hidden channels"
      onClick={() => {
        // Only show all hidden channels from a default channel (station)
        if (!isDefaultChannel) {
          throw new Error(
            `Show all channels context menu should not be used on a child channel ${channelId}`
          );
        }
        showAllChannels(channelId);
      }}
    />
  );

  if (isMeasureWindow) {
    return (
      <Menu>
        {scaleAmplitudeChannelMenuItem}
        {resetAmplitudeSelectedChannelsMenuItem}
        {exportMenuItem}
      </Menu>
    );
  }
  if (isDefaultChannel) {
    return (
      <Menu>
        {showHideMenuItem}
        {hideSelectedStationMenuItem}
        {showAllHiddenChannelsMenuItem}
        {scaleAmplitudeChannelMenuItem}
        {resetAmplitudeSelectedChannelsMenuItem}
        {exportMenuItem}
      </Menu>
    );
  }
  return (
    <Menu>
      {hideChannelMenuItem}
      {hideSelectedStationMenuItem}
      {scaleAmplitudeChannelMenuItem}
      {resetAmplitudeSelectedChannelsMenuItem}
      {exportMenuItem}
    </Menu>
  );
});

/**
 * Shows the {@link WaveformLabelMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link WaveformLabelMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showWaveformLabelMenu = (
  event: React.MouseEvent | MouseEvent,
  props: WaveformLabelMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const {
    amplitudeMaxValue,
    amplitudeMinValue,
    amplitudeScaleOption,
    channelId,
    channelSegments,
    hideStationOrChannel,
    isDefaultChannel,
    isMeasureWindow,
    resetAmplitudeSelectedChannels,
    scaleAllAmplitudes,
    selectedStationIds,
    manuallyScaledChannelIds,
    showAllChannels,
    waveformClientState,
    weavessStations
  } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <WaveformLabelMenu
        amplitudeMaxValue={amplitudeMaxValue}
        amplitudeMinValue={amplitudeMinValue}
        amplitudeScaleOption={amplitudeScaleOption}
        channelId={channelId}
        channelSegments={channelSegments}
        hideStationOrChannel={hideStationOrChannel}
        isDefaultChannel={isDefaultChannel}
        isMeasureWindow={isMeasureWindow}
        resetAmplitudeSelectedChannels={resetAmplitudeSelectedChannels}
        scaleAllAmplitudes={scaleAllAmplitudes}
        selectedStationIds={selectedStationIds}
        manuallyScaledChannelIds={manuallyScaledChannelIds}
        showAllChannels={showAllChannels}
        waveformClientState={waveformClientState}
        weavessStations={weavessStations}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
