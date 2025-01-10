import type { HotkeyConfig, UseHotkeysReturnValue } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import {
  buildHotkeyConfigArray,
  setCommandPaletteVisibility,
  useAppDispatch,
  useAppSelector,
  useKeyboardShortcutConfigurations
} from '@gms/ui-state';
import * as React from 'react';

/**
 * @returns the {@link HotkeyConfig} for command palette action
 */
export const useToggleCommandPaletteVisibilityHotkeyConfig = (): HotkeyConfig[] => {
  const keyboardShortcutConfig = useKeyboardShortcutConfigurations();
  const dispatch = useAppDispatch();
  const visibility = useAppSelector(state => state.app.common.commandPaletteIsVisible);
  const config =
    keyboardShortcutConfig && keyboardShortcutConfig.hotkeys
      ? keyboardShortcutConfig.hotkeys.toggleCommandPalette
      : undefined;
  const commandPaletteVisibility = React.useCallback(() => {
    dispatch(setCommandPaletteVisibility(!visibility));
  }, [dispatch, visibility]);
  return React.useMemo(
    () => buildHotkeyConfigArray(config, commandPaletteVisibility, undefined, false, true),
    [config, commandPaletteVisibility]
  );
};

/**
 * Sets up and configures the hotkeys for toggling command palette visibility.
 *
 * @returns the {@link UseHotkeysReturnValue} for command palette visibility
 */
export const useToggleCommandPaletteVisibilityHotkeys = (): UseHotkeysReturnValue => {
  return useHotkeys(useToggleCommandPaletteVisibilityHotkeyConfig());
};
