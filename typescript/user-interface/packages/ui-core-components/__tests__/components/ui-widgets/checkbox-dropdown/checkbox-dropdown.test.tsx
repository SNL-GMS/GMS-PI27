import { fireEvent, render } from '@testing-library/react';
import Immutable from 'immutable';
import React from 'react';

import { CheckboxList } from '../../../../src/ts/components/ui-widgets/checkbox-list';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
enum mockBoxEnum {
  firstBox = '1st',
  secondBox = '2nd',
  thirdBox = '3rd'
}
const mockEnumToCheckedMap = Immutable.Map([
  [mockBoxEnum.firstBox, false],
  [mockBoxEnum.secondBox, true],
  [mockBoxEnum.thirdBox, false]
]);
const mockKeysToDisplayStrings = Immutable.Map([
  [mockBoxEnum.firstBox, 'The first checkbox'],
  [mockBoxEnum.secondBox, 'The second checkbox'],
  [mockBoxEnum.thirdBox, 'The third checkbox']
]);
const mockColorMap = Immutable.Map([
  ['firstBox', '#123123'],
  ['secondBox', '#ABC123'],
  ['thirdBox', '#000000']
]);
const mockOnChange = jest.fn() as jest.Mock<Map<any, boolean>>;
const checkboxProps = {
  checkboxEnum: mockBoxEnum,
  enumToCheckedMap: mockEnumToCheckedMap,
  enumKeysToDisplayStrings: mockKeysToDisplayStrings,
  enumToColorMap: mockColorMap,
  onChange: mockOnChange
};

describe('checkbox dropdown', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('exists', () => {
    expect(CheckboxList).toBeDefined();
  });

  it('matches the snapshot', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<CheckboxList {...checkboxProps} />);
    expect(container).toMatchSnapshot();
  });

  it('updates state onChange', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<CheckboxList {...checkboxProps} />);
    fireEvent.click(result.getAllByRole('checkbox')[0]);
    expect(mockOnChange).toHaveBeenCalledWith(
      Immutable.Map({ '1st': true, '2nd': true, '3rd': false })
    );
  });
});
