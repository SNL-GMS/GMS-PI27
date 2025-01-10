import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  addComputeLegacyFkSpectraReducers,
  computeLegacyFkSpectra,
  shouldSkipComputeLegacyFkSpectra
} from '../../../../../src/ts/app/api/data/fk/compute-legacy-fk-spectra';
import type { AppState } from '../../../../../src/ts/app/store';
import { getStore } from '../../../../../src/ts/app/store';
import { fkInput, getTestFkPowerChannelSegment } from '../../../../__data__';
import { appState } from '../../../../test-util';

const fkChannelSegment = getTestFkPowerChannelSegment(signalDetectionsData[0]);
jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    computeLegacyFkSpectraWorker: jest.fn(async () => {
      return Promise.reject(new Error('Rejected computeLegacyFkSpectra'));
    })
  };
});

describe('Compute Fk for Signal Detection', () => {
  it('have defined', () => {
    expect(shouldSkipComputeLegacyFkSpectra).toBeDefined();
    expect(computeLegacyFkSpectra).toBeDefined();
    expect(addComputeLegacyFkSpectraReducers).toBeDefined();
  });

  it('build a builder using addComputeFkSpectraReducers', () => {
    const builderMap: any[] = [];
    const builder: any = {
      addCase: (k, v) => {
        builderMap.push(v);
        return builder;
      },
      addMatcher: (k, v) => {
        builderMap.push(v);
        return builder;
      }
    };

    addComputeLegacyFkSpectraReducers(builder);
    expect(builderMap).toMatchSnapshot();

    // eslint-disable-next-line prefer-const
    let state = {
      queries: { computeFkSpectra: {} },
      fkChannelSegments: {},
      fkFrequencyThumbnails: {},
      signalDetections: {
        '012de1b9-8ae3-3fd4-800d-58665c3152cc': {}
      }
    };
    // eslint-disable-next-line prefer-const
    let action = {
      meta: { requestId: 12345, arg: fkInput },
      payload: fkChannelSegment
    };
    builderMap[0](state, action);
    expect(state).toMatchSnapshot();
    // exercise fulfilled non-thumbnail compute
    builderMap[1](state, action);
    // exercise fulfilled thumbnail compute
    action.meta.arg = {
      ...action.meta.arg,
      isThumbnailRequest: true
    };
    builderMap[0](state, action);
    builderMap[1](state, action);
    expect(state).toMatchSnapshot();
    builderMap[2](state, action);
    expect(state).toMatchSnapshot();
  });

  it('can determine when to skip compute execution', () => {
    expect(shouldSkipComputeLegacyFkSpectra(fkInput)).toBeFalsy();
  });

  it.skip('will not execute query if the current interval is not defined', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(computeLegacyFkSpectra(fkInput) as any);

    const storeActions = store.getActions();

    // results should have empty arrays since current interval is not set
    expect(storeActions[storeActions.length - 1].type).toEqual(
      'fk/computeLegacyFkSpectra/rejected'
    );

    expect(storeActions[storeActions.length - 1].payload).toMatchInlineSnapshot(
      `[TypeError: Cannot read properties of undefined (reading 'type')]`
    );
  });

  it('can handle rejected state', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const realStore = getStore();

    const state = cloneDeep(realStore.getState());
    state.app.workflow.timeRange.startTimeSecs = 4;
    state.app.workflow.timeRange.endTimeSecs = 6;

    const store = mockStoreCreator(state);

    await store.dispatch(computeLegacyFkSpectra(fkInput) as any);

    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'fk/computeLegacyFkSpectra/rejected'
    );
  });
});
