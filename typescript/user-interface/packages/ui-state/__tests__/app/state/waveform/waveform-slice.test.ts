import type { CommonTypes, FilterTypes } from '@gms/common-model';
import { cascadeFilter, linearFilter } from '@gms/common-model/__tests__/__data__';
import { QCMaskTypes } from '@gms/common-model/lib/ui-configuration/types';
import { createAction } from '@reduxjs/toolkit';
import type * as Redux from 'redux';
import type { MockStore, MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState } from '../../../../src/ts/app/state/reducer';
import { waveformInitialState, waveformSlice } from '../../../../src/ts/app/state/waveform';
import type {
  StationVisibilityChangesDictionary,
  WaveformLoadingState
} from '../../../../src/ts/app/state/waveform/types';
import * as Util from '../../../../src/ts/app/state/waveform/util';
import type { AppState } from '../../../../src/ts/app/store';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<AppState, Redux.AnyAction> = createMockStore(middlewares);
let store: MockStore<AppState, Redux.AnyAction>;

describe('waveform slice', () => {
  describe('exists', () => {
    it('exists', () => {
      expect(waveformInitialState).toBeDefined();
      expect(waveformSlice).toBeDefined();
      expect(waveformInitialState).toMatchSnapshot();
    });
  });
  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(waveformSlice.reducer(undefined, createAction(''))).toEqual(waveformInitialState);
      expect(waveformSlice.reducer(undefined, createAction(''))).toEqual(waveformInitialState);
      expect(waveformSlice.reducer(waveformInitialState, createAction(''))).toEqual(
        waveformInitialState
      );
      expect(waveformSlice.reducer(waveformInitialState, createAction(''))).toEqual(
        waveformInitialState
      );
    });
  });
  describe('actions', () => {
    beforeEach(() => {
      store = mockStoreCreator({ app: initialState } as any);
    });

    it('should set the stations visibility', () => {
      const sDict: StationVisibilityChangesDictionary = {
        stationName: Util.newStationVisibilityChangesObject('stationName')
      };
      const action: Redux.AnyAction = {
        type: waveformSlice.actions.setStationsVisibility.type,
        payload: sDict
      };
      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual({
        ...waveformInitialState,
        stationsVisibility: sDict
      });
      expect(waveformSlice.actions.setStationsVisibility(sDict)).toEqual(action);
      store.dispatch(waveformSlice.actions.setStationsVisibility(sDict));
      const actions = store.getActions();
      expect(actions).toEqual([action]);
    });

    it('should set the viewable interval', () => {
      const viewableInterval: CommonTypes.TimeRange = {
        startTimeSecs: 1,
        endTimeSecs: 2
      };
      const action: Redux.AnyAction = {
        type: waveformSlice.actions.setViewableInterval.type,
        payload: viewableInterval
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual({
        ...waveformInitialState,
        viewableInterval
      });

      expect(waveformSlice.actions.setViewableInterval(viewableInterval)).toEqual(action);

      store.dispatch(waveformSlice.actions.setViewableInterval(viewableInterval));
      const actions = store.getActions();
      expect(actions).toEqual([action]);
    });

    it('should set the zoom interval', () => {
      const zoomInterval: CommonTypes.TimeRange = {
        startTimeSecs: 1,
        endTimeSecs: 2
      };
      const action: Redux.AnyAction = {
        type: waveformSlice.actions.setZoomInterval.type,
        payload: zoomInterval
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual({
        ...waveformInitialState,
        zoomInterval
      });

      expect(waveformSlice.actions.setZoomInterval(zoomInterval)).toEqual(action);

      store.dispatch(waveformSlice.actions.setZoomInterval(zoomInterval));
      const actions = store.getActions();
      expect(actions).toEqual([action]);
    });

    it('should set the waveform client loading state', () => {
      const waveformClientState: WaveformLoadingState = {
        isLoading: true,
        total: 2,
        completed: 1,
        percent: 50,
        description: 'Loading waveforms'
      };
      const action: Redux.AnyAction = {
        type: waveformSlice.actions.setWaveformClientLoadingState.type,
        payload: waveformClientState
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual({
        ...waveformInitialState,
        loadingState: waveformClientState
      });

      expect(waveformSlice.actions.setWaveformClientLoadingState(waveformClientState)).toEqual(
        action
      );

      store.dispatch(waveformSlice.actions.setWaveformClientLoadingState(waveformClientState));
      const actions = store.getActions();
      expect(actions).toEqual([action]);
    });

    it('should set should show time uncertainty', () => {
      const shouldShowTimeUncertainty = false;
      const action: Redux.AnyAction = {
        type: waveformSlice.actions.setShouldShowTimeUncertainty.type,
        payload: shouldShowTimeUncertainty
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual({
        ...waveformInitialState,
        shouldShowTimeUncertainty
      });

      expect(waveformSlice.actions.setShouldShowTimeUncertainty(shouldShowTimeUncertainty)).toEqual(
        action
      );

      store.dispatch(waveformSlice.actions.setShouldShowTimeUncertainty(shouldShowTimeUncertainty));
      const actions = store.getActions();
      expect(actions).toEqual([action]);
    });

    it('should toggle mask visibility', () => {
      const action: Redux.AnyAction = {
        type: waveformSlice.actions.toggleQcMaskVisibility.type
      };

      const maskVisibility: Record<string, boolean> = {};

      Object.values(QCMaskTypes).forEach(v => {
        maskVisibility[v] = false;
      });

      const toggledToTrue = {
        ...waveformInitialState,
        maskVisibility
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual(toggledToTrue);

      Object.values(QCMaskTypes).forEach(v => {
        maskVisibility[v] = true;
      });

      const toggledToFalse = {
        ...waveformInitialState,
        maskVisibility
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual(toggledToFalse);
    });

    it('should overwrite channel filters', () => {
      const channelFiltersRecord: Record<string, FilterTypes.Filter> = {
        FOO: linearFilter
      };

      const action: Redux.AnyAction = {
        type: waveformSlice.actions.setChannelFilters.type,
        payload: channelFiltersRecord
      };

      expect(waveformSlice.reducer(waveformInitialState, action)).toEqual({
        ...waveformInitialState,
        channelFilters: channelFiltersRecord
      });
    });

    it('should set a channels filter', () => {
      const channelFiltersRecord: Record<string, FilterTypes.Filter> = {
        FOO: linearFilter
      };

      const setupAction: Redux.AnyAction = {
        type: waveformSlice.actions.setChannelFilters.type,
        payload: channelFiltersRecord
      };

      const setAction: Redux.AnyAction = {
        type: waveformSlice.actions.setFilterForChannel.type,
        payload: { channelOrSdName: 'FOO', filter: cascadeFilter }
      };

      expect(waveformSlice.reducer(waveformInitialState, setupAction)).toEqual({
        ...waveformInitialState,
        channelFilters: channelFiltersRecord
      });

      expect(waveformSlice.reducer(waveformInitialState, setAction)).toEqual({
        ...waveformInitialState,
        channelFilters: { FOO: cascadeFilter }
      });
    });

    it('should clear channel filters', () => {
      const channelFiltersRecord: Record<string, FilterTypes.Filter> = {
        FOO: linearFilter
      };

      const setupAction: Redux.AnyAction = {
        type: waveformSlice.actions.setChannelFilters.type,
        payload: channelFiltersRecord
      };

      expect(waveformSlice.reducer(waveformInitialState, setupAction)).toEqual({
        ...waveformInitialState,
        channelFilters: channelFiltersRecord
      });

      const clearAction: Redux.AnyAction = {
        type: waveformSlice.actions.clearChannelFilters.type
      };

      expect(waveformSlice.reducer(waveformInitialState, clearAction)).toEqual({
        ...waveformInitialState,
        channelFilters: {}
      });
    });
  });
});
