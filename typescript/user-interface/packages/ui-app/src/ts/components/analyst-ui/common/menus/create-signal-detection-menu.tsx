import { Menu, MenuItem } from '@blueprintjs/core';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu, useKeyboardShortcutConfigurations } from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import React from 'react';

import {
  formatHotkeyString,
  getKeyboardShortcutCombos
} from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

const logger = UILogger.create(
  'GMS_LOG_SIGNAL_DETECTION_CONTEXT_MENU',
  process.env.GMS_LOG_WORKFLOW_COMMANDS
);

export interface CreateSignalDetectionMenuProps {
  channelId: string;
  timeSecs: number;
  currentPhase?: string;
  defaultSignalDetectionPhase?: string;
  createSignalDetection: (
    stationId: string,
    channelName: string,
    timeSecs: number,
    phase?: string,
    isTemporary?: boolean
  ) => void;
  showCreateSignalDetectionPhaseSelector: (
    stationId: string,
    channelName: string,
    timeSecs: number,
    isTemporary?: boolean
  ) => void;
}

/**
 * Props are passed in by the createSignalDetectionCb call when it gets triggered.
 * This is a render prop of the imperative context menu, which will pass the props set
 * by that callback.
 * Note, unlike for normal components, props may be undefined, so we have to guard against that
 *  */
export function CreateSignalDetectionMenu(props: CreateSignalDetectionMenuProps) {
  const keyboardShortcutConfig = useKeyboardShortcutConfigurations();

  return (
    <Menu className="create-sd-menu">
      <MenuItem
        text="Create signal detection associated to a waveform with current phase"
        label={
          keyboardShortcutConfig?.clickEvents?.createSignalDetectionWithCurrentPhase
            ? formatHotkeyString(
                `${keyboardShortcutConfig.clickEvents.createSignalDetectionWithCurrentPhase?.combos[0]}+click`
              )
            : ''
        }
        onClick={() => {
          logger.info(
            'Create signal detection associated to a waveform with current phase (e + click)'
          );
          try {
            props?.createSignalDetection(
              props?.channelId,
              undefined,
              props?.timeSecs,
              props?.currentPhase
            );
          } catch (e) {
            logger.error(e);
          }
        }}
      />
      <MenuItem
        text="Create signal detection associated to a waveform with default phase"
        label={
          keyboardShortcutConfig?.clickEvents?.createSignalDetectionWithDefaultPhase
            ? formatHotkeyString(
                `${keyboardShortcutConfig.clickEvents.createSignalDetectionWithDefaultPhase?.combos[0]}+click`
              )
            : ''
        }
        onClick={() => {
          logger.info(
            'Create signal detection associated to a waveform with default phase (alt + e + click)'
          );
          try {
            props?.createSignalDetection(
              props?.channelId,
              undefined,
              props?.timeSecs,
              props?.defaultSignalDetectionPhase
            );
          } catch (e) {
            logger.error(e);
          }
        }}
      />
      <MenuItem
        text="Create signal detection associated to a waveform with chosen phase"
        label={
          keyboardShortcutConfig?.clickEvents?.createSignalDetectionWithChosenPhase
            ? formatHotkeyString(
                `${keyboardShortcutConfig.clickEvents.createSignalDetectionWithChosenPhase?.combos[0]}+click`
              )
            : ''
        }
        onClick={() => {
          logger.info(
            'Create signal detection associated to a waveform with chosen phase (ctrl + e + click)'
          );
          try {
            props?.showCreateSignalDetectionPhaseSelector(
              props?.channelId,
              undefined,
              props?.timeSecs,
              false
            );
          } catch (e) {
            logger.error(e);
          }
        }}
      />
      <MenuItem
        text="Create signal detection not associated to a waveform with current phase"
        label={
          keyboardShortcutConfig?.clickEvents
            ?.createSignalDetectionNotAssociatedWithWaveformCurrentPhase
            ? formatHotkeyString(
                getKeyboardShortcutCombos(
                  keyboardShortcutConfig?.clickEvents
                    ?.createSignalDetectionNotAssociatedWithWaveformCurrentPhase,
                  keyboardShortcutConfig
                )[0]
              )
            : ''
        }
        onClick={() => {
          logger.info(
            'Create signal detection not associated to a waveform with current phase (shift + e + click)'
          );
          try {
            props?.createSignalDetection(
              props?.channelId,
              undefined,
              props?.timeSecs,
              props?.currentPhase,
              true
            );
          } catch (e) {
            logger.error(e);
          }
        }}
      />
      <MenuItem
        text="Create signal detection not associated to a waveform with default phase"
        label={
          keyboardShortcutConfig?.clickEvents
            ?.createSignalDetectionNotAssociatedWithWaveformDefaultPhase
            ? formatHotkeyString(
                `${keyboardShortcutConfig.clickEvents.createSignalDetectionNotAssociatedWithWaveformDefaultPhase?.combos[0]}+click`
              )
            : ''
        }
        onClick={() => {
          logger.info(
            'Create signal detection not associated to a waveform with default phase (shift + alt + e + click)'
          );
          try {
            props?.createSignalDetection(
              props?.channelId,
              undefined,
              props?.timeSecs,
              props?.defaultSignalDetectionPhase,
              true
            );
          } catch (e) {
            logger.error(e);
          }
        }}
      />
      <MenuItem
        text="Create signal detection not associated to a waveform with chosen phase"
        label={
          keyboardShortcutConfig?.clickEvents
            ?.createSignalDetectionNotAssociatedWithWaveformChosenPhase
            ? formatHotkeyString(
                `${keyboardShortcutConfig.clickEvents.createSignalDetectionNotAssociatedWithWaveformChosenPhase?.combos[0]}+click`
              )
            : ''
        }
        onClick={() => {
          logger.info(
            'Create signal detection not associated to a waveform with chosen phase (ctrl + shift + e + click)'
          );
          try {
            props?.showCreateSignalDetectionPhaseSelector(
              props?.channelId,
              undefined,
              props?.timeSecs,
              true
            );
          } catch (e) {
            logger.error(e);
          }
        }}
      />
    </Menu>
  );
}

/**
 * Shows the {@link CreateSignalDetectionMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link CreateSignalDetectionMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showCreateSignalDetectionMenu = (
  event: React.MouseEvent | MouseEvent,
  props: CreateSignalDetectionMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const {
    channelId,
    createSignalDetection,
    timeSecs,
    currentPhase,
    defaultSignalDetectionPhase,
    showCreateSignalDetectionPhaseSelector
  } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <CreateSignalDetectionMenu
        channelId={channelId}
        createSignalDetection={createSignalDetection}
        timeSecs={timeSecs}
        currentPhase={currentPhase}
        defaultSignalDetectionPhase={defaultSignalDetectionPhase}
        showCreateSignalDetectionPhaseSelector={showCreateSignalDetectionPhaseSelector}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
