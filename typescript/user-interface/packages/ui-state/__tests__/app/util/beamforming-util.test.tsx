import { convertToEntityReference, SignalDetectionTypes, StationTypes } from '@gms/common-model';
import {
  akasgBHEChannel,
  akasgBHNChannel,
  akasgBHZChannel,
  allRawChannels,
  allSHZRawChannels,
  asar,
  asarAS01Channel,
  defaultStations,
  eventBeamformingTemplate,
  eventData,
  eventDataNoAssocSD,
  fkBeamformingTemplate,
  openIntervalName,
  PD01Channel,
  processingAnalystConfigurationData,
  signalDetectionAsarFkBeams,
  signalDetectionsRecord,
  workflowDefinitionId
} from '@gms/common-model/__tests__/__data__';
import type { BeamformingTemplatesByStationByPhase } from '@gms/common-model/lib/beamforming-templates/types';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import { renderHook } from '@testing-library/react-hooks';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { type AppState, inputChannelsByPrioritization } from '../../../src/ts/app';
import * as BeamformingUtil from '../../../src/ts/app/util/beamforming-util';
import * as BeamProcessor from '../../../src/ts/app/util/ui-beam-processor';
import { getTestFkData } from '../../__data__';
import { appState, getTestReduxWrapper } from '../../test-util';

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useVisibleStations: jest.fn(() => {
      return defaultStations;
    })
  };
});

jest.mock('../../../src/ts/app/hooks/signal-detection-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/signal-detection-hooks');
  return {
    ...actual,
    useSignalDetections: jest.fn(() => {
      return signalDetectionsRecord;
    })
  };
});

jest.mock('../../../src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/hooks/processing-analyst-configuration-hooks'
  );
  return {
    ...actual,
    useProcessingAnalystConfiguration: jest.fn(() => processingAnalystConfigurationData)
  };
});

jest.mock('../../../src/ts/app/hooks/predict-features-for-event-location-hooks', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/hooks/predict-features-for-event-location-hooks'
  );
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/require-await
    usePredictFeaturesForEventLocationFunction: jest.fn(() => async () => {
      const receiverLocationsByName = [];
      defaultStations.forEach((station: StationTypes.Station) => {
        receiverLocationsByName[station.name] = {
          featurePredictions: [
            {
              phase: 'P',
              predictionType: SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME,
              predictionValue: { predictedValue: { arrivalTime: { value: 0 } } }
            },
            {
              phase: 'P',
              predictionType: SignalDetectionTypes.FeatureMeasurementType.SLOWNESS,
              predictionValue: { predictedValue: { measuredValue: { value: 1 } } }
            },
            {
              phase: 'P',
              predictionType:
                SignalDetectionTypes.FeatureMeasurementType.RECEIVER_TO_SOURCE_AZIMUTH,
              predictionValue: { predictedValue: { measuredValue: { value: 2 } } }
            }
          ]
        };
      });
      return { receiverLocationsByName };
    })
  };
});

jest.mock('../../../src/ts/app/hooks/beamforming-template-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/beamforming-template-hooks');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/require-await
    useFetchBeamformingTemplatesQueryFunction: jest.fn(() => async (beamType: BeamType) => {
      const data: BeamformingTemplatesByStationByPhase = {};
      defaultStations.forEach((station: StationTypes.Station) => {
        const beamformingTemplate =
          beamType === BeamType.EVENT ? eventBeamformingTemplate : fkBeamformingTemplate;
        data[station.name] = {
          P: {
            ...beamformingTemplate,
            inputChannels: station.allRawChannels,
            station
          }
        };
      });
      return data;
    })
  };
});

jest.mock('../../../src/ts/app/hooks/channel-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/channel-hooks');
  return {
    ...actual,
    useRawChannels: jest.fn(() => {
      return allRawChannels;
    }),
    useChannels: jest.fn(() => defaultStations)
  };
});

jest.mock('../../../src/ts/app/hooks/fk-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/channel-hooks');
  return {
    ...actual,
    useGetFkData: jest.fn(() => () => {
      return getTestFkData(1000);
    })
  };
});

jest.mock('../../../src/ts/app/hooks/signal-enhancement-configuration-hooks', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/hooks/signal-enhancement-configuration-hooks'
  );
  return {
    ...actual,
    useFindFilterByUsage: jest.fn(() => jest.fn())
  };
});

