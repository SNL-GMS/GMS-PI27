import { type CommonTypes, WorkflowTypes } from '@gms/common-model';
import {
  akasgBHEChannel,
  akasgBHNChannel,
  akasgVersionReference,
  defaultStations,
  eventData2,
  openIntervalName,
  processingAnalystConfigurationData,
  rotationTemplate,
  rotationTemplateByPhaseByStationRecord
} from '@gms/common-model/__tests__/__data__';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { renderHook } from '@testing-library/react-hooks';
import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState } from '../../../../src/ts/app';
import { AsyncActionStatus, userSessionActions, workflowActions } from '../../../../src/ts/app';
import { useRotate2dForStations } from '../../../../src/ts/app/util/ui-rotation-processor/rotate-2d-for-stations';
import { useGetOrFetchRotationTemplateForStationAndPhase } from '../../../../src/ts/app/util/ui-rotation-processor/ui-rotation-processor-utils';
import { useQueryStateResult } from '../../../__data__';
import { appState, getTestReduxWrapper } from '../../../test-util';
import { activityInterval } from '../../api/workflow/sample-data';

// eslint-disable-next-line no-console
console.error = jest.fn();
// eslint-disable-next-line no-console
console.warn = jest.fn();

jest.mock('../../../../src/ts/app/util/ui-rotation-processor/rotate-2d-for-channels', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/util/ui-rotation-processor/rotate-2d-for-channels'
  );
  // need to return undefined until function is implemented
  const mockRotate2dForChannels = jest.fn(() => {
    return undefined;
  });
  return {
    ...actual,
    useRotate2dForChannels: jest.fn(() => mockRotate2dForChannels),
    useGet2dRotationForSingleChannelPair: jest.fn(() => mockRotate2dForChannels)
  };
});
jest.mock('../../../../src/ts/app/util/ui-rotation-processor/ui-rotation-processor-utils', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/util/ui-rotation-processor/ui-rotation-processor-utils'
  );
  const mockGetOrFetchRotationTemplateForStationAndPhase = jest.fn(() => rotationTemplate);
  const channelsToRotate: [Channel, Channel][] = [[akasgBHEChannel, akasgBHNChannel]];
  // need to return undefined until function is implemented
  return {
    ...actual,
    getChannelPairsToRotate: jest.fn(() => channelsToRotate),
    useGetOrFetchRotationTemplateForStationAndPhase: jest.fn(
      () => mockGetOrFetchRotationTemplateForStationAndPhase
    )
  };
});

jest.mock('axios', () => {
  const success = 'success';
  const actualAxios = jest.requireActual('axios');
  return {
    ...actualAxios,
    request: jest.fn().mockReturnValue(Promise.resolve(success))
  };
});

jest.mock('../../../../src/ts/app/api/data/signal-enhancement', () => {
  const actual = jest.requireActual('../../../../src/ts/app/api/data/signal-enhancement');
  return {
    ...actual,
    getRotationTemplates: jest.fn()
  };
});
jest.mock('../../../../src/ts/app/api/workflow/workflow-api-slice', () => {
  const actual = jest.requireActual('../../../../src/ts/app/api/workflow/workflow-api-slice');

  const mockActivityMutation = jest.fn();
  const mockAnalystStageMutation = jest.fn();

  return {
    ...actual,
    useUpdateActivityIntervalStatusMutation: () => [mockActivityMutation],
    useUpdateStageIntervalStatusMutation: () => [mockAnalystStageMutation],
    useWorkflowQuery: jest.fn(() => ({
      isSuccess: true,
      data: {
        stages: [
          {
            name: openIntervalName,
            mode: WorkflowTypes.StageMode.INTERACTIVE,
            activities: [
              {
                name: activityInterval.intervalId.definitionId.name,
                stationGroup: { name: 'mockStationGroup' }
              }
            ]
          },
          {
            name: 'AL2',
            mode: WorkflowTypes.StageMode.AUTOMATIC,
            activities: [
              {
                name: activityInterval.intervalId.definitionId.name,
                stationGroup: { name: 'mockStationGroup2' }
              }
            ]
          }
        ]
      }
    }))
  };
});
const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 2000
};
const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;
jest.mock(
  '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );

    return {
      // ...actual,
      useGetOperationalTimePeriodConfigurationQuery: jest.fn(
        () => operationalTimePeriodConfigurationQuery
      ),
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      })),
      processingConfigurationApiSlice: {
        ...actual.processingConfigurationApiSlice,
        endpoints: {
          getProcessingAnalystConfiguration: {
            select: jest.fn(() =>
              jest.fn(() => ({
                data: processingAnalystConfigurationData
              }))
            )
          }
        }
      }
    };
  }
);
jest.mock('../../../../src/ts/app/hooks/workflow-hooks', () => {
  return {
    useStageId: jest.fn().mockReturnValue({
      startTime: 0,
      definitionId: {
        name: 'AL1'
      }
    })
  };
});
jest.mock('../../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useVisibleStations: jest.fn(() => defaultStations)
  };
});

