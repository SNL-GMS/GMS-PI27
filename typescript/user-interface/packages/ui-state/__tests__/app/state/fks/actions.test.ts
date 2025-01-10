import type * as Redux from 'redux';
import type { MockStore, MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { fksSlice } from '../../../../src/ts/app';
import { initialState } from '../../../../src/ts/app/state/reducer';
import type { AppState } from '../../../../src/ts/app/store';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<AppState, Redux.AnyAction> = createMockStore(middlewares);
let store: MockStore<AppState, Redux.AnyAction>;

describe('actions', () => {
  beforeEach(() => {
    store = mockStoreCreator({ app: initialState } as any);
  });

  it('should set the signal detections ids to show fk', () => {
    const ids = ['1', '2', '3'];
    const expectedAction: Redux.AnyAction = {
      type: fksSlice.actions.setSdIdsToShowFk.type,
      payload: ids
    };
    expect(fksSlice.actions.setSdIdsToShowFk(ids)).toEqual(expectedAction);

    store.dispatch(fksSlice.actions.setSdIdsToShowFk(ids));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });

  it('should set the FK Plots Toolbar Expanded: false', () => {
    const expectedAction: Redux.AnyAction = {
      type: fksSlice.actions.setFkPlotsExpandToolbar.type,
      payload: false
    };
    expect(fksSlice.actions.setFkPlotsExpandToolbar(false)).toEqual(expectedAction);

    store.dispatch(fksSlice.actions.setFkPlotsExpandToolbar(false));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });
});
