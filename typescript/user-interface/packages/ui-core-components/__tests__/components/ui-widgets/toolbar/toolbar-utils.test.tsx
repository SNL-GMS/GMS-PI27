import { H1 } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { DATE_TIME_FORMAT } from '@gms/common-util';
import Immutable from 'immutable';
import React from 'react';

import type { ButtonToolbarItemWithKey } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/button-group-item';
import { ButtonGroupToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/button-group-item';
import { ButtonToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/button-item';
import { CheckboxDropdownToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/checkbox-dropdown-item';
import { DateRangePickerToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/date-range-picker-item';
import { DropdownToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/dropdown-item';
import { LabelValueToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/label-value-item';
import { LoadingSpinnerToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/loading-spinner-item';
import { NumericInputToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/numeric-input-item';
import { PopoverButtonToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/popover-button-item';
import { SwitchToolbarItem } from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-item/switch-item';
import {
  getSizeOfAllRenderedItems,
  getSizeOfItems,
  renderOverflowMenuItem
} from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-utils';
import type { ToolbarItemElement } from '../../../../src/ts/components/ui-widgets/toolbar/types';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const element = <H1>Test</H1>;

const buttonProps: ButtonToolbarItemWithKey = {
  buttonKey: 'button-item-1',
  disabled: false,
  label: 'Pan Left',
  tooltip: 'Pan waveforms to the left',
  icon: IconNames.ARROW_LEFT,
  onlyShowIcon: true,
  onButtonClick: () => jest.fn()
};

const toolbarItems: ToolbarItemElement[] = [
  <ButtonToolbarItem
    key="button"
    onButtonClick={jest.fn()}
    tooltip="Button Hello"
    hasIssue={false}
  />,
  <ButtonGroupToolbarItem
    key="buttongroup"
    buttons={[buttonProps]}
    tooltip="Button675 Group Hello"
    hasIssue={false}
    widthPx={50}
  />,
  <CheckboxDropdownToolbarItem
    key="checkboxdropdown"
    enumToCheckedMap={Immutable.Map<string, boolean>()}
    checkboxEnum={undefined}
    onChange={jest.fn()}
    tooltip="Hello CheckboxDropdown"
    hasIssue={false}
    widthPx={50}
  />,
  <DateRangePickerToolbarItem
    key="datepicker"
    startTimeMs={100}
    endTimeMs={1000}
    onChange={jest.fn()}
    format={DATE_TIME_FORMAT}
    onApplyButton={jest.fn()}
    tooltip="Hello Date Range"
    hasIssue={false}
    widthPx={50}
  />,
  <DropdownToolbarItem
    key="dropdown"
    dropDownItems={[]}
    value="Hello Dropdown"
    onChange={jest.fn()}
    tooltip="Hello Dropdown"
    hasIssue={false}
    widthPx={50}
  />,
  <LabelValueToolbarItem
    key="labelvalue"
    labelValue=""
    tooltip="Hello label"
    label="label"
    menuLabel="menu label"
    widthPx={50}
  />,
  <LoadingSpinnerToolbarItem
    key="loadingspinner"
    itemsToLoad={1}
    tooltip="Hello LoadingSpinner"
    hasIssue={false}
    widthPx={50}
  />,
  <NumericInputToolbarItem
    key="numericinput"
    numericValue={42}
    minMax={{
      max: 43,
      min: 41
    }}
    onChange={jest.fn()}
    tooltip="Hello Numeric"
    hasIssue={false}
    widthPx={50}
  />,
  <PopoverButtonToolbarItem
    key="popover"
    popoverContent={element}
    onPopoverDismissed={jest.fn()}
    tooltip="Hello Popover"
    hasIssue={false}
    widthPx={50}
  />,
  <SwitchToolbarItem key="switch-test" switchValue onChange={jest.fn()} widthPx={50} />
];

describe('Toolbar utils', () => {
  test('Toolbar utils has defined exported functions', () => {
    expect(renderOverflowMenuItem).toBeDefined();
    expect(getSizeOfItems).toBeDefined();
    expect(getSizeOfAllRenderedItems).toBeDefined();
  });

  test('renderMenuItem renders items', () => {
    const renderedItems = toolbarItems.map((item: ToolbarItemElement) => {
      return renderOverflowMenuItem(item, item.key);
    });

    expect(renderedItems).toMatchSnapshot();
  });

  test('getSizeOfItems returns the item size', () => {
    const toolbarItemRefs: any[] = [
      {
        getBoundingClientRect: jest.fn(() => {
          return {
            width: 10
          };
        })
      },
      {
        getBoundingClientRect: jest.fn(() => {
          return {
            width: 10
          };
        })
      }
    ];
    const resultWidth = 20;
    expect(getSizeOfItems(toolbarItemRefs)).toEqual(resultWidth);
    expect(toolbarItemRefs[0].getBoundingClientRect).toHaveBeenCalledTimes(1);
  });

  test("getSizeOfAllRenderedItems returns the items' total size", () => {
    const toolbarItemRightRefs: any[] = [
      {
        getBoundingClientRect: jest.fn(() => {
          return {
            width: 10
          };
        })
      },
      {
        getBoundingClientRect: jest.fn(() => {
          return {
            width: 10
          };
        })
      }
    ];
    const toolbarItemLeftRefs: any[] = [
      {
        getBoundingClientRect: jest.fn(() => {
          return {
            width: 10
          };
        })
      },
      {
        getBoundingClientRect: jest.fn(() => {
          return {
            width: 10
          };
        })
      }
    ];
    const whiteSpace = 10;
    const resultWidth = 50;
    expect(
      getSizeOfAllRenderedItems(toolbarItemLeftRefs, toolbarItemRightRefs, whiteSpace)
    ).toEqual(resultWidth);
  });
});
