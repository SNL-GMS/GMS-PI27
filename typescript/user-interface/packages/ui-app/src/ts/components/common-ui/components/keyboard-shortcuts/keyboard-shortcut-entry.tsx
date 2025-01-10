import type { ConfigurationTypes } from '@gms/common-model';
import { HelpText, HelpTextTarget } from '@gms/ui-core-components';
import React from 'react';

import { KeyComboMarks } from './key-combo-marks';

/**
 * Render a single keyboard shortcut object from config. Includes all key combos,
 * help text (if provided), and the description.
 */
export function KeyboardShortcutEntry(props: ConfigurationTypes.HotkeyConfiguration) {
  const { description, combos, helpText, categories } = props;
  const catKey = categories?.map(cat => cat).reduce((a, b) => `${a}-${b}`);
  const key = `${description}-${catKey}`;
  return (
    <HelpTextTarget key={key} className="keyboard-shortcuts__hotkey-entry">
      {helpText && <HelpText>{helpText}</HelpText>}
      <span className="keyboard-shortcuts__description">
        {description}
        :&nbsp;
      </span>
      <ul className="keyboard-shortcuts__hotkey-list">
        <KeyComboMarks hotkeys={combos} description={description} />
      </ul>
    </HelpTextTarget>
  );
}
