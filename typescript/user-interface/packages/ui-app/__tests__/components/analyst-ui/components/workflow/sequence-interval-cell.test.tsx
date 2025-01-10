import { getStore } from '@gms/ui-state';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SequenceIntervalCell } from '../../../../../src/ts/components/analyst-ui/components/workflow/sequence-interval-cell';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import { isStageIntervalPercentBar } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util';
import * as WorkflowDataTypes from './workflow-data-types';

const store = getStore();

describe('Sequence Interval Cell', () => {
  it('is exported', () => {
    expect(SequenceIntervalCell).toBeDefined();
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
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.automaticProcessingStageInterval}
            workflow={WorkflowDataTypes.workflow}
          />
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
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.automaticProcessingStageInterval}
            workflow={WorkflowDataTypes.workflow}
          />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('can determine cell percent bar', () => {
    const interactiveStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.interactiveAnalysisStageInterval
    );
    expect(interactiveStageInterval).toBeFalsy();

    const automaticStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.automaticProcessingStageInterval
    );
    expect(automaticStageInterval).toBeTruthy();
  });

  it('opens a context menu for interval on right click', async () => {
    const component = render(
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
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.interactiveAnalysisStageInterval}
            workflow={WorkflowDataTypes.workflow}
          />
        </WorkflowContext.Provider>
      </Provider>
    );

    fireEvent.contextMenu(component.getByRole('button'));

    expect(await screen.findByRole('menu')).toBeDefined();
    expect(await screen.findByText('Open interval')).toBeDefined();
  });

  it('double clicking opens interactive events', () => {
    const openConfirmationPromptMock = jest.fn();

    const component = render(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: openConfirmationPromptMock,
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.interactiveAnalysisStageInterval}
            workflow={WorkflowDataTypes.workflow}
          />
        </WorkflowContext.Provider>
      </Provider>
    );
    fireEvent.doubleClick(component.getByRole('button'));
    expect(openConfirmationPromptMock).toHaveBeenCalledWith(
      WorkflowDataTypes.interactiveAnalysisStageInterval
    );
  });

  it('double clicking does not open automatic events', () => {
    const openConfirmationPromptMock = jest.fn();

    const component = render(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: openConfirmationPromptMock,
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.automaticProcessingStageInterval}
            workflow={WorkflowDataTypes.workflow}
          />
        </WorkflowContext.Provider>
      </Provider>
    );
    fireEvent.doubleClick(component.container.firstChild);
    expect(openConfirmationPromptMock).toHaveBeenCalledTimes(0);
  });
});
