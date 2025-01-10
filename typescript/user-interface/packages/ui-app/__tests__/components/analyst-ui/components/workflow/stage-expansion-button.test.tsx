/* eslint-disable react/jsx-props-no-spreading */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import type { StageExpansionButtonProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/stage-expansion-button';
import { StageExpansionButton } from '../../../../../src/ts/components/analyst-ui/components/workflow/stage-expansion-button';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

describe('Stage Expansion Button', () => {
  it('is exported', () => {
    expect(StageExpansionButton).toBeDefined();
  });

  const stageExpansionButtonProps: StageExpansionButtonProps = {
    isExpanded: false,
    disabled: false,
    stageName: 'stage',
    toggle: jest.fn()
  };

  it('matches snapshot', () => {
    const component = render(<StageExpansionButton {...stageExpansionButtonProps} />);
    expect(component.baseElement).toMatchSnapshot();
  });

  it('Stage Expansion Button functions and clicks', () => {
    render(<StageExpansionButton {...stageExpansionButtonProps} />);
    expect(stageExpansionButtonProps.toggle).toHaveBeenCalledTimes(0);
    fireEvent.click(screen.getByRole('button'));
    expect(stageExpansionButtonProps.toggle).toHaveBeenCalledTimes(1);
  });
});
