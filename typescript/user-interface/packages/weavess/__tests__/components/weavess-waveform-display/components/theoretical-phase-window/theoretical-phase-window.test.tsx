/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import React from 'react';

import { TheoreticalPhaseWindow } from '../../../../../src/ts/components/weavess-waveform-display/components/theoretical-phase-window/theoretical-phase-window';
import type { TheoreticalPhaseWindowProps } from '../../../../../src/ts/components/weavess-waveform-display/components/theoretical-phase-window/types';

const props: TheoreticalPhaseWindowProps = {
  id: 'my-id',
  color: '#ff0000',
  label: 'my label',
  left: 0,
  right: 4
};

describe('Weavess Empty Renderer', () => {
  it('to be defined', () => {
    expect(TheoreticalPhaseWindow).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<TheoreticalPhaseWindow {...props} />);
    expect(container).toMatchSnapshot();
  });
});
