/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { render } from '@testing-library/react';
import * as React from 'react';

import type { YAxisProps } from '../../../../../../src/ts/components/weavess-waveform-display/components/axes/y-axis/types';
import { YAxis } from '../../../../../../src/ts/components/weavess-waveform-display/components/axes/y-axis/y-axis';

const props: YAxisProps = {
  heightInPercentage: 100,
  minAmplitude: 0,
  maxAmplitude: 100,
  yAxisTicks: [0, 2, 4, 6, 8, 10]
};

describe('Weavess Y Axis', () => {
  it('to be defined', () => {
    expect(YAxis).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<YAxis {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('calls display', () => {
    const yAxis = new YAxis(props);
    const spy = jest.spyOn(yAxis, 'display');
    yAxis.display();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('try to display a negative with no ticks', () => {
    const { container } = render(
      <YAxis {...props} yAxisTicks={undefined} minAmplitude={-0.05} maxAmplitude={0} />
    );
    expect(container).toMatchSnapshot();
  });

  it('try to display a large range without ticks', () => {
    const { container } = render(<YAxis {...props} yAxisTicks={undefined} />);
    expect(container).toMatchSnapshot();
  });

  it('updates when display is called', () => {
    const result = render(<YAxis {...props} />);
    expect(result.container).toMatchSnapshot();

    result.rerender(<YAxis {...props} maxAmplitude={10} />);
    expect(result.container).toMatchSnapshot();
  });
});
