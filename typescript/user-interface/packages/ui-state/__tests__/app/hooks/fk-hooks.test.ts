import type { ChannelTypes } from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes, FkTypes, StationTypes } from '@gms/common-model';
import {
  allRawChannels,
  defaultStations,
  eventData,
  PD01Channel,
  pd01ProcessingMask,
  PD02Channel,
  pdar,
  pdarSignalDetection,
  processingAnalystConfigurationData,
  processingMaskDefinition,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { act, renderHook } from '@testing-library/react-hooks';
import clone from 'lodash/clone';

import type { AppState, ComputeFkParams, CreateFKPreviewsUserInput } from '../../../src/ts/app';
import {
  dataInitialState,
  fksActions,
  getStore,
  selectFkChannelSegments,
  selectFkFrequencyThumbnails,
  useAppDispatch,
  useAppSelector,
  useComputeFk,
  useComputeFkAndBeam,
  useCreateFkPreviews,
  useFkSpectraTemplatesQuery,
  useGetDisplayedFkMeasuredValues,
  useGetFkChannelSegment,
  useGetFkData,
  useGetFkQueryStatus,
  useGetPeakFkAttributes,
  useMarkFkReviewed,
  useSetFkMeasuredValues
} from '../../../src/ts/app';
import * as computeFkOperations from '../../../src/ts/app/api/data/fk/compute-fk-operations';
import type { FkChannelSegmentRecord, FkFrequencyThumbnailRecord } from '../../../src/ts/types';
import {
  buildUiChannelSegmentRecordFromList,
  defaultPDARSpectraTemplate,
  defaultSpectraDefinition,
  defaultSpectraTemplate,
  fkInput,
  getTestFkChannelSegment,
  getTestFkData,
  unfilteredClaimCheckUiChannelSegment
} from '../../__data__';
import { appState, getTestReduxWrapper } from '../../test-util';
// import * as channelData from '../channel-definitions/channel-definitions-data';

const fkChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> =
  getTestFkChannelSegment(signalDetectionsData[0]);

const fkFrequencyThumbnail: FkTypes.FkFrequencyThumbnail = {
  fkSpectra: fkChannelSegment.timeseries[0],
  frequencyBand: {
    highFrequencyHz: fkInput.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz,
    lowFrequencyHz: fkInput.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz
  }
};
const fkThumbnailRecord: FkFrequencyThumbnailRecord = {};
fkThumbnailRecord[signalDetectionsData[0].id] = [fkFrequencyThumbnail];
const fkChannelSegmentRecord: FkChannelSegmentRecord = {};
fkChannelSegmentRecord[ChannelSegmentTypes.Util.createChannelSegmentString(fkChannelSegment.id)] =
  fkChannelSegment;

const dataInitialStateCopy = clone(dataInitialState);
dataInitialStateCopy.fkChannelSegments = fkChannelSegmentRecord;
dataInitialStateCopy.fkFrequencyThumbnails = fkThumbnailRecord;

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  const mockDispatchFunc = jest.fn().mockReturnValue({
    catch: jest.fn()
  });
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.app.userSession.authenticationStatus.userName = 'test';
      state.app.workflow.openIntervalName = 'AL1';
      state.app.workflow.openActivityNames = ['AL1 Event Review'];
      state.app.analyst.openEventId = eventData.id;
      state.app.workflow.timeRange = { startTimeSecs: 1669150800, endTimeSecs: 1669154400 };
      state.app.analyst.selectedSdIds = [signalDetectionsData[1].id];
      state.data = dataInitialStateCopy;
      return stateFunc(state);
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
    useChannels: jest.fn(() => allRawChannels)
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
      processingConfigurationApiSlice: {
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

jest.mock('../../../src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/hooks/processing-analyst-configuration-hooks'
  );
  return {
    ...actual,
    useProcessingAnalystConfiguration: jest.fn(() => processingAnalystConfigurationData)
  };
});

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useAllStations: jest.fn(() => defaultStations)
  };
});

jest.mock('../../../src/ts/app/hooks/channel-segment-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/channel-segment-hooks');
  return {
    ...actual,
    useVisibleChannelSegments: jest.fn(() => {
      // Adding two segments for same channel to exercise the merging of two
      // segments on the same channel (computeFk)
      return buildUiChannelSegmentRecordFromList(
        [PD01Channel.name, PD01Channel.name, PD02Channel.name],
        false
      );
    }),
    useGetStationRawUnfilteredUiChannelSegments: () => async () => Promise.resolve([])
  };
});
jest.mock('../../../src/ts/app/util/beamforming-util', () => {
  const actual = jest.requireActual('../../../src/ts/app/util/beamforming-util');
  return {
    ...actual,
    useCreateFkBeam: () => jest.fn()
  };
});

