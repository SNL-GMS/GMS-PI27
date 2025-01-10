/* eslint-disable react/jsx-props-no-spreading */
import type { CommonTypes } from '@gms/common-model';
import { UserProfileTypes } from '@gms/common-model';
import type { InteractiveAnalysisStageInterval } from '@gms/common-model/lib/workflow/types';
import { getStore } from '@gms/ui-state';
import { setAppAuthenticationStatus } from '@gms/ui-state/lib/app/state/operations';
import { act, fireEvent, render, screen } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { Provider } from 'react-redux';

import type { IntervalMenuProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/interval-menu';
import { IntervalMenu } from '../../../../../src/ts/components/analyst-ui/components/workflow/interval-menu';
import { useQueryStateResult } from '../../../../__data__/test-util-data';
import * as WorkflowDataTypes from './workflow-data-types';

const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 2000
};
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;
console.warn = jest.fn();
jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockUserProfile = {
    userId: '1',
    defaultAnalystLayoutName: 'default',
    currentTheme: 'GMS Dark Theme',
    workspaceLayouts: [
      {
        name: 'default',
        layoutConfiguration: 'test',
        supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
      }
    ]
  };
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useWorkflowQuery: jest.fn(),
    useStageIntervalsQuery: jest.fn(),
    processingConfigurationApiSlice: jest.fn(() => {
      return {
        endpoints: {
          getOperationalTimePeriodConfiguration: {
            select: () => {
              return [];
            }
          }
        }
      };
    }),
    useGetAllUiThemes: jest.fn(() => [{ name: 'dark' }]),
    useKeyboardShortcutsDisplayVisibility: jest.fn(() => ({ openKeyboardShortcuts: jest.fn() })),
    useUiTheme: jest.fn(() => {
      const currentTheme = {};
      const setUiTheme = jest.fn();
      return [currentTheme, setUiTheme];
    }),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    ),
    getProcessingAnalystConfiguration: jest.fn(() => {
      return { data: mockUserProfile };
    }),
    useGetUserProfileQuery: jest.fn(() => ({ data: mockUserProfile }))
  };
});
const store = getStore();
store.dispatch(
  setAppAuthenticationStatus({
    authenticated: true,
    authenticationCheckComplete: true,
    failedToConnect: false,
    userName: 'john'
  })
);

const props: IntervalMenuProps = {
  interval: WorkflowDataTypes.activityInterval,
  allActivitiesOpenForSelectedInterval: false,
  isSelectedInterval: false,
  closeCallback: null,
  openCallback: null
};

describe('Activity Interval Context Menu', () => {
  it('is exported', () => {
    expect(IntervalMenu).toBeDefined();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Provider store={store}>
        <IntervalMenu
          interval={WorkflowDataTypes.activityInterval}
          allActivitiesOpenForSelectedInterval
          isSelectedInterval
          closeCallback={null}
          openCallback={null}
        />
      </Provider>
    );
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('Interval context menu shallow renders', () => {
    const { container } = render(
      <Provider store={store}>
        <IntervalMenu {...props} />{' '}
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('Interval context menu shallow renders for active analyst', () => {
    const { container } = render(
      <Provider store={store}>
        <IntervalMenu
          {...props}
          interval={{
            ...WorkflowDataTypes.activityInterval,
            activeAnalysts: [...WorkflowDataTypes.activityInterval.activeAnalysts, 'john']
          }}
        />{' '}
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('Interval context menu shallow renders interactive analysis stage interval for active analyst', () => {
    const interactiveAnalysisStageInterval: InteractiveAnalysisStageInterval = {
      ...WorkflowDataTypes.interactiveAnalysisStageInterval,
      activityIntervals: [
        {
          ...WorkflowDataTypes.activityInterval,
          activeAnalysts: [...WorkflowDataTypes.activityInterval.activeAnalysts, 'john']
        }
      ]
    };

    const { container } = render(
      <Provider store={store}>
        <IntervalMenu {...props} interval={interactiveAnalysisStageInterval} />{' '}
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('handle buttons clicks for open disabled', async () => {
    const openCallbackFn = jest.fn();
    const closeCallbackFn = jest.fn();
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await render(
        <IntervalMenu
          interval={WorkflowDataTypes.activityInterval}
          allActivitiesOpenForSelectedInterval={false}
          isSelectedInterval
          openCallback={openCallbackFn}
          closeCallback={closeCallbackFn}
        />,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
    });

    expect(closeCallbackFn).toHaveBeenCalledTimes(0);
    fireEvent.click(await screen.findByText('Close interval'));
    expect(closeCallbackFn).toHaveBeenCalledTimes(1);

    // make sure we can't open the interval
    expect(openCallbackFn).toHaveBeenCalledTimes(0);
    fireEvent.click(await screen.findByText('Open interval'));
    expect(openCallbackFn).toHaveBeenCalledTimes(0);
  });
});

it('handle buttons clicks for open enabled', async () => {
  const openCallbackFn = jest.fn();
  const closeCallbackFn = jest.fn();
  await act(async () => {
    // wait for all the state calls to come back
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await render(
      <IntervalMenu
        interval={WorkflowDataTypes.activityInterval}
        allActivitiesOpenForSelectedInterval={false}
        isSelectedInterval={false}
        openCallback={openCallbackFn}
        closeCallback={closeCallbackFn}
      />,
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );
  });
  // make sure we can open the interval
  expect(openCallbackFn).toHaveBeenCalledTimes(0);
  fireEvent.click(await screen.findByText('Open interval'));
  expect(openCallbackFn).toHaveBeenCalledTimes(1);

  expect(closeCallbackFn).toHaveBeenCalledTimes(0);
  fireEvent.click(await screen.findByText('Close interval'));
  expect(closeCallbackFn).toHaveBeenCalledTimes(0);
});
