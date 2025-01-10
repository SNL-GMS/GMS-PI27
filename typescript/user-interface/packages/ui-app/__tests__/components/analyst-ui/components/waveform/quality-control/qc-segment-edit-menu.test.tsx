import type { CommonTypes } from '@gms/common-model';
import { qcSegment, workflowDefinitionId } from '@gms/common-model/__tests__/__data__';
import { getStore, waveformSlice } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { QcSegmentEditMenu } from '~analyst-ui/components/waveform/quality-control/qc-segment-edit-menu/qc-segment-edit-menu';

jest.mock('@gms/ui-state/lib/app/hooks/workflow-hooks', () => {
  const actual = jest.requireActual('@gms/ui-state/lib/app/hooks/workflow-hooks');
  return {
    ...actual,
    useStageId: () => workflowDefinitionId
  };
});

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useViewableInterval: () => [{ startTimeSecs: 0, endTimeSecs: 1000 }, jest.fn()]
  };
});

describe('QC Segment Edit Context Menu', () => {
  it('exists', () => {
    expect(QcSegmentEditMenu).toBeDefined();
  });

  it('renders QcSegmentEditContextMenuContent', () => {
    const store = getStore();
    const viewableInterval: CommonTypes.TimeRange = {
      startTimeSecs: 1636503404,
      endTimeSecs: 1636506404
    };
    store.dispatch(waveformSlice.actions.setViewableInterval(viewableInterval));
    // Empty content
    let container = render(<QcSegmentEditMenu qcSegment={undefined} />);
    expect(container.container).toMatchSnapshot();

    // One QC Segment
    container = render(
      <Provider store={store}>
        <QcSegmentEditMenu qcSegment={qcSegment} />
      </Provider>
    );
    expect(container.container).toMatchSnapshot();
  });
});
