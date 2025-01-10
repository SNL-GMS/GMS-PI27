import Immutable from 'immutable';
import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';
import React from 'react';

import { getOS, OSTypes } from '../os-util';
import {
  convertCommandToHotKeyArray,
  convertHotKeyArrayToCommand,
  doesEventSatisfyHotKeyCommand,
  getHotKeyArray,
  getKeyPressed,
  normalizeHotKeyCombo
} from './hot-key-util';

/**
 * A map of key strings to whether or not they are currently being pressed.
 * Tracks modifier hotkeys as well as other keys. See @enum ModifierHotKeys.
 */
let keyDownMap: Immutable.Map<string, boolean> | undefined;

/**
 * A map of subscription keys. We use a map for quick lookup and removal.
 */
let subscriptionIdMap: Immutable.Map<string, boolean> = Immutable.Map<string, boolean>();

/**
 * A map of key combos to strings, which are assigned to the `data-key-mode` attribute
 * on the body
 */
let modeNameMap: Immutable.Map<string, string> = Immutable.Map<string, string>();

/**
 * Converts the keydown map into a command. This function handles the immutable js logic,
 * keeping that scoped within this module, and calls `convertHotKeyArrayToCommand` in
 * order to convert it.
 *
 *
 * @param kdm An immutable map of depressed keys to boolean values
 * @returns that map converted to a command, alphabetized, separated by the defined separator,
 * and with no added whitespace.
 *
 * @example a resulting keydown map could be Alt+Control+KeyE
 */
const convertKeyDownMapToCommand = (kdm: Immutable.Map<string, boolean>) => {
  return convertHotKeyArrayToCommand(Object.keys(kdm.filter(v => !!v).toObject()));
};

/**
 * Adds the hotkey to the data-key-combo attribute on the body element.
 * Adds the mode string, if there is one, to the data-key-mode attribute on the body element.
 */
const updateBodyDataAttr = () => {
  let commandFromKeyDownMap = '';
  if (keyDownMap) {
    commandFromKeyDownMap = convertKeyDownMapToCommand(keyDownMap);
  }
  document.body.setAttribute('data-key-combo', commandFromKeyDownMap);
  document.body.setAttribute('data-key-mode', modeNameMap.get(commandFromKeyDownMap) ?? 'default');
};

/**
 * Sets the keyDownMap to a new, empty map.
 */
const initializeKeyDownMap = () => {
  keyDownMap = Immutable.Map<string, boolean>();
  updateBodyDataAttr();
};

/**
 * check if initialize should be called for contextMenu
 */
const checkContextMenuInitialize = event => {
  // Only initialize on right click to prevent conflicting behavior with ctrl+left click on mac
  if (event.button === 2) initializeKeyDownMap();
};

/**
 * If not initialized, throws an error saying so and recommending subscribing
 *
 * @throws an error if not initialized
 */
function assertIsInitialized(
  theKeyDownMap: Immutable.Map<string, boolean> | undefined
): asserts theKeyDownMap is Immutable.Map<string, boolean> {
  if (keyDownMap === undefined) {
    throw new Error(`Attempting to use global hotkey listener, but no listener exists.`);
  }
}

/**
 * Records that a key has been pressed.
 *
 * @param ev the keyboard event for which to record that a key is pressed
 */
const recordKey = (ev: KeyboardEvent) => {
  // Don't update the keyDownMap if we have just done so.
  // This is a performance optimization, since memory allocation is costly.
  if (ev.repeat) {
    return;
  }
  // now set each key that is pressed to true.
  getHotKeyArray(ev).forEach(k => {
    assertIsInitialized(keyDownMap);
    keyDownMap = keyDownMap.set(k, true);
  });
  updateBodyDataAttr();
};

/**
 * Records that a key has been released
 *
 * @param ev the keyboard event for which to record that a key was released
 */
const releaseKey = (ev: KeyboardEvent) => {
  assertIsInitialized(keyDownMap);
  // now set each key that is pressed to false.
  const pressed = getKeyPressed(ev);
  if (pressed) {
    keyDownMap = keyDownMap.set(pressed, false);
  }
  // Handle special case for command key on mac, where keyup events don't trigger
  // for keys held in combo with the command key.
  if (getOS() === OSTypes.MAC && ev.key === 'Meta') {
    keyDownMap = Immutable.Map<string, boolean>();
  }
  updateBodyDataAttr();
};

/**
 * Initializes a global hotkey listener on the document body. Any keyboard events that propagate up to
 * the body will be recorded, and subsequent calls to @function isKeyDown  will return true if that key
 * is currently held down, and false otherwise.
 *
 * Be sure to eat your vegetables and call @function unsubscribeFromGlobalHotkeyListener to clean up these
 * listeners when appropriate, such as in the componentDidUnmount lifecycle method of the component that
 * registered this listener.
 *
 * @returns an id which should be used to unsubscribe by calling @function unsubscribeFromGlobalHotkeyListener
 */
export const subscribeToGlobalHotkeyListener = (): string => {
  const id = uniqueId();
  subscriptionIdMap = subscriptionIdMap.set(id, true);
  if (keyDownMap === undefined) {
    initializeKeyDownMap();
    document.body.addEventListener('keydown', recordKey);
    document.body.addEventListener('keyup', releaseKey);
    // clear all tracked keys if the user leaves the app
    window.addEventListener('contextmenu', checkContextMenuInitialize);
    window.addEventListener('blur', initializeKeyDownMap);
  }
  return id;
};

