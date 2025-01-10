import isEqual from 'lodash/isEqual';

/**
 * Constant string representing the key separator
 */
export const HotKeySeparator = '+' as const;

/**
 * Keys that are not supported as hotkeys.
 *
 * CapsLock has inconsistent behavior across operating systems, and so it is excluded.
 */
export const UnSupportedKeys = ['CapsLock'];
/**
 * Constant strings representing the supported modifier key strings
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export enum ModifierHotKeys {
  META = 'Meta',
  CONTROL = 'Control',
  ALT = 'Alt',
  SHIFT = 'Shift'
}

/**
 * Constant strings representing the supported editing key strings
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export enum EditingHotKeys {
  BACKSPACE = 'Backspace',
  DELETE = 'Delete'
}

/**
 * Constant strings representing the supported navigation key strings
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export enum NavigationHotKeys {
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',
  ARROW_UP = 'ArrowUp',
  END = 'End',
  HOME = 'Home',
  PAGE_DOWN = 'PageDown',
  PAGE_UP = 'PageUp'
}

/**
 * Constant strings representing the supported whitespace key strings
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export enum WhitespaceHotKeys {
  ENTER = 'Enter',
  TAB = 'Tab',
  SPACE = 'Space' // this differs from the actual key value on the event, so that we can easily print and read this
}

/**
 * Constant strings representing the supported function key strings
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export enum FunctionHotKeys {
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',
  F13 = 'F13',
  F14 = 'F14',
  F15 = 'F15',
  F16 = 'F16',
  F17 = 'F17',
  F18 = 'F18',
  F19 = 'F19',
  F20 = 'F20'
}

/**
 * Normalizes capitalization for a key string
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key}
 *
 * @param key the case insensitive key string, in the form of `KeyA`. Other casing is fine, such as `keya`, or `KEYA`
 * @returns a version with normalized capitalization, which should match the KeyboardEvent.key casing
 */
export const normalizeKeyCase = (key: string): string => {
  if (key.match(/ArrowDown/i)) {
    return NavigationHotKeys.ARROW_DOWN;
  }
  if (key.match(/ArrowLeft/i)) {
    return NavigationHotKeys.ARROW_LEFT;
  }
  if (key.match(/ArrowRight/i)) {
    return NavigationHotKeys.ARROW_RIGHT;
  }
  if (key.match(/ArrowUp/i)) {
    return NavigationHotKeys.ARROW_UP;
  }
  if (key.match(/PageDown/i)) {
    return NavigationHotKeys.PAGE_DOWN;
  }
  if (key.match(/PageUp/i)) {
    return NavigationHotKeys.PAGE_UP;
  }
  const lowercase = key.toLowerCase();
  return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
};

/**
 * @param key A key, possibly in the key.code format
 * @returns a key as a single character.
 */
const convertKeyCode = (key: string) => {
  const lowerKey = key.toLowerCase();
  switch (lowerKey) {
    case 'backquote':
      return '`';
    case 'bracketleft':
      return '[';
    case 'bracketright':
      return ']';
    case 'slash':
      return '/';
    case 'backslash':
      return '\\';
    case 'quote':
      return "'";
    case 'semicolon':
      return ';';
    case 'period':
      return '.';
    case 'comma':
      return ',';
    case 'minus':
      return '-';
    case 'equal':
      return '=';
    default:
      return key;
  }
};

/**
 * Normalizes variations of key values so that they all are represented by the same strings for easy comparison
 * so that keys like `a`, `A` are all transformed into `A`,
 * and `ctrl` is transformed into `Control` etc
 *
 * @param key the key string to normalize.
 * @returns the string, or undefined if the key is unsupported
 */
export const normalizeKey = (key: string): string | undefined => {
  if (!key || UnSupportedKeys.some(val => val.toLowerCase() === key.toLowerCase())) {
    return undefined;
  }
  let keyToNormalize = key;
  if (key.match(/^ctrl$/i)) {
    keyToNormalize = ModifierHotKeys.CONTROL;
  } else if (key.match(/^del$/i)) {
    keyToNormalize = EditingHotKeys.DELETE;
  } else if (key.match(/^left$/i)) {
    keyToNormalize = NavigationHotKeys.ARROW_LEFT;
  } else if (key.match(/^right$/i)) {
    keyToNormalize = NavigationHotKeys.ARROW_RIGHT;
  } else if (key.match(/^up$/i)) {
    keyToNormalize = NavigationHotKeys.ARROW_UP;
  } else if (key.match(/^down$/i)) {
    keyToNormalize = NavigationHotKeys.ARROW_DOWN;
  } else if (key.match(/^ $/i)) {
    keyToNormalize = WhitespaceHotKeys.SPACE;
  } else if (key.match(/^Key.$/i)) {
    keyToNormalize = key.slice(-1);
  } else if (key.match(/^Digit.$/i)) {
    keyToNormalize = key.slice(-1);
  }
  return normalizeKeyCase(convertKeyCode(keyToNormalize));
};

/**
 * Returns the key that was just pressed.
 *
 * Normalizes left and right modifier keys, so, for example,
 * the left and right Alt keys will return simply "Alt".
 *
 * Non-meta keys are represented via their event.code value.
 *
 * @param event an event from which to get the key pressed
 * @returns a string representing the key pressed.
 */
