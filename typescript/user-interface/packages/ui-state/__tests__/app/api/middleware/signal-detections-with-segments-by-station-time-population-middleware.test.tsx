import {
  defaultStations,
  eventData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import type { AnalystWaveformTypes } from '../../../../src/ts/app';
import {
  analystActions,
  getStore,
  selectOpenIntervalName,
  selectSignalDetections,
  useAppSelector,
  waveformActions,
  waveformSlice,
  workflowActions
} from '../../../../src/ts/app';
import { getEventsWithDetectionsAndSegmentsByTimeQuery } from '../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time';
import { getSignalDetectionsWithSegmentsByStationAndTime } from '../../../../src/ts/app/api/data/signal-detection/get-signal-detections-segments-by-station-time';

const testMock = jest.fn();

// Certain dispatches may also kick off this query so it is mocked here to prevent testing issues
jest.mock('../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time'
  );
  return {
    ...actual,
    getEventsWithDetectionsAndSegmentsByTime: () => async () => {
      return new Promise(resolve => {
        resolve({
          type: getEventsWithDetectionsAndSegmentsByTimeQuery.typePrefix,
          payload: {
            events: [eventData],
            signalDetections: [],
            uiChannelSegments: []
          }
        });
      });
    }
  };
});

jest.mock(
  '../../../../src/ts/app/api/data/signal-detection/get-signal-detections-segments-by-station-time',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/data/signal-detection/get-signal-detections-segments-by-station-time'
    );
    return {
      ...actual,
      getSignalDetectionsWithSegmentsByStationAndTime: () => async () => {
        testMock();
        return new Promise(resolve => {
          resolve({
            type: getSignalDetectionsWithSegmentsByStationAndTime.typePrefix,
            payload: {
              signalDetections: [signalDetectionsData]
            }
          });
        });
      }
    };
  }
);

describe('Signal Detections with segments by station time population middleware', () => {
  it('will not run if an interval is not open', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    testMock.mockClear();
    const anotherValidDict: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};

    anotherValidDict.ned = { visibility: true, stationName: 'ned', isStationExpanded: false };
    act(() => {
      store.dispatch(waveformSlice.actions.setStationsVisibility(anotherValidDict));
    });
    await waitFor(() => {
      expect(testMock).not.toHaveBeenCalled();
    });
  });

  describe('will run if an interval is open', () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectSignalDetections), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    // setup state
    const validDict: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
    defaultStations.forEach(stationDefinition => {
      validDict[stationDefinition.name] = {
        visibility: true,
        stationName: stationDefinition.name,
        isStationExpanded: false
      };
    });
    act(() => {
      store.dispatch(workflowActions.setOpenIntervalName('Initial'));
      store.dispatch(waveformActions.setViewableInterval({ startTimeSecs: 0, endTimeSecs: 1 }));
      store.dispatch(waveformActions.setStationsVisibility(validDict));
    });

    beforeEach(() => {
      testMock.mockClear();
    });

    it('and a new interval is opened', async () => {
      act(() => {
        store.dispatch(workflowActions.setOpenIntervalName('TEST'));
        store.dispatch(waveformActions.setViewableInterval({ startTimeSecs: 1, endTimeSecs: 11 }));
      });

      expect(selectOpenIntervalName(store.getState())).toBe('TEST');
      await waitFor(() => {
        expect(testMock).toHaveBeenCalled();
      });
    });

    it('and station visibility changes', async () => {
      const anotherValidDict: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};

      anotherValidDict.ne = { visibility: true, stationName: 'ne', isStationExpanded: false };
      act(() => {
        store.dispatch(waveformSlice.actions.setStationsVisibility(anotherValidDict));
      });
      await waitFor(() => {
        expect(testMock).toHaveBeenCalled();
      });
    });

    it('but not if an arbitrary action is fired off', async () => {
      act(() => {
        store.dispatch(analystActions.setOpenEventId('TEST'));
      });
      await waitFor(() => {
        expect(testMock).not.toHaveBeenCalled();
      });
    });
  });
});
