import { pd01ProcessingMask } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { ProcessingMaskDetails } from '~analyst-ui/components/waveform/quality-control';

describe('QC Segment Edit Context Menu', () => {
  it('exists', () => {
    expect(ProcessingMaskDetails).toBeDefined();
  });

  it('renders ProcessingMaskDetailsContextMenuContent', () => {
    // Empty content
    let container = render(<ProcessingMaskDetails processingMask={undefined} qcSegments={[]} />);
    expect(container.container).toMatchSnapshot();

    // Processing Mask
    container = render(
      <Provider store={getStore()}>
        <ProcessingMaskDetails processingMask={pd01ProcessingMask} qcSegments={[]} />
      </Provider>
    );
    expect(container.container).toMatchSnapshot();
  });
});
