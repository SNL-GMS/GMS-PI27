import { PD01Channel, processingMaskDefinition } from '@gms/common-model/__tests__/__data__';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment/types';
import type { Draft } from 'immer';
import { createDraft } from 'immer';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState, DataState } from '../../../../../src/ts/app';
import { dataInitialState } from '../../../../../src/ts/app';
import type {
  GetProcessingMaskDefinitionsQueryArgs,
  GetProcessingMaskDefinitionsQueryResult,
  ProcessingMaskDefinitionsByPhaseByChannel
} from '../../../../../src/ts/app/api/data/signal-enhancement';
import {
  addGetProcessingMaskDefinitionsMatchReducers,
  getProcessingMaskDefinitions,
  getProcessingMaskDefinitionsQuery
} from '../../../../../src/ts/app/api/data/signal-enhancement';
import { appState } from '../../../../test-util';
import { workflowStationGroup } from '../../workflow/sample-data';

const processingMaskDefinitionsByPhaseByChannel1: ProcessingMaskDefinitionsByPhaseByChannel = {
  channel: PD01Channel,
  processingMaskDefinitionByPhase: { P: [processingMaskDefinition] }
};

const processingMaskDefinitionsByPhaseByChannel2: ProcessingMaskDefinitionsByPhaseByChannel = {
  channel: PD01Channel,
  processingMaskDefinitionByPhase: { S: [processingMaskDefinition] }
};

const queryArgs: GetProcessingMaskDefinitionsQueryArgs = {
  stationGroup: workflowStationGroup,
  channels: [PD01Channel],
  processingOperations: [ProcessingOperation.EVENT_BEAM],
  phaseTypes: ['P']
};

const payload: GetProcessingMaskDefinitionsQueryResult = {
  processingMaskDefinitionByPhaseByChannel: [processingMaskDefinitionsByPhaseByChannel1]
};

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(
      () => async () => Promise.reject(new Error('Rejected getProcessingMaskDefinitions'))
    )
  };
});

