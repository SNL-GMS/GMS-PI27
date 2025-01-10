import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { CollapseButton } from '../../../src/ts/components/collapse/collapse-button';
import type * as CollapseButtonTypes from '../../../src/ts/components/collapse/types';

const props: CollapseButtonTypes.CollapseButtonProps = {
  buttonText: 'collapse-button',
  isLoading: false,
  isCollapsed: false,
  onClick: jest.fn()
};

describe('CollapseButton', () => {
  it('to be defined', () => {
    expect(CollapseButton).toBeDefined();
  });

  it('CollapseButton renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<CollapseButton {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('CollapseButton functions and clicks', () => {
    const mockOnClick = jest.fn();

    const result = render(
      <CollapseButton
        buttonText="collapse-button"
        isLoading={false}
        isCollapsed
        onClick={mockOnClick}
      />
    );

    const button = result.container.querySelector(`Button`);
    if (button) {
      fireEvent.click(button);
    }
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
