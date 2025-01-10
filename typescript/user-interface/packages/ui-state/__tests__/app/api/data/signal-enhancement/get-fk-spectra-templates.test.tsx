import type { FkTypes } from '@gms/common-model';
import type { FkSpectraTemplatesByStationByPhase } from '@gms/common-model/lib/fk';
import { unwrapResult } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import Axios from 'axios';
import { produce } from 'immer';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState, GetFkSpectraTemplatesQueryArgs } from '../../../../../src/ts/app';
import { getStore, useAppDispatch } from '../../../../../src/ts/app';
import {
  addFkSpectraTemplatesMatchReducers,
  fkSpectraTemplatesQuery,
  getFkSpectraTemplates
} from '../../../../../src/ts/app/api/data/signal-enhancement';
import { fkSpectraTemplatesResponse } from '../../../../__data__/fk';
import { appState } from '../../../../test-util';

const queryArgs: GetFkSpectraTemplatesQueryArgs = {
  stations: [{ name: 'ASAR', effectiveAt: 1694361600 }],
  phases: ['P']
};

const payload: FkTypes.FkSpectraTemplatesByStationByPhase = fkSpectraTemplatesResponse;

const stateWithFkSpectraTemplates: AppState = produce(appState, draft => {
  draft.data.fkSpectraTemplates = fkSpectraTemplatesResponse;
});

const mockAxiosRequest = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    data: { sample: fkSpectraTemplatesResponse.ASAR } as FkSpectraTemplatesByStationByPhase
  })
);
Axios.request = mockAxiosRequest;

describe('Get FK Reviewable phases for stations', () => {
  it('has defined functions', () => {
    expect(fkSpectraTemplatesQuery).toBeDefined();
    expect(addFkSpectraTemplatesMatchReducers).toBeDefined();
    expect(getFkSpectraTemplates).toBeDefined();
  });

  it('builds a builder using addFkSpectraTemplatesMatchReducers', () => {
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

    addFkSpectraTemplatesMatchReducers(builder);

    // eslint-disable-next-line prefer-const
    let state = {
      fkSpectraTemplates: {},
      queries: {
        getFkSpectraTemplates: {}
      }
    };

    // eslint-disable-next-line prefer-const
    let action = {
      meta: { requestId: fkSpectraTemplatesQuery.idGenerator(queryArgs), arg: queryArgs },
      payload
    };

    // Pending
    builderMap[0](state, action);
    expect(
      state.queries.getFkSpectraTemplates[fkSpectraTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('pending');
    expect(state.fkSpectraTemplates).toMatchObject({});

    // Fulfilled
    builderMap[1](state, action);
    expect(
      state.queries.getFkSpectraTemplates[fkSpectraTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('fulfilled');
    expect(state.fkSpectraTemplates).toMatchObject(payload);

    // Rejected
    builderMap[2](state, action);
    expect(
      state.queries.getFkSpectraTemplates[fkSpectraTemplatesQuery.idGenerator(queryArgs)][
        action.meta.requestId
      ].status
    ).toMatch('rejected');
  });

  it('can determine when to skip query execution', () => {
    expect(
      fkSpectraTemplatesQuery.shouldSkip({
        ...queryArgs,
        stations: []
      })
    ).toBeTruthy();

    expect(
      fkSpectraTemplatesQuery.shouldSkip({
        ...queryArgs,
        stations: []
      })
    ).toBeTruthy();

    expect(
      fkSpectraTemplatesQuery.shouldSkip({
        ...queryArgs,
        phases: []
      })
    ).toBeTruthy();

    expect(fkSpectraTemplatesQuery.shouldSkip(queryArgs)).toBeFalsy();
  });

  it('can create lookup keys from the arguments', () => {
    expect(fkSpectraTemplatesQuery.idGenerator(queryArgs)).toMatchInlineSnapshot(
      `"stations:ASAR/phases:P"`
    );
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(stateWithFkSpectraTemplates);

    const badQueryArgs: GetFkSpectraTemplatesQueryArgs = {
      ...queryArgs,
      stations: []
    };

    await store.dispatch(getFkSpectraTemplates(badQueryArgs) as any);

    // results should have empty arrays
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(stateWithFkSpectraTemplates);

    await store.dispatch(getFkSpectraTemplates(queryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signal-enhancement/getFkSpectraTemplates/fulfilled'
    );
  });

  it('sample fk spectra template query test', async () => {
    const dispatch = renderHook(() => useAppDispatch(), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={getStore()}>{props.children}</Provider>
      )
    });

    const result = await dispatch.result.current(
      getFkSpectraTemplates({
        stations: [{ name: 'sample1', effectiveAt: 0 }],
        phases: ['a', 'b', 'c']
      })
    );
    expect(unwrapResult(result)).toMatchInlineSnapshot(`
      {
        "sample": {
          "P": {
            "fkSpectraParameters": {
              "fftTaperFunction": "BLACKMAN",
              "fftTaperPercent": 5,
              "fkFrequencyRange": {
                "highFrequencyHz": 4.2,
                "lowFrequencyHz": 3.3,
              },
              "fkSpectrumWindow": {
                "duration": 4,
                "lead": 1,
              },
              "fkUncertaintyOption": "EMPIRICAL",
              "minimumWaveformsForSpectra": 1,
              "normalizeWaveforms": false,
              "orientationAngleToleranceDeg": 0,
              "phase": "P",
              "preFilter": {
                "comments": "Butterworth IIR band-pass 0.5-4.0 Hz, order 3, non-causal",
                "filterDescription": {
                  "causal": false,
                  "comments": "0.5 4.0 3 BP non-causal",
                  "filterType": "LINEAR",
                  "highFrequencyHz": 4,
                  "linearFilterType": "IIR_BUTTERWORTH",
                  "lowFrequencyHz": 0.5,
                  "order": 3,
                  "parameters": {
                    "groupDelaySec": 1,
                    "sampleRateHz": 1,
                    "sampleRateToleranceHz": 1,
                  },
                  "passBandType": "BAND_PASS",
                  "zeroPhase": true,
                },
                "name": "0.5 4.0 3 BP non-causal",
              },
              "slownessGrid": {
                "maxSlowness": 8.883,
                "numPoints": 10,
              },
              "spectrumStepDuration": 10,
              "twoDimensional": true,
              "waveformSampleRate": {
                "waveformSampleRateHz": 4.9,
                "waveformSampleRateToleranceHz": 9.9737,
              },
            },
            "fkSpectraWindow": {
              "duration": 300,
              "lead": 60,
            },
            "inputChannels": [],
            "phaseType": "P",
            "station": {
              "effectiveAt": 1694361600,
              "name": "ASAR",
            },
          },
        },
      }
    `);
  });
});
