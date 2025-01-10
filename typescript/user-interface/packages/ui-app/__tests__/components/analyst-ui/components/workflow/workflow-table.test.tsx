import type { StageIntervalList } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';

import { WorkflowTable } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-table';
import { glContainer } from './gl-container';
import * as WorkflowDataTypes from './workflow-data-types';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const intervalQueryResult: StageIntervalList = [];
intervalQueryResult.push({
  name: WorkflowDataTypes.interactiveStage.name,
  value: [WorkflowDataTypes.interactiveAnalysisStageInterval]
});

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

jest.spyOn(document, 'querySelector').mockImplementation(() => {
  return {
    scrollWidth: 1200,
    clientWidth: 1200,
    getBoundingClientRect: jest.fn().mockReturnValue({
      width: 1200
    }),
    parentElement: {
      scrollTo: jest.fn()
    }
  } as unknown as Element;
});
describe('Workflow Table', () => {
  it('is exported', () => {
    expect(WorkflowTable).toBeDefined();
  });

  it('matches snapshot', () => {
    const result = render(
      <WorkflowTable
        timeRange={{
          startTimeSecs: 0,
          endTimeSecs: 360000
        }}
        widthPx={500}
        heightPx={500}
        stageIntervals={intervalQueryResult}
        workflow={WorkflowDataTypes.workflow}
        staleStartTime={123456}
        glContainer={glContainer}
      />
    );
    expect(result.container).toMatchSnapshot();
  });
});
