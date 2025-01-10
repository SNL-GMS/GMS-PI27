import { WorkflowTypes } from '@gms/common-model';
import { qcSegment, qcSegment4, workflowDefinitionId } from '@gms/common-model/__tests__/__data__';
import { getStore, setOpenInterval } from '@gms/ui-state';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { generateSegmentHistoryTableRows } from '~analyst-ui/components/waveform/quality-control/qc-segment-edit-menu/qc-segment-edit-content/all-versions';
import { QcSegmentEditContent } from '~analyst-ui/components/waveform/quality-control/qc-segment-edit-menu/qc-segment-edit-content/qc-segment-edit-content';

jest.mock('@gms/ui-state/src/ts/app/hooks/workflow-hooks.ts', () => {
  const actual = jest.requireActual('@gms/ui-state/src/ts/app/hooks/workflow-hooks.ts');
  return {
    ...actual,
    useStageId: () => workflowDefinitionId
  };
});
jest.mock('@gms/ui-state/src/ts/app/hooks/user-session-hooks.ts', () => {
  const actual = jest.requireActual('@gms/ui-state/src/ts/app/hooks/user-session-hooks.ts');
  return {
    ...actual,
    useUsername: () => 'Test User'
  };
});

describe('QC edit dialog', () => {
  const store = getStore();
  store.dispatch(
    setOpenInterval(
      {
        startTimeSecs: 0,
        endTimeSecs: 100
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
  it('exists', () => {
    expect(QcSegmentEditContent).toBeDefined();
  });

  it('can generate table rows', () => {
    const expectedResult = [
      {
        author: 'User 1',
        category: 'Analyst Defined',
        channelName: ['PDAR.PD01.SHZ'],
        effectiveAt: 0,
        endTime: 1636503704,
        'first-in-table': true,
        id: '0',
        rationale: '',
        rejected: 'False',
        stage: 'Unknown',
        startTime: 1636503404,
        type: 'Aggregate'
      }
    ];
    const tableRows = generateSegmentHistoryTableRows(qcSegment.versionHistory);
    expect(tableRows).toMatchObject(expectedResult);
  });
  it('renders QcSegmentEditContent', () => {
    // non-reject process
    const container = render(
      <Provider store={getStore()}>
        <QcSegmentEditContent qcSegment={qcSegment} />
      </Provider>
    );

    const rejectButton = screen.queryByText('Reject');

    expect(container.container).toMatchSnapshot();
    expect(screen.getAllByText('Save')).toHaveLength(1);
    expect(rejectButton).toBeNull();

    // rejected and expect save button to not be on the screen
    container.rerender(
      <Provider store={getStore()}>
        <QcSegmentEditContent qcSegment={qcSegment4} />
      </Provider>
    );

    expect(container.container).toMatchSnapshot();
  });

  it('renders with clearBrushStroke prop', () => {
    const updateBrushStroke = jest.fn();
    const container = render(
      <Provider store={getStore()}>
        <QcSegmentEditContent qcSegment={qcSegment} updateBrushStroke={updateBrushStroke} />
      </Provider>
    );
    expect(container.container).toMatchSnapshot();
  });
});
