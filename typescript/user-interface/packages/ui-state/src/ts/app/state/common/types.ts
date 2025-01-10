export enum GLDisplayState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface CommonState {
  commandPaletteIsVisible: boolean;
  keyboardShortcutsVisibility: boolean;
  userPreferencesVisibility: boolean;
  keyPressActionQueue: Record<string, number>;
  selectedStationIds: string[];
  glLayoutState: Record<string, GLDisplayState>;
  uniqueComponent: Record<string, number>;
}
