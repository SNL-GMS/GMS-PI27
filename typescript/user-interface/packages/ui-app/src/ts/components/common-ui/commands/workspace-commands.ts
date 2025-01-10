import type { AuthenticationStatus } from '@gms/ui-state';
import { useKeyboardShortcutsDisplayVisibility } from '@gms/ui-state';
import React from 'react';

import { authenticator } from '~app/authentication';
import {
  clearLayout,
  showLogPopup
} from '~components/workspace/components/golden-layout/golden-layout-util';

import type { Command } from '../components/command-palette/types';
import { CommandType } from '../components/command-palette/types';

/**
 * Creates workspace commands, including
 *   logout
 *   clear layout
 *   show logs
 */
export const useWorkspaceCommands = (
  setAppAuthenticationStatus: (auth: AuthenticationStatus) => void
): Command[] => {
  const { openKeyboardShortcuts } = useKeyboardShortcutsDisplayVisibility();
  return React.useMemo(
    () => [
      authenticator.logout && {
        commandType: CommandType.LOG_OUT,
        searchTags: ['quit', 'exit', 'logout', 'log out'],
        action: () => authenticator.logout(setAppAuthenticationStatus)
      },
      {
        commandType: CommandType.SHOW_KEYBOARD_SHORTCUTS,
        searchTags: ['hotkey', 'hot key', 'keys', 'keyboard', 'shortcut'],
        action: openKeyboardShortcuts
      },
      {
        commandType: CommandType.CLEAR_LAYOUT,
        searchTags: ['clear', 'reset', 'layout', 'workspace'],
        action: clearLayout
      },
      {
        commandType: CommandType.SHOW_LOGS,
        searchTags: ['logs'],
        action: showLogPopup
      }
    ],
    [openKeyboardShortcuts, setAppAuthenticationStatus]
  );
};
