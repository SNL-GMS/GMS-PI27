/* eslint-disable react/jsx-no-useless-fragment */
import { ConfigurationTypes } from '@gms/common-model';
import { renderHook } from '@testing-library/react-hooks';
import { produce } from 'immer';
import React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';

import {
  useCompleteEventSDColor,
  useDefaultInteractiveAnalysisStationGroup,
  useGetAllUiThemes,
  useLegibleColorsForEventAssociations,
  useMapStationDefaultColor,
  useMapVisibleStationColor,
  useOpenEventSDColor,
  useOtherEventSDColor,
  useTranslateAnalystConfigPropsToReduxProps,
  useUiTheme,
  useUnassociatedSDColor,
  useUnassociatedSignalDetectionLengthInMeters,
  useUpdateReduxWithConfigDefaults
} from '../../../src/ts/app/hooks/processing-analyst-configuration-hooks';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/app/store';
import { appState, getTestReduxWrapper } from '../../test-util';

const mockData: Partial<ConfigurationTypes.ProcessingAnalystConfiguration> = {
  defaultInteractiveAnalysisStationGroup: 'test',
  unassociatedSignalDetectionLengthMeters: 10,
  uiThemes: [
    {
      colors: ConfigurationTypes.defaultColorTheme,
      display: {
        edgeEventOpacity: 0.5,
        edgeSDOpacity: 0.2,
        predictionSDOpacity: 0.1
      },
      name: 'GMS Dark Theme'
    }
  ]
};

let data: any | null = {};

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = produce(appState, draft => {
        draft.app.events.displayedEventsConfiguration = {
          edgeEventsBeforeInterval: true,
          edgeEventsAfterInterval: true,
          eventsCompleted: false,
          eventsRemaining: false,
          eventsConflict: false,
          eventsDeleted: false,
          eventsRejected: false
        };
        draft.app.signalDetections.displayedSignalDetectionConfiguration = {
          syncWaveform: false,
          signalDetectionBeforeInterval: true,
          signalDetectionAfterInterval: true,
          signalDetectionAssociatedToOpenEvent: true,
          signalDetectionAssociatedToCompletedEvent: true,
          signalDetectionAssociatedToOtherEvent: true,
          signalDetectionConflicts: true,
          signalDetectionUnassociated: true,
          signalDetectionDeleted: false
        };
        draft.app.map.layerVisibility = {
          stations: true,
          sites: false,
          signalDetections: true,
          events: true,
          eventsRejected: false,
          eventsDeleted: false,
          preferredLocationSolution: true,
          edgeEventsBeforeInterval: true,
          edgeEventsAfterInterval: true,
          nonPreferredLocationSolution: false,
          confidenceEllipse: true,
          coverageEllipse: true,
          edgeDetectionBefore: true,
          edgeDetectionAfter: true,
          unassociatedDetection: true,
          associatedOpenDetection: true,
          associatedOtherDetection: true,
          associatedCompleteDetection: true,
          deletedDetection: false
        };
        draft.app.waveform.displayedSignalDetectionConfiguration = {
          signalDetectionBeforeInterval: true,
          signalDetectionAfterInterval: true,
          signalDetectionAssociatedToOpenEvent: true,
          signalDetectionAssociatedToCompletedEvent: true,
          signalDetectionAssociatedToOtherEvent: true,
          signalDetectionConflicts: true,
          signalDetectionUnassociated: true,
          signalDetectionDeleted: false
        };
      });

      return stateFunc(state);
    })
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
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data
      }))
    };
  }
);

jest.mock('../../../src/ts/app/api/user-manager/user-manager-api-slice', () => {
  const actual = jest.requireActual('../../../src/ts/app/api/user-manager/user-manager-api-slice');
  return {
    ...actual,
    useGetUserProfileQuery: jest.fn(() => ({
      data: { currentTheme: 'GMS Dark Theme' }
    }))
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('processing analyst configuration hooks', () => {
  it('exists', () => {
    expect(useUnassociatedSDColor).toBeDefined();
    expect(useCompleteEventSDColor).toBeDefined();
    expect(useOpenEventSDColor).toBeDefined();
    expect(useOtherEventSDColor).toBeDefined();
    expect(useUnassociatedSignalDetectionLengthInMeters).toBeDefined();
    expect(useDefaultInteractiveAnalysisStationGroup).toBeDefined();
    expect(useMapStationDefaultColor).toBeDefined();
    expect(useMapVisibleStationColor).toBeDefined();
    expect(useUiTheme).toBeDefined();
    expect(useGetAllUiThemes).toBeDefined();
    expect(useUpdateReduxWithConfigDefaults).toBeDefined();
  });

  it('can use default interactive analysis station group', () => {
    const store = getStore();

    function Component() {
      const result = useDefaultInteractiveAnalysisStationGroup();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use unassociated signal detection color', () => {
    const store = getStore();

    function Component() {
      const result = useUnassociatedSDColor();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use associated open signal detection color', () => {
    const store = getStore();

    function Component() {
      const result = useOpenEventSDColor();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use map default (non-visible) station color', () => {
    const store = getStore();

    function Component() {
      const result = useMapStationDefaultColor();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use visible station color', () => {
    const store = getStore();

    function Component() {
      const result = useMapVisibleStationColor();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use associated complete signal detection color', () => {
    const store = getStore();

    function Component() {
      const result = useCompleteEventSDColor();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use associated other signal detection color', () => {
    const store = getStore();

    function Component() {
      const result = useOtherEventSDColor();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use unassociated signal detection length in meters', () => {
    const store = getStore();

    function Component() {
      const result = useUnassociatedSignalDetectionLengthInMeters();
      return <>{result}</>;
    }

    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can use ui theme', () => {
    const store = getStore();

    function Component() {
      const [result] = useUiTheme();
      const resultString = JSON.stringify(result);
      return <>{resultString}</>;
    }
    data = undefined;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    data = mockData;

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('can retrieve all UI themes', () => {
    expect(useGetAllUiThemes()).toMatchSnapshot();
  });

  it('creates the expected custom css vars for our event association colors', () => {
    function Component() {
      const result = useLegibleColorsForEventAssociations();
      const resultString = JSON.stringify(result);
      return <>{resultString}</>;
    }
    expect(
      create(
        <Provider store={getStore()}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });

  it('useTranslateAnalystConfigPropsToReduxProps', () => {
    const store = getStore();

    const { result } = renderHook(() => useTranslateAnalystConfigPropsToReduxProps(), {
      wrapper: getTestReduxWrapper(store)
    });
    expect(result.current).toMatchSnapshot();
  });

  it('useUpdateReduxWithConfigDefaults', () => {
    const store = getStore();

    const { result } = renderHook(() => useUpdateReduxWithConfigDefaults(), {
      wrapper: getTestReduxWrapper(store)
    });

    expect(result.current).toMatchSnapshot();
  });
});
