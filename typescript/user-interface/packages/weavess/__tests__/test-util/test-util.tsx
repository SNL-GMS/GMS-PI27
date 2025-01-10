/**
 * Creates and dispatches a 'mousemove' event on the document.body element.
 *
 * @param clientX the x coordinate in pixels at which to trigger the mouse move
 * @param clientY the y coordinate in pixels at which to trigger the mouse move
 */
export const documentMoveMouse = (clientX = 75, clientY = 75): void => {
  const mouseEventInit: MouseEventInit = {
    clientX,
    clientY
  };
  const moveMouseEvent = new MouseEvent('mousemove', mouseEventInit);
  document.body.dispatchEvent(moveMouseEvent);
};

/**
 * Creates and dispatches a 'mouseup' event on the document.body element.
 *
 * @param clientX the x coordinate in pixels at which to trigger the mouse up
 * @param clientY the y coordinate in pixels at which to trigger the mouse up
 */
export const documentReleaseMouse = (clientX = 90, clientY = 75): void => {
  // Now release mouse
  const mouseEventUp = {
    clientX,
    clientY
  };
  const mouseUpEvent = new MouseEvent('mouseup', mouseEventUp);
  document.body.dispatchEvent(mouseUpEvent);
};
