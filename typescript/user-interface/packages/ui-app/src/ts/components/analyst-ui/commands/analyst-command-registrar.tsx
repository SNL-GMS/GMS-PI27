import React from 'react';

import { CommandPaletteContext, CommandScope } from '~common-ui/components/command-palette';

import { useWorkflowCommands } from './workflow-commands';

/**
 * Registers IAN-specific commands for the command palette. Does not render anything
 */
export function AnalystCommandRegistrar() {
  const { registerCommands } = React.useContext(CommandPaletteContext);
  const workflowCommands = useWorkflowCommands();
  //! useEffect updates state
  React.useEffect(() => {
    registerCommands([...workflowCommands], CommandScope.ANALYST);
  }, [registerCommands, workflowCommands]);
  return null; // this component just registers commands. It doesn't render anything.
}
