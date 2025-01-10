import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ButtonToolbarItem } from '../../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/button-item';
import { LoadingSpinnerToolbarItem } from '../../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/loading-spinner-item';
import { ButtonOverflowMenuToolbarItem } from '../../../../../src/ts/components/ui-widgets/toolbar/toolbar-overflow-menu-item/button-menu-item';

// set up window alert and open map so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const buttonToolbarItem = (
  <ButtonToolbarItem
    key="button"
    onButtonClick={jest.fn()}
    tooltip="Button Hello"
    hasIssue={false}
    widthPx={50}
  />
);

const loadingSpinnerToolbarItem = (
  <LoadingSpinnerToolbarItem
    key="loadingspinner"
    itemsToLoad={1}
    tooltip="Hello LoadingSpinner"
    hasIssue={false}
    widthPx={50}
  />
);

describe('ButtonOverflowMenuToolbarItem', () => {
  test('ButtonOverflowMenuToolbarItem renders', () => {
    const { container } = render(
      <ButtonOverflowMenuToolbarItem
        item={buttonToolbarItem.props}
        menuKey={buttonToolbarItem.key}
      />
    );

    expect(container).toMatchSnapshot();
  });
  test('ButtonOverflowMenuToolbarItem renders empty due to incorrect type', () => {
    const { container } = render(
      <ButtonOverflowMenuToolbarItem
        item={loadingSpinnerToolbarItem.props}
        menuKey={loadingSpinnerToolbarItem.key}
      />
    );

    expect(container).toMatchSnapshot();
  });

  test('ButtonOverflowMenuToolbarItem onClick', () => {
    const clickCallback = jest.fn();
    const buttonToolbarItemToClick = (
      <ButtonToolbarItem
        key="button"
        onButtonClick={clickCallback}
        tooltip="Button Hello"
        hasIssue={false}
        widthPx={50}
        menuLabel="Button Hello"
      />
    );
    const { container } = render(
      <ButtonOverflowMenuToolbarItem
        item={buttonToolbarItemToClick.props}
        menuKey={buttonToolbarItemToClick.key}
      />
    );
    expect(container).toMatchSnapshot();
    const buttonToClick = screen.getByText('Button Hello');
    fireEvent.click(buttonToClick);
    expect(clickCallback).toHaveBeenCalled();
  });
});
