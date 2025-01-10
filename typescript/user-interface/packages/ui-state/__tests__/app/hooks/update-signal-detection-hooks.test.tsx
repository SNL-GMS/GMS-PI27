import type { CommonTypes } from '@gms/common-model';
import { ChannelSegmentTypes, ChannelTypes } from '@gms/common-model';
import {
  asarAS01Channel,
  asarAS02Channel,
  defaultStations,
  eventData,
  eventStatusInfoNotComplete,
  linearFilter,
  PD01Channel,
  pdarUiChannelSegmentDescriptor,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { PhaseTypeMeasurementValue } from '@gms/common-model/lib/signal-detection';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { renderHook } from '@testing-library/react-hooks';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState } from '../../../src/ts/app';
import {
  addBeamedChannels,
  createSignalDetection,
  useCreateSignalDetection,
  useRevertSignalDetectionAcceptFk,
  useUpdateSignalDetectionAcceptFk
} from '../../../src/ts/app';
import { acceptFk } from '../../../src/ts/app/api/data/signal-detection/accept-fk-reducer';
import { revertFkAction } from '../../../src/ts/app/api/data/signal-detection/revert-fk-reducer';
import type { ChannelFilterRecord } from '../../../src/ts/types';
import {
  filteredUiChannelSegmentWithClaimCheck,
  getTestFkChannelSegment,
  uiChannelSegmentRecord,
  unfilteredClaimCheckUiChannelSegment,
  useQueryStateResult
} from '../../__data__';
import { appState, getTestReduxWrapper } from '../../test-util';

const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 2000
};
const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;

const uiChannelSegments = {
  [unfilteredClaimCheckUiChannelSegment.channelSegment.id.channel.name.split('.')[0]]: {
    [unfilteredClaimCheckUiChannelSegment.channelSegment._uiFilterId || '']: [
      unfilteredClaimCheckUiChannelSegment
    ]
  }
};

const filteredUiChannelSegments = {
  [filteredUiChannelSegmentWithClaimCheck.channelSegment.id.channel.name.split('.')[0]]: {
    [filteredUiChannelSegmentWithClaimCheck.channelSegment._uiFilterId || '']: [
      filteredUiChannelSegmentWithClaimCheck
    ]
  }
};
const channelFilters: ChannelFilterRecord = {
  [filteredUiChannelSegmentWithClaimCheck.channelSegment.id.channel.name.split('.')[0]]:
    linearFilter
};

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useAllStations: jest.fn(() => defaultStations),
    useVisibleStations: jest.fn(() => defaultStations)
  };
});
jest.mock('@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks'
  );

  return {
    ...actual,
    useProcessingAnalystConfiguration: jest.fn(() => processingAnalystConfigurationData)
  };
});

jest.mock('../../../src/ts/app/hooks/operational-time-period-configuration-hooks', () => {
  return {
    useEffectiveTime: jest.fn(() => 0),
    useOperationalTimePeriodConfiguration: jest.fn(() => ({
      timeRange: {
        startTimeSecs: 0,
        endTimeSecs: 2000
      },
      operationalTimePeriodConfigurationQuery
    }))
  };
});

jest.mock('../../../src/ts/app/hooks/workflow-hooks', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
  );
  return {
    ...actual,
    useStageId: jest.fn(() => ({
      startTime: 0,
      definitionId: {
        name: 'AL_1'
      }
    }))
  };
});

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
        data: {
          stationGroupNames: []
        }
      })),
      useGetProcessingMonitoringOrganizationConfigurationQuery: jest.fn(() => ({
        data: {
          monitoringOrganization: 'gms'
        }
      }))
    };
  }
);

jest.mock('../../../src/ts/app/hooks/event-manager-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/event-manager-hooks');
  return {
    ...actual,
    useGetEvents: jest.fn(() => ({
      isSuccess: true,
      data: [eventData]
    })),
    useEventStatusQuery: jest.fn(() => ({
      isSuccess: true,
      data: {
        [eventData.id]: {
          stageId: {
            name: 'AL1'
          },
          eventId: eventData.id,
          eventStatusInfo: { ...eventStatusInfoNotComplete }
        }
      }
    }))
  };
});

jest.mock('../../../src/ts/app/api/event-manager/event-manager-api-slice', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/event-manager/event-manager-api-slice'
  );
  return {
    ...actual,
    // Prevents async operations from hanging when the test finishes
    useUpdateEventStatusMutation: jest.fn(() => [jest.fn()])
  };
});

jest.mock('../../../src/ts/app/hooks/channel-segment-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/channel-segment-hooks');
  return {
    ...actual,
    useVisibleChannelSegments: jest.fn(() => uiChannelSegmentRecord),
    useGetVisibleChannelSegmentsByStationAndTime: jest.fn(() =>
      jest.fn(() => [unfilteredClaimCheckUiChannelSegment])
    ),
    useFetchUiChannelSegmentsForChannelTimeRange: () => async () => Promise.resolve([])
  };
});

