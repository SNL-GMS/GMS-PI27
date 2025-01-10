/* eslint-disable react/jsx-props-no-spreading */

import { render } from '@testing-library/react';
import * as React from 'react';

import { NumericInput } from '../../../../src/ts/components/ui-widgets/numeric-input';
import type { NumericInputProps } from '../../../../src/ts/components/ui-widgets/numeric-input/types';
import type { MinMax } from '../../../../src/ts/components/ui-widgets/toolbar/types';

describe('numeric input', () => {
  const baseProps: NumericInputProps = {
    onChange: jest.fn(),
    tooltip: 'test numeric input',
    value: 100
  };
  const numericInputMinMax: MinMax = {
    min: 0,
    max: 100
  };
  describe('component', () => {
    it('exists', () => {
      expect(NumericInput).toBeDefined();
    });

    it('matches a snapshot with default values', () => {
      const { container } = render(<NumericInput {...baseProps} />);
      expect(container).toMatchSnapshot();
    });

    it('matches a snapshot when given optional props', () => {
      const { container } = render(
        <NumericInput {...baseProps} minMax={numericInputMinMax} widthPx={100} step={2} />
      );
      expect(container).toMatchSnapshot();
    });
    it('matches a snapshot when disabled', () => {
      const { container } = render(<NumericInput {...baseProps} disabled />);
      expect(container).toMatchSnapshot();
    });
  });
});
