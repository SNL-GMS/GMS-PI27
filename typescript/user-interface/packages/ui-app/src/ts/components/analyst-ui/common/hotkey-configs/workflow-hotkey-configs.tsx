import type { HotkeyConfig } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import type { HotkeyConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import {
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_HALF_SECOND,
  MILLISECONDS_IN_SECOND,
  MILLISECONDS_IN_WEEK
} from '@gms/common-util';
import { useKeyboardShortcutConfigurations } from '@gms/ui-state';
import throttle from 'lodash/throttle';
import React from 'react';

export interface WorkflowHotkeysProps {
  onPan: (seconds: number) => void;
}

const MILLISECONDS_TO_THROTTLE = MILLISECONDS_IN_HALF_SECOND / 4;

/**
 * @returns the HotkeyConfiguration for workflow
 */
export const useGetWorkflowKeyboardShortcut = (): {
  rightOneDay: HotkeyConfiguration;
  rightOneWeek: HotkeyConfiguration;
  leftOneDay: HotkeyConfiguration;
  leftOneWeek: HotkeyConfiguration;
} => {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  return React.useMemo(
    () => ({
      rightOneDay: keyboardShortcutConfigurations?.hotkeys?.workflowRightOneDay,
      rightOneWeek: keyboardShortcutConfigurations?.hotkeys?.workflowRightOneWeek,
      leftOneDay: keyboardShortcutConfigurations?.hotkeys?.workflowLeftOneDay,
      leftOneWeek: keyboardShortcutConfigurations?.hotkeys?.workflowLeftOneWeek
    }),
    [
      keyboardShortcutConfigurations?.hotkeys?.workflowLeftOneDay,
      keyboardShortcutConfigurations?.hotkeys?.workflowLeftOneWeek,
      keyboardShortcutConfigurations?.hotkeys?.workflowRightOneDay,
      keyboardShortcutConfigurations?.hotkeys?.workflowRightOneWeek
    ]
  );
};

export const useRightOneDayHotkeyConfig = (onPan: (seconds: number) => void) => {
  const hotkeyCombo = useGetWorkflowKeyboardShortcut();
  const hotkeys = hotkeyCombo.rightOneDay?.combos;
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    hotkeys?.forEach(hotkey => {
      // update HotkeyConfig once keyboardShortcutConfig loads
      if (hotkeyCombo && hotkeyCombo.rightOneDay)
        config.push({
          combo: hotkey,
          global: false,
          group: hotkeyCombo.rightOneDay.categories[0],
          label: hotkeyCombo.rightOneDay.description,
          onKeyDown: throttle(() => {
            onPan(MILLISECONDS_IN_DAY / MILLISECONDS_IN_SECOND);
          }, MILLISECONDS_TO_THROTTLE)
        });
    });
    return config;
  }, [hotkeyCombo, onPan, hotkeys]);
};

export const useRightOneWeekHotkeyConfig = (onPan: (seconds: number) => void) => {
  const hotkeyCombo = useGetWorkflowKeyboardShortcut();
  const hotkeys = hotkeyCombo.rightOneWeek?.combos;
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    hotkeys?.forEach(hotkey => {
      // update HotkeyConfig once keyboardShortcutConfig loads
      if (hotkeyCombo && hotkeyCombo.rightOneWeek)
        config.push({
          combo: hotkey,
          global: false,
          group: hotkeyCombo.rightOneWeek.categories[0],
          label: hotkeyCombo.rightOneWeek.description,
          onKeyDown: throttle(() => {
            onPan(MILLISECONDS_IN_WEEK / MILLISECONDS_IN_SECOND);
          }, MILLISECONDS_TO_THROTTLE)
        });
    });
    return config;
  }, [hotkeyCombo, onPan, hotkeys]);
};

export const useLeftOneDayHotkeyConfig = (onPan: (seconds: number) => void) => {
  const hotkeyCombo = useGetWorkflowKeyboardShortcut();
  const hotkeys = hotkeyCombo.leftOneDay?.combos;
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    // update HotkeyConfig once keyboardShortcutConfig loads
    hotkeys?.forEach(hotkey => {
      if (hotkeyCombo && hotkey)
        config.push({
          combo: hotkey,
          global: false,
          group: hotkeyCombo.leftOneDay.categories[0],
          label: hotkeyCombo.leftOneDay.description,
          onKeyDown: throttle(() => {
            onPan(-(MILLISECONDS_IN_DAY / MILLISECONDS_IN_SECOND));
          }, MILLISECONDS_TO_THROTTLE)
        });
    });
    return config;
  }, [hotkeyCombo, onPan, hotkeys]);
};

export const useLeftOneWeekHotkeyConfig = (onPan: (seconds: number) => void) => {
  const hotkeyCombo = useGetWorkflowKeyboardShortcut();
  const hotkeys = hotkeyCombo.leftOneWeek?.combos;
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    hotkeys?.forEach(hotkey => {
      // update HotkeyConfig once keyboardShortcutConfig loads
      if (hotkeyCombo && hotkeyCombo.leftOneWeek)
        config.push({
          combo: hotkey,
          global: false,
          group: hotkeyCombo.leftOneWeek.categories[0],
          label: hotkeyCombo.leftOneWeek.description,
          onKeyDown: throttle(() => {
            onPan(-(MILLISECONDS_IN_WEEK / MILLISECONDS_IN_SECOND));
          }, MILLISECONDS_TO_THROTTLE)
        });
    });
    return config;
  }, [hotkeyCombo, onPan, hotkeys]);
};

export function WorkflowHotkeys({
  onPan,
  children
}: React.PropsWithChildren<WorkflowHotkeysProps>) {
  const rightOneDayHotkeyConfig = useRightOneDayHotkeyConfig(onPan);
  const rightOneWeekHotkeyConfig = useRightOneWeekHotkeyConfig(onPan);
  const leftOneDayHotkeyConfig = useLeftOneDayHotkeyConfig(onPan);
  const leftOneWeekHotkeyConfig = useLeftOneWeekHotkeyConfig(onPan);
  const config = React.useMemo(() => {
    // combine hotkey configurations
    return [
      ...rightOneDayHotkeyConfig,
      ...rightOneWeekHotkeyConfig,
      ...leftOneDayHotkeyConfig,
      ...leftOneWeekHotkeyConfig
    ];
  }, [
    leftOneDayHotkeyConfig,
    leftOneWeekHotkeyConfig,
    rightOneDayHotkeyConfig,
    rightOneWeekHotkeyConfig
  ]);

  const { handleKeyDown } = useHotkeys(config);

  return (
    <div onKeyDown={handleKeyDown} style={{ height: '100%' }} role="tab" tabIndex={-1}>
      {children}
    </div>
  );
}
