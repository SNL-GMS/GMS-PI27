/* eslint-disable react/jsx-props-no-spreading */
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { SaveOpenDialog } from '../../../src/ts/components/dialog/save-open-dialog';
import type * as SaveOpenDialogTypes from '../../../src/ts/components/dialog/types';

const saveableItem1: SaveOpenDialogTypes.SaveableItem = {
  title: 'title1',
  id: '1'
};

const saveableItem2: SaveOpenDialogTypes.SaveableItem = {
  title: 'title2',
  id: '2'
};

const props: SaveOpenDialogTypes.SaveOpenDialogProps = {
  title: 'string',
  actionText: 'string',
  itemList: [saveableItem1, saveableItem2],
  actionTooltipText: 'string',
  isDialogOpen: true,
  titleOfItemList: 'string',
  cancelText: 'string',
  cancelTooltipText: 'string',
  selectedId: 'string',
  openedItemId: 'string',
  defaultId: '1',
  defaultSaveName: 'string',
  actionCallback: jest.fn(),
  cancelCallback: jest.fn(),
  selectEntryCallback: jest.fn()
};

describe('SaveOpenDialog', () => {
  it('to be defined', () => {
    expect(SaveOpenDialog).toBeDefined();
  });

  it('Save Open Dialog renders', () => {
    const result = render(<SaveOpenDialog {...props} />);
    expect(result.baseElement).toMatchSnapshot();
  });

  it('Save Open Dialog functions and clicks', () => {
    const mockActionCallback = jest.fn();
    const mockCancelCallback = jest.fn();
    const mockSelectEntryCallback = jest.fn();

    const result = render(
      <SaveOpenDialog
        title="title"
        actionText="actionText"
        itemList={[saveableItem1, saveableItem2]}
        actionTooltipText="actionTooltipText"
        isDialogOpen
        titleOfItemList="titleOfItemList"
        cancelText="cancelText"
        cancelTooltipText="cancelTooltipText"
        selectedId="selectedId"
        openedItemId="openedItemId"
        defaultId="1"
        defaultSaveName="defaultSaveName"
        actionCallback={mockActionCallback}
        cancelCallback={mockCancelCallback}
        selectEntryCallback={mockSelectEntryCallback}
      />
    );

    const actionText = result.queryByText('actionText');
    if (actionText) {
      fireEvent.click(actionText);
    }
    expect(mockActionCallback).toHaveBeenCalledTimes(1);
    fireEvent.click(result.getByText('cancelText'));
    expect(mockCancelCallback).toHaveBeenCalledTimes(1);
    fireEvent.click(result.getByText('title1'));
    expect(mockSelectEntryCallback).toHaveBeenCalledTimes(1);
    fireEvent.click(result.getByLabelText('Close'));
    expect(mockCancelCallback).toHaveBeenCalledTimes(2);
  });
});
