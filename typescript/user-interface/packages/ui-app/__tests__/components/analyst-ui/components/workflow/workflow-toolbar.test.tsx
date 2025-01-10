import { WorkflowTypes } from '@gms/common-model';
import {
  FORTY_FIVE_DAYS_IN_SECONDS,
  MILLISECONDS_IN_SECOND,
  SECONDS_IN_HOUR
} from '@gms/common-util';
import type { OperationalTimePeriodConfigurationQuery } from '@gms/ui-state';
import { getStore, setOpenInterval } from '@gms/ui-state';
import { fireEvent, render, screen } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import { WorkflowToolbar } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-toolbar';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { useQueryStateResult } from '../../../../__data__/test-util-data';
import { glContainer } from './gl-container';

const TEN_SECONDS_MS = 10000;

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const MOCK_TIME = 1606818240000;

const operationalTimePeriodConfigurationQuery: OperationalTimePeriodConfigurationQuery =
  cloneDeep(useQueryStateResult);

operationalTimePeriodConfigurationQuery.data = {
  operationalPeriodStart: FORTY_FIVE_DAYS_IN_SECONDS,
  operationalPeriodEnd: 0
};

const processingAnalystConfigurationQueryResult = {
  leadBufferDuration: 900,
  lagBufferDuration: 900,
  maximumOpenAnythingDuration: 7200,
  workflow: {
    panSingleArrow: 86400,
    panDoubleArrow: 604800
  }
};

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useGetStationGroupsByNamesQuery: jest.fn(() => ({
      data: [
        {
          name: 'TEST',
          description: '',
          effectiveAt: 0,
          effectiveUntil: 1,
          stations: []
        }
      ]
    })),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: processingAnalystConfigurationQueryResult
    })),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    ),
    useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
      data: { stationGroupNames: ['mockStationGroup', 'mockStationGroup'] }
    }))
  };
});

describe('Workflow Toolbar', () => {
  const onPan = jest.fn();

  const storeDefault = getStore();

  const store = getStore();
  store.dispatch(
    setOpenInterval(
      {
        startTimeSecs: MOCK_TIME / MILLISECONDS_IN_SECOND - SECONDS_IN_HOUR,
        endTimeSecs: MOCK_TIME / MILLISECONDS_IN_SECOND
      },
      {
        name: 'Station Group',
        effectiveAt: 0,
        description: ''
      },
      'Al1',
      ['Event Review'],
      WorkflowTypes.AnalysisMode.SCAN
    ) as any
  );

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_TIME);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('is exported', () => {
    expect(WorkflowToolbar).toBeDefined();
  });

  it('mocks date correctly', () => {
    expect(new Date().getTimezoneOffset()).toEqual(0);
    expect(Date.now()).toEqual(MOCK_TIME);
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Provider store={storeDefault}>
        <BaseDisplay glContainer={glContainer}>
          <WorkflowToolbar onPan={onPan} />
        </BaseDisplay>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches default value snapshot', () => {
    const { container } = render(
      <Provider store={store}>
        <BaseDisplay glContainer={glContainer}>
          <WorkflowToolbar onPan={onPan} />
        </BaseDisplay>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it(
    'handle buttons clicks',
    async () => {
      const component = render(
        <Provider store={store}>
          <BaseDisplay glContainer={glContainer}>
            <WorkflowToolbar onPan={onPan} />
          </BaseDisplay>
        </Provider>
      );

      jest.runAllTimers();

      const doubleLeftArrowItem = component.getByTitle(
        'Pan the workflow to the left by 7 days (Shift + ←)'
      );
      fireEvent.click(doubleLeftArrowItem);
      expect(onPan).toHaveBeenCalledTimes(1);
      expect(onPan).toHaveBeenLastCalledWith(
        -processingAnalystConfigurationQueryResult.workflow.panDoubleArrow
      );

      const singleLeftArrowItem = component.getByTitle('Pan the workflow to the left by 1 day (←)');
      fireEvent.click(singleLeftArrowItem);
      expect(onPan).toHaveBeenCalledTimes(2);
      expect(onPan).toHaveBeenLastCalledWith(
        -processingAnalystConfigurationQueryResult.workflow.panSingleArrow
      );

      const singleRightArrowItem = component.getByTitle(
        'Pan the workflow to the right by 1 day (→)'
      );
      fireEvent.click(singleRightArrowItem);
      expect(onPan).toHaveBeenCalledTimes(3);
      expect(onPan).toHaveBeenLastCalledWith(
        processingAnalystConfigurationQueryResult.workflow.panSingleArrow
      );

      const doubleRightArrowItem = component.getByTitle(
        'Pan the workflow to the right by 7 days (Shift + →)'
      );
      fireEvent.click(doubleRightArrowItem);
      expect(onPan).toHaveBeenCalledTimes(4);
      expect(onPan).toHaveBeenLastCalledWith(
        processingAnalystConfigurationQueryResult.workflow.panDoubleArrow
      );

      const openAnythingItem = component.getByTitle('Open anything');
      expect(openAnythingItem).toBeDefined();

      fireEvent.click(openAnythingItem);
      expect(await screen.findByText('Open')).toBeDefined();
    },
    TEN_SECONDS_MS
  );
});