const mockCreateProcessingMasks = jest.fn(async () => {
  const mockChannelWithProcessingMask = {
    processingMasks: [pd01ProcessingMask],
    channel: {
      ...PD01Channel,
      processingDefinition: processingMaskDefinition
    }
  };
  return Promise.resolve(mockChannelWithProcessingMask);
});

jest.mock('../../../src/ts/app/util/ui-waveform-masking-util', () => {
  const actual = jest.requireActual('../../../src/ts/app/util/ui-waveform-masking-util');
  return {
    ...actual,
    useCreateProcessingMasksFromChannelSegment: () => mockCreateProcessingMasks
  };
});

const fkAttributes: FkTypes.FkAttributes = {
  peakFStat: 11.1391088585,
  receiverToSourceAzimuth: {
    value: 120.55096987354057,
    standardDeviation: 0.007000210384022968,
    units: CommonTypes.Units.DEGREES
  },
  slowness: {
    value: 13071.373483361533,
    standardDeviation: 1.597017531000969,
    units: CommonTypes.Units.SECONDS
  }
};

jest.mock('../../../src/ts/app/api/data/fk/compute-fk-operations', () => {
  const actual = jest.requireActual('../../../src/ts/app/api/data/fk/compute-fk-operations');
  return {
    ...actual,
    computeFk: jest.fn(async () => {
      const mockFkChannelSegment = getTestFkChannelSegment(signalDetectionsData[0]);
      return Promise.resolve(mockFkChannelSegment);
    }),
    getPeakFkAttributes: jest.fn(async () => {
      return Promise.resolve(fkAttributes);
    })
  };
});

