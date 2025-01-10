/* eslint-disable react/jsx-props-no-spreading */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import { HistoryList } from '../../../../src/ts/components/ui-widgets/history-list';
import type * as HistoryListTypes from '../../../../src/ts/components/ui-widgets/history-list/types';

const historyListItem: HistoryListTypes.HistoryListItem = {
  index: 0,
  label: 'item A',
  id: '1'
};

const historyListItem2: HistoryListTypes.HistoryListItem = {
  index: 1,
  label: 'item B',
  id: '2'
};

const props: HistoryListTypes.HistoryListProps = {
  items: [historyListItem],
  preferredItems: [historyListItem],
  listLength: 1,
  onSelect: jest.fn()
};

describe('History List', () => {
  it('to be defined', () => {
    expect(HistoryList).toBeDefined();
  });

  it('History List renders', () => {
    const { container } = render(<HistoryList {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('shows a defined number of items', () => {
    const { rerender } = render(
      <HistoryList items={[historyListItem]} listLength={1} onSelect={jest.fn()} />
    );

    expect(screen.getAllByRole('menuitem')).toHaveLength(1);

    rerender(
      <HistoryList
        items={[historyListItem, historyListItem2]}
        listLength={1}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getAllByRole('menuitem')).toHaveLength(1);

    rerender(<HistoryList items={[historyListItem, historyListItem2]} onSelect={jest.fn()} />);

    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('preferred items are not limited by the list length', () => {
    render(
      <HistoryList
        items={[historyListItem]}
        preferredItems={[historyListItem, historyListItem2]}
        listLength={1}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('triggers a callback on click', () => {
    const onSelectMock = jest.fn();

    render(
      <HistoryList
        items={[historyListItem]}
        preferredItems={[historyListItem2]}
        listLength={1}
        onSelect={onSelectMock}
      />
    );
    fireEvent.click(screen.getByText(historyListItem.label));

    expect(onSelectMock).toHaveBeenCalledWith(historyListItem.id);

    fireEvent.click(screen.getByText(historyListItem2.label));

    expect(onSelectMock).toHaveBeenCalledWith(historyListItem2.id);
  });
});
