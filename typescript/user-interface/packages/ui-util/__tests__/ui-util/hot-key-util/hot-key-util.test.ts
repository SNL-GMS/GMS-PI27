/* eslint-disable jest/no-conditional-expect */
import { HotkeyListener } from '../../../src/ts/ui-util';
import {
  doesEventSatisfyHotKeyCommand,
  EditingHotKeys,
  getHotKeyArray,
  getHotKeyCombo,
  getHotKeyString,
  ModifierHotKeys,
  NavigationHotKeys,
  normalizeKey,
  normalizeKeyCase,
  UnSupportedKeys,
  WhitespaceHotKeys
} from '../../../src/ts/ui-util/hot-key-util';

const testEvent = {
  metaKey: true,
  key: 'S',
  code: 'KeyS'
} as KeyboardEvent;

const anotherEvent = {
  ctrlKey: true,
  shiftKey: true,
  key: 'W',
  code: 'KeyW'
} as KeyboardEvent;

const aBoringEvent = {
  key: 'A',
  code: 'KeyA'
} as KeyboardEvent;

const forceKillEvent = {
  ctrlKey: true,
  altKey: true,
  key: 'Delete',
  code: 'Delete'
} as KeyboardEvent;

const keyboardEvents = [testEvent, anotherEvent, aBoringEvent, forceKillEvent];

