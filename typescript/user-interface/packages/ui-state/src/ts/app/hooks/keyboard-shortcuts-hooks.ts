import { useHotkeys } from '@blueprintjs/core';
import * as React from 'react';
import { batch } from 'react-redux';

import { buildHotkeyConfigArray } from '../api';
import { commonActions } from '../state/common/common-slice';
import { isCommandPaletteOpen, isKeyboardShortcutPopupOpen } from '../state/common/selectors';
import { useKeyboardShortcutConfigurations } from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';

/**
 * Event handler to prevent Blueprint's default behavior of launching
 * a hotkey dialog when typing 'shift + /' (question mark)
 */
const onKeyDownToPreventBlueprintDefaultHotKeyDialog = (e: KeyboardEvent) => {
  if (e.key === '?') {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
  }
};

/**
 * Creates a set of helper functions for manipulating the keyboard dialog state.
 * Functions are referentially stable.
 *
 * @returns toggleKeyboardShortcuts a function to turn on and off the keyboard shortcuts dialog,
 * isKeyboardShortcutsDialogOpen a function to determine if the dialog is open
 * closeKeyboardShortcuts closes the dialog
 * openKeyboardShortcuts opens the dialog
 */
export const useKeyboardShortcutsDisplayVisibility = (): {
  toggleKeyboardShortcuts: () => void;
  isKeyboardShortcutsDialogOpen: boolean;
  closeKeyboardShortcuts: () => void;
  openKeyboardShortcuts: () => void;
} => {
  const dispatch = useAppDispatch();
  const areKeyboardShortcutsVisible = useAppSelector(isKeyboardShortcutPopupOpen);
  const isCommandPaletteVisible = useAppSelector(isCommandPaletteOpen);

  const toggleKeyboardShortcuts = React.useCallback(() => {
    if (!isCommandPaletteVisible) {
      dispatch(commonActions.setKeyboardShortcutsVisibility(!areKeyboardShortcutsVisible));
    }
  }, [isCommandPaletteVisible, dispatch, areKeyboardShortcutsVisible]);

  const closeKeyboardShortcuts = React.useCallback(() => {
    dispatch(commonActions.setKeyboardShortcutsVisibility(false));
  }, [dispatch]);
  const openKeyboardShortcuts = React.useCallback(() => {
    batch(() => {
      if (isCommandPaletteVisible) {
        dispatch(commonActions.setCommandPaletteVisibility(false));
      }
      dispatch(commonActions.setKeyboardShortcutsVisibility(true));
    });
  }, [dispatch, isCommandPaletteVisible]);

  React.useEffect(() => {
    document.body.addEventListener('keydown', onKeyDownToPreventBlueprintDefaultHotKeyDialog, true);
  }, []);

  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  const hotkey = React.useMemo(
    () =>
      buildHotkeyConfigArray(
        keyboardShortcutConfigurations?.hotkeys?.showKeyboardShortcuts,
        toggleKeyboardShortcuts,
        undefined,
        false,
        true
      ), // update HotkeyConfig once keyboardShortcutConfig loads
    [keyboardShortcutConfigurations?.hotkeys?.showKeyboardShortcuts, toggleKeyboardShortcuts]
  );

  useHotkeys(hotkey);

  return {
    toggleKeyboardShortcuts,
    isKeyboardShortcutsDialogOpen: areKeyboardShortcutsVisible,
    closeKeyboardShortcuts,
    openKeyboardShortcuts
  };
};
