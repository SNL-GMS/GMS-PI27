import { render } from '@testing-library/react';
import React from 'react';

import type { DropDownProps } from '../../src/ts/components/ui-widgets/drop-down';
import { DropDown } from '../../src/ts/components/ui-widgets/drop-down';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Core drop down', () => {
  enum TEST_ENUM {
    test = 'test',
    foo = 'foo',
    bar = 'bar'
  }
  let testValue = TEST_ENUM.bar;
  const propsDisabled: DropDownProps<typeof TEST_ENUM> = {
    dropDownItems: TEST_ENUM,
    value: testValue,
    displayLabel: false,
    widthPx: 120,
    disabled: false,
    disabledDropDownOptions: [TEST_ENUM.test],
    onChange: value => {
      testValue = value as TEST_ENUM;
    }
  };
  const propsWithLabel: DropDownProps<typeof TEST_ENUM> = {
    dropDownItems: TEST_ENUM,
    value: testValue,
    displayLabel: true,
    label: 'best label ever',
    widthPx: 120,
    disabled: false,
    onChange: value => {
      testValue = value as TEST_ENUM;
    }
  };
  const propsWithLabelNoDisplay: DropDownProps<typeof TEST_ENUM> = {
    dropDownItems: TEST_ENUM,
    value: testValue,
    label: 'best label ever',
    displayLabel: false,
    widthPx: 120,
    disabled: false,
    onChange: value => {
      testValue = value as TEST_ENUM;
    }
  };
  it('Renders with label', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<DropDown {...propsWithLabel} />);
    expect(result.container).toMatchSnapshot();
  });

  it('Renders without label', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<DropDown {...propsWithLabelNoDisplay} />);
    expect(result.container).toMatchSnapshot();
  });

  it('Renders with disable dropdown options', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<DropDown {...propsDisabled} />);
    expect(result.container).toMatchSnapshot();
  });

  it('Can render custom value', () => {
    testValue = TEST_ENUM.bar;
    const propsCustom: DropDownProps<typeof TEST_ENUM> = {
      dropDownItems: TEST_ENUM,
      value: testValue,
      widthPx: 120,
      disabled: false,
      onChange: value => {
        testValue = value as TEST_ENUM;
      },
      custom: true,
      dropDownText: {
        [TEST_ENUM.test]: 'Test',
        [TEST_ENUM.foo]: 'Foo',
        [TEST_ENUM.bar]: 'Bar'
      }
    };
    // eslint-disable-next-line react/jsx-props-no-spreading
    const mockDropdownCustom = render(<DropDown {...propsCustom} />);
    expect(mockDropdownCustom.container).toMatchSnapshot();
  });
});