describe('hotkey Util', () => {
  it('defines its functions', () => {
    expect(HotkeyListener.getHotKeyArray).toBeDefined();
    expect(HotkeyListener.getHotKeyString).toBeDefined();
    expect(HotkeyListener.doesEventSatisfyHotKeyCommand).toBeDefined();
  });

  it('can get a hotkey array from a keyboard event', () => {
    keyboardEvents.forEach(keyEvent => {
      const arr = getHotKeyArray(keyEvent);
      if (keyEvent.ctrlKey) {
        expect(arr).toContain(ModifierHotKeys.CONTROL);
      }
      if (keyEvent.altKey) {
        expect(arr).toContain(ModifierHotKeys.ALT);
      }
      if (keyEvent.shiftKey) {
        expect(arr).toContain(ModifierHotKeys.SHIFT);
      }
      if (keyEvent.metaKey) {
        expect(arr).toContain(ModifierHotKeys.META);
      }
      expect(arr[arr.length - 1]).toEqual(keyEvent.key);
    });
  });

  it('can generate a hotkey string from an event', () => {
    const forceKillString = getHotKeyString(forceKillEvent);
    expect(forceKillString).toEqual('Alt+Control+Delete');
  });

  it('can verify if a hotkey combination has been pressed', () => {
    const forceKillString = getHotKeyString(forceKillEvent);
    expect(doesEventSatisfyHotKeyCommand(forceKillEvent, [forceKillString])).toBe(true);
  });

  it('can verify if a hotkey combination has not been pressed', () => {
    expect(doesEventSatisfyHotKeyCommand(forceKillEvent, ['Control+Alt+P'])).toBe(false);
  });

  it('returns false when given an empty string', () => {
    expect(doesEventSatisfyHotKeyCommand(forceKillEvent, [''])).toBe(false);
  });
  describe('normalizeKeyCase', () => {
    it('matches the enum for modifier keys', () => {
      expect(normalizeKeyCase('alt')).toBe(ModifierHotKeys.ALT);
      expect(normalizeKeyCase('Alt')).toBe(ModifierHotKeys.ALT);
      expect(normalizeKeyCase('ALT')).toBe(ModifierHotKeys.ALT);
      expect(normalizeKeyCase('control')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKeyCase('Control')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKeyCase('CONTROL')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKeyCase('meta')).toBe(ModifierHotKeys.META);
      expect(normalizeKeyCase('Meta')).toBe(ModifierHotKeys.META);
      expect(normalizeKeyCase('META')).toBe(ModifierHotKeys.META);
      expect(normalizeKeyCase('shift')).toBe(ModifierHotKeys.SHIFT);
      expect(normalizeKeyCase('Shift')).toBe(ModifierHotKeys.SHIFT);
      expect(normalizeKeyCase('SHIFT')).toBe(ModifierHotKeys.SHIFT);
    });
  });
  describe('normalizeKey', () => {
    it('returns undefined for unsupported keys', () => {
      UnSupportedKeys.forEach(k => expect(normalizeKey(k)).toBeUndefined());
    });
    it('matches the enum for modifier keys', () => {
      expect(normalizeKey('alt')).toBe(ModifierHotKeys.ALT);
      expect(normalizeKey('Alt')).toBe(ModifierHotKeys.ALT);
      expect(normalizeKey('ALT')).toBe(ModifierHotKeys.ALT);
      expect(normalizeKey('ctrl')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKey('Ctrl')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKey('CTRL')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKey('control')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKey('Control')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKey('CONTROL')).toBe(ModifierHotKeys.CONTROL);
      expect(normalizeKey('meta')).toBe(ModifierHotKeys.META);
      expect(normalizeKey('Meta')).toBe(ModifierHotKeys.META);
      expect(normalizeKey('META')).toBe(ModifierHotKeys.META);
      expect(normalizeKey('shift')).toBe(ModifierHotKeys.SHIFT);
      expect(normalizeKey('Shift')).toBe(ModifierHotKeys.SHIFT);
      expect(normalizeKey('SHIFT')).toBe(ModifierHotKeys.SHIFT);
    });

    it('normalize matches letters keys', () => {
      expect(normalizeKey('keya')).toBe('A');
      expect(normalizeKey('KeyA')).toBe('A');
      expect(normalizeKey('KEYA')).toBe('A');
      expect(normalizeKey('keyb')).toBe('B');
      expect(normalizeKey('KeyB')).toBe('B');
      expect(normalizeKey('KEYB')).toBe('B');
      expect(normalizeKey('keyc')).toBe('C');
      expect(normalizeKey('KeyC')).toBe('C');
      expect(normalizeKey('KEYC')).toBe('C');
    });

    it('normalize matches digits keys', () => {
      expect(normalizeKey('Digit1')).toBe('1');
      expect(normalizeKey('Digit2')).toBe('2');
      expect(normalizeKey('Digit3')).toBe('3');
      expect(normalizeKey('digit1')).toBe('1');
      expect(normalizeKey('digit2')).toBe('2');
      expect(normalizeKey('digit3')).toBe('3');
    });

    it('normalize special characters', () => {
      expect(normalizeKey('Backquote')).toBe('`');
      expect(normalizeKey('Bracketleft')).toBe('[');
      expect(normalizeKey('Bracketright')).toBe(']');
      expect(normalizeKey('Slash')).toBe('/');
      expect(normalizeKey('Backslash')).toBe('\\');
      expect(normalizeKey('Quote')).toBe("'");
      expect(normalizeKey('Semicolon')).toBe(';');
      expect(normalizeKey('Period')).toBe('.');
      expect(normalizeKey('Comma')).toBe(',');
      expect(normalizeKey('Minus')).toBe('-');
      expect(normalizeKey('Equal')).toBe('=');
    });

    it('matches the enum for special keys', () => {
      expect(normalizeKey(' ')).toBe(WhitespaceHotKeys.SPACE);
      expect(normalizeKey('down')).toBe(NavigationHotKeys.ARROW_DOWN);
      expect(normalizeKey('left')).toBe(NavigationHotKeys.ARROW_LEFT);
      expect(normalizeKey('right')).toBe(NavigationHotKeys.ARROW_RIGHT);
      expect(normalizeKey('up')).toBe(NavigationHotKeys.ARROW_UP);
      expect(normalizeKey('end')).toBe(NavigationHotKeys.END);
      expect(normalizeKey('home')).toBe(NavigationHotKeys.HOME);
      expect(normalizeKey('pagedown')).toBe(NavigationHotKeys.PAGE_DOWN);
      expect(normalizeKey('pageup')).toBe(NavigationHotKeys.PAGE_UP);
      expect(normalizeKey('del')).toBe(EditingHotKeys.DELETE);
    });

    it('normalizes the form for letter and number keys', () => {
      expect(normalizeKeyCase('a')).toBe('A');
      expect(normalizeKeyCase('A')).toBe('A');
      expect(normalizeKeyCase('b')).toBe('B');
      expect(normalizeKeyCase('B')).toBe('B');
      expect(normalizeKeyCase('c')).toBe('C');
      expect(normalizeKeyCase('C')).toBe('C');
      expect(normalizeKeyCase('1')).toBe('1');
      expect(normalizeKeyCase('2')).toBe('2');
      expect(normalizeKeyCase('3')).toBe('3');
    });
  });
  describe('getHotKeyCombo', () => {
    it('creates normalized key combos from events', () => {
      expect(getHotKeyCombo(testEvent)).toBe('Meta+S');
      expect(getHotKeyCombo(anotherEvent)).toBe('Control+Shift+W');
      expect(getHotKeyCombo(aBoringEvent)).toBe('A');
      expect(getHotKeyCombo(forceKillEvent)).toBe('Alt+Control+Delete');
    });
  });
});
