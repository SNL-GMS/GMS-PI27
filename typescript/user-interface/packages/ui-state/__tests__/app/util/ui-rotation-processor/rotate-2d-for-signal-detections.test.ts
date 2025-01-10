import type { CommonTypes, WaveformTypes } from '@gms/common-model';
import { StationTypes, WorkflowTypes } from '@gms/common-model';
import {
  akasg,
  akasgBHEChannel,
  akasgBHNChannel,
  akasgBHZChannel,
  akasgVersionReference,
  asar,
  asarAS01Channel,
  eventData2,
  featurePredictionsAKASG,
  openIntervalName,
  PD01Channel,
  processingAnalystConfigurationData,
  processingMaskDefinition,
  qcSegmentAkasgBHE,
  qcSegmentAkasgBHN,
  rotationTemplate,
  rotationTemplateByPhaseByStationRecord,
  rotationTemplatesByStationByPhase,
  signalDetectionAsarEventBeam,
  signalDetectionOnRawBHN
} from '@gms/common-model/__tests__/__data__';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment';
import { SamplingType } from '@gms/common-model/lib/common/types';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import { convertToEntityReference } from '@gms/common-model/lib/faceted/utils';
import type { RotationTemplateByPhaseByStation } from '@gms/common-model/lib/rotation/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { WithRequired } from '@gms/common-model/lib/type-util/type-util';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import { renderHook } from '@testing-library/react-hooks';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState, GetChannelsByNamesTimeRangeQueryArgs } from '../../../../src/ts/app';
import { AsyncActionStatus, userSessionActions, workflowActions } from '../../../../src/ts/app';
import type { GetChannelSegmentsByChannelQueryArgs } from '../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel';
import { useRotate2dForSignalDetections } from '../../../../src/ts/app/util/ui-rotation-processor/rotate-2d-for-signal-detections';
import type { MaskAndRotate2dResult, UiChannelSegment } from '../../../../src/ts/types';
import { unfilteredClaimCheckUiChannelSegment, useQueryStateResult } from '../../../__data__';
import { appState, getTestReduxWrapper } from '../../../test-util';
import { activityInterval } from '../../api/workflow/sample-data';

// eslint-disable-next-line no-console
console.error = jest.fn();
// eslint-disable-next-line no-console
console.warn = jest.fn();

jest.mock('../../../../src/ts/app/util/channel-factory', () => {
  const actual = jest.requireActual('../../../../src/ts/app/util/channel-factory');
  return {
    ...actual,
    /**
     * ! If this is not mocked, then it will break our Axios request mocks when it fails
     */
    batchPublishDerivedChannelsCreatedEvents: jest.fn()
  };
});
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
jest.mock('../../../../src/ts/app/hooks/operational-time-period-configuration-hooks', () => {
  const app = jest.requireActual(
    '../../../../src/ts/app/hooks/operational-time-period-configuration-hooks'
  );
  return {
    ...app,
    useEffectiveTime: jest.fn(() => akasgBHEChannel.effectiveAt + 1000)
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
      useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
        data: { stationGroupNames: ['test'] }
      })),
      useGetOperationalTimePeriodConfigurationQuery: jest.fn(
        () => operationalTimePeriodConfigurationQuery
      ),
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      })),
      processingConfigurationApiSlice: {
        ...actual.processingConfigurationApiSlice,
        middleware: actual.processingConfigurationApiSlice.middleware,
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
const defaultMockStationGroup: StationTypes.StationGroup[] = [
  {
    description: 'test group',
    effectiveAt: 123,
    effectiveUntil: 456,
    name: 'test group name',
    stations: [
      {
        name: 'station name',
        description: 'station description',
        type: StationTypes.StationType.HYDROACOUSTIC,
        effectiveAt: 123,
        effectiveUntil: 456,
        relativePositionsByChannel: {},
        location: { depthKm: 3, elevationKm: 3, latitudeDegrees: 1, longitudeDegrees: 3 },
        allRawChannels: [],
        channelGroups: []
      }
    ]
  }
];

const defaultMockStation: StationTypes.Station[] = [
  {
    name: 'station name',
    description: 'station description',
    type: StationTypes.StationType.HYDROACOUSTIC,
    effectiveAt: 123,
    effectiveUntil: 456,
    relativePositionsByChannel: {},
    location: { depthKm: 3, elevationKm: 3, latitudeDegrees: 1, longitudeDegrees: 3 },
    allRawChannels: [],
    channelGroups: []
  }
];
const mockStationGroup = defaultMockStationGroup;
const mockStation = defaultMockStation;
jest.mock('../../../../src/ts/app/api/station-definition/station-definition-api-slice', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/station-definition/station-definition-api-slice'
  );
  return {
    // ...actual,
    useGetStationGroupsByNamesQuery: jest.fn(() => ({
      data: mockStationGroup
    })),
    useGetStationsQuery: jest.fn(() => ({
      data: mockStation
    })),
    useGetStationsWithChannelsQuery: jest.fn(() => ({
      data: mockStation
    })),
    stationDefinitionSlice: {
      ...actual.stationDefinitionSlice,
      endpoints: {
        ...actual.stationDefinitionSlice.endpoints,
        getStationGroupsByNames: {
          ...actual.stationDefinitionSlice.endpoints.getStationGroupsByNames,
          select: jest.fn(() =>
            jest.fn(() => ({
              data: {}
            }))
          )
        }
      }
    }
  };
});

