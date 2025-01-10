import { useHotkeys } from '@blueprintjs/core';
import type { AppState } from '@gms/ui-state';
import * as UIState from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';

import { FilterManager } from '../../../../../src/ts/components/analyst-ui/components/filters/filter-manager';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useFilterCycle: () => ({
      selectNextFilter: jest.fn(),
      selectPreviousFilter: jest.fn(),
      selectUnfiltered: jest.fn()
    }),
    useGetChannelsQuery: jest.fn(),
    useGetDefaultFilterDefinitionByUsageForChannelSegments: jest.fn(),
    useGetFilterDefinitionsForSignalDetections: jest.fn(),
    useGetFilterListsDefinitionQuery: jest.fn(),
    waveformSlice: {
      actions: {
        clearChannelFilters: jest.fn()
      }
    },
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      const range = { startTimeSecs: 100, endTimeSecs: 200 };
      state.app.workflow.timeRange = range;
      state.app.workflow.openIntervalName = 'AL1';
      state.app.waveform.viewableInterval = range;
      return stateFunc(state);
    })
  };
});

jest.mock('@blueprintjs/core', () => {
  const blueprintActual = jest.requireActual('@blueprintjs/core');
  return {
    ...blueprintActual,
    useHotkeys: jest.fn()
  };
});

describe('FilterManager', () => {
  const store = UIState.getStore();
  const rendered = renderer.create(
    <Provider store={store}>
      <FilterManager />
    </Provider>
  );

  it("doesn't render anything", () => {
    expect(rendered.toJSON()).toMatchInlineSnapshot('null');
  });

  it('FilterManager calls useHotkeys', () => {
    expect(useHotkeys).toHaveBeenCalledTimes(1);
  });
});
