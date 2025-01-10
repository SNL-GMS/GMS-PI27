/* eslint-disable @typescript-eslint/no-magic-numbers */
import { sleep } from '@gms/common-util';
import { render, renderHook } from '@testing-library/react';
import * as ReactHooks from '@testing-library/react-hooks';
import * as React from 'react';
import { create } from 'react-test-renderer';

import {
  HighlightVisualState,
  useDataAttrScroll,
  useDependencyDebugger,
  useEffectDebugger,
  useElementSize,
  useFocusOnMount,
  useForceUpdate,
  useHighlightManager,
  useImmutableMap,
  useInterval,
  useMouseUpListenerBySelector,
  usePrevious,
  useRestoreFocus,
  useScrollIntoView,
  useSuperStableCallback
} from '../../src/ts/ui-util/custom-hooks';

jest.mock('lodash/debounce', () => {
  return fn => {
    fn.cancel = jest.fn();
    return fn;
  };
});

jest.mock('@gms/common-util', () => {
  const original = jest.requireActual('@gms/common-util');
  console.debug = jest.fn();
  return {
    ...original,
    Logger: {
      setConfiguredLoggers: jest.fn(),
      create: () => ({
        debug: console.debug,
        info: console.debug,
        warn: console.debug,
        error: console.debug
      })
    }
  };
});

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});

const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const initialVal = 'initial value';
const nextVal = 'next value';

const TIME_TO_WAIT_MS = 200;

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  await ReactHooks.act(async () => {
    await sleep(TIME_TO_WAIT_MS);
    wrapper.update();
  });
};

