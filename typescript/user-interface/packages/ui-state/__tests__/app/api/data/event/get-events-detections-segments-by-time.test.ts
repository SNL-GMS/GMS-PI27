import { FeatureMeasurementType } from '@gms/common-model/lib/signal-detection';
import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers,
  getEventsWithDetectionsAndSegmentsByTime,
  getEventsWithDetectionsAndSegmentsByTimeQuery
} from '../../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time';
import type { GetEventsWithDetectionsAndSegmentsByTimeQueryArgs } from '../../../../../src/ts/app/api/data/event/types';
import type { AppState } from '../../../../../src/ts/app/store';
import { appState } from '../../../../test-util';

jest.mock('../../../../../src/ts/workers/api', () => {
  const actual = jest.requireActual('../../../../../src/ts/workers/api');
  return {
    ...actual,
    getEvents: jest.fn(async () => {
      return Promise.resolve({
        signalDetections: ['signalDetections'],
        channelSegments: ['channelSegments'],
        events: ['events']
      });
    })
  };
});

jest.mock('../../../../../src/ts/app/api/processing-configuration/processing-config-util', () => {
  const actual = jest.requireActual(
    '../../../../../src/ts/app/api/processing-configuration/processing-config-util'
  );
  return {
    ...actual,
    getProcessingAnalystConfiguration: jest.fn(() => ({
      endpointConfigurations: {
        fetchQcSegmentsByChannelsAndTime: { maxTimeRangeRequestInSeconds: 50 }
      }
    }))
  };
});
const fiveMinutes = 300;
const endTimeSecs = 123456789;
const startTimeSecs = endTimeSecs - fiveMinutes;

const eventsQueryInput: GetEventsWithDetectionsAndSegmentsByTimeQueryArgs = {
  startTime: startTimeSecs,
  endTime: endTimeSecs,
  stageId: { name: 'stageId' }
};

describe('Get events by time', () => {
  it('have defined exports', () => {
    expect(getEventsWithDetectionsAndSegmentsByTime).toBeDefined();
    expect(addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers).toBeDefined();
    expect(getEventsWithDetectionsAndSegmentsByTimeQuery).toBeDefined();
  });

  it('build a builder using addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers', () => {
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

    addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers(builder);
    expect(builderMap).toMatchSnapshot();

    const state = {
      events: [{ id: 'eventID1' }],
      signalDetections: [{ id: 'sdID1', station: { name: 'stationName1' } }],
      channelSegments: [{ channelName: 'stationName1' }],
      queries: { getEventsWithDetectionsAndSegmentsByTime: {} }
    };

    const mockArgs: GetEventsWithDetectionsAndSegmentsByTimeQueryArgs = {
      stageId: { name: 'mockStageId' },
      startTime: startTimeSecs,
      endTime: endTimeSecs
    };

    const action = {
      meta: {
        requestId: getEventsWithDetectionsAndSegmentsByTimeQuery.idGenerator(mockArgs),
        arg: {}
      },
      payload: {
        events: [{ id: 'eventID2' }],
        signalDetections: [
          {
            station: { name: 'stationName1' },
            id: 'sdID2',
            signalDetectionHypotheses: [
              {
                featureMeasurements: [
                  {
                    featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
                    channel: { name: 'stationName1' }
                  }
                ]
              }
            ]
          }
        ],
        uiChannelSegments: [
          {
            channelSegment: {
              id: {
                channel: {
                  name: 'channelName2'
                }
              }
            },
            channelSegmentDescriptor: undefined
          }
        ]
      }
    };
    builderMap[0](state, action);
    expect(state).toMatchSnapshot();
    builderMap[1](state, action);
    expect(state).toMatchSnapshot();
    builderMap[2](state, action);
    expect(state).toMatchSnapshot();
  });

  it('can determine when to skip query execution', () => {
    expect(getEventsWithDetectionsAndSegmentsByTimeQuery.shouldSkip(eventsQueryInput)).toBeFalsy();
  });

  it('will not execute query if the current interval is not defined', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

    const mockAppState: AppState = cloneDeep(appState);
    mockAppState.processingConfigurationApi = {
      endpoints: {
        getProcessingAnalystConfiguration: {
          select: jest.fn(() =>
            jest.fn(() => ({
              data: {
                uiThemes: {
                  name: 'currentTheme',
                  colors: { waveformRaw: 'color', waveformFilterLabel: 'color' }
                }
              }
            }))
          )
        }
      }
    } as any;
    mockAppState.userManagerApi = {
      endpoints: {
        getUserProfile: {
          select: jest.fn(() => jest.fn(() => ({ data: { currentTheme: 'currentTheme' } })))
        }
      }
    } as any;
    const store = mockStoreCreator(mockAppState);

    await store.dispatch(getEventsWithDetectionsAndSegmentsByTime(eventsQueryInput) as any);

    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toMatchInlineSnapshot(
      `"events/getEventsWithDetectionsAndSegmentsByTime/rejected"`
    );
    expect(store.getActions()[store.getActions().length - 1].payload).toMatchInlineSnapshot(
      `[TypeError: Cannot read properties of undefined (reading 'type')]`
    );
  });

  it('can handle executing the query with the fulfilled state', async () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const userManagerApi: any = {
      endpoints: {
        getUserProfile: {
          select: jest.fn(() => jest.fn(() => ({ data: { currentTheme: 'currentTheme' } })))
        }
      }
    };
    const mockAppState: AppState = cloneDeep(appState);
    mockAppState.userManagerApi = userManagerApi;
    mockAppState.processingConfigurationApi = {
      endpoints: {
        getProcessingAnalystConfiguration: {
          select: jest.fn(() =>
            jest.fn(() => ({
              data: {
                uiThemes: {
                  name: 'currentTheme',
                  colors: { waveformRaw: 'color', waveformFilterLabel: 'color' }
                }
              }
            }))
          )
        }
      }
    } as any;

    mockAppState.app = { workflow: { timeRange: { startTimeSecs: 4, endTimeSecs: 6 } } } as any;
    const store = mockStoreCreator(mockAppState);

    await store.dispatch(getEventsWithDetectionsAndSegmentsByTime(eventsQueryInput) as any);
    // results should have empty arrays since current interval is not set
    expect(store.getActions()[store.getActions().length - 1].type).toMatchInlineSnapshot(
      `"events/getEventsWithDetectionsAndSegmentsByTime/rejected"`
    );
    expect(store.getActions()[store.getActions().length - 1].payload).toMatchInlineSnapshot(
      `[TypeError: Cannot read properties of undefined (reading 'type')]`
    );
  });
});
