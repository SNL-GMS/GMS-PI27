import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { HelpText, HelpTextTarget } from '../../../../src/ts/components';

describe('HelpText', () => {
  it('matches a snapshot', () => {
    const { container } = render(
      <HelpTextTarget data-test-id="help-text-target">
        <HelpText>The contents of the help text tooltip...</HelpText>
        Hover over this to show icon
      </HelpTextTarget>
    );
    expect(container).toMatchSnapshot();
  });
  it('HelpTextTarget reveals the icon on hover', async () => {
    const { container } = render(
      <HelpTextTarget>
        <HelpText>The contents of the help text tooltip...</HelpText>
        <span data-test-id="hover-target">Hover target</span>
      </HelpTextTarget>
    );

    const hoverTarget = screen.getByText('Hover target');
    expect(hoverTarget).toBeInTheDocument();
    await userEvent.hover(hoverTarget);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