describe('Get processing mask definitions for channels', () => {
  it('have defined', () => {
    expect(getProcessingMaskDefinitionsQuery).toBeDefined();
    expect(addGetProcessingMaskDefinitionsMatchReducers).toBeDefined();
    expect(getProcessingMaskDefinitions).toBeDefined();
  });

  it('build a builder using addGetProcessingMaskDefinitionsMatchReducers', () => {
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

    addGetProcessingMaskDefinitionsMatchReducers(builder);

    const state = {
      processingMaskDefinitionsByChannels: [],
      queries: { getProcessingMaskDefinitions: {} }
    };

    const action = {
      meta: { requestId: getProcessingMaskDefinitionsQuery.idGenerator(queryArgs), arg: queryArgs },
      payload
    };
    builderMap[0](state, action);
    expect(
      state.queries.getProcessingMaskDefinitions[
        getProcessingMaskDefinitionsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('pending');
    expect(state.processingMaskDefinitionsByChannels).toMatchObject([]);

    builderMap[1](state, action);
    expect(
      state.queries.getProcessingMaskDefinitions[
        getProcessingMaskDefinitionsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('fulfilled');
    expect(state.processingMaskDefinitionsByChannels).toMatchObject([
      {
        channel: processingMaskDefinitionsByPhaseByChannel1.channel,
        processingMaskDefinitions: { P: { EVENT_BEAM: processingMaskDefinition } }
      }
    ]);

    builderMap[2](state, action);
    expect(
      state.queries.getProcessingMaskDefinitions[
        getProcessingMaskDefinitionsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('rejected');
  });

  it('can determine when to skip query execution', () => {
    expect(
      getProcessingMaskDefinitionsQuery.shouldSkip({
        ...queryArgs,
        channels: []
      })
    ).toBeTruthy();
    expect(
      getProcessingMaskDefinitionsQuery.shouldSkip({
        ...queryArgs,
        phaseTypes: []
      })
    ).toBeTruthy();
    expect(
      getProcessingMaskDefinitionsQuery.shouldSkip({
        ...queryArgs,
        processingOperations: []
      })
    ).toBeTruthy();
    expect(getProcessingMaskDefinitionsQuery.shouldSkip(queryArgs)).toBeFalsy();
  });

  it('can create lookup keys from the arguments', () => {
    const key =
      'stationGroup:station-group/processingOperations:EVENT_BEAM/phases:P/channels:PDAR.PD01.SHZ';
    expect(getProcessingMaskDefinitionsQuery.idGenerator(queryArgs)).toEqual(key);
  });

  it('will not execute query if the args are invalid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    const badQueryArgs: GetProcessingMaskDefinitionsQueryArgs = {
      ...queryArgs,
      channels: []
    };

    await store.dispatch(getProcessingMaskDefinitions(badQueryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()).toHaveLength(0);
  });

  it('will execute query if the args are valid', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const store = mockStoreCreator(appState);

    await store.dispatch(getProcessingMaskDefinitions(queryArgs) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toEqual(
      'signal-enhancement/getProcessingMaskDefinitions/rejected'
    );
  });

  describe('mutate processing mask definition', () => {
    it('can exercise immer produce method to add a processing mask definition to an unseen channel', () => {
      const state: Draft<DataState> = createDraft({ ...dataInitialState });
      getProcessingMaskDefinitionsQuery.updateState(
        {
          payload: {
            processingMaskDefinitionByPhaseByChannel: [processingMaskDefinitionsByPhaseByChannel1]
          },
          type: '',
          meta: {
            arg: {
              channels: [],
              phaseTypes: [],
              stationGroup: { description: 'test', effectiveAt: 0, name: 'test' },
              processingOperations: []
            },
            requestId: '0',
            requestStatus: 'fulfilled'
          }
        },
        state
      );
      expect(state.processingMaskDefinitionsByChannels).toEqual([
        {
          channel: processingMaskDefinitionsByPhaseByChannel1.channel,
          processingMaskDefinitions: { P: { EVENT_BEAM: processingMaskDefinition } }
        }
      ]);
    });

    it('can exercise immer produce method to add a processing mask definition to a seen channel', () => {
      const state: Draft<DataState> = createDraft({ ...dataInitialState });
      getProcessingMaskDefinitionsQuery.updateState(
        {
          payload: {
            processingMaskDefinitionByPhaseByChannel: [processingMaskDefinitionsByPhaseByChannel1]
          },
          type: '',
          meta: {
            arg: {
              channels: [],
              phaseTypes: [],
              stationGroup: { description: 'test', effectiveAt: 0, name: 'test' },
              processingOperations: []
            },
            requestId: '0',
            requestStatus: 'fulfilled'
          }
        },
        state
      );
      getProcessingMaskDefinitionsQuery.updateState(
        {
          payload: {
            processingMaskDefinitionByPhaseByChannel: [processingMaskDefinitionsByPhaseByChannel2]
          },
          type: '',
          meta: {
            arg: {
              channels: [],
              phaseTypes: [],
              stationGroup: { description: 'test', effectiveAt: 0, name: 'test' },
              processingOperations: []
            },
            requestId: '0',
            requestStatus: 'fulfilled'
          }
        },
        state
      );

      expect(state.processingMaskDefinitionsByChannels).toEqual([
        {
          channel: processingMaskDefinitionsByPhaseByChannel1.channel,
          processingMaskDefinitions: {
            P: { EVENT_BEAM: processingMaskDefinition },
            S: { EVENT_BEAM: processingMaskDefinition }
          }
        }
      ]);
    });

    it('can exercise immer produce method with empty', () => {
      const state: Draft<DataState> = createDraft({ ...dataInitialState });
      getProcessingMaskDefinitionsQuery.updateState(
        {
          payload: { processingMaskDefinitionByPhaseByChannel: [] },
          type: '',
          meta: {
            arg: {
              channels: [],
              phaseTypes: [],
              stationGroup: { description: 'test', effectiveAt: 0, name: 'test' },
              processingOperations: []
            },
            requestId: '0',
            requestStatus: 'fulfilled'
          }
        },
        state
      );
      expect(state.processingMaskDefinitionsByChannels).toEqual([]);
    });
  });
});
