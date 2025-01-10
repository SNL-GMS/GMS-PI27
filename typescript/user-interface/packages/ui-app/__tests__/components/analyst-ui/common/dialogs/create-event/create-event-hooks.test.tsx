import type { CommonTypes } from '@gms/common-model';
import { MILLISECONDS_IN_SECOND } from '@gms/common-util';
import { getStore, waveformActions } from '@gms/ui-state';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import { useInitialEventDate } from '~analyst-ui/common/dialogs/create-event/create-event-hooks';

const store = getStore();

function TestReduxWrapper({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

describe('Create Event Hooks', () => {
  it('is defined', () => {
    expect(useInitialEventDate).toBeDefined();
  });

  describe('useInitialEventDate', () => {
    it('initial event date is undefined', () => {
      const { result } = renderHook(useInitialEventDate, { wrapper: TestReduxWrapper });

      expect(result.current).toBe(undefined);
    });

    it('initial event date is the viewableInterval startTime', () => {
      const viewableInterval: CommonTypes.TimeRange = {
        startTimeSecs: 100,
        endTimeSecs: 500
      };
      const zoomInterval: CommonTypes.TimeRange = {
        startTimeSecs: 0,
        endTimeSecs: 1000
      };
      store.dispatch(waveformActions.setViewableInterval(viewableInterval));
      store.dispatch(waveformActions.setZoomInterval(zoomInterval));

      const { result } = renderHook(useInitialEventDate, { wrapper: TestReduxWrapper });
      const expectedResult = new Date(viewableInterval.startTimeSecs * MILLISECONDS_IN_SECOND);
      expect(result.current).toEqual(expectedResult);
    });

    it('initial event date is the zoomInterval startTime', () => {
      const viewableInterval: CommonTypes.TimeRange = {
        startTimeSecs: 100,
        endTimeSecs: 500
      };
      const zoomInterval: CommonTypes.TimeRange = {
        startTimeSecs: 150,
        endTimeSecs: 1000
      };
      store.dispatch(waveformActions.setViewableInterval(viewableInterval));
      store.dispatch(waveformActions.setZoomInterval(zoomInterval));

      const { result } = renderHook(useInitialEventDate, { wrapper: TestReduxWrapper });
      const expectedResult = new Date(zoomInterval.startTimeSecs * MILLISECONDS_IN_SECOND);
      expect(result.current).toEqual(expectedResult);
    });

    it('initial event date is the viewableInterval endTime', () => {
      const viewableInterval: CommonTypes.TimeRange = {
        startTimeSecs: 100,
        endTimeSecs: 500
      };
      const zoomInterval: CommonTypes.TimeRange = {
        startTimeSecs: 600,
        endTimeSecs: 1000
      };
      store.dispatch(waveformActions.setViewableInterval(viewableInterval));
      store.dispatch(waveformActions.setZoomInterval(zoomInterval));

      const { result } = renderHook(useInitialEventDate, { wrapper: TestReduxWrapper });
      const expectedResult = new Date(viewableInterval.endTimeSecs * MILLISECONDS_IN_SECOND);
      expect(result.current).toEqual(expectedResult);
    });
  });
});
