import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import { FilterableOptionList } from '../../src/ts/components/ui-widgets/filterable-option-list';
import type { FilterableOptionListProps } from '../../src/ts/components/ui-widgets/filterable-option-list/types';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const props: FilterableOptionListProps = {
  options: ['alpha', 'beta', 'delta', 'gamma'],
  priorityOptions: ['aa', 'bb', 'cc', 'dd'],
  defaultSelection: 'uno',
  defaultFilter: 'o',
  disabled: false,
  widthPx: 120,
  onSelection: jest.fn(),
  onEnter: jest.fn(),
  onClick: jest.fn(),
  onDoubleClick: jest.fn()
};

describe('Core drop down', () => {
  it('Renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<FilterableOptionList {...props} />);
    expect(result.container).toMatchSnapshot();
  });

  it('disables search given the disabled flag', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<FilterableOptionList {...props} />);
    // eslint-disable-next-line react/jsx-props-no-spreading
    result.rerender(<FilterableOptionList {...{ ...props, disabled: true }} />);
    expect(result.container).toMatchSnapshot();
  });

  it('Can filter down based on input', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<FilterableOptionList {...props} />);
    const input = result.container.querySelector(`input`);
    if (input) {
      fireEvent.change(input, { target: { value: 'alpha' } });
    }
    expect(result.container).toMatchSnapshot();
  });
});
