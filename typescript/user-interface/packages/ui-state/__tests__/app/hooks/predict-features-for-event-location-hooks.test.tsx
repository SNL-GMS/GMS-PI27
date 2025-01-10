import type { StationTypes } from '@gms/common-model';
import {
  defaultStations,
  eventData,
  openIntervalName,
  processingAnalystConfigurationData,
  signalDetectionsData,
  user
} from '@gms/common-model/__tests__/__data__';
import { renderHook } from '@testing-library/react-hooks';
import produce from 'immer';
import { act } from 'react-dom/test-utils';

import {
  predictFeaturesForEventLocation,
  usePreCachePredictFeaturesForEventLocation
} from '../../../src/ts/app/api/data/event/predict-features-for-event-location';
import {
  prepareReceiverCollection,
  useCachePredictFeaturesForEventLocation,
  usePredictFeaturesForEventLocation,
  usePredictFeaturesForEventLocationQuery,
  usePredictFeaturesForEventLocationQueryHistory
} from '../../../src/ts/app/hooks/predict-features-for-event-location-hooks';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import { appState, getTestReduxWrapper } from '../../test-util';

jest.mock('lodash/defer', () => {
  return {
    defer: (func: (...args: any[]) => any): number => {
      func();
      return 1;
    }
  };
});

jest.mock('lodash', () => {
  const actual = jest.requireActual('lodash');
  return {
    ...actual,
    defer: (func: (...args: any[]) => any): number => {
      func();
      return 1;
    }
  };
});

jest.mock('../../../src/ts/app/hooks/channel-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/channel-hooks');
  return {
    ...actual,
    useRawChannels: jest.fn()
  };
});

jest.mock('../../../src/ts/app/hooks/event-manager-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/event-manager-hooks');
  return {
    ...actual,
    useGetEvents: jest.fn().mockReturnValue({
      data: [eventData],
      fulfilled: 0,
      isError: false,
      isLoading: false,
      pending: 0,
      rejected: 0
    })
  };
});

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  return {
    ...actual,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = produce(appState, draft => {
        draft.data.signalDetections = {
          [signalDetectionsData[1].id]: signalDetectionsData[1]
        };
        draft.data.events = {
          [eventData.id]: eventData
        };
        draft.app.userSession.authenticationStatus.userName = user;
        draft.app.workflow.openIntervalName = openIntervalName;
        draft.app.workflow.openActivityNames = ['AL1 Event Review'];
        draft.app.analyst.openEventId = eventData.id;
        draft.app.workflow.timeRange = { startTimeSecs: 1669150800, endTimeSecs: 1669154400 };
        draft.app.waveform.viewableInterval = {
          startTimeSecs: 1669150800,
          endTimeSecs: 1669154400
        };
        draft.app.analyst.selectedSdIds = [signalDetectionsData[1].id];
        draft.app.analyst.selectedEventIds = [eventData.id];
        draft.app.analyst.actionTargets.eventIds = [eventData.id];
      });
      return stateFunc(state);
    })
  };
});

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useAllStations: jest.fn(() => defaultStations),
    useVisibleStations: jest.fn(() => defaultStations)
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
      useGetProcessingMonitoringOrganizationConfigurationQuery: jest.fn(() => ({
        data: {
          monitoringOrganization: 'testOrg'
        }
      })),
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      }))
    };
  }
);

jest.mock('../../../src/ts/app/api/data/event/predict-features-for-event-location', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/data/event/predict-features-for-event-location'
  );
  return {
    ...actual,
    predictFeaturesForEventLocation: jest.fn(),
    usePreCachePredictFeaturesForEventLocation: jest.fn()
  };
});

describe('Predict features for event location hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is defined', () => {
    expect(prepareReceiverCollection).toBeDefined();
    expect(useCachePredictFeaturesForEventLocation).toBeDefined();
    expect(usePredictFeaturesForEventLocation).toBeDefined();
    expect(usePredictFeaturesForEventLocationQuery).toBeDefined();
    expect(usePredictFeaturesForEventLocationQueryHistory).toBeDefined();
  });

  test('prepareReceiverCollection', () => {
    const stationDefinitions: StationTypes.Station[] = defaultStations;
    expect(prepareReceiverCollection(stationDefinitions[1].allRawChannels, [])).toEqual([
      {
        receiverBandType: 'HIGH_BROADBAND',
        receiverLocationsByName: {
          'AKASG.AKASG.BHN': {
            depthKm: 0.035,
            elevationKm: 0.16,
            latitudeDegrees: 50.7012,
            longitudeDegrees: 29.2242
          },
          'AKASG.AKASG.BHZ': {
            depthKm: 0.035,
            elevationKm: 0.16,
            latitudeDegrees: 50.7012,
            longitudeDegrees: 29.2242
          },
          'AKASG.AKBB.BHE': {
            depthKm: 0.035,
            elevationKm: 0.16,
            latitudeDegrees: 50.7012,
            longitudeDegrees: 29.2242
          }
        }
      },
      {
        receiverLocationsByName: {}
      }
    ]);
  });

  test('usePredictFeaturesForEventLocation', () => {
    const store = getStore();

    renderHook(() => usePredictFeaturesForEventLocation(), {
      wrapper: getTestReduxWrapper(store)
    });

    expect(predictFeaturesForEventLocation).toHaveBeenCalledWith({
      phases: [
        'Iw',
        'Lg',
        'P',
        'PKP',
        'PKPab',
        'PKPbc',
        'PKPdf',
        'PcP',
        'Pg',
        'Pn',
        'Rg',
        'S',
        'ScP',
        'Sn',
        'pP',
        'sP'
      ],
      receivers: [
        {
          receiverLocationsByName: {
            AKASG: {
              depthKm: 0,
              elevationKm: 2.312,
              latitudeDegrees: 37.53,
              longitudeDegrees: 71.66
            },
            ASAR: {
              depthKm: 0,
              elevationKm: 2.312,
              latitudeDegrees: 37.53,
              longitudeDegrees: 71.66
            },
            PDAR: {
              depthKm: 0,
              elevationKm: 2.215,
              latitudeDegrees: 42.76738,
              longitudeDegrees: -109.5579
            }
          }
        }
      ],
      sourceLocation: {
        depthKm: 3.3,
        latitudeDegrees: 1.1,
        longitudeDegrees: 2.2,
        time: 3600
      }
    });
  });

  test('useCachePredictFeaturesForEventLocation', async () => {
    const store = getStore();

    await act(() => {
      renderHook(() => useCachePredictFeaturesForEventLocation(), {
        wrapper: getTestReduxWrapper(store)
      });
    });

    expect(usePreCachePredictFeaturesForEventLocation).toHaveBeenCalled();
  });
});
