/* eslint-disable react/jsx-no-useless-fragment */
import { CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { Units } from '@gms/common-model/lib/common/types';
import type { ArrivalTimeFeatureMeasurement } from '@gms/common-model/lib/signal-detection';
import { uuid } from '@gms/common-util';
import { renderHook } from '@testing-library/react-hooks';
import produce, { enableMapSet } from 'immer';
import type { WritableDraft } from 'immer/dist/internal';
import React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';

import { addSignalDetections } from '../../../src/ts/app';
import {
  useDetermineActionTargetsByType,
  useGetSignalDetections,
  useSetSelectedSdIds
} from '../../../src/ts/app/hooks/signal-detection-hooks';
import { workflowActions } from '../../../src/ts/app/state';
import { getStore } from '../../../src/ts/app/store';
import type { SignalDetectionWithSegmentsFetchResults } from '../../../src/ts/workers/waveform-worker/operations/fetch-signal-detections-segments-by-stations-time';
import { unfilteredClaimCheckUiChannelSegment } from '../../__data__';
import { expectHookToCallWorker } from '../../test-util';

const signalDetectionWithSegmentsFetchResults: SignalDetectionWithSegmentsFetchResults = {
  signalDetections: signalDetectionsData,
  uiChannelSegments: [unfilteredClaimCheckUiChannelSegment]
};

// Set first SD arrival to pre transformed since signalDetection fetch results is post transform
signalDetectionWithSegmentsFetchResults.signalDetections[0] = produce(
  signalDetectionWithSegmentsFetchResults.signalDetections[0],
  draft => {
    const fixedArrivalTimeFM: WritableDraft<ArrivalTimeFeatureMeasurement> =
      SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
        SignalDetectionTypes.Util.getCurrentHypothesis(draft.signalDetectionHypotheses)
          .featureMeasurements
      );
    fixedArrivalTimeFM.measurementValue = {
      arrivalTime: {
        value: 1546715054.2,
        standardDeviation: 1.162,
        units: CommonTypes.Units.SECONDS
      },
      travelTime: { value: 3, units: Units.COUNTS_PER_NANOMETER }
    };
  }
);

signalDetectionWithSegmentsFetchResults.signalDetections[2] = produce(
  signalDetectionWithSegmentsFetchResults.signalDetections[2],
  draft => {
    const fixedArrivalTimeFM: WritableDraft<ArrivalTimeFeatureMeasurement> =
      SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
        SignalDetectionTypes.Util.getCurrentHypothesis(draft.signalDetectionHypotheses)
          .featureMeasurements
      );
    fixedArrivalTimeFM.measurementValue = {
      arrivalTime: {
        value: 1546715054.2,
        standardDeviation: 1.162,
        units: CommonTypes.Units.SECONDS
      },
      travelTime: { value: 3, units: Units.COUNTS_PER_NANOMETER }
    };
  }
);

enableMapSet();
const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

// mock the uuid
uuid.asString = jest.fn().mockImplementation(() => '12345789');

jest.mock('worker-rpc', () => ({
  RpcProvider: jest.fn().mockImplementation(() => {
    // eslint-disable-next-line no-var
    var mockRpc = jest.fn(async () => {
      return new Promise(resolve => {
        resolve(signalDetectionWithSegmentsFetchResults);
      });
    });
    return { rpc: mockRpc };
  })
}));

jest.mock('../../../src/ts/app/hooks/workflow-hooks', () => {
  return {
    useStageId: jest.fn().mockReturnValue({
      startTime: 0,
      definitionId: {
        name: 'AL1'
      }
    })
  };
});

const mockedGetFilterDefinitionsForSignalDetections = jest.fn();

jest.mock(
  '../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/data/signal-detection/get-filter-definitions-for-signal-detections'
    );
    return {
      ...actual,
      getFilterDefinitionsForSignalDetections: () => mockedGetFilterDefinitionsForSignalDetections
    };
  }
);

const mockFetchDefaultFilterDefinitionsForSignalDetectionHypotheses = jest.fn();

jest.mock(
  '../../../src/ts/workers/api/fetch-default-filter-definitions-for-signal-detection-hypotheses',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/workers/api/fetch-default-filter-definitions-for-signal-detection-hypotheses'
    );
    return {
      ...actual,
      fetchDefaultFilterDefinitionsForSignalDetectionHypotheses: () =>
        mockFetchDefaultFilterDefinitionsForSignalDetectionHypotheses()
    };
  }
);

const mockUseSetSelectedSdIds = jest.fn();

jest.mock('../../../src/ts/app/hooks/signal-detection-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/signal-detection-hooks');
  return {
    ...actual,
    useSetSelectedSdIds: jest.fn(() => mockUseSetSelectedSdIds)
  };
});

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const now = 1234567890 / 1000;
const timeRange: CommonTypes.TimeRange = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  startTimeSecs: now - 3600,
  endTimeSecs: now
};

describe('signal detection hooks', () => {
  describe('useGetSignalDetections', () => {
    const store = getStore();

    it('exists', () => {
      expect(useGetSignalDetections).toBeDefined();
    });

    it('calls useGetSignalDetections', async () => {
      const useTestHook = () => useGetSignalDetections();
      const result = await expectHookToCallWorker(useTestHook);
      expect(result).toMatchSnapshot();
    });

    it('calls useDetermineActionTargetsByType', async () => {
      const useTestHook = () => useDetermineActionTargetsByType();
      const result = await expectHookToCallWorker(useTestHook);
      expect(result).toMatchSnapshot();
    });

    it('hook query for signal detections for current stations with initial state', () => {
      function Component() {
        const result = useGetSignalDetections();
        return <>{result.data}</>;
      }

      expect(
        create(
          <Provider store={store}>
            <Component />
          </Provider>
        ).toJSON()
      ).toMatchSnapshot();
    });

    it('hook query for signal detections for current stations', () => {
      store.dispatch(workflowActions.setTimeRange(timeRange));
      store.dispatch(addSignalDetections(signalDetectionsData));

      function Component() {
        const result = useGetSignalDetections();
        return <>{result.data}</>;
      }

      expect(
        create(
          <Provider store={store}>
            <Component />
          </Provider>
        ).toJSON()
      ).toMatchSnapshot();
    });

    it('hook query for signal detections', () => {
      store.dispatch(workflowActions.setTimeRange(timeRange));

      function Component() {
        const result = useGetSignalDetections();
        return <>{result.data}</>;
      }

      expect(
        create(
          <Provider store={store}>
            <Component />
          </Provider>
        ).toJSON()
      ).toMatchSnapshot();

      expect(
        create(
          <Provider store={store}>
            <Component />
          </Provider>
        ).toJSON()
      ).toMatchSnapshot();
    });
  });

  describe('useSetSelectedSdIds', () => {
    it('exists', () => {
      expect(useSetSelectedSdIds).toBeDefined();
    });

    it('adds a selected sd id to store', () => {
      const store = getStore();

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useSetSelectedSdIds(), {
        wrapper: Wrapper
      });
      result.current([signalDetectionsData[0].id]);

      expect(mockUseSetSelectedSdIds).toHaveBeenCalledTimes(1);
      expect(mockUseSetSelectedSdIds).toHaveBeenCalledWith([signalDetectionsData[0].id]);
    });
  });
});
