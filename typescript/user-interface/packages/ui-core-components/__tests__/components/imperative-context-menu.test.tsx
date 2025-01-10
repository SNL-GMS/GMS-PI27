import React from 'react';

import { hideImperativeContextMenu, showImperativeContextMenu } from '../../src/ts/components';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('imperative context menu', () => {
  it('exists', () => {
    expect(showImperativeContextMenu).toBeDefined();
    expect(hideImperativeContextMenu).toBeDefined();
  });

  it('can show and hide', () => {
    const onClose = jest.fn();
    const callback = jest.fn();

    expect(() => {
      showImperativeContextMenu({ content: <div>test</div>, targetOffset: { left: 0, top: 0 } });
    }).not.toThrow();

    expect(onClose).toHaveBeenCalledTimes(0);
    expect(callback).toHaveBeenCalledTimes(0);

    expect(() => {
      hideImperativeContextMenu();
    }).not.toThrow();

    expect(onClose).toHaveBeenCalledTimes(0);
    expect(callback).toHaveBeenCalledTimes(0);

    expect(() => {
      showImperativeContextMenu({
        content: <div>test</div>,
        targetOffset: { left: 0, top: 0 },
        onClose
      });
    }).not.toThrow();

    expect(onClose).toHaveBeenCalledTimes(0);
    expect(callback).toHaveBeenCalledTimes(0);

    hideImperativeContextMenu({ callback, shouldInvokeOnClose: true, shouldReturnFocus: true });
    hideImperativeContextMenu({ callback, shouldInvokeOnClose: true, shouldReturnFocus: true });

    expect(onClose).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });
});
