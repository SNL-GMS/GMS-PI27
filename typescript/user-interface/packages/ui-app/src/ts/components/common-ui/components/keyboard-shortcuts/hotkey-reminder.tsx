import type { ConfigurationTypes } from '@gms/common-model';
import classNames from 'classnames';
import React from 'react';

import { KeyMark } from './key-mark';
import { formatHotkeysForOs } from './keyboard-shortcuts-util';

/**
 * The type of the props for the {@link HotkeyReminder} component
 */
export interface HotkeyReminderProps {
  className?: string;
  description: string;
  hotkeyConfig: ConfigurationTypes.HotkeyConfiguration;
}

/**
 * A description associated to a hotkey key-mark component, to remind the user about what hotkey to use
 */
export function HotkeyReminder({ className, description, hotkeyConfig }: HotkeyReminderProps) {
  if (hotkeyConfig == null) {
    return undefined;
  }
  return (
    <div className={classNames('hotkey-reminder', className)}>
      {description}:{' '}
      {formatHotkeysForOs(hotkeyConfig.combos[0])
        .replace(/control/g, 'ctrl')
        .split('+')
        .map(keyboardKey => (
          <KeyMark key={keyboardKey}>{keyboardKey.toLocaleLowerCase()}</KeyMark>
        ))}
    </div>
  );
}
