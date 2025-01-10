/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import * as React from 'react';

import { PieChart } from '../../../../src/ts/components/charts/pie-chart/pie-chart';
import type * as PieChartTypes from '../../../../src/ts/components/charts/pie-chart/types';

const pieChartStyle: PieChartTypes.PieChartStyle = {
  diameterPx: 100,
  borderPx: 5
};

const props: PieChartTypes.PieChartProps = {
  style: pieChartStyle,
  percent: 40,
  className: 'string',
  pieSliceClass: 'string',
  status: 'string'
};

describe('Pie Chart', () => {
  it('to be defined', () => {
    expect(PieChart).toBeDefined();
  });

  it('Pie Chart renders', () => {
    const { container } = render(<PieChart {...props} />);
    expect(container).toMatchSnapshot();
  });
});
