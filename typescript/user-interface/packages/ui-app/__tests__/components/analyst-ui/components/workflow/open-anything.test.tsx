import { WorkflowTypes } from '@gms/common-model';
import { FORTY_FIVE_DAYS_IN_SECONDS } from '@gms/common-util';
import type { OperationalTimePeriodConfigurationQuery } from '@gms/ui-state';
import { getStore } from '@gms/ui-state';
import { act, fireEvent, render, screen } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import { OpenAnythingDialog } from '../../../../../src/ts/components/analyst-ui/components/workflow/open-anything-dialog';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { useQueryStateResult } from '../../../../__data__/test-util-data';
import { glContainer } from './gl-container';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const MOCK_TIME = 1609506000000;

const operationalTimePeriodConfigurationQuery: OperationalTimePeriodConfigurationQuery =
  cloneDeep(useQueryStateResult);

operationalTimePeriodConfigurationQuery.data = {
  operationalPeriodStart: FORTY_FIVE_DAYS_IN_SECONDS,
  operationalPeriodEnd: 0
};

jest.mock('@gms/ui-state', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  ...(jest.requireActual('@gms/ui-state') as any),
  useWorkflowQuery: jest.fn(() => ({
    ...cloneDeep(useQueryStateResult),
    data: {
      stages: [
        {
          name: 'mockStage',
          mode: WorkflowTypes.StageMode.INTERACTIVE,
          activities: [{ stationGroup: { name: 'mockStationGroup' } }]
        },
        {
          name: 'mockStage2',
          mode: WorkflowTypes.StageMode.AUTOMATIC,
          activities: [{ stationGroup: { name: 'mockStationGroup2' } }]
        },
        {
          name: 'mockStage3',
          mode: WorkflowTypes.StageMode.INTERACTIVE,
          activities: [{ stationGroup: { name: 'mockStationGroup3' } }]
        }
      ]
    }
  })),
  useGetOperationalTimePeriodConfigurationQuery: jest.fn(
    () => operationalTimePeriodConfigurationQuery
  ),
  useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
    data: { stationGroupNames: ['mockStationGroup'] }
  })),
  useGetStationGroupsByNamesQuery: jest.fn(() => ({
    data: [{ name: 'mockStationGroup' }, { name: 'mockStationGroup' }]
  }))
}));

describe('Open Anything Dialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_TIME);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is exported', () => {
    expect(OpenAnythingDialog).toBeDefined();
  });

  it('has the correct mocked time', () => {
    expect(new Date().getTimezoneOffset()).toEqual(0);
    expect(Date.now()).toEqual(MOCK_TIME);
  });

  it('matches snapshot when visible and not visible', () => {
    let resultsRenderer = render(
      <OpenAnythingDialog isVisible={false} onCancel={jest.fn()} onOpen={jest.fn()} />
    );
    expect(resultsRenderer.baseElement).toMatchSnapshot();

    resultsRenderer = render(
      <OpenAnythingDialog isVisible onCancel={jest.fn()} onOpen={jest.fn()} />
    );
    expect(resultsRenderer.baseElement).toMatchSnapshot();
  });

  const store = getStore();

  it('default values are called', async () => {
    const openAnythingConfirmationPrompt = jest.fn();
    const onOpen = jest.fn();
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await render(<div />, {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <WorkflowContext.Provider
              value={{
                staleStartTime: 1,
                allActivitiesOpenForSelectedInterval: false,
                openConfirmationPrompt: jest.fn(),
                closeConfirmationPrompt: jest.fn(),
                openAnythingConfirmationPrompt
              }}
            >
              <BaseDisplay glContainer={glContainer}>
                <OpenAnythingDialog isVisible onCancel={jest.fn()} onOpen={onOpen} />
                {children}
              </BaseDisplay>
            </WorkflowContext.Provider>
          </Provider>
        )
      });
    });
    expect(onOpen).toHaveBeenCalledTimes(0);
    expect(openAnythingConfirmationPrompt).toHaveBeenCalledTimes(0);
    fireEvent.click(await screen.findByText('Open'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(openAnythingConfirmationPrompt).toHaveBeenCalledWith({
      openIntervalName: 'mockStage',
      stationGroup: {
        name: 'mockStationGroup'
      },
      timeRange: {
        endTimeSecs: 1609506000,
        startTimeSecs: 1609498800
      }
    });
  });
});
