import { act, renderHook } from '@testing-library/react';

import { findEventBeamsByEventHypothesisAndStations, useAppDispatch } from '../../../src/ts/app';
import {
  useFindEventBeamsByEventHypothesisAndStationsQuery,
  useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent
} from '../../../src/ts/app/hooks/event-beams-by-event-hypothesis-and-stations-hooks';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import { appState, getTestReduxWrapper } from '../../test-util';

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actualRedux = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  const mockAppDispatch = jest.fn(async () => Promise.resolve());
  const mockUseAppDispatch = jest.fn(() => mockAppDispatch);
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => AppState) => {
      const state: AppState = appState;
      return stateFunc(state);
    })
  };
});

jest.mock('../../../src/ts/app/api', () => {
  const actual = jest.requireActual('../../../src/ts/app/api');
  return {
    ...actual,
    findEventBeamsByEventHypothesisAndStations: jest.fn()
  };
});

describe('Event Beams By Event Hypothesis and Stations Hook', () => {
  it('is defined', () => {
    expect(useFindEventBeamsByEventHypothesisAndStationsQuery).toBeDefined();
    expect(useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent).toBeDefined();
  });

  it('query for segments', async () => {
    const store = getStore();
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await renderHook(() => useFindEventBeamsByEventHypothesisAndStationsQueryForOpenEvent(), {
        wrapper: getTestReduxWrapper(store)
      });
    });
    const dispatch = useAppDispatch();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect((findEventBeamsByEventHypothesisAndStations as unknown as jest.Mock).mock.calls[0][0])
      .toMatchInlineSnapshot(`
      {
        "eventHypotheses": [],
        "stations": [],
      }
    `);
  });
});
