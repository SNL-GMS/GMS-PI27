import { render } from '@testing-library/react';
import React from 'react';

import { HotkeyListener } from '../../../src/ts/ui-util';

const keyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
  key: 'Y',
  code: 'KeyY'
});
const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
  key: 'Alt',
  code: 'AltLeft',
  altKey: true
});
const keyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
  key: 'Y',
  code: 'KeyY'
});
const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
  key: 'Alt',
  code: 'AltLeft',
  altKey: true
});

describe('Global Hotkey Listener', () => {
  describe('subscription', () => {
    let subscriptionId: string;
    beforeEach(() => {
      subscriptionId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    afterEach(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
    });
    it('does not throw when calling isKeyDown after subscribing', () => {
      expect(() => {
        HotkeyListener.isKeyDown('KeyY');
      }).not.toThrow();
    });
    it('does not throw when calling isGlobalHotKeyCommandSatisfied after subscribing', () => {
      expect(() => {
        HotkeyListener.isGlobalHotKeyCommandSatisfied(['Alt+KeyY']);
      }).not.toThrow();
    });
    it('throws when calling isKeyDown after unsubscribing', () => {
      expect(() => {
        HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
        HotkeyListener.isKeyDown('KeyY');
      }).toThrowErrorMatchingSnapshot();
    });
    it('throws when calling isGlobalHotKeyCommandSatisfied after unsubscribing', () => {
      expect(() => {
        HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
        HotkeyListener.isGlobalHotKeyCommandSatisfied(['Alt+KeyY']);
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('useGlobalHotkeyListener', () => {
    it('subscribes when calling useGlobalHotkeyListener hook', () => {
      function TestComponent() {
        HotkeyListener.useGlobalHotkeyListener();
        return null;
      }
      const { rerender, unmount } = render(<TestComponent />);
      const test = () => {
        rerender(<TestComponent />);
        HotkeyListener.isGlobalHotKeyCommandSatisfied(['Alt+Y']);
        unmount();
      };
      expect(test).not.toThrow();
    });
    it('unsubscribes when unmounting useGlobalHotkeyListener hook', () => {
      function TestComponent() {
        HotkeyListener.useGlobalHotkeyListener();
        return null;
      }
      const { rerender, unmount } = render(<TestComponent />);
      const test = () => {
        rerender(<TestComponent />);
        unmount();
        HotkeyListener.isGlobalHotKeyCommandSatisfied(['Alt+Y']);
      };
      expect(test).toThrowErrorMatchingSnapshot();
    });
  });

  describe('key presses', () => {
    let listenerId: string;
    beforeAll(() => {
      listenerId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    beforeEach(() => {
      document.body.dispatchEvent(keyDownEvent);
    });
    afterEach(() => {
      document.body.dispatchEvent(keyUpEvent);
    });
    afterAll(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(listenerId);
    });
    it('knows if a key is pressed', () => {
      expect(HotkeyListener.isKeyDown('Y')).toBe(true);
    });
    it('knows if a key has been released', () => {
      document.body.dispatchEvent(keyUpEvent);
      expect(HotkeyListener.isKeyDown('Y')).toBe(false);
    });
  });

  describe('commands', () => {
    let listenerId: string;
    beforeAll(() => {
      listenerId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    beforeEach(() => {
      document.body.dispatchEvent(modifierKeyDownEvent);
      document.body.dispatchEvent(keyDownEvent);
    });
    afterEach(() => {
      document.body.dispatchEvent(modifierKeyUpEvent);
      document.body.dispatchEvent(keyUpEvent);
    });
    afterAll(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(listenerId);
    });
    it('knows if a multi-key command is satisfied', () => {
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Alt+Y'])).toBe(true);
    });
    it('returns false if too many Key Y are pressed', () => {
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Y'])).toBe(false);
    });
    it('returns false if not enough Key Y are pressed', () => {
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Control+Alt+Y'])).toBe(false);
    });

    // add test for sort
    it('returns false if the wrong Key Y are pressed', () => {
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Control+Y'])).toBe(false);
    });
    it('returns false if command is undefined', () => {
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(undefined)).toBe(false);
    });
  });

  describe('command combos', () => {
    let listenerId: string;
    // before/after to clear the key down map (since 1 -> 0 subs clears the map)
    beforeEach(() => {
      listenerId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    afterEach(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(listenerId);
    });
    it('knows if a single modifier and single key/code command is satisfied', () => {
      // add modifiers 'alt' and then key 'y'
      let eventInit: KeyboardEventInit = {
        code: '',
        key: '',
        repeat: false,
        altKey: true
      };
      let keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      eventInit = {
        code: 'KeyY',
        key: 'Y',
        repeat: false
      };
      keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Alt+Y'])).toBe(true);
    });

    it('knows if a multi modifier and single key/code command is satisfied', () => {
      // add modifiers 'alt' and then key 'y'
      let eventInit: KeyboardEventInit = {
        code: '',
        key: '',
        repeat: false,
        altKey: true,
        shiftKey: true
      };
      let keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      eventInit = {
        code: 'KeyY',
        key: 'Y',
        repeat: false,
        altKey: false
      };
      keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Shift+Alt+Y'])).toBe(true);
    });

    it('knows if a multi modifier multi key/code command is satisfied', () => {
      // add modifiers 'alt', `shift`, `ctrl`, then key 'y', then key `1`
      let eventInit: KeyboardEventInit = {
        code: '',
        key: '',
        repeat: false,
        altKey: true,
        shiftKey: true,
        ctrlKey: true
      };
      let keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      eventInit = {
        code: 'KeyY',
        key: 'Y',
        repeat: false
      };
      keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      eventInit = {
        code: 'Digit1',
        key: '1',
        repeat: false,
        altKey: false
      };
      keyboardEvent = new KeyboardEvent('keydown', eventInit);
      document.body.dispatchEvent(keyboardEvent);
      expect(HotkeyListener.isGlobalHotKeyCommandSatisfied(['Control+Shift+Alt+Y+1'])).toBe(true);
    });
  });
});
