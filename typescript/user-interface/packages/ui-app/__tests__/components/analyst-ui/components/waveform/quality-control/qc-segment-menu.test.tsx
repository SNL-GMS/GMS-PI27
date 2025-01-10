import {
  processingAnalystConfigurationData,
  qcSegment
} from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { QcSegmentMenu } from '~analyst-ui/components/waveform/quality-control/qc-segment-menu';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    )
  };
});

describe('QC Segment Context Menu', () => {
  it('exists', () => {
    expect(QcSegmentMenu).toBeDefined();
  });

  it('renders QcSegmentContextMenuContent', () => {
    // Empty array
    let container = render(
      <Provider store={getStore()}>
        <QcSegmentMenu qcSegments={undefined} />
      </Provider>
    );
    expect(container.container).toMatchSnapshot();

    // One QC Segment
    container = render(
      <Provider store={getStore()}>
        <QcSegmentMenu qcSegments={[qcSegment]} />
      </Provider>
    );
    expect(container.container).toMatchSnapshot();

    // More than one QC Segment
    container = render(
      <Provider store={getStore()}>
        <QcSegmentMenu qcSegments={[qcSegment, qcSegment]} />
      </Provider>
    );
    expect(container.container).toMatchSnapshot();
  });
});
