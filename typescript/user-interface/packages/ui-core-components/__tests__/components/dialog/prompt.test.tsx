import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { ModalPrompt } from '../../../src/ts/components/dialog/prompt';
import type * as ModalPromptTypes from '../../../src/ts/components/dialog/types';

const props: ModalPromptTypes.PromptProps = {
  title: 'title',
  actionText: 'actionText',
  actionTooltipText: 'actionTooltipText',
  cancelText: 'cancelText',
  cancelTooltipText: 'cancelTooltipText',
  isOpen: true,
  optionalButton: true,
  optionalText: 'optionalText',
  optionalTooltipText: 'optionalTooltipText',
  actionCallback: jest.fn(),
  cancelButtonCallback: jest.fn(),
  onCloseCallback: jest.fn(),
  optionalCallback: jest.fn()
};

describe('ModalPrompt', () => {
  it('to be defined', () => {
    expect(ModalPrompt).toBeDefined();
  });

  it('Modal Prompt renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<ModalPrompt {...props} />);
    expect(result.baseElement).toMatchSnapshot();
  });

  it('Modal Prompt functions and clicks', () => {
    const mockActionCallback = jest.fn();
    const mockCancelButtonCallback = jest.fn();
    const mockCloseCallback = jest.fn();
    const mockOptionalCallback = jest.fn();

    const result = render(
      <ModalPrompt
        title="title"
        actionText="actionText"
        actionTooltipText="actionTooltipText"
        cancelText="cancelText"
        cancelTooltipText="cancelTooltipText"
        isOpen
        optionalButton
        optionalText="optionalText"
        optionalTooltipText="optionalTooltipText"
        optionalCallback={mockOptionalCallback}
        actionCallback={mockActionCallback}
        cancelButtonCallback={mockCancelButtonCallback}
        onCloseCallback={mockCloseCallback}
      />
    );
    // Act
    const actionText = result.queryByText('actionText');
    if (actionText) {
      fireEvent.click(actionText);
    }
    expect(mockActionCallback).toHaveBeenCalledTimes(1);

    const optionalText = result.queryByText('optionalText');
    if (optionalText) {
      fireEvent.click(optionalText);
    }
    expect(mockOptionalCallback).toHaveBeenCalledTimes(1);
    fireEvent.click(result.getByLabelText('Close'));
    expect(mockOptionalCallback).toHaveBeenCalledTimes(1);
    fireEvent.click(result.getByText('cancelText'));
    expect(mockOptionalCallback).toHaveBeenCalledTimes(1);
  });
});
