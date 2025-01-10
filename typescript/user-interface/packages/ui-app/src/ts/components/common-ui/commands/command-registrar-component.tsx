import * as React from 'react';

import { CommandPaletteContext } from '../components/command-palette/command-palette-context';
import { CommandScope } from '../components/command-palette/types';
import { useAppCommands } from './app-commands';
import type { CommandRegistrarProps } from './types';
import { useWorkspaceCommands } from './workspace-commands';

/**
 * Registers Common UI commands with the command palette.
 * Does not render anything, but updates the registered commands in the CommandPalette context
 */
export function CommandRegistrarComponent({ setAppAuthenticationStatus }: CommandRegistrarProps) {
  const { registerCommands } = React.useContext(CommandPaletteContext);
  const workspaceCommands = useWorkspaceCommands(setAppAuthenticationStatus);
  const appCommands = useAppCommands();
  React.useEffect(() => {
    registerCommands([...workspaceCommands, ...appCommands], CommandScope.COMMON);
  }, [appCommands, registerCommands, workspaceCommands]);
  return null; // this component just registers commands. It doesn't render anything.
}
