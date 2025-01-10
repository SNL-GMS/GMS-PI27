import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import type { AnalystWaveformTypes } from '../../../../src/ts/app';
import {
  addRawChannels,
  analystActions,
  getProcessingMaskDefinitionsQuery,
  getStore,
  selectEvents,
  useAppSelector,
  waveformSlice,
  workflowActions
} from '../../../../src/ts/app';
import { getEventsWithDetectionsAndSegmentsByTimeQuery } from '../../../../src/ts/app/api/data/event/get-events-detections-segments-by-time';
import { testChannel } from '../../../__data__/channel-data';

jest.mock(
  '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
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

const testMock = jest.fn();

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
          payload: {}
        });
      });
    }
  };
});

jest.mock(
  '../../../../src/ts/app/api/data/signal-enhancement/get-processing-mask-definitions',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/data/signal-enhancement/get-processing-mask-definitions'
    );
    return {
      ...actual,
      getProcessingMaskDefinitions: () => async () => {
        testMock();
        return new Promise(resolve => {
          resolve({
            type: getProcessingMaskDefinitionsQuery.typePrefix,
            payload: {}
          });
        });
      }
    };
  }
);

function setupState(store) {
  const validDict: AnalystWaveformTypes.StationVisibilityChangesDictionary = {};
  validDict.ARCES = { visibility: true, stationName: 'ARCES', isStationExpanded: false };
  act(() => {
    store.dispatch(waveformSlice.actions.setStationsVisibility(validDict));
    store.dispatch(addRawChannels([testChannel]));
    store.dispatch(
      workflowActions.setStationGroup({
        effectiveAt: 0,
        name: 'init',
        description: 'init'
      })
    );
  });
}

describe('Processing mask definition population middleware', () => {
  it('will not run if an arbitrary action is fired off', () => {
    const store = getStore();
    const { result } = renderHook(() => useAppSelector(selectEvents), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });

    act(() => {
      store.dispatch(analystActions.setOpenEventId('TEST'));
    });

    expect(Object.keys(result.current)).toHaveLength(0);
  });

  it('will run if a correct action is triggered and the processing config is set', async () => {
    const store = getStore();
    renderHook(() => useAppSelector(selectEvents), {
      wrapper: (props: React.PropsWithChildren<unknown>) => (
        <Provider store={store}>{props.children}</Provider>
      )
    });
    setupState(store);

    act(() => {
      store.dispatch(
        analystActions.setPhaseSelectorFavorites({
          listName: 'test',
          favorites: []
        })
      );
    });
    await waitFor(() => {
      expect(testMock).toHaveBeenCalled();
    });

    testMock.mockClear();

    act(() => {
      store.dispatch(analystActions.setCurrentPhase('P'));
    });

    await waitFor(() => {
      expect(testMock).toHaveBeenCalled();
    });
    testMock.mockClear();

    act(() => {
      store.dispatch(
        workflowActions.setStationGroup({
          effectiveAt: 0,
          name: 'test',
          description: 'test'
        })
      );
    });
    await waitFor(() => {
      expect(testMock).toHaveBeenCalled();
    });
    testMock.mockClear();

    act(() => {
      store.dispatch(addRawChannels([testChannel]));
    });

    await waitFor(() => {
      expect(testMock).toHaveBeenCalled();
    });
    testMock.mockClear();
  });
});