jest.mock('../../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useVisibleStations: jest.fn(() => defaultStations)
  };
});

const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);

const mockAppState: AppState = {
  ...appState,
  app: {
    ...appState.app,
    analyst: {
      ...appState.app.analyst,
      currentPhase: 'S',
      openEventId: eventData2.id,
      phaseSelectorFavorites: {
        'Seismic & Hydroacoustic': ['S']
      }
    },
    workflow: { ...appState.app.workflow, openIntervalName: 'AL1' }
  },
  data: {
    ...appState.data,
    events: { [eventData2.id]: eventData2 },
    rotationTemplates: rotationTemplateByPhaseByStationRecord,
    queries: {
      ...appState.data.queries,
      getRotationTemplates: {
        AKASG: {
          '0': {
            arg: { stations: [akasgVersionReference], phases: ['S'] },
            error: undefined,
            status: AsyncActionStatus.fulfilled,
            time: 0,
            attempts: 1
          }
        }
      }
    }
  }
};
const store = mockStoreCreator(mockAppState);

const createMockOpenInterval = () => {
  store.dispatch(workflowActions.setOpenActivityNames(['AL1 Event Review']));
  store.dispatch(workflowActions.setOpenIntervalName('AL1'));
  store.dispatch(
    userSessionActions.setAuthenticationStatus({
      userName: 'TestUser',
      authenticated: true,
      authenticationCheckComplete: true,
      failedToConnect: false
    })
  );
  store.dispatch(
    workflowActions.setTimeRange({ startTimeSecs: 1669150800, endTimeSecs: 1669151800 })
  );
};

describe('useRotate2dForStations', () => {
  createMockOpenInterval();

  it('is defined', () => {
    expect(useRotate2dForStations).toBeDefined();
  });
  it('can be called given stations and a phase', async () => {
    jest.clearAllMocks();
    const result = renderHook(useRotate2dForStations, {
      wrapper: getTestReduxWrapper(store)
    });
    const akasg = defaultStations[1];

    await result.result.current([akasg], 'S');
    expect(useGetOrFetchRotationTemplateForStationAndPhase).toHaveBeenCalled();
    const mockGetOrFetchRotationTemplateForStationAndPhase: jest.Mock =
      useGetOrFetchRotationTemplateForStationAndPhase() as any;
    expect(mockGetOrFetchRotationTemplateForStationAndPhase.mock.calls[0][0]).toMatchSnapshot();
  });
  describe('validation checks for rotate2dForChannels', () => {
    createMockOpenInterval();
    it('called with provided leadDuration and Duration', async () => {
      jest.clearAllMocks();
      const result = renderHook(useRotate2dForStations, {
        wrapper: getTestReduxWrapper(store)
      });
      const akasg = defaultStations[1];
      const providedStations = [akasg];
      const providedPhase = `S`;
      const providedLeadDuration = 789234;
      const providedDuration = 908345890;

      await result.result.current(
        providedStations,
        providedPhase,
        undefined,
        providedLeadDuration,
        providedDuration
      );
      expect(useGetOrFetchRotationTemplateForStationAndPhase).toHaveBeenCalled();
      const mockGetOrFetchRotationTemplateForStationAndPhase: jest.Mock =
        useGetOrFetchRotationTemplateForStationAndPhase() as any;
      expect(mockGetOrFetchRotationTemplateForStationAndPhase).toHaveBeenCalled();
    });
    it('called with duration and leadDuration from the template when none have been provided', async () => {
      jest.clearAllMocks();
      const result = renderHook(useRotate2dForStations, {
        wrapper: getTestReduxWrapper(store)
      });
      const akasg = defaultStations[1];
      const providedStations = [akasg];
      const providedPhase = `S`;

      await result.result.current(providedStations, providedPhase);
      expect(useGetOrFetchRotationTemplateForStationAndPhase).toHaveBeenCalled();
      const mockGetOrFetchRotationTemplateForStationAndPhase: jest.Mock =
        useGetOrFetchRotationTemplateForStationAndPhase() as any;
      expect(mockGetOrFetchRotationTemplateForStationAndPhase).toHaveBeenCalled();
    });
  });
});
