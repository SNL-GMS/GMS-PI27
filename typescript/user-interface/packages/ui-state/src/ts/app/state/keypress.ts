import type * as React from 'react';

import * as AnalystWorkspaceTypes from './analyst/types';

export type GenericKeyAction = AnalystWorkspaceTypes.AnalystKeyAction;

const createKeyString = (e: React.KeyboardEvent | KeyboardEvent, keyCode: string) =>
  `${e.ctrlKey || e.metaKey ? 'Control+' : ''}${e.altKey ? 'Alt+' : ''}${
    e.shiftKey ? 'Shift+' : ''
  }${keyCode}`;

const getKeyAction = (
  e: React.KeyboardEvent | KeyboardEvent,
  keyCode: string
): GenericKeyAction | undefined => {
  const keyStr = createKeyString(e, keyCode);
  return AnalystWorkspaceTypes.AnalystKeyActions.get(keyStr);
};

/**
 * Gets the keypress event, if any are defined, that matches the action provided.
 * Handles events on React wrapped HTML elements. For example,
 * this may be used to handle keypress events on elements created by JSX, like <div>
 *
 * @param e a React wrapped keypress event
 */
export function getReactKeyPressAction(
  e: React.KeyboardEvent<HTMLElement>
): GenericKeyAction | undefined {
  return getKeyAction(e, e.nativeEvent.code);
}

/**
 * Gets the keypress event, if any are defined, that matches the action provided.
 * Handles events on native HTML elements. For example,
 * this may be used to handle keypress events on document or window.
 *
 * @param e a keyboard event
 */
export function getKeyPressAction(e: KeyboardEvent): GenericKeyAction | undefined {
  return getKeyAction(e, e.code);
}
