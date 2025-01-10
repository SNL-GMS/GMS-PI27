import type { ChannelSegmentTypes } from '@gms/common-model';
import { Displays } from '@gms/common-model';
import { act, renderHook } from '@testing-library/react-hooks';

import type { ReduxStoreType } from '../../../src/ts/app';
import {
  analystActions,
  commonActions,
  getStore,
  useDeselect,
  useDeselectAll
} from '../../../src/ts/app';
import { getTestReduxWrapper } from '../../test-util';

const waveformOneCSD: ChannelSegmentTypes.ChannelSegmentDescriptor = {
  channel: {
    name: 'waveform1',
    effectiveAt: 100
  },
  startTime: 1000,
  endTime: 2000,
  creationTime: 1000
};
describe('redux-selection-hooks', () => {
  let store: ReduxStoreType;
  beforeEach(() => {
    act(() => {
      store = getStore();
      store.dispatch(analystActions.setSelectedWaveforms([waveformOneCSD]));
      store.dispatch(analystActions.setSelectedSdIds(['sd1']));
      store.dispatch(analystActions.setSelectedEventIds(['event1']));
      store.dispatch(commonActions.setSelectedStationIds(['station1']));
    });
  });
  it('is exported', () => {
    expect(useDeselectAll).toBeDefined();
    expect(useDeselect).toBeDefined();
  });

  it('Can deselect all', () => {
    const { result } = renderHook(() => useDeselectAll(), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result).toBeDefined();
    result.current();
    expect(store.getState().app.common.selectedStationIds).toEqual([]);
    expect(store.getState().app.analyst.selectedEventIds).toEqual([]);
    expect(store.getState().app.analyst.selectedSdIds).toEqual([]);
    expect(store.getState().app.analyst.selectedWaveforms).toEqual([]);
  });
  it('Can deselect correctly in waveform display', () => {
    const { result } = renderHook(() => useDeselect(Displays.IanDisplays.WAVEFORM), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result).toBeDefined();
    result.current();
    expect(store.getState().app.common.selectedStationIds).toEqual([]);
    expect(store.getState().app.analyst.selectedEventIds).toEqual(['event1']);
    expect(store.getState().app.analyst.selectedSdIds).toEqual([]);
    expect(store.getState().app.analyst.selectedWaveforms).toEqual([]);
  });
  it('Can deselect correctly in events display', () => {
    const { result } = renderHook(() => useDeselect(Displays.IanDisplays.EVENTS), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result).toBeDefined();
    result.current();
    expect(store.getState().app.common.selectedStationIds).toEqual(['station1']);
    expect(store.getState().app.analyst.selectedEventIds).toEqual([]);
    expect(store.getState().app.analyst.selectedSdIds).toEqual(['sd1']);
    expect(store.getState().app.analyst.selectedWaveforms).toEqual([waveformOneCSD]);
  });
  it('Can deselect correctly in signal detection display', () => {
    const { result } = renderHook(() => useDeselect(Displays.IanDisplays.SIGNAL_DETECTIONS), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result).toBeDefined();
    result.current();
    expect(store.getState().app.common.selectedStationIds).toEqual(['station1']);
    expect(store.getState().app.analyst.selectedEventIds).toEqual(['event1']);
    expect(store.getState().app.analyst.selectedSdIds).toEqual([]);
    expect(store.getState().app.analyst.selectedWaveforms).toEqual([waveformOneCSD]);
  });
  it('Can deselect correctly in map display', () => {
    const { result } = renderHook(() => useDeselect(Displays.IanDisplays.MAP), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result).toBeDefined();
    result.current();
    expect(store.getState().app.common.selectedStationIds).toEqual([]);
    expect(store.getState().app.analyst.selectedEventIds).toEqual([]);
    expect(store.getState().app.analyst.selectedSdIds).toEqual([]);
    expect(store.getState().app.analyst.selectedWaveforms).toEqual([waveformOneCSD]);
  });
  it('Can deselect all when default', () => {
    const { result } = renderHook(() => useDeselect('notADisplay'), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result).toBeDefined();
    result.current();
    expect(store.getState().app.common.selectedStationIds).toEqual([]);
    expect(store.getState().app.analyst.selectedEventIds).toEqual([]);
    expect(store.getState().app.analyst.selectedSdIds).toEqual([]);
    expect(store.getState().app.analyst.selectedWaveforms).toEqual([]);
  });
});
