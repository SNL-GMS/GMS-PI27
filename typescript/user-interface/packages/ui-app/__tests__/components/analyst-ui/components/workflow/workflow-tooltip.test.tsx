import { WorkflowTypes } from '@gms/common-model';
import { secondsToString } from '@gms/common-util';
import { render } from '@testing-library/react';
import * as React from 'react';

import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import {
  getActiveAnalysts,
  getStatus,
  Tooltip,
  TooltipPanel
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-tooltip';
import * as WorkFlowDataTypes from './workflow-data-types';

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
global.Date.now = jest.fn(() => MOCK_TIME);
describe('Workflow Tooltip', () => {
  it('is exported', () => {
    expect(TooltipPanel).toBeDefined();
    expect(getActiveAnalysts).toBeDefined();
    expect(Tooltip).toBeDefined();
  });

  it('getActiveAnalysts can get active analysts from an interval with active analysts', () => {
    expect(getActiveAnalysts(WorkFlowDataTypes.activityInterval)).toMatchInlineSnapshot(
      `"larry, moe, curly"`
    );
  });
  it('getActiveAnalysts returns empty string for an interval without active analysts', () => {
    const emptyActivityInterval = WorkFlowDataTypes.activityInterval;
    emptyActivityInterval.activeAnalysts = [];
    expect(getActiveAnalysts(emptyActivityInterval)).toEqual('');
  });
  it('getActiveAnalysts returns empty string for a stage interval', () => {
    expect(getActiveAnalysts(WorkFlowDataTypes.interactiveAnalysisStageInterval)).toEqual('');
  });

  it('getStatus can get status for an activity interval', () => {
    expect(getStatus).toBeDefined();

    expect(getStatus(WorkFlowDataTypes.automaticProcessingStageInterval)).toMatchInlineSnapshot(
      `"In Progress (last-step)"`
    );

    expect(getStatus(WorkFlowDataTypes.activityInterval)).toMatchInlineSnapshot(`"In Progress"`);

    expect(getStatus(WorkFlowDataTypes.automaticProcessingStageInterval)).toMatchInlineSnapshot(
      `"In Progress (last-step)"`
    );

    expect(getStatus(WorkFlowDataTypes.activityInterval)).toMatchInlineSnapshot(`"In Progress"`);

    expect(
      getStatus(
        WorkFlowDataTypes.processingSequenceInterval as unknown as WorkflowTypes.StageInterval
      )
    ).toMatchInlineSnapshot(`"In Progress (last-step)"`);
  });

  it('matches tooltip panel snapshot', () => {
    expect(
      render(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <TooltipPanel
            startTime={WorkFlowDataTypes.activityInterval.intervalId.startTime.toString()}
            endTime={WorkFlowDataTypes.activityInterval.endTime.toString()}
            status={WorkFlowDataTypes.activityInterval.status}
            activeAnalysts="jbc, bo"
            lastModified={WorkFlowDataTypes.activityInterval.modificationTime.toString()}
            setTooltipKey={jest.fn()}
            tooltipRef={{
              current: {
                focus: jest.fn()
              } as any
            }}
            isStale={false}
          />
        </WorkflowContext.Provider>
      ).container
    ).toMatchSnapshot();

    expect(
      render(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <TooltipPanel
            startTime="500"
            endTime="600"
            status={WorkflowTypes.IntervalStatus.IN_PROGRESS}
            activeAnalysts="analyst 1, analyst 2"
            lastModified={secondsToString(0)}
            setTooltipKey={jest.fn}
            tooltipRef={{
              current: {
                focus: jest.fn()
              } as any
            }}
            isStale={false}
          />
        </WorkflowContext.Provider>
      ).container
    ).toMatchSnapshot();
  });

  it('matches tooltip snapshot', () => {
    expect(
      render(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <Tooltip interval={WorkFlowDataTypes.activityInterval} staleStartTime={500} />
        </WorkflowContext.Provider>
      ).container
    ).toMatchSnapshot();

    expect(
      render(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <Tooltip
            interval={WorkFlowDataTypes.automaticProcessingStageInterval}
            staleStartTime={500}
          >
            <div>content</div>
          </Tooltip>
        </WorkflowContext.Provider>
      ).container
    ).toMatchSnapshot();
  });

  it('can handle undefined interval with tooltip', () => {
    expect(
      render(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <Tooltip interval={WorkFlowDataTypes.activityInterval} staleStartTime={500} />{' '}
        </WorkflowContext.Provider>
      ).container
    ).toMatchSnapshot();
  });
});
