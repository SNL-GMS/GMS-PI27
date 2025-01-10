import { InputGroup } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { HotkeyConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { nonIdealStateWithNoSpinner } from '@gms/ui-core-components';
import { useKeyboardShortcutConfigurations } from '@gms/ui-state';
import { useDataAttrScroll, useVanillaSearch } from '@gms/ui-util';
import orderBy from 'lodash/orderBy';
import React from 'react';

import { KeyboardShortcutCategory } from './keyboard-shortcut-category';
import { KeyboardShortcutEntry } from './keyboard-shortcut-entry';
import {
  addAlternateKeyNameTagsToHotkeyConfiguration,
  categorizeKeyboardShortcuts,
  hotkeyMatchesSearchTerm,
  mergeKeyboardShortcutsByCategory
} from './keyboard-shortcuts-util';

/**
 * Shows the list of the keyboard shortcuts that are configured.
 */
export function KeyboardShortcuts() {
  const addDataAttrScroll = useDataAttrScroll();
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();

  const keyboardShortcutList = React.useMemo(() => {
    return addAlternateKeyNameTagsToHotkeyConfiguration(
      keyboardShortcutConfigurations
        ? Object.values(mergeKeyboardShortcutsByCategory(keyboardShortcutConfigurations)).flat()
        : []
    );
  }, [keyboardShortcutConfigurations]);

  /**
   * Provides search results, and getters and setters for the search term.
   * Uses the hotkeyMatchesSearchTerm function to determine a match
   */
  const [searchResults, setSearchTerm, getSearchTerm] = useVanillaSearch<HotkeyConfiguration>(
    keyboardShortcutList,
    hotkeyMatchesSearchTerm
  );

  const handleChange = React.useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setSearchTerm(e.currentTarget.value);
      e.preventDefault();
    },
    [setSearchTerm]
  );

  const categories = categorizeKeyboardShortcuts(
    getSearchTerm() ? searchResults?.map(result => result.item) : keyboardShortcutList
  );

  return (
    <aside className="keyboard-shortcuts" ref={addDataAttrScroll}>
      <div className="keyboard-shortcuts__search-container">
        <InputGroup
          autoFocus
          className="keyboard-shortcuts__input"
          dir="ltr"
          large
          leftIcon={IconNames.SEARCH}
          onChange={handleChange}
          placeholder="Search"
          value={getSearchTerm() ?? ''}
        />
      </div>
      <div className="keyboard-shortcuts__shortcuts-container">
        {categories
          ? Object.keys(categories)
              .sort()
              .map(catName => (
                <KeyboardShortcutCategory key={`keyboard-shortcut__${catName}`} catName={catName}>
                  {orderBy(categories[catName]).map(KeyboardShortcutEntry)}
                </KeyboardShortcutCategory>
              ))
          : nonIdealStateWithNoSpinner('No keyboard shortcuts found')}
      </div>
    </aside>
  );
}
