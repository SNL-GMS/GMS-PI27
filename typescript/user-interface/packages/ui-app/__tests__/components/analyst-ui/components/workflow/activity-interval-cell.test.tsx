import { getStore } from '@gms/ui-state';
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import {
  ActivityIntervalCell,
  determineTextForCell
} from '../../../../../src/ts/components/analyst-ui/components/workflow/activity-interval-cell';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import * as WorkflowDataTypes from './workflow-data-types';

const store = getStore();

describe('Activity Interval Cell', () => {
  it('is exported', () => {
    expect(ActivityIntervalCell).toBeDefined();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <ActivityIntervalCell activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('shallow mounts', () => {
    const { container } = render(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <ActivityIntervalCell activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('can determine text for cell', () => {
    const text = determineTextForCell(WorkflowDataTypes.status, WorkflowDataTypes.analysts);
    expect(text).toBe('larry + 2');

    const text2 = determineTextForCell(
      WorkflowDataTypes.status,
      WorkflowDataTypes.analysts.slice(-1)
    );
    expect(text2).toBe('curly');

    const desiredAnalystItem = -2;
    const text3 = determineTextForCell(
      WorkflowDataTypes.status,
      WorkflowDataTypes.analysts.slice(desiredAnalystItem)
    );
    expect(text3).toBe('moe + 1');

    const text4 = determineTextForCell(
      WorkflowDataTypes.notStartedStatus,
      WorkflowDataTypes.analysts
    );
    expect(text4).toBe('');

    const text5 = determineTextForCell(
      WorkflowDataTypes.notCompleteStatus,
      WorkflowDataTypes.analysts
    );
    expect(text5).toBe('');

    const text6 = determineTextForCell(
      WorkflowDataTypes.completeStatus,
      WorkflowDataTypes.analysts
    );
    expect(text6).toBe('larry');

    const text7 = determineTextForCell(WorkflowDataTypes.completeStatus, []);
    expect(text7).toBe('');

    const text8 = determineTextForCell(WorkflowDataTypes.completeStatus, undefined);
    expect(text8).toBe('');
  });

  it('Activity Interval Cell functions and clicks', () => {
    const openFn = jest.fn();
    const wrapper = render(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: openFn,
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <ActivityIntervalCell activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );

    const intervalCell = wrapper.getByRole('button');
    expect(intervalCell.classList.contains('interval-cell--clickable')).toBeTruthy();
    expect(intervalCell.classList.contains('interval-cell--selected')).toBeFalsy();
    expect(openFn).not.toHaveBeenCalled();
    fireEvent.doubleClick(intervalCell);
    expect(openFn).toHaveBeenCalledTimes(1);
  });
});
