import type { AnalystWaveformTypes } from '@gms/ui-state';
import { AnalystWaveformUtil, getStore, useAppDispatch, waveformActions } from '@gms/ui-state';
import { render, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import {
  useOnMultipleSelect,
  useRenderMapOnSelection
} from '../../../../../src/ts/components/common-ui/components/map/map-util';
import { data } from '../../../analyst-ui/components/station-properties/mock-station-data';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

jest.mock('@gms/ui-state', () => {
  const actualRedux = jest.requireActual('@gms/ui-state');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch
  };
});

const { station } = data;
const validMap: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
validMap[station.name] = AnalystWaveformUtil.newStationVisibilityChangesObject(station.name, true);
describe('Command Palette Component', () => {
  const expectuseRenderMapOnSelectionToCallFunc = async () => {
    const viewerRef: any = {
      current: {
        cesiumElement: {
          scene: {
            requestRender: jest.fn()
          }
        }
      }
    };

    function TestComponent() {
      useRenderMapOnSelection(viewerRef);
      return null;
    }

    const store = getStore();
    store.dispatch(waveformActions.setStationsVisibility(validMap));

    // Mounting may call the request, if React decides to run it soon.
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    await waitFor(() => {
      expect(viewerRef.current.cesiumElement.scene.requestRender).toHaveBeenCalledTimes(1);
    });
  };
  it('should be defined', () => {
    expect(useRenderMapOnSelection).toBeDefined();
  });
  // eslint-disable-next-line jest/expect-expect
  it('should call use effect ref', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expectuseRenderMapOnSelectionToCallFunc();
  });

  it('useOnMultipleSelect handles stations', () => {
    const retVal = {
      id: {
        id: 'station1',
        properties: { type: { getValue: jest.fn(() => 'Station') } }
      }
    };
    const ref: any = {
      current: {
        cesiumElement: {
          scene: {
            pick: jest.fn(() => {
              return retVal;
            })
          }
        }
      }
    };
    const selectedStations = ['station1'];
    const selectedEvents = ['event1'];
    const selectedSdIds = [];
    const { result } = renderHook(() =>
      useOnMultipleSelect(ref, selectedStations, selectedEvents, selectedSdIds)
    );
    expect(result).toBeDefined();
    act(() => {
      result.current({ position: 'fake position' });
    });
    expect(ref.current.cesiumElement.scene.pick).toHaveBeenCalledTimes(1);
    expect(retVal.id.properties.type.getValue).toHaveBeenCalledTimes(3);
    const mockDispatch = useAppDispatch();
    expect(useAppDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  test('useOnMultipleSelect handles events', () => {
    const retVal = {
      id: {
        id: 'event1',
        properties: { type: { getValue: jest.fn(() => 'Event location') } }
      }
    };
    const ref: any = {
      current: {
        cesiumElement: {
          scene: {
            pick: jest.fn(() => {
              return retVal;
            })
          }
        }
      }
    };
    const selectedStations = [];
    const selectedEvents = ['event1'];
    const selectedSdIds = [];
    const { result } = renderHook(() =>
      useOnMultipleSelect(ref, selectedStations, selectedEvents, selectedSdIds)
    );
    expect(result).toBeDefined();
    act(() => {
      result.current({ position: 'fake position' });
    });
    expect(ref.current.cesiumElement.scene.pick).toHaveBeenCalledTimes(1);
    expect(retVal.id.properties.type.getValue).toHaveBeenCalledTimes(3);
    const mockDispatch = useAppDispatch();
    expect(useAppDispatch).toHaveBeenCalledTimes(4);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  test('useOnMultipleSelect handles SDs', () => {
    const retVal = {
      id: {
        id: 'event1',
        properties: { type: { getValue: jest.fn(() => 'Signal detection') } }
      }
    };
    const ref: any = {
      current: {
        cesiumElement: {
          scene: {
            pick: jest.fn(() => {
              return retVal;
            })
          }
        }
      }
    };
    const selectedStations = [];
    const selectedEvents = ['event1'];
    const selectedSdIds = ['sd1'];
    const { result } = renderHook(() =>
      useOnMultipleSelect(ref, selectedStations, selectedEvents, selectedSdIds)
    );
    expect(result).toBeDefined();
    act(() => {
      result.current({ position: 'fake position' });
    });
    expect(ref.current.cesiumElement.scene.pick).toHaveBeenCalledTimes(1);
    expect(retVal.id.properties.type.getValue).toHaveBeenCalledTimes(3);
    const mockDispatch = useAppDispatch();
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(useAppDispatch).toHaveBeenCalledTimes(6);
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });
});
