import { InputGroup } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { classList, isNextTabbableKey, isPreviousTabbableKey, useRestoreFocus } from '@gms/ui-util';
import React from 'react';

import { CommandPaletteContext } from './command-palette-context';
import type { CommandPaletteInputProps } from './types';

/**
 * Focuses on the command palette when it is loaded.
 * Returns focus to whatever had it when the CP is closed.
 * Cleans up the input field on close.
 *
 * @param onClearFocus a function that is called on close
 */
const useFocusManager: (
  onClearFocus: () => void
) => React.MutableRefObject<HTMLInputElement | null> = onClearFocus => {
  const context = React.useContext(CommandPaletteContext);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  useRestoreFocus(context.commandPaletteIsVisible);
  React.useEffect(() => {
    if (context.commandPaletteIsVisible && inputRef.current) {
      inputRef.current.focus();
    } else {
      onClearFocus();
    }
  }, [context.commandPaletteIsVisible, onClearFocus]);
  return inputRef;
};

/**
 * The form input and its keyboard listeners.
 */
export function CommandPaletteInput(props: CommandPaletteInputProps) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { setSearchTerm, getSearchTerm, selectionManager } = props;
  const clearSearchTermOnClose = React.useCallback(() => setSearchTerm(''), [setSearchTerm]);

  const context = React.useContext(CommandPaletteContext);
  const inputRef = useFocusManager(clearSearchTermOnClose);

  return (
    <InputGroup
      inputRef={ref => {
        inputRef.current = ref;
      }}
      autoComplete="off"
      autoFocus
      className={classList({ 'command-palette__input': true })}
      leftIcon={IconNames.CHEVRON_RIGHT}
      name="command-palette"
      dir="ltr"
      placeholder="Command"
      value={getSearchTerm() ?? ''}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSearchTerm('');
          context.setCommandPaletteVisibility(false);
        }
        if (isPreviousTabbableKey(e)) {
          e.preventDefault();
          selectionManager.selectPrevious();
        } else if (isNextTabbableKey(e)) {
          e.preventDefault();
          selectionManager.selectNext();
        }
      }}
      onChange={(e: React.FormEvent<HTMLInputElement>) => {
        setSearchTerm(e.currentTarget.value);
        e.preventDefault();
      }}
    />
  );
}
