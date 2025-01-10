import type GoldenLayout from '@gms/golden-layout';
import React from 'react';

import { useForceUpdate } from './custom-hooks';

/**
 * Void callback function
 */
type callback = () => void;

/**
 * Helper function to execute the Golden Layout Container's action
 *
 * @param glContainer the golden layout container
 * @param callbackFn the call back function
 * @param action action to it should execute on
 */
const addGlAction = (glContainer: GoldenLayout.Container, callbackFn: callback, action: string) => {
  if (glContainer && callbackFn) {
    glContainer.on(action, callbackFn);
  }
};

/**
 * Clears a golden layout event listener to avoid memory leaks
 *
 * @param glContainer The golden layout container
 * @param callbackFn The callback that was used when adding the action (must be the exact same, referentially equivalent callback)
 * @param action The action for which to clear the event listener
 */
const clearGlAction = (
  glContainer: GoldenLayout.Container,
  callbackFn: callback,
  action: string
): void => {
  if (glContainer && callbackFn) {
    glContainer.off(action, callbackFn);
  }
};

/**
 * Attaches an event handler to the golden-layout event 'show' that will force
 * the component to update when dispatched.
 * ! Attached event listeners can cause memory leaks. Always call `clearGlUpdateOnShow`
 * ! when the listener is no longer needed.
 *
 * @param glContainer the golden-layout container
 * @param callbackFn the callback to invoke on show
 */
export const addGlUpdateOnShow = (
  glContainer: GoldenLayout.Container,
  callbackFn: callback
): void => {
  addGlAction(glContainer, callbackFn, 'show');
};

/**
 * Clears an attached event listener on the golden-layout event 'show'.
 *
 * @param glContainer the golden layout container which has the attached event
 * @param callbackFn the callback function that was originally attached (must be the exact same, referentially equivalent callback)
 */
export const clearGlUpdateOnShow = (glContainer: GoldenLayout.Container, callbackFn: callback) => {
  clearGlAction(glContainer, callbackFn, 'show');
};

/**
 * Attaches an event handler to the golden-layout event 'show' that will force
 * the component to update when dispatched.
 * ! Attached event listeners can cause memory leaks. Always call `clearGlUpdateOnHide`
 * ! when the listener is no longer needed.
 *
 * @param glContainer the golden-layout container
 * @param callbackFn the callback to invoke on show
 */
export const addGlUpdateOnHide = (
  glContainer: GoldenLayout.Container,
  callbackFn: callback
): void => {
  addGlAction(glContainer, callbackFn, 'hide');
};

/**
 * Clears an attached event listener on the golden-layout event 'hide'.
 *
 * @param glContainer the golden layout container which has the attached event
 * @param callbackFn the callback function that was originally attached (must be the exact same, referentially equivalent callback)
 */
export const clearGlUpdateOnHide = (glContainer: GoldenLayout.Container, callbackFn: callback) => {
  clearGlAction(glContainer, callbackFn, 'hide');
};

/**
 * Attaches an event handler to the golden-layout event 'resize' that will force
 * the component to update when dispatched.
 * ! Attached event listeners can cause memory leaks. Always call `clearGlUpdateOnResize`
 * ! when the listener is no longer needed.
 *
 * @param glContainer the golden-layout container
 * @param callbackFn the callback to invoke on resize
 */
export const addGlUpdateOnResize = (
  glContainer: GoldenLayout.Container,
  callbackFn: callback
): void => {
  if (glContainer && callbackFn) {
    // force update when the golden-layout container is resized
    glContainer.on('resize', callbackFn);
  }
};

/**
 * Clears an attached event listener on the golden-layout event 'resize'.
 *
 * @param glContainer the golden layout container which has the attached event
 * @param callbackFn the callback function that was originally attached (must be the exact same, referentially equivalent callback)
 */
export const clearGlUpdateOnResize = (
  glContainer: GoldenLayout.Container,
  callbackFn: callback
) => {
  clearGlAction(glContainer, callbackFn, 'resize');
};

/**
 * Attaches an event handler to the golden-layout event 'tab' that will force
 * the component to update when dispatched.
 * ! Attached event listeners can cause memory leaks. Always call `clearGlUpdateOnResize`
 * ! when the listener is no longer needed.
 *
 * @param glContainer the golden-layout container
 * @param callbackFn the callback to invoke on tab
 */
export const addGlUpdateOnTab = (
  glContainer: GoldenLayout.Container,
  callbackFn: callback
): void => {
  if (glContainer && callbackFn) {
    // force update when the golden-layout container is tab
    glContainer.on('tab', callbackFn);
  }
};

/**
 * Clears an attached event listener on the golden-layout event 'tab'.
 *
 * @param glContainer the golden layout container which has the attached event
 * @param callbackFn the callback function that was originally attached (must be the exact same, referentially equivalent callback)
 */

export const clearGlUpdateOnTab = (glContainer: GoldenLayout.Container, callbackFn: callback) => {
  clearGlAction(glContainer, callbackFn, 'tab');
};

/**
 * A custom hook that will force update a react function component
 * on the golden layout events `resize` and `show`.
 *
 * @param glContainer the golden layout container
 */
export const useForceGlUpdateOnResizeAndShow = (
  glContainer: GoldenLayout.Container | undefined
): void => {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    if (glContainer) {
      addGlUpdateOnShow(glContainer, forceUpdate);
      addGlUpdateOnResize(glContainer, forceUpdate);
    } else {
      window.addEventListener('resize', forceUpdate);
    }
    return () => {
      // removeEventListener is a no-op if there is no event that matches
      // so we don't need to check
      window.removeEventListener('resize', forceUpdate);

      if (glContainer && glContainer.off) {
        glContainer.off('show');
        glContainer.off('resize');
      }
    };
  }, [forceUpdate, glContainer]);
};
