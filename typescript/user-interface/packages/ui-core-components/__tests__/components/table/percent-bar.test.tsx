/* eslint-disable react/jsx-props-no-spreading */

import { render } from '@testing-library/react';
import * as React from 'react';

import { PercentBar } from '../../../src/ts/components/table/percent-bar';
import type * as PercentBarTypes from '../../../src/ts/components/table/types/percent-bar';

const firstPercntValue = 50;
const secondPercentValue = 75;
const initialClassNames = 'percent-bar-half';
const nextClassNames = 'percent-bar-three-fourths';

const props: PercentBarTypes.PercentBarProps = {
  percentage: firstPercntValue,
  classNames: initialClassNames
};

describe('Percent Bar', () => {
  it('to be defined', () => {
    expect(PercentBar).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<PercentBar {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('updates', () => {
    const result = render(<PercentBar {...props} />);
    result.rerender(<PercentBar percentage={secondPercentValue} classNames={nextClassNames} />);
    expect(result.container).toMatchSnapshot();
  });
});
