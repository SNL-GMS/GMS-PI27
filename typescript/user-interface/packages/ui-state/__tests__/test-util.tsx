/* eslint-disable no-promise-executor-return */
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';
import type { AnyAction, Store } from 'redux';

import { dataInitialState } from '../src/ts/app/api';
import { historyInitialState } from '../src/ts/app/history/history-slice';
import { initialState } from '../src/ts/app/state/reducer';
import type { AppState, GMSWindow } from '../src/ts/app/store';
import { getStore } from '../src/ts/app/store';

const TIME_TO_WAIT_MS = 2000;

/**
 * @param store The store to pass to the {@link Provider}
 * @returns returns a simple functional wrapper components that wraps a component with the provided store
 */
export function getTestReduxWrapper<S extends Store<unknown, AnyAction>>(store: S) {
  return function TestReduxWrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
export const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

export const expectHookToCallWorker = async (
  useHook: () => any,
  expectedValue?: any
): Promise<void> => {
  const axiosSchema = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {}
  };
  Axios.request = jest.fn(async () => Promise.resolve(axiosSchema)) as any;

  function TestComponent() {
    const query = useHook();
    return <div>{JSON.stringify(query.data)}</div>;
  }

  function TestComponentWithProvider() {
    return (
      <Provider store={getStore()}>
        <TestComponent />
      </Provider>
    );
  }

  // Mounting may call the request, if React decides to run it soon.
  const wrapper = create(<TestComponentWithProvider />);

  // This ensures that the axios request will have been called.
  await waitForComponentToPaint(wrapper);

  expect(wrapper.toJSON()).toMatchSnapshot();

  if (expectedValue) {
    expect(JSON.stringify(wrapper.toJSON)).toContain(expectedValue);
  }
};

/**
 * the props for the @component HookChecker component.
 */
export interface HookProps<HookReturnType> {
  /**
   * A hook to be called within the HookChecker component
   */
  useHook: () => HookReturnType;
  children: (result: HookReturnType) => void;
}

/**
 * When passed a hook and given a `checker` function as a render prop, this will call the hook, then call
 * the checker function with the return value of the hook. This allows us to perform assertions on the
 * result of the hook. Be sure to use `act` on any assertions that will require a render.
 *
 * @param props expects a useHook prop and a children prop. The children prop should contain a function
 * that will be called with the return value of useHook.
 * @returns null, should not render anything.
 */
export function HookChecker<HookReturnType>({
  useHook,
  children
}: HookProps<HookReturnType>): null {
  const result = useHook();
  if (children && typeof children === 'function') {
    const check: any = children;
    check(result);
  } else {
    throw new Error(
      'Invalid children in HookChecker. Pass in a function that expects the hook results as a parameter, and run your assertions in there.'
    );
  }
  return null;
}

/**
 * Initial App state
 */
export const appState: AppState = {
  eventManagerApi: {} as any,
  processingConfigurationApi: {} as any,
  processingStationApi: {} as any,
  signalEnhancementConfigurationApi: {} as any,
  userManagerApi: {} as any,
  workflowApi: {} as any,
  stationDefinitionApi: {} as any,
  systemEventGatewayApi: {} as any,
  data: dataInitialState,
  history: cloneDeep(historyInitialState),
  app: cloneDeep(initialState)
};

/**
 * signalEnhancementConfigurationApiSlice
 *
 * @returns a new Redux store (without our custom middleware) that contains the initial state.
 */
export const configureNewStore = (): Store<AppState> => {
  const gmsWindow = window as unknown as GMSWindow;
  // clear out store and force a new instance
  gmsWindow.ReduxStore = undefined;
  return cloneDeep(getStore());
};
