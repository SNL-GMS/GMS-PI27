import type { CommonTypes, WaveformTypes } from '@gms/common-model';
import { StationTypes } from '@gms/common-model';
import {
  akasg,
  akasgBHEChannel,
  akasgBHNChannel,
  akasgBHZChannel,
  akasgVersionReference,
  asar,
  asarAS01Channel,
  defaultStations,
  eventData2,
  featurePredictionsAKASG,
  PD01Channel,
  processingAnalystConfigurationData,
  processingMaskDefinition,
  qcSegmentAkasgBHE,
  qcSegmentAkasgBHN,
  rotationTemplate,
  rotationTemplateByPhaseByStationRecord,
  rotationTemplatesByStationByPhase,
  signalDetectionAsarEventBeam
} from '@gms/common-model/__tests__/__data__';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment';
import { SamplingType, Units } from '@gms/common-model/lib/common/types';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import { convertToEntityReference } from '@gms/common-model/lib/faceted/utils';
import type {
  RotationDefinition,
  RotationTemplateByPhaseByStation
} from '@gms/common-model/lib/rotation/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import {
  ChannelBandType,
  ChannelInstrumentType,
  ChannelOrientationType
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import type { WithRequired } from '@gms/common-model/lib/type-util/type-util';
import type { PriorityRequestConfig } from '@gms/ui-workers';
import { renderHook } from '@testing-library/react-hooks';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { toast } from 'react-toastify';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { AppState, GetChannelsByNamesTimeRangeQueryArgs } from '../../../../src/ts/app';
import { AsyncActionStatus, getRotationTimeRangeForSignalDetection } from '../../../../src/ts/app';
import * as ProcessingMaskThunks from '../../../../src/ts/app/api/data/signal-enhancement/get-processing-mask-definitions';
import * as QcSegmentThunks from '../../../../src/ts/app/api/data/waveform/find-qc-segments-by-channel-and-time-range';
import type { GetChannelSegmentsByChannelQueryArgs } from '../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel';
import * as ChannelSegmentThunks from '../../../../src/ts/app/api/data/waveform/get-channel-segments-by-channel';
import * as UiRotationProcessor from '../../../../src/ts/app/util/ui-rotation-processor/ui-rotation-processor-utils';
import type { MaskAndRotate2dResult, UiChannelSegment } from '../../../../src/ts/types';
import { unfilteredClaimCheckUiChannelSegment } from '../../../__data__';
import { appState, getTestReduxWrapper } from '../../../test-util';

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
jest.mock('../../../../src/ts/app/hooks/operational-time-period-configuration-hooks', () => {
  const app = jest.requireActual(
    '../../../../src/ts/app/hooks/operational-time-period-configuration-hooks'
  );
  return {
    ...app,
    useEffectiveTime: jest.fn(() => akasgBHEChannel.effectiveAt + 1000)
  };
});

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
const c2 = {
  ...akasgBHEChannel,
  name: 'AKASG.AKBB.BHN',
  canonicalName: 'AKASG.AKBB.BHN',
  channelOrientationType: ChannelOrientationType.NORTH_SOUTH,
  channelOrientationCode: 'N'
};

const c3 = cloneDeep(akasgBHNChannel);
const c4 = {
  ...akasgBHEChannel,
  name: 'AKASG.AKASG.BHE',
  canonicalName: 'AKASG.AKASG.BHE',
  channelOrientationType: ChannelOrientationType.EAST_WEST,
  channelOrientationCode: 'E'
};
const akasgStation = defaultStations[1];

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

