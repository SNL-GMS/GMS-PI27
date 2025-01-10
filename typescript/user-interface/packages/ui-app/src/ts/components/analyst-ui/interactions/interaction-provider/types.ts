import type { CommonTypes, WorkflowTypes } from '@gms/common-model';
import React from 'react';

/**
 * The interaction provider redux props.
 */
export interface InteractionProviderReduxProps {
  analysisMode: WorkflowTypes.AnalysisMode;
  openEventId: string;
  currentTimeInterval: CommonTypes.TimeRange;
  commandPaletteIsVisible: boolean;
  setCommandPaletteVisibility(visibility: boolean): void;
}

/**
 * The interaction provider props.
 */
export type InteractionProviderProps = InteractionProviderReduxProps;

/**
 * The interaction provider callbacks.
 */
export interface InteractionCallbacks {
  isListenerAttached: boolean;
  toggleCommandPaletteVisibility(): void;
}

/**
 * The interaction context.
 */
export const InteractionContext = React.createContext<InteractionCallbacks>(undefined);