export const getKeyPressed = (event: KeyboardEvent): string | undefined => {
  // we use the event.key for meta keys so we don't have to deal with AltLeft or ShiftLeft codes.
  if (
    event.key === 'Alt' ||
    event.key === 'Meta' ||
    event.key === 'Control' ||
    event.key === 'Shift'
  ) {
    return event.key;
  }
  return normalizeKey(event.code);
};

function isKeyboardEvent(event: KeyboardEvent | MouseEvent): event is KeyboardEvent {
  return !!(event as KeyboardEvent)?.key;
}

/**
 * The hotkey array based on the KeyboardEvent.
 *
 * @param event the keyboard event as KeyboardEvent
 *
 * @returns The hotkey array
 */
export const getHotKeyArray = (event: KeyboardEvent | MouseEvent): string[] => {
  const hotKeyArray: string[] = [];

  if (event.metaKey) {
    hotKeyArray.push(ModifierHotKeys.META);
  }

  if (event.ctrlKey) {
    hotKeyArray.push(ModifierHotKeys.CONTROL);
  }

  if (event.altKey) {
    hotKeyArray.push(ModifierHotKeys.ALT);
  }

  if (event.shiftKey) {
    hotKeyArray.push(ModifierHotKeys.SHIFT);
  }

  if (isKeyboardEvent(event))
    if (
      event.key !== ModifierHotKeys.META &&
      event.key !== ModifierHotKeys.CONTROL &&
      event.key !== ModifierHotKeys.ALT &&
      event.key !== ModifierHotKeys.SHIFT
    ) {
      // add non-control characters
      // see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
      const normalized = normalizeKey(event.code);

      if (normalized) {
        hotKeyArray.push(normalized);
      }
    }

  const normalizedHotKeyArray: string[] = [];
  hotKeyArray.forEach(key => {
    const normalized = normalizeKey(key);
    if (normalized) {
      normalizedHotKeyArray.push(normalized);
    }
  });

  return normalizedHotKeyArray;
};

/**
 * Converts commands into hotkey arrays. Normalizes key inputs, converting letters into KeyA
 *
 * @param hotKeyCommand a hotkey command such as "Control+Alt+S"
 * @returns an array of strings representing each key
 */
export const convertCommandToHotKeyArray = (hotKeyCommand: string): string[] => {
  // remove all whitespace
  const noWhiteSpaceCommand = hotKeyCommand.replace(/\s/g, '');

  const normalizedHotKeyArray: string[] = [];
  noWhiteSpaceCommand.split(HotKeySeparator).forEach(key => {
    const normalized = normalizeKey(key);
    if (normalized) {
      normalizedHotKeyArray.push(normalized);
    }
  });
  return normalizedHotKeyArray.sort();
};

/**
 * Creates a serialized hotkey command that has no whitespace, and for which the keys
 * are sorted alphabetically (where letter keys are identified by their key encoding,
 * such as keyE for the 'E' key)
 *
 * @param hotKeyArray an input array from which to generate a hotkey command string
 * @returns a hotkey command serialization
 */
export const convertHotKeyArrayToCommand = (hotKeyArray: string[]): string => {
  return [...hotKeyArray].sort().join(HotKeySeparator);
};

/**
 * Takes a hotkey combo and normalizes each key in it so that it uses the expected strings
 * for each key. This allows keys such as `a`, `A`, and `KeyA` all to be represented by the same
 * string, `KeyA`.
 *
 * @param combo a key combo string to normalize
 */
export const normalizeHotKeyCombo = (combo: string): string => {
  return convertHotKeyArrayToCommand(convertCommandToHotKeyArray(combo));
};

/**
 * Creates a normalized hotkey combo for the provided keyboard event
 *
 * @param event a keyboard event
 */
export const getHotKeyCombo = (event: KeyboardEvent) => {
  return normalizeHotKeyCombo(convertHotKeyArrayToCommand(getHotKeyArray(event)));
};

/**
 * hotkey string based on the KeyboardEvent.
 *
 * @param event the keyboard event
 *
 * @returns hotkey string
 */
export const getHotKeyString = (event: KeyboardEvent): string =>
  normalizeHotKeyCombo(getHotKeyArray(event).join(HotKeySeparator));

/**
 * Is a hotkey command satisfied—checks only this event, not any keys that were fired in previous events.
 *
 * @see isGlobalHotKeyCommandSatisfied to check for the state of all held hotkeys
 *
 * @param event the keyboard event to check
 * @param hotKeyCommands List of hotkey commands such as ["Alt+S"] where meta keys use event.key
 * and other keys use the event.code
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key }
 *
 * @returns true if the hotkey command is satisfied. False otherwise.
 */
export const doesEventSatisfyHotKeyCommand = (
  event: KeyboardEvent | MouseEvent,
  hotKeyCommands: string[]
): boolean => {
  if (!event) {
    return false;
  }

  if (hotKeyCommands == null || hotKeyCommands.length === 0) {
    return false;
  }

  const hotKeyArray = getHotKeyArray(event).sort();
  const isSatisfied = hotKeyCommands.map(hotKeyCommand => {
    const commandArray = convertCommandToHotKeyArray(hotKeyCommand);
    commandArray.sort();
    return isEqual(hotKeyArray, commandArray);
  });

  return isSatisfied.includes(true);
};
