import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { CheckboxSearchList } from '../../../../src/ts/components/ui-widgets/checkbox-search-list/checkbox-search-list';
import type * as CheckboxSearchListTypes from '../../../../src/ts/components/ui-widgets/checkbox-search-list/types';

const checkboxItem1 = {
  id: '1',
  name: 'first',
  checked: true
};

const checkboxItem2 = {
  id: '2',
  name: 'second',
  checked: false
};

const checkboxItem3 = {
  id: '3',
  name: 'third',
  checked: false
};

const checkboxItems = [checkboxItem1, checkboxItem2, checkboxItem3];
const onCheckboxChecked = jest.fn();
const props: CheckboxSearchListTypes.CheckboxListProps = {
  items: checkboxItems,
  maxHeightPx: 300,
  onCheckboxChecked
};

describe('CheckboxSearchList', () => {
  it('to be defined', () => {
    expect(CheckboxSearchList).toBeDefined();
  });

  it('CheckboxSearchList renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<CheckboxSearchList {...props} />);
    expect(result.container).toMatchSnapshot();
  });

  it('CheckboxSearchList functions and clicks', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<CheckboxSearchList {...props} />);
    fireEvent.click(result.getAllByRole('checkbox')[0]);
    fireEvent.change(result.getByRole('searchbox'), { target: { value: '23' } });
    fireEvent.blur(result.getByRole('searchbox'));
    expect(onCheckboxChecked).toHaveBeenCalledWith('1', false);
  });
});
