import { qcSegment, qcSegment2, qcSegment3 } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { QcSegmentSelectionTableMenu } from '~analyst-ui/components/waveform/quality-control/qc-segment-selection-table-menu';

describe('QC Segment Selection Menu', () => {
  it('exists', () => {
    expect(QcSegmentSelectionTableMenu).toBeDefined();
  });

  it('renders the Qc Segment Selection Menu Table', () => {
    // Empty
    let container = render(
      <Provider store={getStore()}>
        <QcSegmentSelectionTableMenu qcSegments={[]} />
      </Provider>
    );

    expect(container.container).toMatchSnapshot();

    // One QC segment
    container = render(
      <Provider store={getStore()}>
        <QcSegmentSelectionTableMenu qcSegments={[qcSegment]} />
      </Provider>
    );

    expect(container.container).toMatchSnapshot();

    // 3 QC segments
    container = render(
      <Provider store={getStore()}>
        <QcSegmentSelectionTableMenu qcSegments={[qcSegment, qcSegment2, qcSegment3]} />
      </Provider>
    );

    expect(container.container).toMatchSnapshot();
  });
});