describe('FK Hooks', () => {
  it('all hooks are defined', () => {
    expect(selectFkFrequencyThumbnails).toBeDefined();
    expect(selectFkChannelSegments).toBeDefined();
    expect(useFkSpectraTemplatesQuery).toBeDefined();
    expect(useMarkFkReviewed).toBeDefined();
    expect(useGetFkQueryStatus).toBeDefined();
    expect(useComputeFk).toBeDefined();
    expect(useSetFkMeasuredValues).toBeDefined();
    expect(useGetDisplayedFkMeasuredValues).toBeDefined();
    expect(useCreateFkPreviews).toBeDefined();
  });

  describe('fetch fk channel segment hooks', () => {
    it('can use fetch fk channel segments', () => {
      const { result } = renderHook(() => useAppSelector(selectFkChannelSegments));
      expect(result.current).toEqual(fkChannelSegmentRecord);
    });

    it('can use fetch fk frequency thumbnails', () => {
      const { result } = renderHook(() => useAppSelector(selectFkFrequencyThumbnails));
      expect(result.current).toEqual(fkThumbnailRecord);
    });

    it('can use mark fk reviewed', () => {
      const store = getStore();
      const { result } = renderHook(() => useMarkFkReviewed(), {
        wrapper: getTestReduxWrapper(store)
      });
      act(() => {
        expect(() => result.current(signalDetectionsData[0])).not.toThrow();
      });
    });
  });

  describe('useGetFkChannelSegment', () => {
    const store = getStore();
    const { result } = renderHook(() => useGetFkChannelSegment(), {
      wrapper: getTestReduxWrapper(store)
    });
    it('Returns fkChannelSegment', () => {
      expect(result.current(signalDetectionsData[0])).toBeDefined();
    });
  });

  describe('useGetFkData', () => {
    const store = getStore();
    const { result } = renderHook(() => useGetFkData(), {
      wrapper: getTestReduxWrapper(store)
    });
    it('Returns FkSpectra', () => {
      expect(result.current(signalDetectionsData[0])).toBeDefined();
    });
  });

  describe('useComputeFk', () => {
    const store = getStore();
    const { result } = renderHook(() => useComputeFk(), {
      wrapper: getTestReduxWrapper(store)
    });

    it('useComputeFk callback computes an FK', async () => {
      const startTime = 0;
      const endTime = 10000;
      const detectionTime = 5000;
      const processingMasksByChannel: FkTypes.ProcessingMasksByChannel[] = [
        {
          channel: PD01Channel,
          processingMasks: [pd01ProcessingMask]
        }
      ];
      const relativePositionByChannelMap: Record<string, ChannelTypes.RelativePosition> =
        pdar.relativePositionsByChannel;
      const params: ComputeFkParams = {
        fkSpectraTemplate: defaultSpectraTemplate,
        detectionTime,
        endTime,
        startTime,
        expandedTimeBufferSeconds: 0,
        fkSpectraDefinition: defaultSpectraDefinition,
        inputChannels: [PD01Channel],
        maskTaperDefinition: {
          taperLengthSamples: 100,
          taperFunction: FkTypes.TaperFunction.COSINE
        },
        processingMasksByChannel,
        signalDetection: signalDetectionsData[0],
        station: {
          name: 'PDAR',
          effectiveAt: 100,
          relativePositionsByChannel: relativePositionByChannelMap,
          type: StationTypes.StationType.SEISMIC_ARRAY
        } as StationTypes.Station,
        uiChannelSegmentsForProcessingMasks: [unfilteredClaimCheckUiChannelSegment]
      };
      await result.current(params);

      const spyComputeFk = jest.spyOn(computeFkOperations, 'computeFk');
      const expectedCalls = 1;

      // based on main fk compute and each preview frequency compute
      expect(spyComputeFk).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('useCreateFkPreviews', () => {
    const store = getStore();
    const { result } = renderHook(() => useCreateFkPreviews(), {
      wrapper: getTestReduxWrapper(store)
    });

    it('useCreateFkPreviews callback computes 9 thumbnails', async () => {
      const processingMasksByChannel: FkTypes.ProcessingMasksByChannel[] = [
        {
          channel: PD01Channel,
          processingMasks: [pd01ProcessingMask]
        }
      ];

      const relativePositionByChannelMap: Record<string, ChannelTypes.RelativePosition> =
        pdar.relativePositionsByChannel;

      const props: CreateFKPreviewsUserInput = {
        fkSpectraTemplate: defaultSpectraTemplate,
        fkSpectraDefinition: defaultSpectraDefinition,
        station: {
          name: 'PDAR',
          effectiveAt: 100,
          relativePositionsByChannel: relativePositionByChannelMap,
          type: StationTypes.StationType.SEISMIC_ARRAY
        } as StationTypes.Station,
        inputChannels: [PD01Channel],
        detectionTime: 200,
        uiChannelSegmentsForProcessingMasks: [unfilteredClaimCheckUiChannelSegment],
        processingMasksByChannel,
        maskTaperDefinition: {
          taperLengthSamples: 100,
          taperFunction: FkTypes.TaperFunction.COSINE
        },
        expandedTimeBufferSeconds: 2,
        signalDetectionId: signalDetectionsData[0].id
      };
      await result.current(props);

      const spyComputeFk = jest.spyOn(computeFkOperations, 'computeFk');
      const expectedCalls = 8;

      expect(spyComputeFk).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('useGetPeakFkAttributes', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    const store = getStore();
    const { result } = renderHook(() => useGetPeakFkAttributes(), {
      wrapper: getTestReduxWrapper(store)
    });

    it('useGetPeakFkAttributes callback finds the peak FK attributes in a FK', async () => {
      const arrivalTime = 1000;
      const fkSpectra = getTestFkData(arrivalTime);
      const results = await result.current(fkSpectra);
      expect(results).toEqual(fkAttributes);

      const expectedCalls = 1;
      const spyPeakFkAttributes = jest.spyOn(computeFkOperations, 'getPeakFkAttributes');
      expect(spyPeakFkAttributes).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('useComputeFkAndBeam', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    const store = getStore();
    const { result } = renderHook(() => useComputeFkAndBeam(), {
      wrapper: getTestReduxWrapper(store)
    });
    // Expected calls is 8 since there is 1 fk and 7 previews
    it('useGetPeakFkAttributes to call peak', async () => {
      await result.current(pdarSignalDetection, defaultPDARSpectraTemplate);
      const expectedCalls = 8;
      const spyPeakFkAttributes = jest.spyOn(computeFkOperations, 'getPeakFkAttributes');
      expect(spyPeakFkAttributes).toHaveBeenCalledTimes(expectedCalls);
    });
    it('useComputeFk to call to compute fk and previews', async () => {
      await result.current(pdarSignalDetection, defaultPDARSpectraTemplate);

      const expectedCalls = 8;
      const spyComputeFk = jest.spyOn(computeFkOperations, 'computeFk');
      expect(spyComputeFk).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('useSetFkMeasuredValues', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const store = getStore();
    const { result } = renderHook(() => useSetFkMeasuredValues(), {
      wrapper: getTestReduxWrapper(store)
    });

    it('sets a new measured value and computes an FK beam', () => {
      const mockDispatch = useAppDispatch();
      const mockMeasuredValue = { azimuth: 10, slowness: 10 };
      result.current(signalDetectionsData[0], mockMeasuredValue);

      expect(mockDispatch).toHaveBeenCalledWith(
        fksActions.setSignalDetectionMeasuredValue({
          signalDetectionId: signalDetectionsData[0].id,
          measuredValues: mockMeasuredValue
        })
      );
    });
  });
});
