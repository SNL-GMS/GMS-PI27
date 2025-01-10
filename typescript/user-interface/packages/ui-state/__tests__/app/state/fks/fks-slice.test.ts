import { createAction } from '@reduxjs/toolkit';
import type * as Redux from 'redux';

import type { FksState } from '../../../../src/ts/app';
import { fksInitialState, fksSlice } from '../../../../src/ts/app';

const MOCK_TIME = 1606818240000;
Date.now = jest.fn(() => MOCK_TIME);
Date.constructor = jest.fn(() => new Date(MOCK_TIME));

describe('state user session slice', () => {
  it('defined', () => {
    expect(fksInitialState).toBeDefined();
    expect(fksSlice).toBeDefined();
  });

  it('should return the initial state', () => {
    expect(fksSlice.reducer(undefined, createAction(''))).toMatchSnapshot();
    expect(fksSlice.reducer(undefined, createAction(''))).toMatchSnapshot();
    expect(fksSlice.reducer(fksInitialState, createAction(''))).toMatchSnapshot();
    expect(fksSlice.reducer(fksInitialState, createAction(''))).toMatchSnapshot();
  });

  it('should setSdIdsToShowFk', () => {
    const action: Redux.AnyAction = {
      type: fksSlice.actions.setSdIdsToShowFk.type,
      payload: ['12345']
    };
    const expectedState: FksState = {
      ...fksInitialState,
      sdIdsToShowFk: action.payload
    };
    expect(fksSlice.reducer(fksInitialState, action)).toEqual(expectedState);
  });

  it('should setFkPlotsExpandToolbar', () => {
    const action: Redux.AnyAction = {
      type: fksSlice.actions.setFkPlotsExpandToolbar.type,
      payload: false
    };
    const expectedState: FksState = {
      ...fksInitialState,
      fkPlotsExpandToolbar: action.payload
    };
    expect(fksSlice.reducer(fksInitialState, action)).toEqual(expectedState);
  });
});