describe('UI Rotation Processor', () => {
  describe('maskAndRotate2d', () => {
    const akasgBHEChannelInTolerance: Channel = {
      ...akasgBHEChannel,
      nominalSampleRateHz: 40
    };
    const akasgBHNChannelInTolerance: Channel = {
      ...akasgBHNChannel,
      nominalSampleRateHz: 40
    };
    const durationSecs = 300;
    const startTimeSecs = 1638298000;
    const endTimeSecs = startTimeSecs + durationSecs;
    const rotationTimeInterval: CommonTypes.TimeRange = { startTimeSecs, endTimeSecs };
    const rotationDef: RotationDefinition = {
      rotationDescription: {
        phaseType: 'S',
        samplingType: SamplingType.NEAREST_SAMPLE,
        twoDimensional: true
      },
      rotationParameters: {
        location: akasgBHEChannel.location,
        locationToleranceKm: 0.1,
        orientationAngles: {
          horizontalAngleDeg: 120,
          verticalAngleDeg: akasgBHEChannel.orientationAngles?.verticalAngleDeg
        },
        orientationAngleToleranceDeg: 0.5,
        receiverToSourceAzimuthDeg: 60,
        sampleRateHz: 40,
        sampleRateToleranceHz: 0.5
      }
    };
    const renderedHook = renderHook<
      { children },
      (
        processingOperation: ProcessingOperation,
        rotationDefinition: RotationDefinition,
        station: Station,
        rotationTimeInterval: CommonTypes.TimeRange,
        channels: [Channel, Channel]
      ) => Promise<MaskAndRotate2dResult[]>
    >(UiRotationProcessor.useMaskAndRotate2d, {
      wrapper: getTestReduxWrapper(store)
    });
    const maskAndRotate2d = renderedHook.result.current;
    describe('validation', () => {
      it('throws if it is not given exactly two channels', async () => {
        await expect(async () =>
          maskAndRotate2d(
            ProcessingOperation.ROTATION,
            rotationDef,
            akasgStation,
            rotationTimeInterval,
            [akasgBHEChannelInTolerance, akasgBHNChannelInTolerance, akasgBHZChannel] as any
          )
        ).rejects.toThrow('maskAndRotate2d: Rotation requires exactly two channels');
        await expect(async () =>
          maskAndRotate2d(
            ProcessingOperation.ROTATION,
            rotationDef,
            akasgStation,
            rotationTimeInterval,
            [akasgBHNChannelInTolerance] as any
          )
        ).rejects.toThrow('maskAndRotate2d: Rotation requires exactly two channels');
      });
      it('toasts a warning if the channels are out of sample rate tolerance', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            { ...akasgBHEChannelInTolerance, nominalSampleRateHz: 123 },
            { ...akasgBHNChannelInTolerance, nominalSampleRateHz: 321 }
          ] as any
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Channels are out of sample rate tolerance', {
          toastId: 'Channels are out of sample rate tolerance'
        });
      });
      it('throws if it is given two channels with the same horizontal orientation angles', async () => {
        await expect(async () =>
          maskAndRotate2d(
            ProcessingOperation.ROTATION,
            rotationDef,
            akasgStation,
            rotationTimeInterval,
            [akasgBHEChannelInTolerance, akasgBHEChannelInTolerance]
          )
        ).rejects.toThrow('maskAndRotate2d: Channels cannot have the same orientation angle');
      });
      it('toasts a warning if the channels have different units', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            { ...akasgBHEChannelInTolerance, units: Units.NANOMETERS },
            { ...akasgBHNChannelInTolerance, units: Units.DECIBELS }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Incompatible channel units', {
          toastId: 'Incompatible channel units'
        });
      });
      it('toasts a warning if the channels have different channel band types', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            { ...akasgBHEChannelInTolerance, channelBandType: ChannelBandType.BROADBAND },
            { ...akasgBHNChannelInTolerance, channelBandType: ChannelBandType.HIGH_BROADBAND }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Incompatible channel band codes', {
          toastId: 'Incompatible channel band codes'
        });
      });
      it('toasts a warning if the channels have different channel instrument types', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            {
              ...akasgBHEChannelInTolerance,
              channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER
            },
            {
              ...akasgBHNChannelInTolerance,
              channelInstrumentType: ChannelInstrumentType.LOW_GAIN_SEISMOMETER
            }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Incompatible channel instrument types', {
          toastId: 'Incompatible channel instrument types'
        });
      });
      it('toasts a warning if the channels have different channel orientation codes', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            { ...akasgBHEChannelInTolerance, channelOrientationCode: 'N' },
            { ...akasgBHNChannelInTolerance, channelOrientationCode: '1' }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Incompatible channel orientation codes', {
          toastId: 'Incompatible channel orientation codes'
        });
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            { ...akasgBHEChannelInTolerance, channelOrientationCode: 'E' },
            { ...akasgBHNChannelInTolerance, channelOrientationCode: '2' }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Incompatible channel orientation codes', {
          toastId: 'Incompatible channel orientation codes'
        });
      });
      it('toasts a warning if the channels are out of vertical tolerance', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            {
              ...akasgBHEChannelInTolerance,
              orientationAngles: {
                horizontalAngleDeg: 90,
                verticalAngleDeg: 90
              }
            },
            {
              ...akasgBHNChannelInTolerance,
              orientationAngles: {
                horizontalAngleDeg: 0,
                verticalAngleDeg: 45
              }
            }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Channel out of vertical tolerance', {
          toastId: 'Channel out of vertical tolerance'
        });
      });
      it('toasts a warning if the channels are not orthogonal within tolerance', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            {
              ...akasgBHEChannelInTolerance,
              orientationAngles: {
                horizontalAngleDeg: 90,
                verticalAngleDeg: 90
              }
            },
            {
              ...akasgBHNChannelInTolerance,
              orientationAngles: {
                horizontalAngleDeg: 2,
                verticalAngleDeg: 90
              }
            }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Channels are not orthogonal', {
          toastId: 'Channels are not orthogonal'
        });
      });
      it('toasts a warning if the channels are not within location tolerance', async () => {
        const toastSpy = jest.spyOn(toast, 'warn');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [
            {
              ...akasgBHEChannelInTolerance,
              location: {
                depthKm: 0,
                elevationKm: 0,
                latitudeDegrees: 0,
                longitudeDegrees: 0
              }
            },
            {
              ...akasgBHNChannelInTolerance,
              location: {
                depthKm: 0,
                elevationKm: 0,
                latitudeDegrees: 1,
                longitudeDegrees: -1
              }
            }
          ]
        );
        expect(toastSpy).toHaveBeenLastCalledWith('Channels are not within location tolerance', {
          toastId: 'Channels are not within location tolerance'
        });
      });
    });
    describe('fetches required data when not present:', () => {
      test('ChannelSegments when none are found in Redux', async () => {
        const channelSegmentQuerySpy = jest.spyOn(
          ChannelSegmentThunks,
          'getChannelSegmentsByChannel'
        );
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          rotationDef,
          akasgStation,
          rotationTimeInterval,
          [{ ...akasgBHEChannelInTolerance }, { ...akasgBHNChannelInTolerance }]
        );
        expect(channelSegmentQuerySpy).toHaveBeenCalledWith({
          channels: [akasgBHEChannelInTolerance],
          endTime: 1669152200,
          startTime: 1669150400
        });
        expect(channelSegmentQuerySpy).toHaveBeenCalledWith({
          channels: [akasgBHNChannelInTolerance],
          endTime: 1669152200,
          startTime: 1669150400
        });
      });
      test('ProcessingMasks when none are found in Redux', async () => {
        const processingMaskQuerySpy = jest.spyOn(
          ProcessingMaskThunks,
          'getProcessingMaskDefinitions'
        );
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          {
            ...rotationDef,
            rotationDescription: {
              phaseType: 'P3KPdf_B',
              samplingType: SamplingType.NEAREST_SAMPLE,
              twoDimensional: true
            }
          },
          akasgStation,
          rotationTimeInterval,
          [{ ...akasgBHEChannelInTolerance }, { ...akasgBHNChannelInTolerance }]
        );
        expect(processingMaskQuerySpy).toHaveBeenCalledWith({
          channels: [akasgBHEChannel],
          phaseTypes: ['P3KPdf_B'],
          processingOperations: [ProcessingOperation.ROTATION],
          stationGroup: { description: '', effectiveAt: 1, name: 'test' }
        });
        expect(processingMaskQuerySpy).toHaveBeenCalledWith({
          channels: [akasgBHNChannel],
          phaseTypes: ['P3KPdf_B'],
          processingOperations: [ProcessingOperation.ROTATION],
          stationGroup: { description: '', effectiveAt: 1, name: 'test' }
        });
      });
      test('QC Segments when none are found in Redux', async () => {
        const qcSegmentSpy = jest.spyOn(QcSegmentThunks, 'findQCSegmentsByChannelAndTimeRange');
        await maskAndRotate2d(
          ProcessingOperation.ROTATION,
          {
            ...rotationDef,
            rotationDescription: {
              phaseType: 'P3KPdf_B',
              samplingType: SamplingType.NEAREST_SAMPLE,
              twoDimensional: true
            }
          },
          akasgStation,
          rotationTimeInterval,
          [{ ...akasgBHEChannelInTolerance }, { ...akasgBHNChannelInTolerance }]
        );
        expect(qcSegmentSpy).toHaveBeenCalledWith({
          channels: [akasgBHEChannel],
          endTime: 1669152200,
          startTime: 1669150400
        });
        expect(qcSegmentSpy).toHaveBeenCalledWith({
          channels: [akasgBHNChannel],
          endTime: 1669152200,
          startTime: 1669150400
        });
      });
    });
  });

  describe('getRotationTimeRangeForSignalDetection', () => {
    it('should return a time range for the signal detection', () => {
      const timeRange = getRotationTimeRangeForSignalDetection(signalDetectionAsarEventBeam, 1, 1);
      expect(timeRange).not.toBeUndefined();
      expect(timeRange).toMatchObject({ startTimeSecs: 1636503403, endTimeSecs: 1636503405 });
    });

    it('should undefined for a signal detection without an arrival time feature measurement', () => {
      const sdWithMissingArrivalTime = cloneDeep(signalDetectionAsarEventBeam);
      sdWithMissingArrivalTime.signalDetectionHypotheses[0].featureMeasurements.splice(1, 1);

      const timeRange = getRotationTimeRangeForSignalDetection(sdWithMissingArrivalTime, 1, 1);
      expect(timeRange).toBeUndefined();
    });
  });

  describe('getChannelPairsToRotate', () => {
    it('should use the rotationTemplate.inputChannels to create pairs', () => {
      const chan1 = cloneDeep(akasgBHEChannel);
      const chan2 = {
        ...akasgBHEChannel,
        name: 'AKASG.AKBB.BHN',
        canonicalName: 'AKASG.AKBB.BHN',
        channelOrientationType: ChannelOrientationType.NORTH_SOUTH,
        channelOrientationCode: 'N'
      };

      const chan3 = cloneDeep(akasgBHNChannel);
      const chan4 = {
        ...akasgBHEChannel,
        name: 'AKASG.AKASG.BHE',
        canonicalName: 'AKASG.AKASG.BHE',
        channelOrientationType: ChannelOrientationType.EAST_WEST,
        channelOrientationCode: 'E'
      };

      const channels = [chan1, chan2, chan3, chan4];

      const viableRotationTemplate = cloneDeep(rotationTemplate);
      viableRotationTemplate.orientationAngleToleranceDeg = 90;
      viableRotationTemplate.inputChannels = channels.map(channel =>
        convertToEntityReference(channel, 'name')
      );

      const results = UiRotationProcessor.getChannelPairsToRotate(
        channels,
        akasg,
        viableRotationTemplate
      );

      expect(results[0][0].name).toBe('AKASG.AKBB.BHN');
      expect(results[0][1].name).toBe('AKASG.AKBB.BHE');
      expect(results).toHaveLength(1);
    });
    it('should use the rotationTemplate.inputChannelGroup to create pairs', () => {
      const chan1 = cloneDeep(akasgBHEChannel);
      const chan2 = {
        ...akasgBHEChannel,
        name: 'AKASG.AKBB.BHN',
        canonicalName: 'AKASG.AKBB.BHN',
        channelOrientationType: ChannelOrientationType.NORTH_SOUTH,
        channelOrientationCode: 'N'
      };

      const chan3 = cloneDeep(akasgBHNChannel);
      const chan4 = {
        ...akasgBHEChannel,
        name: 'AKASG.AKASG.BHE',
        canonicalName: 'AKASG.AKASG.BHE',
        channelOrientationType: ChannelOrientationType.EAST_WEST,
        channelOrientationCode: 'E'
      };

      const channels = [chan1, chan2, chan3, chan4];

      const viableRotationTemplate = cloneDeep(rotationTemplate);
      viableRotationTemplate.orientationAngleToleranceDeg = 90;
      viableRotationTemplate.inputChannels = undefined;
      viableRotationTemplate.inputChannelGroup = { name: chan1.processingMetadata?.CHANNEL_GROUP };

      const results = UiRotationProcessor.getChannelPairsToRotate(
        channels,
        akasg,
        viableRotationTemplate
      );

      expect(results[0][0].name).toBe('AKASG.AKBB.BHN');
      expect(results[0][1].name).toBe('AKASG.AKBB.BHE');
      expect(results).toHaveLength(1);
    });
    it('should use the station.allRawChannels to create pairs', () => {
      const chan1 = cloneDeep(akasgBHEChannel);
      const chan2 = {
        ...akasgBHEChannel,
        name: 'AKASG.AKBB.BHN',
        canonicalName: 'AKASG.AKBB.BHN',
        channelOrientationType: ChannelOrientationType.NORTH_SOUTH,
        channelOrientationCode: 'N'
      };

      const chan3 = cloneDeep(akasgBHNChannel);
      const chan4 = {
        ...akasgBHEChannel,
        name: 'AKASG.AKASG.BHE',
        canonicalName: 'AKASG.AKASG.BHE',
        channelOrientationType: ChannelOrientationType.EAST_WEST,
        channelOrientationCode: 'E'
      };

      const channels = [chan1, chan2, chan3, chan4];

      const viableRotationTemplate = cloneDeep(rotationTemplate);
      viableRotationTemplate.orientationAngleToleranceDeg = 90;
      viableRotationTemplate.inputChannels = undefined;
      viableRotationTemplate.inputChannelGroup = undefined;

      const station = {
        ...akasg,
        allRawChannels: channels
      };

      const results = UiRotationProcessor.getChannelPairsToRotate(
        channels,
        station,
        viableRotationTemplate
      );

      expect(results[0][0].name).toBe('AKASG.AKBB.BHN');
      expect(results[0][1].name).toBe('AKASG.AKBB.BHE');
      expect(results).toHaveLength(1);
    });
  });
});
