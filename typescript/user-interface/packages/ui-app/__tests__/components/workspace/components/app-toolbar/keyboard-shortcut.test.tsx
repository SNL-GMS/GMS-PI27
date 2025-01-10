import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';

import { KeyboardShortcuts } from '../../../../../src/ts/components/common-ui/components/keyboard-shortcuts/keyboard-shortcuts';
import {
  doHotkeyCombosMatch,
  hotkeyMatchesSearchTerm,
  isSearchTermFoundInCombo
} from '../../../../../src/ts/components/common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

const mockShortcuts = processingAnalystConfigurationData.keyboardShortcuts;

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(() => mockShortcuts)
  };
});

describe('Keyboard Shortcuts', () => {
  describe('isSearchTermFoundInCombo', () => {
    it('can identify a match with shift key', () => {
      mockShortcuts.hotkeys.loadLaterData.combos.forEach(combo => {
        expect(isSearchTermFoundInCombo(combo, 'shift')).toBe(true);
      });
    });
    it('can identify when a term does not match', () => {
      mockShortcuts.hotkeys.loadLaterData.combos.forEach(combo => {
        expect(isSearchTermFoundInCombo(combo, 'ctrl')).toBe(false);
      });
    });
  });
  describe('doHotkeyCombosMatch', () => {
    it('can identify a match with control key', () => {
      expect(doHotkeyCombosMatch(mockShortcuts.dragEvents.zoomToRange.combos, 'control')).toBe(
        true
      );
    });
    it('can identify a match with ctrl key', () => {
      expect(doHotkeyCombosMatch(mockShortcuts.dragEvents.zoomToRange.combos, 'ctrl')).toBe(true);
    });
    it('can identify a match with command key', () => {
      expect(doHotkeyCombosMatch(mockShortcuts.dragEvents.zoomToRange.combos, 'command')).toBe(
        true
      );
    });
    it('can identify a match with cmd key', () => {
      expect(doHotkeyCombosMatch(mockShortcuts.dragEvents.zoomToRange.combos, 'cmd')).toBe(true);
    });
    it('can identify when keys do not match', () => {
      expect(doHotkeyCombosMatch(mockShortcuts.dragEvents.zoomToRange.combos, 'shift')).toBe(false);
    });
  });
  describe('hotkeyMatchesSearchTerm', () => {
    it('can identify a match in the tags', () => {
      expect(hotkeyMatchesSearchTerm(mockShortcuts.dragEvents.zoomToRange, 'click')).toBe(true);
    });
    it('can identify a match in the category', () => {
      expect(hotkeyMatchesSearchTerm(mockShortcuts.dragEvents.zoomToRange, 'display')).toBe(true);
    });
    it('can identify a match in the description', () => {
      expect(hotkeyMatchesSearchTerm(mockShortcuts.dragEvents.zoomToRange, 'range')).toBe(true);
    });
    it('can identify when there is no match', () => {
      expect(hotkeyMatchesSearchTerm(mockShortcuts.dragEvents.zoomToRange, 'fail')).toBe(false);
    });
    it('can find hotkey combo', () => {
      expect(hotkeyMatchesSearchTerm(mockShortcuts.dragEvents.zoomToRange, 'ctrl')).toBe(true);
      expect(hotkeyMatchesSearchTerm(mockShortcuts.dragEvents.zoomToRange, 'cmd')).toBe(true);
    });
  });
  describe('KeyboardShortcuts component', () => {
    it('matches a snapshot', () => {
      expect(
        create(
          <Provider store={getStore()}>
            <KeyboardShortcuts />
          </Provider>
        ).toJSON()
      ).toMatchSnapshot();
    });
  });
});
