/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import * as React from 'react';

import { LabelValue } from '../../../../src/ts/components/ui-widgets/label-value';
import type { LabelValueProps } from '../../../../src/ts/components/ui-widgets/label-value/types';

describe('label-value', () => {
  const props: LabelValueProps = {
    value: 'value',
    label: 'label',
    tooltip: 'tooltip',
    valueColor: 'blue',
    customStylePrefix: ''
  };
  it('to be defined', () => {
    expect(LabelValue).toBeDefined();
  });

  it('label-value renders without ian', () => {
    const { container } = render(<LabelValue {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('label-value renders with ian', () => {
    props.customStylePrefix = 'ian';
    const { container } = render(<LabelValue {...props} />);
    expect(container).toMatchSnapshot();
  });
});