/**
 * Cleans up the global hotkey listener. Subsequent calls to @function isKeyDown
 * or @function isGlobalHotkeyCommandSatisfied will throw an error.
 * This should be called only once per subscribe.
 *
 * @param id the ID that was given when subscribing using @function subscribeToGlobalHotkeyListener
 */
export const unsubscribeFromGlobalHotkeyListener = (id: string): void => {
  if (subscriptionIdMap.get(id)) {
    subscriptionIdMap = subscriptionIdMap.remove(id);
    // if nobody is listening, clean up
    if (subscriptionIdMap.size === 0) {
      keyDownMap = undefined;
      updateBodyDataAttr();
      document.body.removeEventListener('keydown', recordKey);
      document.body.removeEventListener('keyup', releaseKey);
      window.removeEventListener('contextmenu', checkContextMenuInitialize);
      window.removeEventListener('blur', initializeKeyDownMap);
    }
  }
};

/**
 * Maps a hotkey combo to a string, and if that combo is pressed, sets the data-key-mode attribute on the body element
 * to be the corresponding string.
 *
 * @throws if a different mode was already defined for this combo
 *
 * @param combo A key combo that enables this mode
 * @param modeName the string that should be set in the data-key-mode attribute on the body element
 */
export const registerHotKeyMode = (combo: string, modeName: string) => {
  const normalizedCombo = normalizeHotKeyCombo(combo);
  if (modeNameMap.has(combo) && modeNameMap.get(normalizedCombo) !== modeName) {
    throw new Error(
      `Cannot register hotkey mode for combo ${combo}. Mode already exists for this combo: ${modeNameMap.get(
        normalizedCombo
      )}`
    );
  }
  modeNameMap = modeNameMap.set(normalizedCombo, modeName);
};

/**
 * Returns a sorted array of keys pressed
 *
 * @throws if the listener has not been initialized
 */
const getKeysPressedArray = (): string[] => {
  assertIsInitialized(keyDownMap);
  return Array.from(keyDownMap.filter(val => val).keys()).sort();
};

/**
 * Returns true if the @param keyToCheck is current held down, false otherwise.
 * Note: if an element is calling stopPropagation for a keypress event, that keypress will not be registered, and this command
 * may not be matched.
 *
 * @throws if called before @function subscribeToGlobalHotkeyListener has
 * been called to initialize the listener, or if called after @function unsubscribeFromGlobalHotkeyListener
 * has been called to remove the global listener.
 *
 * @param keyToCheck the string representing the key code (for example, the string returned by event.code)
 * See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
 * @returns true if the key is held down, false if otherwise.
 */
export const isKeyDown = (keyToCheck: string): boolean => {
  assertIsInitialized(keyDownMap);
  return !!keyDownMap.get(keyToCheck);
};

/**
 * Returns true if all of the keys in a hotkey command are pressed and have propagated up to the document.body element.
 * Note: if an element is calling stopPropagation for a keypress event, that keypress will not be registered, and this command
 * may not be matched.
 *
 * @throws if called before @function subscribeToGlobalHotkeyListener or @function useGlobalHotkeyListener has
 * been called to initialize the listener, or if called after @function unsubscribeFromGlobalHotkeyListener
 * has been called to remove the global listener.
 *
 * @param hotKeyCommands a list of hotkey commands of the form Control+Alt+Shift+S combined of meta key strings and event.code strings.
 * If an undefined command is provided, returns false.
 * @returns true if all keys are pressed. False otherwise.
 */
export const isGlobalHotKeyCommandSatisfied = (hotKeyCommands: string[] | undefined): boolean => {
  assertIsInitialized(keyDownMap);

  // guard against undefined because a lot of commands are optional.
  if (!hotKeyCommands || hotKeyCommands.length === 0) {
    return false;
  }

  const isSatisfied = hotKeyCommands.map(hotKeyCommand => {
    if (hotKeyCommand == null) return false;
    return isEqual(convertCommandToHotKeyArray(hotKeyCommand), getKeysPressedArray());
  });
  return isSatisfied.includes(true);
};

/**
 * A hook that initializes the global hotkey listener on mount, and cleans
 * it up when unmounted.
 */
export const useGlobalHotkeyListener = (): void => {
  const listenerIdRef = React.useRef<string>();
  React.useEffect(() => {
    listenerIdRef.current = subscribeToGlobalHotkeyListener();
    const value = listenerIdRef.current;
    if (value != null) {
      return () => unsubscribeFromGlobalHotkeyListener(value);
    }
    return () => {
      /* do nothing */
    };
  }, []);
};

/**
 * Returns true if the event satisfies the hotkey command on its own, or if all of the keys in a hotkey command
 * are pressed and have propagated up to the document.body element.
 *
 * Note: if an element is calling stopPropagation for a keypress event, that keypress will not be registered, and this command
 * may not be matched.
 *
 * @throws if called before @function subscribeToGlobalHotkeyListener or @function useGlobalHotkeyListener has
 * been called to initialize the listener, or if called after @function unsubscribeFromGlobalHotkeyListener
 * has been called to remove the global listener.
 *
 * @param hotKeyCommand a hotkey command of the form Control+Alt+Shift+S combined of meta keys strings and event.code values.
 * If an undefined command is provided, returns false.
 * @returns true if all keys are pressed. False otherwise.
 */
export const isHotKeyCommandSatisfied = (
  event: KeyboardEvent | MouseEvent,
  hotKeyCommands: string[]
) => {
  return (
    doesEventSatisfyHotKeyCommand(event, hotKeyCommands) ||
    isGlobalHotKeyCommandSatisfied(hotKeyCommands)
  );
};
