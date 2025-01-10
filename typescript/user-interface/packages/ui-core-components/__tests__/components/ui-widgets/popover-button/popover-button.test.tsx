/* eslint-disable react/jsx-props-no-spreading */
import { IconNames } from '@blueprintjs/icons';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import type { PopoverTypes } from '../../../../src/ts/components/ui-widgets/popover-button';
import { PopoverButton } from '../../../../src/ts/components/ui-widgets/popover-button';

const showImperativeContextMenuMock = jest.fn();
const hideImperativeContextMenuMock = jest.fn();

jest.mock('../../../../src/ts/components/imperative-context-menu', () => {
  const original = jest.requireActual('../../../../src/ts/components/imperative-context-menu');
  return {
    ...original,
    hideImperativeContextMenu: args => hideImperativeContextMenuMock(args),
    showImperativeContextMenu: args => showImperativeContextMenuMock(args)
  };
});

const onPopoverDismissedMock = jest.fn();
const onClickMock = jest.fn();

const props: PopoverTypes.PopoverProps = {
  label: 'my label',
  popupContent: (
    <div>
      <p>Pop Up Content</p>
    </div>
  ),
  renderAsMenuItem: false,
  disabled: false,
  tooltip: 'my tool tip',
  widthPx: 150,
  onlyShowIcon: false,
  icon: IconNames.AIRPLANE,
  onPopoverDismissed: onPopoverDismissedMock,
  onClick: onClickMock
};

describe('PopoverButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('to be defined', () => {
    expect(PopoverButton).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<PopoverButton {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('renders as menu item', () => {
    const { container } = render(<PopoverButton {...props} renderAsMenuItem />);
    expect(container).toMatchSnapshot();
  });

  it('does not show the label if onlyShowIcon is true', () => {
    render(<PopoverButton {...props} onlyShowIcon />);
    expect(screen.queryByText('my label')).toBeFalsy();
  });

  it('opens and closes the context menu on click', () => {
    render(<PopoverButton {...props} />);

    fireEvent.click(screen.getByRole('button'));

    expect(showImperativeContextMenuMock).toHaveBeenCalled();
    expect(onClickMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button'));

    expect(hideImperativeContextMenuMock).toHaveBeenCalled();
  });

  it('opens and closes the context menu on click as a menu item', () => {
    render(<PopoverButton {...props} renderAsMenuItem />);

    fireEvent.click(screen.getByRole('menuitem'));

    expect(showImperativeContextMenuMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('menuitem'));

    expect(hideImperativeContextMenuMock).toHaveBeenCalled();
  });
});
