/* eslint-disable @typescript-eslint/unbound-method */
import type GoldenLayout from '@gms/golden-layout';
import { renderHook } from '@testing-library/react';

import {
  addGlUpdateOnHide,
  addGlUpdateOnResize,
  addGlUpdateOnShow,
  addGlUpdateOnTab,
  clearGlUpdateOnHide,
  clearGlUpdateOnResize,
  clearGlUpdateOnShow,
  clearGlUpdateOnTab,
  useForceGlUpdateOnResizeAndShow
} from '../../src/ts/ui-util/gl-util';

// Tell Jest to mock all timeout functions
jest.useFakeTimers();

const gl: GoldenLayout.Container = {
  close: jest.fn(),
  emit: jest.fn(),
  extendState: jest.fn(),
  getElement: jest.fn(),
  getState: jest.fn(),
  height: 100,
  layoutManager: {} as any,
  off: jest.fn(),
  parent: {} as any,
  setState: jest.fn(),
  setTitle: jest.fn(),
  tab: {
    isActive: true,
    setActive: jest.fn(() => {
      const event = new Event('tab');
      document.dispatchEvent(event);
      return true;
    }),
    header: {} as any,
    setTitle: jest.fn(),
    titleElement: {} as any,
    closeElement: {} as any,
    contentItem: {} as any,
    element: undefined
  },
  title: 'title',
  trigger: jest.fn(),
  unbind: jest.fn(),
  width: 400,
  isHidden: false,
  on: jest.fn((action: string, callback: () => void) => {
    document.addEventListener(action, callback);
  }),
  show: jest.fn(() => {
    const event = new Event('show');
    document.dispatchEvent(event);
    return true;
  }),
  hide: jest.fn(() => {
    const event = new Event('hide');
    document.dispatchEvent(event);
    return true;
  }),
  setSize: jest.fn(() => {
    const event = new Event('resize');
    document.dispatchEvent(event);
    return true;
  })
};

describe('Golden Layout utils', () => {
  it('to be defined', () => {
    expect(clearGlUpdateOnShow).toBeDefined();
    expect(clearGlUpdateOnHide).toBeDefined();
    expect(clearGlUpdateOnResize).toBeDefined();
    expect(clearGlUpdateOnTab).toBeDefined();
    expect(addGlUpdateOnHide).toBeDefined();
    expect(addGlUpdateOnResize).toBeDefined();
    expect(addGlUpdateOnTab).toBeDefined();
    expect(addGlUpdateOnShow).toBeDefined();
    expect(useForceGlUpdateOnResizeAndShow).toBeDefined();
  });

  it('addGlUpdateOnShow', () => {
    const spy = jest.fn();

    addGlUpdateOnShow(gl, spy);

    gl.show();

    // Fast-forward time
    jest.runAllTimers();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('addGlUpdateOnHide', () => {
    const spy = jest.fn();

    addGlUpdateOnHide(gl, spy);

    gl.hide();

    // Fast-forward time
    jest.runAllTimers();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('addGlUpdateOnTab', () => {
    const spy = jest.fn();

    addGlUpdateOnTab(gl, spy);

    gl.tab.setActive(true);

    // Fast-forward time
    jest.runAllTimers();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('addGlUpdateOnResize', () => {
    const spy = jest.fn();

    addGlUpdateOnResize(gl, spy);

    gl.setSize(100, 100);

    // Fast-forward time
    jest.runAllTimers();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('useForceGlUpdateOnResizeAndShow', () => {
    const container: GoldenLayout.Container = {
      ...gl,
      on: jest.fn((action: string, callback: () => void) => {
        document.addEventListener(action, callback);
      }),
      show: jest.fn(() => {
        const event = new Event('show');
        document.dispatchEvent(event);
        return true;
      }),
      hide: jest.fn(() => {
        const event = new Event('hide');
        document.dispatchEvent(event);
        return true;
      }),
      setSize: jest.fn(() => {
        const event = new Event('resize');
        document.dispatchEvent(event);
        return true;
      })
    };

    renderHook(() => {
      useForceGlUpdateOnResizeAndShow(container);
    });

    container.hide();
    container.show();
    container.setSize(100, 100);

    // Fast-forward time
    jest.runAllTimers();

    expect(container.hide).toHaveBeenCalledTimes(1);
    expect(container.show).toHaveBeenCalledTimes(1);
    expect(container.setSize).toHaveBeenCalledTimes(1);
  });

  it('clearGlUpdateOnShow calls goldenLayout "off" function to clear event listener', () => {
    const container: GoldenLayout.Container = {
      ...gl,
      off: jest.fn()
    };
    const callback = jest.fn();
    clearGlUpdateOnShow(container, callback);
    expect(container.off).toHaveBeenCalledTimes(1);
    expect(container.off).toHaveBeenCalledWith('show', callback);
  });

  it('clearGlUpdateOnHide calls goldenLayout "off" function to clear event listener', () => {
    const container: GoldenLayout.Container = {
      ...gl,
      off: jest.fn()
    };
    const callback = jest.fn();
    clearGlUpdateOnHide(container, callback);
    expect(container.off).toHaveBeenCalledTimes(1);
    expect(container.off).toHaveBeenCalledWith('hide', callback);
  });

  it('clearGlUpdateOnResize calls goldenLayout "off" function to clear event listener', () => {
    const container: GoldenLayout.Container = {
      ...gl,
      off: jest.fn()
    };
    const callback = jest.fn();
    clearGlUpdateOnResize(container, callback);
    expect(container.off).toHaveBeenCalledTimes(1);
    expect(container.off).toHaveBeenCalledWith('resize', callback);
  });

  it('clearGlUpdateOnTab calls goldenLayout "off" function to clear event listener', () => {
    const container: GoldenLayout.Container = {
      ...gl,
      off: jest.fn()
    };
    const callback = jest.fn();
    clearGlUpdateOnTab(container, callback);
    expect(container.off).toHaveBeenCalledTimes(1);
    expect(container.off).toHaveBeenCalledWith('tab', callback);
  });
});
