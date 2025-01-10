/* eslint-disable react/destructuring-assignment */
import { hideImperativeContextMenu } from '@gms/ui-core-components';
import { AnalystWorkspaceTypes, getKeyPressAction } from '@gms/ui-state';
import produce from 'immer';
import throttle from 'lodash/throttle';
import React from 'react';

import type { InteractionConsumerProps } from './types';

const THROTTLE_HOTKEY_REPEAT_MS = 500;

const isHotkeyListenerAttached = () => {
  if (document.getElementById('app')) {
    return document.getElementById('app').dataset.hotkeyListenerAttached === 'true';
  }
  return false;
};

const setHotkeyListenerAttached = () => {
  if (document.getElementById('app')) {
    document.getElementById('app').dataset.hotkeyListenerAttached = 'true';
  }
};

/**
 * Consumes keypress from the redux store and calls the Interaction Provider context to perform the appropriate action
 */
export function InteractionConsumer(props: React.PropsWithChildren<InteractionConsumerProps>) {
  /**
   * Checks to see if an action should be performed, and if so consumes the keypress and performs it
   *
   * @param keyAction the key action
   * @param callback the callback
   * @param shouldConsumeAllKeypress true if should consume all key presses
   */
  const maybeConsumeKeypress = React.useCallback(
    (
      keyAction: AnalystWorkspaceTypes.AnalystKeyAction,
      callback: () => void,
      shouldConsumeAllKeypress = false
    ) => {
      if (props.keyPressActionQueue) {
        const maybeKeyCount = props.keyPressActionQueue[keyAction];
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(maybeKeyCount) && maybeKeyCount > 0) {
          props.setKeyPressActionQueue(
            produce(props.keyPressActionQueue, draft => {
              draft[keyAction] = shouldConsumeAllKeypress ? 0 : maybeKeyCount - 1;
            })
          );
          callback();
        }
      }
    },
    [props]
  );

  React.useEffect(() => {
    maybeConsumeKeypress(
      AnalystWorkspaceTypes.AnalystKeyAction.ESCAPE,
      () => {
        // close/hide any opened context menus
        hideImperativeContextMenu();
      },
      true
    );
  }, [maybeConsumeKeypress, props.keyPressActionQueue]);

  /**
   * checks to see if the keypress matches a configured hotkey, and if so,
   * adds it to the keypress action queue
   */
  const handleHotkey = React.useCallback(
    (keyEvent: KeyboardEvent): void => {
      if (props.keyPressActionQueue && !keyEvent.repeat) {
        if (props.keyPressActionQueue) {
          const keyPressAction = getKeyPressAction(keyEvent);
          if (keyPressAction && AnalystWorkspaceTypes.isAnalystKeyAction(keyPressAction)) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
            const entryForKeyMap = props.keyPressActionQueue[keyPressAction]
              ? props.keyPressActionQueue[keyPressAction]
              : 0;
            props.setKeyPressActionQueue(
              produce(props.keyPressActionQueue, draft => {
                draft[keyPressAction] = Number(entryForKeyMap) + 1;
              })
            );
          }
        }
      }
    },
    [props]
  );

  /**
   * Adds a keydown listener to the document, so we will catch anything that bubbles up to the top.
   */
  React.useEffect(() => {
    if (!isHotkeyListenerAttached()) {
      document.addEventListener('keydown', throttle(handleHotkey, THROTTLE_HOTKEY_REPEAT_MS));
      setHotkeyListenerAttached();
    }

    // Clean up the event listener on unmount
    return () => document.removeEventListener('keydown', handleHotkey);
  }, [handleHotkey]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}