jest.mock('../../../src/ts/app/hooks/workflow-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/workflow-hooks');
  return {
    ...actual,
    useStageId: () => workflowDefinitionId
  };
});

jest.mock('../../../src/ts/app/hooks/channel-segment-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/channel-segment-hooks');
  return {
    ...actual,
    useFetchUiChannelSegmentsForChannelTimeRange: () => async () => Promise.resolve([]),
    useGetStationRawUnfilteredUiChannelSegments: () => async () => Promise.resolve([])
  };
});

const mockCreateProcessingMasks = jest.fn();

jest.mock('../../../src/ts/app/util/ui-waveform-masking-util', () => {
  const actual = jest.requireActual('../../../src/ts/app/util/ui-waveform-masking-util');
  return {
    ...actual,
    useCreateProcessingMasks: () => mockCreateProcessingMasks
  };
});

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});

describe('beamforming-utils', () => {
  const mockAppState = {
    ...appState,
    app: {
      ...appState.app,
      analyst: {
        ...appState.app.analyst,
        currentPhase: 'P',
        openEventId: eventDataNoAssocSD.id
      },
      workflow: {
        ...appState.app.workflow,
        openIntervalName: 'openIntervalName',
        timeRange: { startTimeSecs: 0, endTimeSecs: 100 }
      }
    },
    data: {
      ...appState.data,
      events: {
        [eventDataNoAssocSD.id]: eventDataNoAssocSD
      }
    }
  };

  describe('generateBeamDefinition', () => {
    it('is defined', () => {
      expect(BeamformingUtil.generateBeamDefinition).toBeDefined();
    });
  });

  describe('useCreatePreconfiguredEventBeams', () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(mockAppState);

    it('is defined', () => {
      expect(BeamformingUtil.useCreatePreconfiguredEventBeams).toBeDefined();
    });

    it('returns a valid result when called', async () => {
      const maskAndBeamWaveformsSpy = jest
        .spyOn(BeamProcessor, 'maskAndBeamWaveforms')
        .mockImplementation(async () => {
          return Promise.resolve(undefined as any);
        }); // spy on fn

      const expectedStartTime = -5;
      const expectedEndTime = 295;

      // expected values based on mock channel data.
      const expectedParams = {
        beamDefinition: {
          beamDescription: eventBeamformingTemplate.beamDescription,
          beamParameters: {
            eventHypothesis: { id: eventDataNoAssocSD?.overallPreferred?.id },
            orientationAngles: { horizontalAngleDeg: -1, verticalAngleDeg: 0 },
            receiverToSourceAzimuthDeg: 2,
            sampleRateHz: 20,
            minWaveformsToBeam: eventBeamformingTemplate.minWaveformsToBeam,
            orientationAngleToleranceDeg: eventBeamformingTemplate.orientationAngleToleranceDeg,
            sampleRateToleranceHz: eventBeamformingTemplate.sampleRateToleranceHz,
            slownessSecPerDeg: 1
          }
        },
        beamStartTime: expectedStartTime,
        beamEndTime: expectedEndTime,
        station: defaultStations[0],
        channels: defaultStations[0].allRawChannels,
        channelSegments: [],
        createProcessingMasks: mockCreateProcessingMasks,
        expandedTimeBuffer: 60,
        currentInterval: {
          endTimeSecs: 100,
          startTimeSecs: 0
        }
      };

      const { result } = renderHook(() => BeamformingUtil.useCreatePreconfiguredEventBeams(), {
        wrapper: getTestReduxWrapper(store)
      });
      await result.current([defaultStations[0]]);
      expect(maskAndBeamWaveformsSpy).toHaveBeenCalledWith(expectedParams);
    });
  });

  describe('useCreateFkBeam', () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(mockAppState);

    it('is defined', () => {
      expect(BeamformingUtil.useCreateFkBeam).toBeDefined();
    });

    it('returns a valid result when called', async () => {
      const maskAndBeamWaveformsSpy = jest
        .spyOn(BeamProcessor, 'maskAndBeamWaveforms')
        .mockImplementation(async () => {
          return Promise.resolve(undefined as any);
        }); // spy on fn

      const { result } = renderHook(() => BeamformingUtil.useCreateFkBeam(), {
        wrapper: getTestReduxWrapper(store)
      });
      const channelEntityRef = convertToEntityReference(asarAS01Channel, 'name');
      await result.current(
        signalDetectionAsarFkBeams[0],
        { azimuth: 10, slowness: 1 },
        asar,
        [channelEntityRef],
        []
      );
      expect(maskAndBeamWaveformsSpy).toMatchSnapshot();
    });
  });

  describe('useCreateEventBeams', () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
    const store = mockStoreCreator(mockAppState);

    it('is defined', () => {
      expect(BeamformingUtil.useCreateEventBeams).toBeDefined();
    });

    it('returns a valid result when called', async () => {
      const maskAndBeamWaveformsSpy = jest
        .spyOn(BeamProcessor, 'maskAndBeamWaveforms')
        .mockImplementation(async () => {
          return Promise.resolve(undefined as any);
        }); // spy on fn

      const expectedStartTime = -1;
      const expectedEndTime = 4;

      const newBeamDescription = {
        ...eventBeamformingTemplate.beamDescription,
        beamSummation: 'RMS',
        samplingType: 'INTERPOLATED'
      };

      // expected values based on mock channel data.
      const expectedParams = {
        beamDefinition: {
          beamDescription: newBeamDescription,
          beamParameters: {
            eventHypothesis: { id: eventDataNoAssocSD?.overallPreferred?.id },
            orientationAngles: { horizontalAngleDeg: -1, verticalAngleDeg: 0 },
            receiverToSourceAzimuthDeg: 2,
            sampleRateHz: 20,
            minWaveformsToBeam: eventBeamformingTemplate.minWaveformsToBeam,
            orientationAngleToleranceDeg: eventBeamformingTemplate.orientationAngleToleranceDeg,
            sampleRateToleranceHz: eventBeamformingTemplate.sampleRateToleranceHz,
            slownessSecPerDeg: 1
          }
        },
        beamStartTime: expectedStartTime,
        beamEndTime: expectedEndTime,
        station: defaultStations[0],
        channels: defaultStations[0].allRawChannels,
        channelSegments: [],
        createProcessingMasks: mockCreateProcessingMasks,
        expandedTimeBuffer: 60,
        currentInterval: {
          endTimeSecs: 100,
          startTimeSecs: 0
        }
      };

      const { result } = renderHook(() => BeamformingUtil.useCreateEventBeams(), {
        wrapper: getTestReduxWrapper(store)
      });
      await result.current({
        phase: 'P',
        summationMethod: 'RMS',
        samplingMethod: 'INTERPOLATED',
        arrivalTimeLead: 1,
        beamDuration: 5,
        preFilter: undefined,
        selectedStations: [defaultStations[0]]
      });
      expect(maskAndBeamWaveformsSpy).toHaveBeenCalledWith(expectedParams);
    });
  });

  describe('filterStationsForCreateEventBeams', () => {
    it('is defined', () => {
      expect(BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams).toBeDefined();
    });

    it('should handle empty stations and channels', () => {
      expect(
        BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams(
          [],
          [],
          [],
          signalDetectionsRecord,
          eventData,
          openIntervalName,
          'P'
        )
      ).toStrictEqual([[], [], false, false, null]);
    });

    it('should filter out any stations which are not arrays', () => {
      expect(
        BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams(
          defaultStations,
          [],
          [],
          signalDetectionsRecord,
          eventData,
          openIntervalName,
          'P'
        )
      ).toStrictEqual([
        [defaultStations[0]],
        [],
        true,
        true,
        {
          details:
            'These selected stations already have associated signal detections for phase P or are non-array stations: AKASG, ASAR.',
          summary: 'Skipping event beam computation'
        }
      ]);
    });

    it('should filter out any stations which already have an associated Signal Detection', () => {
      // Setting it to a Hydroacoustic array so it doesn't get filtered out by the array check.
      const modifiedStation = { ...asar, type: StationTypes.StationType.HYDROACOUSTIC_ARRAY };
      const stations = BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams(
        [modifiedStation],
        [],
        [],
        signalDetectionsRecord,
        eventData,
        openIntervalName,
        'P'
      );
      expect(stations).toStrictEqual([
        [],
        [],
        true,
        false,
        {
          details: 'All selected stations already have associated signal detections for phase P.',
          summary: 'No valid stations for event beaming',
          intent: 'danger'
        }
      ]);
    });

    it('should filter out any stations and channels which already have an associated Signal Detection', () => {
      // Setting it to a Hydroacoustic array so it doesn't get filtered out by the array check.
      const modifiedStation = { ...asar, type: StationTypes.StationType.HYDROACOUSTIC_ARRAY };
      const stations = BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams(
        [modifiedStation],
        [akasgBHEChannel, akasgBHNChannel, akasgBHZChannel],
        [],
        signalDetectionsRecord,
        eventData,
        openIntervalName,
        'P'
      );
      expect(stations).toStrictEqual([
        [],
        [],
        true,
        false,
        {
          details: 'All selected stations already have associated signal detections for phase P.',
          summary: 'No valid stations for event beaming',
          intent: 'danger'
        }
      ]);
    });

    it('should filter out any non array stations', () => {
      // Setting it to a Hydroacoustic array so it doesn't get filtered out by the array check.
      const modifiedStation = { ...asar, type: StationTypes.StationType.HYDROACOUSTIC_ARRAY };
      const stations = BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams(
        [modifiedStation],
        [],
        [],
        signalDetectionsRecord,
        eventData,
        openIntervalName,
        'S'
      );
      expect(stations).toStrictEqual([[modifiedStation], [], false, false, null]);
    });
  });

  it('should filter out any non array stations and channels', () => {
    // Setting it to a SEISMIC_3_COMPONENT array so it does get filtered out by the array check.
    const modifiedStation = { ...asar, type: StationTypes.StationType.SEISMIC_3_COMPONENT };
    const stations = BeamformingUtil.filterSelectedStationsAndChannelsForCreateEventBeams(
      [modifiedStation],
      [akasgBHEChannel, akasgBHNChannel, akasgBHZChannel],
      [],
      signalDetectionsRecord,
      eventData,
      openIntervalName,
      'PKPdf'
    );
    expect(stations).toStrictEqual([
      [],
      [],
      false,
      true,
      {
        details: 'All selected stations are non-array stations.',
        summary: 'No valid stations for event beaming',
        intent: 'danger'
      }
    ]);
  });

  describe('beamformingInputChannelsByPrioritization', () => {
    it('is defined', () => {
      expect(inputChannelsByPrioritization).toBeDefined();
    });

    it('should filter out channels by top priority SHZ', () => {
      expect(
        inputChannelsByPrioritization(allRawChannels, ['SHZ', 'BHZ', 'MHZ', 'HHZ', 'EHZ'], 2)
      ).toStrictEqual(allSHZRawChannels);
    });

    it('should filter out channels by second priority BHZ', () => {
      expect(
        inputChannelsByPrioritization(
          [akasgBHEChannel, akasgBHNChannel, akasgBHZChannel, akasgBHZChannel],
          ['SHZ', 'BHZ', 'MHZ', 'HHZ', 'EHZ'],
          2
        )
      ).toStrictEqual([akasgBHZChannel, akasgBHZChannel]);
    });
    it('should filter out channels by third priority BHZ', () => {
      expect(
        inputChannelsByPrioritization(
          [
            PD01Channel,
            akasgBHEChannel,
            akasgBHEChannel,
            akasgBHNChannel,
            akasgBHZChannel,
            akasgBHZChannel
          ],
          ['SHZ', 'BHN', 'BHZ', 'HHZ', 'EHZ'],
          2
        )
      ).toStrictEqual([akasgBHZChannel, akasgBHZChannel]);
    });
    it('should return an empty list since not enough channels could be found', () => {
      expect(
        inputChannelsByPrioritization(
          [akasgBHEChannel, akasgBHNChannel, akasgBHZChannel],
          ['SHZ', 'BHZ', 'MHZ', 'HHZ', 'EHZ'],
          2
        )
      ).toStrictEqual([]);
    });

    it('should return an empty list since no priority found', () => {
      expect(
        inputChannelsByPrioritization(
          [akasgBHEChannel, akasgBHNChannel],
          ['SHZ', 'BHZ', 'MHZ', 'HHZ', 'EHZ'],
          2
        )
      ).toStrictEqual([]);
    });
  });
});