describe('Update signal detection hooks', () => {
  describe('useCreateSignalDetection', () => {
    it('returns a callback function', () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const mockAppState: AppState = {
        ...appState,
        data: {
          ...appState.data,
          channels: {
            raw: {
              [asarAS01Channel.name]: asarAS01Channel
            },
            beamed: {
              [asarAS02Channel.name]: asarAS02Channel
            },
            filtered: {}
          }
        }
      };

      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      expect(result.current).toBeDefined();
    });
    it('creates a signal detection with the current phase associated to a temp channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments,
          channels: {
            raw: {},
            beamed: {
              [PD01Channel.name]: PD01Channel
            },
            filtered: {}
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      // Time before the channel segment
      const timeSec = pdarUiChannelSegmentDescriptor.startTime - 1;

      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(PD01Channel.name, '', timeSec, currentPhase);

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;
      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(currentPhase);
    });

    it('creates a signal detection with the default phase associated to a temp/beam channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments,
          channels: {
            raw: {},
            beamed: {
              [PD01Channel.name]: PD01Channel
            },
            filtered: {}
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      // Time before the channel segment
      const timeSec = pdarUiChannelSegmentDescriptor.startTime - 1;

      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(PD01Channel.name, '', timeSec, defaultSignalDetectionPhase, true);

      const actions = store.getActions();
      const beamedChannel: Channel = actions[0].payload[0];
      expect(actions[0].type).toBe(addBeamedChannels.type);
      expect(beamedChannel).toBeDefined();
      expect(ChannelTypes.Util.isTemporaryChannel(beamedChannel)).toBe(true);

      expect(actions[1].type).toBe(createSignalDetection.type);
      const { signalDetection } = actions[1].payload;
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(defaultSignalDetectionPhase);
    });
    it('creates a signal detection with the current phase associated to an existing beamed channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments,
          channels: {
            raw: {},
            beamed: {
              [PD01Channel.name]: PD01Channel
            },
            filtered: {}
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      const timeSec = pdarUiChannelSegmentDescriptor.startTime;

      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(
        PD01Channel.name,
        pdarUiChannelSegmentDescriptor.channel.name,
        timeSec,
        currentPhase
      );

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;

      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(currentPhase);
    });
    it('creates a signal detection with the default phase associated to an existing beamed channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments,
          channels: {
            raw: {},
            beamed: {
              [PD01Channel.name]: PD01Channel
            },
            filtered: {}
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      const timeSec = pdarUiChannelSegmentDescriptor.startTime;
      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(
        PD01Channel.name,
        pdarUiChannelSegmentDescriptor.channel.name,
        timeSec,
        defaultSignalDetectionPhase
      );

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;
      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(defaultSignalDetectionPhase);
    });
    it('creates a signal detection with the current phase associated to an existing raw channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments,
          channels: {
            raw: {
              [PD01Channel.name]: PD01Channel
            },
            beamed: {},
            filtered: {}
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      const timeSec = pdarUiChannelSegmentDescriptor.startTime;
      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(
        PD01Channel.name,
        pdarUiChannelSegmentDescriptor.channel.name,
        timeSec,
        currentPhase
      );

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;

      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(currentPhase);
    });
    it('creates a signal detection with the default phase associated to an existing raw channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments,
          channels: {
            raw: {
              [PD01Channel.name]: PD01Channel
            },
            beamed: {},
            filtered: {}
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      const timeSec = pdarUiChannelSegmentDescriptor.startTime;
      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(
        PD01Channel.name,
        pdarUiChannelSegmentDescriptor.channel.name,
        timeSec,
        defaultSignalDetectionPhase
      );

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;

      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(defaultSignalDetectionPhase);
    });

    it('creates a signal detection with the current phase associated to an existing filtered channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments: filteredUiChannelSegments,
          channels: {
            raw: {},
            beamed: {},
            filtered: {
              [PD01Channel.name]: PD01Channel
            }
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            channelFilters,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      const timeSec = pdarUiChannelSegmentDescriptor.startTime;
      // For raw channel createSignalDetection stationId is the raw channel name and channel is not needed
      await result.current(
        PD01Channel.name,
        pdarUiChannelSegmentDescriptor.channel.name,
        timeSec,
        currentPhase
      );

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;

      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(currentPhase);
    });
    it('creates a signal detection with the default phase associated to an existing filtered channel', async () => {
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const currentPhase = 'P';
      const defaultSignalDetectionPhase = 'I';

      const store = mockStoreCreator({
        ...appState,
        data: {
          ...appState.data,
          uiChannelSegments: filteredUiChannelSegments,
          channels: {
            raw: {},
            beamed: {},
            filtered: {
              [PD01Channel.name]: PD01Channel
            }
          }
        },
        app: {
          ...appState.app,
          analyst: {
            ...appState.app.analyst,
            currentPhase,
            defaultSignalDetectionPhase
          },
          waveform: {
            ...appState.app.waveform,
            channelFilters,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: Number.MAX_SAFE_INTEGER
            }
          }
        }
      });

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useCreateSignalDetection(), {
        wrapper: Wrapper
      });

      const timeSec = pdarUiChannelSegmentDescriptor.startTime;
      await result.current(
        pdarUiChannelSegmentDescriptor.channel.name,
        '',
        timeSec,
        defaultSignalDetectionPhase
      );

      const actions = store.getActions();
      const { signalDetection } = actions[0].payload;

      expect(actions[0].type).toBe(createSignalDetection.type);
      expect(signalDetection).toBeDefined();
      expect(
        (
          signalDetection.signalDetectionHypotheses[0].featureMeasurements[1]
            .measurementValue as PhaseTypeMeasurementValue
        ).value
      ).toBe(defaultSignalDetectionPhase);
    });
  });
});

