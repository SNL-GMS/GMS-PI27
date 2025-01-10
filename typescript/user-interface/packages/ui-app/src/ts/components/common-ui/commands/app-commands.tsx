import { setCommandPaletteVisibility, useAppDispatch } from '@gms/ui-state';
import React from 'react';

import { useFileSaveLoad } from '~analyst-ui/common/save-load/save-load-hooks';

import type { Command } from '../components/command-palette/types';
import { CommandType } from '../components/command-palette/types';

/**
 * Creates app commands, including
 *   save to file
 *   load from file
 */
export const useAppCommands = (): Command[] => {
  const { isSaveEnabled, saveGmsToFile, loadGmsFromFile } = useFileSaveLoad();
  const dispatch = useAppDispatch();
  return React.useMemo(() => {
    const commands: Command[] = [];

    if (isSaveEnabled) {
      commands.push({
        commandType: CommandType.SAVE_TO_FILE,
        searchTags: ['save', 'file', 'disk', 'disc', 'write', 'export'],
        action: async () => {
          // close the command palette or else it will end up in saved in the open state
          dispatch(setCommandPaletteVisibility(false));
          await saveGmsToFile();
        }
      });
      commands.push({
        commandType: CommandType.SAVE_TO_FILE_AS,
        searchTags: ['save', 'as', 'file', 'disk', 'disc', 'write', 'export'],
        action: async () => {
          // close the command palette or else it will end up in saved in the open state
          dispatch(setCommandPaletteVisibility(false));
          await saveGmsToFile(true);
        }
      });
    }

    commands.push({
      commandType: CommandType.LOAD_FROM_FILE,
      searchTags: ['load', 'open', 'file', 'disk', 'disc', 'write', 'export'],
      action: async () => {
        await loadGmsFromFile();
      }
    });

    return commands;
  }, [dispatch, isSaveEnabled, loadGmsFromFile, saveGmsToFile]);
};
