import type { StationTypes } from '@gms/common-model';
import {
  defaultStations,
  eventData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { CheckboxSearchListTypes } from '@gms/ui-core-components';
import type { AnalystWaveformTypes, AppState } from '@gms/ui-state';
import { getStore, waveformSlice } from '@gms/ui-state';
import { predictFeaturesForEventLocationResponseData } from '@gms/ui-state/__tests__/__data__';
import { appState } from '@gms/ui-state/__tests__/test-util';
import type { PredictFeatures } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import { act, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { Provider } from 'react-redux';

import {
  useStationsVisibilityFromCheckboxState,
  useVisibleSignalDetections,
  useWaveformOffsets
} from '../../../../../src/ts/components/analyst-ui/components/waveform/waveform-hooks';
import { useQueryStateResult } from '../../../../__data__/test-util-data';

const featurePredictionsByEventLocation: PredictFeatures =
  predictFeaturesForEventLocationResponseData;

const stationDefinitions: StationTypes.Station[] = defaultStations;

const validDict: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};

defaultStations.forEach(stationDefinition => {
  validDict[stationDefinition.name] = {
    visibility: true,
    stationName: stationDefinition.name,
    isStationExpanded: false
  };
});

jest.mock('@gms/ui-state', () => {
  const actualRedux = jest.requireActual('@gms/ui-state');
  return {
    ...actualRedux,
    useAppDispatch: jest.fn(() => jest.fn()),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const stationsVisibility: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
      stationsVisibility.name = {
        visibility: true,
        stationName: 'station-name',
        isStationExpanded: false
      };
      const state: AppState = appState;
      const range = { startTimeSecs: 100, endTimeSecs: 200 };
      state.app.workflow.timeRange = range;
      state.app.workflow.openIntervalName = 'AL1';
      state.app.waveform.viewableInterval = range;
      state.app.waveform.stationsVisibility = stationsVisibility;
      state.app.common.selectedStationIds = ['station-name'];
      state.app.analyst.openEventId = eventData.id;
      state.app.analyst.phaseToAlignOn = 'P';
      state.app.analyst.alignWaveformsOn = AlignWaveformsOn.PREDICTED_PHASE;
      return stateFunc(state);
    }),
    useGetAllStationsQuery: () => ({ data: stationDefinitions }),
    useGetStationsWithChannelsQuery: () => ({ data: stationDefinitions }),
    useGetSignalDetections: jest.fn(() => ({
      data: signalDetectionsData,
      isLoading: false
    })),
    useEffectiveTime: () => 1,
    useGetEvents: () => ({ ...useQueryStateResult, data: [eventData] }),
    useRawChannels: () => stationDefinitions[0].allRawChannels,
    useAllStations: jest.fn(() => stationDefinitions),
    useWorkflowQuery: jest.fn(() => ({
      isSuccess: true,
      data: { stages: [{ name: 'Auto Network' }, { name: 'AL1' }] }
    })),
    usePredictFeaturesForEventLocation: jest.fn(() => ({
      isLoading: false,
      data: featurePredictionsByEventLocation
    })),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: {
        priorityPhases: ['P', 'S']
      }
    }))
  };
});

describe('waveform-hooks', () => {
  test('functions are defined', () => {
    expect(useStationsVisibilityFromCheckboxState).toBeDefined();
    expect(useWaveformOffsets).toBeDefined();
  });

  const expectUseStationsVisibilityFromCheckboxStateHookToMatchSnapshot = async () => {
    const getUpdatedCheckboxItemsList = jest.fn((): CheckboxSearchListTypes.CheckboxItem[] => {
      return [
        { name: 'name', id: 'name', checked: false },
        { name: 'name2', id: 'name2', checked: true }
      ];
    });

    function TestComponent() {
      const checkboxItemsList: CheckboxSearchListTypes.CheckboxItem[] = [
        { name: 'name', id: 'name', checked: true },
        { name: 'name2', id: 'name2', checked: true }
      ];
      const stationsVisibility: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
      stationsVisibility.name = {
        visibility: true,
        stationName: 'name',
        isStationExpanded: false
      };
      const setStationsVisibilityFromCheckboxState =
        useStationsVisibilityFromCheckboxState(checkboxItemsList);
      setStationsVisibilityFromCheckboxState(getUpdatedCheckboxItemsList);
      return null;
    }

    const store = getStore();
    store.dispatch(waveformSlice.actions.setStationsVisibility(validDict));

    // Mounting may call the request, if React decides to run it soon.
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await render(<TestComponent />, {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      });
    });

    expect(getUpdatedCheckboxItemsList).toHaveBeenCalledTimes(1);
  };
  it('useStationsVisibilityFromCheckboxState matches the snapshot', async () => {
    await expectUseStationsVisibilityFromCheckboxStateHookToMatchSnapshot();
    expect(useStationsVisibilityFromCheckboxState).toBeDefined();
  });

  describe('useWaveformOffsets', () => {
    it('builds offsets for the waveform display', () => {
      const store = getStore();
      store.dispatch(waveformSlice.actions.setStationsVisibility(validDict));

      const { result } = renderHook(() => useWaveformOffsets(), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current).toEqual({
        AKASG: 0,
        ASAR: 20924.798000097275,
        PDAR: -72,
        baseStationTime: 1663205700
      });
    });
  });

  describe('useVisibleSignalDetections', () => {
    it('shows visible signal detections when isSyncedToWaveformDisplay is true', () => {
      const store = getStore();
      store.dispatch(waveformSlice.actions.setStationsVisibility(validDict));
      store.dispatch(
        waveformSlice.actions.setZoomInterval({
          startTimeSecs: 1636503400,
          endTimeSecs: 1636503420
        })
      );

      const { result } = renderHook(() => useVisibleSignalDetections(true), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]).toEqual(signalDetectionsData[3]);
    });

    it('shows all signal detections when isSyncedToWaveformDisplay is false', () => {
      const store = getStore();
      store.dispatch(waveformSlice.actions.setStationsVisibility(validDict));

      const { result } = renderHook(() => useVisibleSignalDetections(false), {
        wrapper: (props: React.PropsWithChildren<unknown>) => (
          <Provider store={store}>{props.children}</Provider>
        )
      });
      expect(result.current.data).toEqual(signalDetectionsData);
    });
  });
});