describe('Custom Hooks', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('usePrevious', () => {
    it('exists', () => {
      expect(usePrevious).toBeDefined();
      expect(useEffectDebugger).toBeDefined();
      expect(HighlightVisualState).toBeDefined();
      expect(useHighlightManager).toBeDefined();
      expect(useScrollIntoView).toBeDefined();
      expect(useRestoreFocus).toBeDefined();
      expect(useInterval).toBeDefined();
      expect(useImmutableMap).toBeDefined();
      expect(useElementSize).toBeDefined();
      expect(useFocusOnMount).toBeDefined();
      expect(useForceUpdate).toBeDefined();
      expect(useMouseUpListenerBySelector).toBeDefined();
    });

    it('useElementSize', () => {
      const { result } = renderHook(() => useElementSize());
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "current": null,
          },
          0,
          0,
        ]
      `);
    });

    it('useFocusOnMount', () => {
      const focus = jest.fn();
      const beforeFocus = jest.fn();
      const ref = {
        current: {
          focus
        }
      };
      renderHook(() => {
        useFocusOnMount(ref as any, beforeFocus);
      });

      expect(ref).toBeDefined();
      expect(focus).toHaveBeenCalled();
      expect(beforeFocus).toHaveBeenCalled();
    });

    it('useScrollIntoView', () => {
      const condition = jest.fn(() => true);
      const { result } = renderHook(() => useScrollIntoView(condition));
      expect(result.current).toMatchInlineSnapshot(`
        {
          "current": null,
        }
      `);
    });

    it('useInterval', () => {
      const { result } = renderHook(() => useInterval(10000, 20000));

      expect(result.current).toMatchInlineSnapshot(`
        [
          10000,
          20000,
          [Function],
        ]
      `);
    });

    it('useMouseUpListenerBySelector', () => {
      const callback = jest.fn();

      document.createElement('div');
      document.createElement('div');

      const { result } = renderHook(() => useMouseUpListenerBySelector('div', callback)) as any;

      expect(result.current).toMatchInlineSnapshot(`[Function]`);
    });

    it('useHighlightManager', () => {
      const { result } = renderHook(() => useHighlightManager()) as any;

      expect(result.current).toMatchInlineSnapshot(`
        {
          "getVisualState": [Function],
          "onMouseDown": [Function],
          "onMouseOut": [Function],
          "onMouseOver": [Function],
          "onMouseUp": [Function],
        }
      `);
    });

    it('useImmutableMap', () => {
      const { result } = renderHook(() => useImmutableMap(['keyA', 'keyB', 'keyC'], true));

      expect(result.current).toMatchInlineSnapshot(`
        [
          Immutable.Map {
            "keyA": true,
            "keyB": true,
            "keyC": true,
          },
          [Function],
        ]
      `);
    });

    it('returns the initial value the first time', () => {
      let returnedVal;

      function TestComponent() {
        const internalReturnedVal = usePrevious(nextVal, initialVal);
        returnedVal = internalReturnedVal;
        return <div>{internalReturnedVal}</div>;
      }
      render(<TestComponent />);
      expect(returnedVal).toEqual(initialVal);
    });

    it('returns the initial value the first time and the next value the second time', () => {
      let returnedVal;

      function TestComponent({ count, nextValue }: { count: number; nextValue: string }) {
        const internalReturnedVal = usePrevious(nextValue, initialVal);
        returnedVal = internalReturnedVal;
        return (
          <div>
            {internalReturnedVal}-{count}
          </div>
        );
      }
      const container = render(<TestComponent count={0} nextValue={nextVal} />);
      expect(returnedVal).toEqual(initialVal);

      // we need to update the props to get a re-render.
      container.rerender(<TestComponent count={1} nextValue="a new value" />);

      // await waitForComponentToPaint(wrapper);

      expect(container).toMatchSnapshot();
      expect(returnedVal).toEqual(nextVal);
    });
  });

  describe('useEffectDebugger', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    it('exists', () => {
      expect(useEffectDebugger).toBeDefined();
    });

    it('calls logger if and only if the dependencies have changed', () => {
      function TestComponent({
        propToWatch,
        propToIgnore
      }: {
        propToWatch: any;
        propToIgnore: string;
      }) {
        useEffectDebugger(() => {
          // no-op
        }, [propToWatch]);
        return (
          <div>
            {propToIgnore}-{JSON.stringify(propToWatch)}
          </div>
        );
      }
      const unchanging = 'unchanging';
      const changing = {};
      const container = render(<TestComponent propToIgnore={unchanging} propToWatch={changing} />);

      // it sees the initial dependencies as a change from the empty set
      expect(console.debug).toHaveBeenCalledTimes(1);

      const newUnchangingObj = {};
      // the {} notation creates a new object that is referentially distinct
      container.rerender(
        <TestComponent propToIgnore={unchanging} propToWatch={newUnchangingObj} />
      );
      expect(console.debug).toHaveBeenCalledTimes(2);

      // should not print anything because the props watched prop has not changed
      container.rerender(
        <TestComponent propToIgnore={unchanging} propToWatch={newUnchangingObj} />
      );
      expect(console.debug).toHaveBeenCalledTimes(2);
    });
  });

  describe('useDependencyDebugger', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    it('exists', () => {
      expect(useDependencyDebugger).toBeDefined();
    });

    it('calls logger if and only if the dependencies have changed', () => {
      function TestComponent({ propToWatch, prop2 }: { propToWatch: any; prop2: string }) {
        useDependencyDebugger([propToWatch, prop2], ['propToWatch', 'prop2']);
        return null;
      }

      const unchanging = 'unchanging';
      const changing = {};
      const container = render(<TestComponent prop2={unchanging} propToWatch={changing} />);

      // it sees the initial dependencies as a change from the empty set
      expect(console.debug).toHaveBeenCalledTimes(1);

      const newUnchangingObj = {};
      // the {} notation creates a new object that is referentially distinct
      container.rerender(<TestComponent prop2={unchanging} propToWatch={newUnchangingObj} />);
      expect(console.debug).toHaveBeenCalledTimes(2);

      container.rerender(<TestComponent prop2="something" propToWatch={newUnchangingObj} />);
      expect(console.debug).toHaveBeenCalledTimes(3);
    });
  });

  describe('useDataAttrScroll', () => {
    let dataScrollRef;
    let dataScrollCallback;

    function TestComponent() {
      const addDataAttrScroll = useDataAttrScroll();
      return (
        <div
          ref={ref => {
            dataScrollRef = {
              ...ref,
              dataset: { scroll: '100' },
              scrollTop: 100,
              addEventListener: jest.fn((name: string, callback) => {
                dataScrollCallback = callback;
              })
            } as HTMLElement;
            addDataAttrScroll(dataScrollRef);
          }}
        />
      );
    }
    const wrapper = create(<TestComponent />);
    test('sets a callback on the event listener', async () => {
      await waitForComponentToPaint(wrapper);
      // This ensures that the axios request will have been called.
      expect(dataScrollCallback).toBeDefined();
    });
    test('sets dataset.scroll when you scroll', async () => {
      const newScrollVal = 200;
      dataScrollRef.scrollTop = newScrollVal;
      dataScrollCallback();
      await waitForComponentToPaint(wrapper);
      // This ensures that the axios request will have been called.
      expect(dataScrollRef.dataset.scroll).toBe(newScrollVal.toString());
    });
  });

  describe('useSuperStableCallback', () => {
    it('throws if given an undefined callback', () => {
      const result = renderHook(() => useSuperStableCallback(undefined as any));
      expect(() => result.result.current()).toThrow(
        `Cannot call callback function. Function is not defined.`
      );
    });
    it('returns a callback that calls the original callback', () => {
      const testFn = jest.fn();
      const result = renderHook(() => useSuperStableCallback(testFn));
      result.result.current();
      expect(testFn).toHaveBeenCalledTimes(1);
    });
    it('returns a callback that remains referentially stable between renders', () => {
      const result = renderHook(() => useSuperStableCallback(jest.fn()));
      const result1 = result.result.current;
      result.rerender();
      const result2 = result.result.current;
      expect(result1).toBe(result2);
    });
  });
});