const c1 = cloneDeep(akasgBHEChannel);
let c2 = {
  ...akasgBHEChannel,
  name: 'AKASG.AKBB.BHN',
  canonicalName: 'AKASG.AKBB.BHN',
  channelOrientationType: ChannelOrientationType.NORTH_SOUTH,
  channelOrientationCode: 'N'
};
if (c1.orientationAngles?.horizontalAngleDeg && c1.orientationAngles?.verticalAngleDeg) {
  c2 = {
    ...c2,
    orientationAngles: {
      horizontalAngleDeg: c1.orientationAngles.horizontalAngleDeg + 1,
      verticalAngleDeg: c1.orientationAngles.verticalAngleDeg + 1
    }
  };
}

const c3 = cloneDeep(akasgBHNChannel);
let c4 = {
  ...akasgBHEChannel,
  name: 'AKASG.AKASG.BHE',
  canonicalName: 'AKASG.AKASG.BHE',
  channelOrientationType: ChannelOrientationType.EAST_WEST,
  channelOrientationCode: 'E',
  OrientationAngles: {
    horizontalAngleDeg: 300,
    verticalAngleDeg: 400
  }
};
if (c3.orientationAngles?.horizontalAngleDeg && c3.orientationAngles?.verticalAngleDeg) {
  c4 = {
    ...c4,
    orientationAngles: {
      horizontalAngleDeg: c3.orientationAngles.horizontalAngleDeg - 1,
      verticalAngleDeg: c3.orientationAngles.verticalAngleDeg - 1
    }
  };
}

jest.mock('../../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useVisibleStations: jest.fn(() => [
      {
        ...akasg,
        allRawChannels: [c1, c2, c3, c4]
      },
      asar
    ])
  };
});

jest.mock('../../../../src/ts/workers/api', () => {
  const actualWorkers = jest.requireActual('../../../../src/ts/workers/api');
  return {
    ...actualWorkers,
    fetchChannelSegmentsByChannel: async (
      requestConfig: WithRequired<
        PriorityRequestConfig<GetChannelSegmentsByChannelQueryArgs>,
        'data'
      >
    ): Promise<UiChannelSegment<WaveformTypes.Waveform>[]> => {
      const { channels, endTime, startTime } = requestConfig.data;
      if (startTime == null || endTime == null) {
        throw new Error(
          'Error building mock UiChannelSegment. startTime and endTime must be defined'
        );
      }
      const buildUiChanSeg: (
        chan: VersionReference<'name'>
      ) => UiChannelSegment<WaveformTypes.Waveform> = chan => {
        return {
          ...unfilteredClaimCheckUiChannelSegment,
          channelSegment: {
            ...unfilteredClaimCheckUiChannelSegment.channelSegment,
            id: {
              channel: chan,
              creationTime: unfilteredClaimCheckUiChannelSegment.channelSegment.id.creationTime,
              startTime,
              endTime
            }
          },
          channelSegmentDescriptor: {
            channel: chan,
            creationTime: unfilteredClaimCheckUiChannelSegment.channelSegment.id.creationTime,
            startTime,
            endTime
          }
        };
      };
      return Promise.resolve(channels.map(chan => buildUiChanSeg(chan)));
    },
    maskAndRotate2d: async (): Promise<MaskAndRotate2dResult[]> => {
      return Promise.resolve([
        {
          stationName: 'myStation',
          phase: 'P',
          rotatedChannel: PD01Channel,
          rotatedUiChannelSegment: unfilteredClaimCheckUiChannelSegment
        }
      ]);
    }
  };
});

