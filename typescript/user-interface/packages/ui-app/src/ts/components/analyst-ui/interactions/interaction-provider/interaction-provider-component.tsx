import React from 'react';

import type { InteractionCallbacks, InteractionProviderProps } from './types';
import { InteractionContext } from './types';

/**
 * Provides one implementation of redux capabilities and provides them to child components via a context
 */
export function InteractionProvider({
  children,
  commandPaletteIsVisible,
  setCommandPaletteVisibility
}: React.PropsWithChildren<InteractionProviderProps>) {
  const toggleCommandPaletteVisibility = React.useCallback(() => {
    setCommandPaletteVisibility(!commandPaletteIsVisible);
  }, [commandPaletteIsVisible, setCommandPaletteVisibility]);

  const interactionContextData: InteractionCallbacks = React.useMemo(
    () => ({
      isListenerAttached: false,
      toggleCommandPaletteVisibility
    }),
    [toggleCommandPaletteVisibility]
  );

  return (
    <InteractionContext.Provider value={interactionContextData}>
      {children}
    </InteractionContext.Provider>
  );
}
