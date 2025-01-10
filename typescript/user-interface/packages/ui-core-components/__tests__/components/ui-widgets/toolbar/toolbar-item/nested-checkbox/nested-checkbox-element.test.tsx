import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { NestedCheckboxListRecord } from '../../../../../../src/ts/components';
import { NestedCheckboxList } from '../../../../../../src/ts/components';

const testElements: NestedCheckboxListRecord[] = [
  {
    key: 'line1',
    displayString: 'line 1',
    children: [
      {
        key: 'child1',
        displayString: 'child 1',
        children: []
      }
    ]
  },
  {
    key: 'line2',
    displayString: 'line 2',
    children: [
      {
        key: 'child2',
        displayString: 'child 2',
        children: []
      },
      {
        key: 'child3',
        displayString: 'child 3',
        children: [
          {
            key: 'grandchild1',
            displayString: 'grandchild 1',
            children: []
          }
        ]
      },
      {
        key: 'child4',
        displayString: 'child 4',
        children: []
      }
    ]
  },
  {
    key: 'line3',
    displayString: 'line 3'
  }
];

describe('nested checkbox list', () => {
  it('handles a first level click', () => {
    const keyToCheckedRecord: Record<string, boolean> = {
      line1: false,
      line2: false,
      line3: false,
      child1: false,
      child2: false,
      child3: false,
      child4: false
    };
    const onChange = jest.fn();

    // ARRANGE
    render(
      <NestedCheckboxList
        checkBoxElements={testElements}
        keyToCheckedRecord={keyToCheckedRecord}
        onChange={onChange} // do nothing
      />
    );

    // ACT
    fireEvent.click(screen.getByText('line 3'));

    // ASSERT
    expect(onChange).toHaveBeenCalledWith({
      line1: false,
      line2: false,
      line3: true,
      child1: false,
      child2: false,
      child3: false,
      child4: false
    });
  });
  it('handles a child click', () => {
    const keyToCheckedRecord: Record<string, boolean> = {
      line1: false,
      line2: false,
      line3: false,
      child1: false,
      child2: false,
      child3: false,
      child4: false
    };
    const onChange = jest.fn();

    // ARRANGE
    render(
      <NestedCheckboxList
        checkBoxElements={testElements}
        keyToCheckedRecord={keyToCheckedRecord}
        onChange={onChange} // do nothing
      />
    );

    // ACT
    fireEvent.click(screen.getByText('child 4'));

    // ASSERT
    expect(onChange).toHaveBeenCalledWith({
      line1: false,
      line2: true,
      line3: false,
      child1: false,
      child2: false,
      child3: false,
      child4: true
    });
  });
  it('handles a parent with children click', () => {
    const keyToCheckedRecord: Record<string, boolean> = {
      line1: false,
      line2: false,
      line3: false,
      child1: false,
      child2: false,
      child3: false,
      child4: false
    };
    const onChange = jest.fn();

    // ARRANGE
    render(
      <NestedCheckboxList
        checkBoxElements={testElements}
        keyToCheckedRecord={keyToCheckedRecord}
        onChange={onChange} // do nothing
      />
    );

    // ACT
    fireEvent.click(screen.getByText('line 1'));

    // ASSERT
    expect(onChange).toHaveBeenCalledWith({
      line1: true,
      line2: false,
      line3: false,
      child1: true,
      child2: false,
      child3: false,
      child4: false
    });
  });
  it('handles a child with multiple parents click', () => {
    const keyToCheckedRecord: Record<string, boolean> = {
      line1: false,
      line2: false,
      line3: false,
      child1: false,
      child2: false,
      child3: false,
      child4: false
    };
    const onChange = jest.fn();

    // ARRANGE
    render(
      <NestedCheckboxList
        checkBoxElements={testElements}
        keyToCheckedRecord={keyToCheckedRecord}
        onChange={onChange} // do nothing
      />
    );

    // ACT
    fireEvent.click(screen.getByText('grandchild 1'));

    // ASSERT
    expect(onChange).toHaveBeenCalledWith({
      line1: false,
      line2: true,
      line3: false,
      child1: false,
      child2: false,
      child3: true,
      child4: false,
      grandchild1: true
    });
  });
});