jest.mock('../../../../src/ts/workers/api/fetch-channels-by-names-timerange', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/workers/api/fetch-channels-by-names-timerange'
  );
  return {
    ...actual,
    fetchChannelsByNamesTimeRange: async (
      requestConfig: WithRequired<
        PriorityRequestConfig<GetChannelsByNamesTimeRangeQueryArgs>,
        'data'
      >
    ): Promise<Channel[]> => {
      const { channelNames, endTime, startTime } = requestConfig.data;
      if (startTime == null || endTime == null) {
        throw new Error('Error building mock Channel. startTime and endTime must be defined');
      }
      const buildChannel: (chanName: string) => Channel = chanName => {
        switch (chanName) {
          case akasgBHEChannel.name:
            return akasgBHEChannel;
          case akasgBHNChannel.name:
            return akasgBHNChannel;
          case akasgBHZChannel.name:
            return akasgBHZChannel;
          case asarAS01Channel.name:
            return asarAS01Channel;
          default:
            throw new Error(`Mock does not (yet) support channel: ${chanName}`);
        }
      };
      return Promise.resolve(channelNames.map(chan => buildChannel(chan)));
    }
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
    workflow: {
      ...appState.app.workflow,
      openIntervalName: 'AL1',
      stationGroup: {
        name: 'test',
        effectiveAt: 1,
        description: ''
      }
    },
    waveform: {
      ...appState.app.waveform,
      viewableInterval: { startTimeSecs: 1669150400, endTimeSecs: 1669152200 }
    }
  },
  data: {
    ...appState.data,
    events: { [eventData2.id]: eventData2 },
    rotationTemplates: rotationTemplateByPhaseByStationRecord,
    channels: {
      ...appState.data.channels
    },
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

const response: AxiosResponse<unknown> = {
  status: 200,
  config: {},
  headers: {},
  statusText: '',
  data: {}
};

const mockAxiosRequest = jest.fn().mockImplementation(async requestConfig => {
  const { url } = requestConfig;
  if (url.includes('predict-for-event-location')) {
    return Promise.resolve({
      ...response,
      data: {
        receiverLocationsByName: {
          AKASG: {
            featurePredictions: featurePredictionsAKASG
          }
        }
      }
    });
  }
  if (url.includes('processing-mask')) {
    return Promise.resolve({
      ...response,
      data: {
        processingMaskDefinitionByPhaseByChannel: [
          {
            channel: requestConfig.data.channels[0],
            processingMaskDefinitionByPhase: {
              [requestConfig.data.phaseTypes[0]]: {
                ...processingMaskDefinition,
                processingOperation: ProcessingOperation.ROTATION
              }
            }
          }
        ]
      }
    });
  }
  if (url.includes('qc-segment')) {
    if (requestConfig.data.channels.find(chan => chan.name.includes('BHE'))) {
      return Promise.resolve({
        ...response,
        data: [
          {
            ...qcSegmentAkasgBHE,
            versionHistory: [
              {
                ...qcSegmentAkasgBHE.versionHistory[0],
                startTime: requestConfig.data.startTime,
                endTime: requestConfig.data.endTime
              }
            ]
          }
        ]
      });
    }
    if (requestConfig.data.channels.find(chan => chan.name.includes('BHN'))) {
      return Promise.resolve({
        ...response,
        data: [qcSegmentAkasgBHN]
      });
    }
  }
  if (url.includes('rotation-templates')) {
    const data: RotationTemplateByPhaseByStation[] = [
      {
        ...rotationTemplatesByStationByPhase,
        rotationTemplatesByPhase: {
          ...rotationTemplatesByStationByPhase.rotationTemplatesByPhase,
          [requestConfig.data.phases[0]]: {
            ...rotationTemplate,
            rotationDescription: {
              ...rotationTemplate.rotationDescription,
              phaseType: requestConfig.data.phases[0]
            }
          }
        }
      }
    ];
    return Promise.resolve({
      ...response,
      data
    });
  }
  const success = 'success';
  return Promise.resolve(success);
});
Axios.request = mockAxiosRequest;

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

describe('UI Rotation Processor signal detections', () => {
  describe('useRotate2dForSignalDetections', () => {
    createMockOpenInterval();
    const location: CommonTypes.Location = {
      depthKm: 0,
      elevationKm: 0,
      latitudeDegrees: 11.3493,
      longitudeDegrees: 142.1996
    };
    const renderedHook = renderHook(useRotate2dForSignalDetections, {
      wrapper: getTestReduxWrapper(store)
    });
    const rotate2dForSignalDetections = renderedHook.result.current;
    // state.app.waveform.stationsVisibility
    const storeNoEventOpen = mockStoreCreator({
      ...mockAppState,
      app: {
        ...mockAppState.app,
        analyst: { ...mockAppState.app.analyst, openEventId: '' }
      }
    });
    const renderedHookNoEvent = renderHook(useRotate2dForSignalDetections, {
      wrapper: getTestReduxWrapper(storeNoEventOpen)
    });
    const rotate2dForSignalDetectionsNoEventOpen = renderedHookNoEvent.result.current;
    // Setting up required state for a viable rotation
    const viableRotationTemplate = cloneDeep(rotationTemplate);
    viableRotationTemplate.orientationAngleToleranceDeg = 90;
    viableRotationTemplate.inputChannels = [c1, c2, c3, c4].map(channel =>
      convertToEntityReference(channel, 'name')
    );
    describe('Validation', () => {
      beforeEach(() => {
        console.error = jest.fn();
      });
      it('throws if given an invalid sampling type', async () => {
        await expect(async () => {
          await rotate2dForSignalDetections([signalDetectionOnRawBHN], 'GARBAGE' as SamplingType);
        }).rejects.toThrow(`Invalid sampling type: GARBAGE`);
      });
      it('throws if given no leadDuration or no duration', async () => {
        await expect(async () => {
          await rotate2dForSignalDetections(
            [signalDetectionOnRawBHN],
            SamplingType.NEAREST_SAMPLE,
            0
          );
        }).rejects.toThrow(
          'leadDuration and duration must both be defined, or both be undefined; however, leadDuration is 0 and duration is undefined'
        );
        await expect(async () => {
          await rotate2dForSignalDetections(
            [signalDetectionOnRawBHN],
            SamplingType.NEAREST_SAMPLE,
            undefined,
            0
          );
        }).rejects.toThrow(
          'leadDuration and duration must both be defined, or both be undefined; however, leadDuration is undefined and duration is 0'
        );
      });
      it('throws if given no leadDuration is not a number', async () => {
        await expect(async () => {
          await rotate2dForSignalDetections(
            [signalDetectionOnRawBHN],
            SamplingType.NEAREST_SAMPLE,
            'GARBAGE' as unknown as number,
            0
          );
        }).rejects.toThrow(
          'Invalid lead duration for rotation: GARBAGE. Lead duration must be a number.'
        );
      });
      it('throws if given no duration is not a number', async () => {
        await expect(async () => {
          await rotate2dForSignalDetections(
            [signalDetectionOnRawBHN],
            SamplingType.NEAREST_SAMPLE,
            0,
            'GARBAGE' as unknown as number
          );
        }).rejects.toThrow(
          'Invalid duration for rotation: GARBAGE. Duration must be a positive number.'
        );
      });
      it('throws if given no location or no receiverToSourceAzimuthDeg', async () => {
        const receiverToSourceAzimuthDeg = 1;
        await expect(async () => {
          await rotate2dForSignalDetections(
            [signalDetectionOnRawBHN],
            SamplingType.NEAREST_SAMPLE,
            0,
            1,
            location,
            receiverToSourceAzimuthDeg
          );
        }).rejects.toThrow(
          'Error rotating. One of location and receiverToSourceAzimuthDeg may be given, but not both.'
        );
      });
      it('console logs an error if the station cannot be found', async () => {
        await rotate2dForSignalDetections(
          [signalDetectionOnRawBHN],
          SamplingType.NEAREST_SAMPLE,
          0,
          1,
          location
        );
        expect(console.error).toHaveBeenCalledWith(
          `GMS_LOG_UI_ROTATION_PROCESSOR_SD Cannot find station ${signalDetectionOnRawBHN.station.name} for signal detection ${signalDetectionOnRawBHN.id}`
        );
      });
      it('console logs an error if the signal detection is missing a receiver to source azimuth feature measurement', async () => {
        const sdWithMissingReceiverToSourceAzimuthDeg = cloneDeep(signalDetectionAsarEventBeam);
        sdWithMissingReceiverToSourceAzimuthDeg.signalDetectionHypotheses[0].featureMeasurements.splice(
          4,
          1
        );
        await rotate2dForSignalDetectionsNoEventOpen(
          [sdWithMissingReceiverToSourceAzimuthDeg],
          SamplingType.NEAREST_SAMPLE,
          0,
          1
        );
        expect(console.error).toHaveBeenCalledWith(
          `GMS_LOG_UI_ROTATION_PROCESSOR_SD Error: Cannot rotate. Either an event must be open, or a location or receiverToSourceAzimuth must be provided.`
        );
      });
    });
  });
});