describe('useUpdateSignalDetectionAcceptFk, useUpdateSignalDetectionUnacceptFk, useUpdateSignalDetectionRestoreFkAccepted', () => {
  const testAzimuth = 1;
  const testSlowness = 1;

  const signalDetection =
    signalDetectionsData.find(sd => sd.id === '012de1b9-8ae3-3fd4-800d-58665c3152dd') ||
    signalDetectionsData[3];

  const acceptFkArgs = [
    {
      signalDetectionId: signalDetection.id,
      measuredValues: { azimuth: testAzimuth, slowness: testSlowness }
    }
  ];

  const fkChannelSegment = getTestFkChannelSegment(signalDetection);
  const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
  const mockAppState: AppState = {
    ...appState,
    app: {
      ...appState.app,
      userSession: {
        ...appState.app.userSession,
        authenticationStatus: {
          ...appState.app.userSession.authenticationStatus,
          userName: 'test'
        }
      },
      workflow: {
        ...appState.app.workflow,
        openIntervalName: 'AL1',
        openActivityNames: ['AL1 Event Review'],
        timeRange: { startTimeSecs: 1669150800, endTimeSecs: 1669154400 }
      },
      analyst: {
        ...appState.app.analyst,
        openEventId: eventData.id
      }
    },
    data: {
      ...appState.data,
      filterDefinitionsForSignalDetections: {},
      fkChannelSegments: {
        [ChannelSegmentTypes.Util.createChannelSegmentString(fkChannelSegment.id)]: fkChannelSegment
      },
      signalDetections: {
        [signalDetection.id]: signalDetection
      },
      events: { [eventData.id]: eventData }
    }
  };

  const store = mockStoreCreator(mockAppState);

  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  describe('useUpdateSignalDetectionAcceptFk', () => {
    it('is defined', () => {
      expect(useUpdateSignalDetectionAcceptFk).toBeDefined();
    });

    it('matches snapshot', () => {
      const { result } = renderHook(() => useUpdateSignalDetectionAcceptFk(), {
        wrapper: getTestReduxWrapper(store)
      });
      expect(result.current).toMatchSnapshot();
    });

    it('dispatches with expected payload', () => {
      const { result } = renderHook(() => useUpdateSignalDetectionAcceptFk(), {
        wrapper: Wrapper
      });

      result.current(acceptFkArgs);

      const expectedDispatchPayload = {
        stageId: {
          definitionId: {
            name: 'AL_1'
          },
          startTime: 0
        },
        username: 'test',
        openIntervalName: 'AL1',
        sdIdsAndMeasuredValues: acceptFkArgs
      };

      const actions = store.getActions();

      expect(actions[0].type).toBe(acceptFk.type);
      expect(actions[0].payload).toStrictEqual(expectedDispatchPayload);
    });
  });

  describe('useRevertSignalDetectionAcceptFk', () => {
    it('is defined', () => {
      expect(useRevertSignalDetectionAcceptFk).toBeDefined();
    });
    it('matches snapshot', () => {
      const { result } = renderHook(() => useRevertSignalDetectionAcceptFk(), {
        wrapper: getTestReduxWrapper(store)
      });
      expect(result.current).toMatchSnapshot();
    });
    it('dispatches with expected payload', () => {
      const { result } = renderHook(() => useRevertSignalDetectionAcceptFk(), {
        wrapper: Wrapper
      });

      result.current(signalDetection.id);

      const expectedDispatchPayload = {
        signalDetectionId: signalDetection.id
      };

      const actions = store.getActions();
      expect(actions[1].type).toBe(revertFkAction);
      expect(actions[1].payload).toStrictEqual(expectedDispatchPayload);
    });
  });
});
