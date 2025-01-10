import type { ConfigurationTypes } from '@gms/common-model';

import {
  addAlternateKeyNameTagsToHotkeyConfiguration,
  categorizeKeyboardShortcuts,
  doHotkeyCombosMatch,
  formatHotkeyString,
  hotkeyMatchesSearchTerm,
  isNonOSSpecificKeyCombo,
  isSearchTermFoundInCombo,
  mergeKeyboardShortcutsByCategory
} from '../../../../../src/ts/components/common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

describe('keyboard shortcuts util', () => {
  describe('isNonOSSpecificKeyCombo', () => {
    test('should recognize if a hotkey [combo] is not specific to a particular OS', () => {
      expect(isNonOSSpecificKeyCombo('shift+x')).toBe(true);
    });
    test('should recognize if a hotkey [combo] is specific to MacOS', () => {
      expect(isNonOSSpecificKeyCombo('command+x')).toBe(false);
    });
    test('should recognize if a hotkey [combo] is specific to Windows', () => {
      expect(isNonOSSpecificKeyCombo('alt+x')).toBe(false);
    });
  });
  describe('categorizeKeyboardShortcuts', () => {
    test('should return an empty object if given no shortcuts', () => {
      expect(categorizeKeyboardShortcuts(undefined)).toMatchObject({});
    });
    test('should return an empty object if given an empty list', () => {
      expect(categorizeKeyboardShortcuts([])).toMatchObject({});
    });
  });
  describe('hotkeyMatchesSearchTerm', () => {
    test('handles hotkeys without categories', () => {
      expect(
        hotkeyMatchesSearchTerm(
          {
            combos: ['shift+s'],
            description: 'Does a thing'
          },
          'foo'
        )
      ).toBe(false);
    });
  });
  describe('doHotkeyCombosMatch', () => {
    test('handles control and ctrl the same', () => {
      const combo = 'ctrl+a';
      expect(doHotkeyCombosMatch([combo], 'ctrl')).toBe(doHotkeyCombosMatch([combo], 'control'));
      const combo2 = 'control+a';
      expect(doHotkeyCombosMatch([combo2], 'ctrl')).toBe(doHotkeyCombosMatch([combo2], 'control'));
    });
    test('handles command and cmd the same', () => {
      const combo = 'cmd+a';
      expect(doHotkeyCombosMatch([combo], 'cmd')).toBe(doHotkeyCombosMatch([combo], 'command'));
      const combo2 = 'command+a';
      expect(doHotkeyCombosMatch([combo2], 'cmd')).toBe(doHotkeyCombosMatch([combo2], 'command'));
    });
  });
  describe('isSearchTermFoundInCombo', () => {
    test('matches combos that use + as though they used a space', () => {
      expect(isSearchTermFoundInCombo('shift+s', 'shift s')).toBe(true);
    });
  });
  describe('formatHotkeyString', () => {
    test('generates the expected hotkey', () => {
      expect(formatHotkeyString('control+alt+delete')).toBe('(ctrl + alt + delete)');
    });
    test('generates the expected hotkey if given capital letters', () => {
      expect(formatHotkeyString('Control+Alt+Delete')).toBe('(ctrl + alt + delete)');
    });
  });
  describe('mergeKeyboardShortcutsByCategory', () => {
    const keyboardShortcuts = {
      clickEvents: {
        testClickEvent: {
          description: 'Do the click thing',
          helpText: 'Click to do the thing.',
          combos: [],
          tags: ['click', 'foo'],
          categories: ['A', 'B', 'C']
        }
      },
      doubleClickEvents: {
        testClickEvent: {
          description: 'Double do the thing',
          helpText: 'Click to do the thing.',
          combos: ['alt'],
          tags: ['double click', 'foo'],
          categories: ['A', 'C', 'E', 'D']
        }
      },
      hotkeys: {
        testClickEvent: {
          description: 'Do the thing',
          helpText: 'Hotkey to do the thing.',
          combos: ['alt', 'ctrl + t'],
          tags: ['hotkey', 'foo'],
          categories: ['A', 'E', 'I', 'O', 'U']
        },
        unrelatedHotkey: {
          description: 'Something else',
          helpText: 'Another hotkey.',
          combos: ['ctrl + p'],
          tags: ['bar', 'baz'],
          categories: ['I', 'O', 'U']
        }
      }
    };
    const mergedKeyboardShortcuts = mergeKeyboardShortcutsByCategory(
      // This gets around the key-typing for the keyboard shortcuts
      keyboardShortcuts as unknown as ConfigurationTypes.KeyboardShortcutConfigurations
    );
    it('merges click, double click, and normal hotkey combos', () => {
      // A is in clickEvents doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.A[0].combos).toContainEqual('click');
      expect(mergedKeyboardShortcuts.A[0].combos).toContainEqual('alt');
      expect(mergedKeyboardShortcuts.A[0].combos).toContainEqual('ctrl + t');
      expect(mergedKeyboardShortcuts.A[0].combos).toContainEqual('alt + double click');
      expect(mergedKeyboardShortcuts.A[0].combos).toHaveLength(4);

      // B is in only clickEvents
      expect(mergedKeyboardShortcuts.B[0].combos).toContainEqual('click');
      expect(mergedKeyboardShortcuts.B[0].combos).toHaveLength(1);

      // C is in clickEvents and doubleClickEvents
      expect(mergedKeyboardShortcuts.C[0].combos).toContainEqual('click');
      expect(mergedKeyboardShortcuts.C[0].combos).toContainEqual('alt + double click');
      expect(mergedKeyboardShortcuts.C[0].combos).toHaveLength(2);

      // D is in only doubleClickEvents
      expect(mergedKeyboardShortcuts.D[0].combos).toContainEqual('alt + double click');
      expect(mergedKeyboardShortcuts.D[0].combos).toHaveLength(1);

      // E is in doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.E[0].combos).toContainEqual('alt + double click');
      expect(mergedKeyboardShortcuts.E[0].combos).toContainEqual('alt');
      expect(mergedKeyboardShortcuts.E[0].combos).toContainEqual('ctrl + t');
      expect(mergedKeyboardShortcuts.E[0].combos).toHaveLength(3);

      // I is only in hotkeys
      expect(mergedKeyboardShortcuts.I[0].combos).toContainEqual('alt');
      expect(mergedKeyboardShortcuts.I[0].combos).toContainEqual('ctrl + t');
      expect(mergedKeyboardShortcuts.I[0].combos).toHaveLength(2);
      // I contains two hotkey shortcuts
      expect(mergedKeyboardShortcuts.I).toHaveLength(2);
    });
    it('merges click, double click, and normal hotkey tags', () => {
      // A is in clickEvents doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.A[0].tags).toContainEqual('click');
      expect(mergedKeyboardShortcuts.A[0].tags).toContainEqual('double click');
      expect(mergedKeyboardShortcuts.A[0].tags).toContainEqual('hotkey');
      expect(mergedKeyboardShortcuts.A[0].tags.filter(tag => tag === 'foo')).toHaveLength(1);
      expect(mergedKeyboardShortcuts.A[0].tags).toHaveLength(4);

      // B is in only clickEvents
      expect(mergedKeyboardShortcuts.B[0].tags).toContainEqual('foo');
      expect(mergedKeyboardShortcuts.B[0].tags).toContainEqual('click');
      expect(mergedKeyboardShortcuts.B[0].tags).not.toContainEqual('double click');
      expect(mergedKeyboardShortcuts.B[0].tags).not.toContainEqual('hotkey');
      expect(mergedKeyboardShortcuts.B[0].tags).toHaveLength(2);

      // C is in clickEvents and doubleClickEvents
      expect(mergedKeyboardShortcuts.C[0].tags).toContainEqual('foo');
      expect(mergedKeyboardShortcuts.C[0].tags).toContainEqual('click');
      expect(mergedKeyboardShortcuts.C[0].tags).toContainEqual('double click');
      expect(mergedKeyboardShortcuts.C[0].tags).not.toContainEqual('hotkey');
      expect(mergedKeyboardShortcuts.C[0].tags).toHaveLength(3);

      // D is in only doubleClickEvents
      expect(mergedKeyboardShortcuts.D[0].tags).toContainEqual('foo');
      expect(mergedKeyboardShortcuts.D[0].tags).not.toContainEqual('click');
      expect(mergedKeyboardShortcuts.D[0].tags).toContainEqual('double click');
      expect(mergedKeyboardShortcuts.D[0].tags).not.toContainEqual('hotkey');
      expect(mergedKeyboardShortcuts.D[0].tags).toHaveLength(2);

      // E is in doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.E[0].tags).toContainEqual('foo');
      expect(mergedKeyboardShortcuts.E[0].tags).not.toContainEqual('click');
      expect(mergedKeyboardShortcuts.E[0].tags).toContainEqual('double click');
      expect(mergedKeyboardShortcuts.E[0].tags).toContainEqual('hotkey');
      expect(mergedKeyboardShortcuts.E[0].tags).toHaveLength(3);

      // I is only in hotkeys
      expect(mergedKeyboardShortcuts.I[0].tags).toContainEqual('foo');
      expect(mergedKeyboardShortcuts.I[0].tags).not.toContainEqual('click');
      expect(mergedKeyboardShortcuts.I[0].tags).not.toContainEqual('double click');
      expect(mergedKeyboardShortcuts.I[0].tags).toContainEqual('hotkey');
      expect(mergedKeyboardShortcuts.I[0].tags).toHaveLength(2);
    });
    it('merges descriptions', () => {
      // A is in clickEvents doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.A[0].description).toEqual(
        'Do the click thing; Double do the thing; Do the thing'
      );
      // B is in only clickEvents
      expect(mergedKeyboardShortcuts.B[0].description).toEqual('Do the click thing');
      // C is in clickEvents and doubleClickEvents
      expect(mergedKeyboardShortcuts.C[0].description).toEqual(
        'Do the click thing; Double do the thing'
      );
      // D is in only doubleClickEvents
      expect(mergedKeyboardShortcuts.D[0].description).toEqual('Double do the thing');
      // E is in doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.E[0].description).toEqual('Double do the thing; Do the thing');
      // I is only in hotkeys
      expect(mergedKeyboardShortcuts.I[0].description).toEqual('Do the thing');
    });
    it('merges help text', () => {
      // A is in clickEvents doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.A[0].helpText).toEqual(
        'Click to do the thing.\nHotkey to do the thing.'
      );
      // B is in only clickEvents
      expect(mergedKeyboardShortcuts.B[0].helpText).toEqual('Click to do the thing.');
      // C is in clickEvents and doubleClickEvents
      expect(mergedKeyboardShortcuts.C[0].helpText).toEqual('Click to do the thing.');
      // D is in only doubleClickEvents
      expect(mergedKeyboardShortcuts.D[0].helpText).toEqual('Click to do the thing.');
      // E is in doubleClickEvents and hotkeys
      expect(mergedKeyboardShortcuts.E[0].helpText).toEqual(
        'Click to do the thing.\nHotkey to do the thing.'
      );
      // I is only in hotkeys
      expect(mergedKeyboardShortcuts.I[0].helpText).toEqual('Hotkey to do the thing.');
    });
    it('separates categories correctly', () => {
      Object.entries(mergedKeyboardShortcuts).forEach(([category, mergedShortcuts]) => {
        mergedShortcuts.forEach(mergedShortcut => {
          expect(mergedShortcut.categories).toHaveLength(1);
          expect(mergedShortcut.categories).toContainEqual(category);
        });
      });
    });
  });
  describe('addAlternateKeyNameTagsToHotkeyConfiguration', () => {
    const keyboardShortcuts: ConfigurationTypes.HotkeyConfiguration[] = [
      {
        description: 'Do the click thing',
        helpText: 'Click to do the thing.',
        combos: ['ctrl+a'],
        tags: ['click', 'foo'],
        categories: ['A']
      },
      {
        description: 'Double do the thing',
        helpText: 'Click to do the thing.',
        combos: ['alt+shift+b'],
        tags: ['double click', 'foo'],
        categories: ['A']
      },
      {
        description: 'Do the thing',
        helpText: 'Hotkey to do the thing.',
        combos: ['alt+mod+e', 'ctrl + t'],
        tags: ['hotkey', 'foo'],
        categories: ['A']
      },
      {
        description: 'Something else',
        helpText: 'Another hotkey.',
        combos: ['meta + p'],
        tags: ['bar', 'baz'],
        categories: ['A']
      }
    ];
    it('handles alt/command', () => {
      const originalPlatform = window.navigator.platform;
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Macintosh',
        configurable: true
      });
      const withTags = addAlternateKeyNameTagsToHotkeyConfiguration(keyboardShortcuts);
      expect(withTags[0].tags).toContainEqual('control');
      expect(withTags[1].tags).toContainEqual('option');
      expect(withTags[2].tags).toContainEqual('command');
      expect(withTags[2].tags).toContainEqual('cmd');
      expect(withTags[2].tags).toContainEqual('option');
      expect(withTags[2].tags).toContainEqual('control');
      expect(withTags[3].tags).toContainEqual('command');
      expect(withTags[3].tags).toContainEqual('cmd');
      Object.defineProperty(window.navigator, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });
  });
});
