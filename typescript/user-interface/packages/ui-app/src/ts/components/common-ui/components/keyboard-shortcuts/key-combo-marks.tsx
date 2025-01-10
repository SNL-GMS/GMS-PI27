import React from 'react';

import { KeyMark } from './key-mark';
import { formatHotkeysForOs } from './keyboard-shortcuts-util';

interface KeyComboMarksProps {
  description: string;
  hotkeys: string[];
}

/**
 * Component to render a list of one or more hotkey combos, side by side.
 */
export function KeyComboMarks({ description, hotkeys }: KeyComboMarksProps) {
  return (
    <>
      {hotkeys.map((combo, index) => {
        const formattedCombo = formatHotkeysForOs(combo);
        return (
          <React.Fragment key={`shortcuts: ${formattedCombo} in "${description}"`}>
            <span
              key={`combo: ${formattedCombo} in "${description}"`}
              className="keyboard-shortcuts__hotkey-combo"
            >
              {formattedCombo.split('+').map(hotkey => (
                <KeyMark key={`${hotkey}:${formattedCombo}`}>{hotkey}</KeyMark>
              ))}
            </span>
            {index !== hotkeys.length - 1 && (
              <span
                key={`${formattedCombo} conjunction-junction`}
                className="keyboard-shortcuts__conjunction-junction"
              >
                &nbsp;or&nbsp;
              </span>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
