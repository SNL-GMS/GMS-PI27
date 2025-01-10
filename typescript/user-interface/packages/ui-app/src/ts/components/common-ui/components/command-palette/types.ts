import type { SearchResult, SelectionManager } from '@gms/ui-util';

/**
 * A broad category of command.
 */
export enum CommandType {
  CLEAR_LAYOUT = 'Developer: Clear Layout',
  CLOSE_DISPLAY = 'Displays: Close Display',
  CLOSE_INTERVAL = 'Workflow: Close Interval',
  LOAD_WORKSPACE = 'Workspace: Open Workspace',
  LOG_OUT = 'User: Log Out',
  OPEN_DISPLAY = 'Displays: Open Display',
  OPEN_INTERVAL = 'Workflow: Open Latest Interval',
  SHOW_KEYBOARD_SHORTCUTS = 'Help: Show Keyboard Shortcuts',
  SAVE_WORKSPACE = 'Workspace: Save Workspace As',
  SAVE_TO_FILE = 'App: Save to File',
  SAVE_TO_FILE_AS = 'App: Save to File As',
  LOAD_FROM_FILE = 'App: Load from File',
  SHOW_ABOUT = 'Help: About',
  SHOW_LOGS = 'Developer: Show Logs'
}

/**
 * Used as a key for registering commands. Registering a command at a specific
 * scope will overwrite all previously registered commands at that scope.
 */
export enum CommandScope {
  ANALYST = 'ANALYST',
  COMMON = 'COMMON',
  DEV = 'DEV',
  DISPLAY_MANAGEMENT = 'DISPLAY_MANAGEMENT',
  GOLDEN_LAYOUT = 'GOLDEN_LAYOUT'
}

/**
 * Tye type of a command.
 */
export interface Command {
  // the command enum corresponding to this command
  commandType: CommandType;

  // the text for the command palette list
  displayText?: string;

  // A list of strings that should be searched for this command
  searchTags?: string[];

  // higher priority appears closer to the top of the list. Treated as 0 by default.
  priority?: number;

  // the function to call when the command is executed.
  action(): void;
}

export interface CommandPaletteComponentReduxProps {
  commandPaletteIsVisible: boolean;
  keyPressActionQueue: Record<string, number>;
  setCommandPaletteVisibility(visibility: boolean): void;
  setKeyPressActionQueue(actions: Record<string, number>): void;
}

export type CommandPaletteComponentProps = CommandPaletteComponentReduxProps;

export interface CommandPaletteProps {
  isVisible: boolean;
  defaultSearchTerms?: string[];
  commandActions: Command[];
}

export interface CommandPaletteState {
  defaultSearchResults: SearchResult<Command>[];
}

export interface SearchableCommandPaletteProps extends CommandPaletteProps {
  commandActions: Command[];
  defaultSearchResults?: SearchResult<Command>[];
}

export const scrollOptions: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'nearest',
  inline: 'nearest'
};

export interface CommandPaletteResultProps {
  searchResult: SearchResult<Command>;
  isSelected: boolean;
}

export interface CommandPaletteResultListProps {
  searchResults: SearchResult<Command>[];
  selectedResult: SearchResult<Command>;
}

export interface CommandPaletteInputProps {
  selectionManager: SelectionManager<Command>;
  getSearchTerm(): string | null;
  setSearchTerm(term: string): void;
}

export interface CommandPaletteOverlayProps {
  commandActions: Command[];
  showCommandPalette: boolean;
}
