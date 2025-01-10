import type Immutable from 'immutable';
import React from 'react';

import { PopoverButton } from '../../../popover-button';
import type { ToolbarItemBase, ToolbarItemElement } from '../../types';
import type { NestedCheckboxListRecord } from './nested-checkbox-element';
import { NestedCheckboxList } from './nested-checkbox-list';

/**
 * Type guard, for use when rendering overflow menu items.
 */
export function isNestedCheckboxDropdownToolbarItem(
  object: unknown
): object is NestedCheckboxDropdownToolbarItemProps {
  return (object as NestedCheckboxDropdownToolbarItemProps).checkBoxElements !== undefined;
}

/**
 * props for {@link CheckboxDropdownToolbarItem}
 *
 * @see {@link ToolbarItemBase} for base properties.
 */
export interface NestedCheckboxDropdownToolbarItemProps extends ToolbarItemBase {
  checkBoxElements: NestedCheckboxListRecord[];
  keyToCheckedRecord: Record<string, boolean>;
  keyToColorRecord?: Record<string, string>;
  keysToDividerMap?: Immutable.Map<string, boolean>;
  children?: JSX.Element;
  /** callback to change event */
  onChange(value: Record<string, boolean>): void;

  /** callback to onPopUp (list appearing) event */
  onPopUp?(ref?: HTMLDivElement): void;

  /** callback to onPopoverDismissed (list disappears) event */
  onPopoverDismissed?(): void;
}

/**
 * Represents a dropdown list of checkbox items used within a toolbar
 *
 * @param checkboxItem the checkboxItem to display {@link CheckboxDropdownItem}
 */
export function NestedCheckboxDropdownToolbarItem({
  checkBoxElements,
  keyToCheckedRecord,
  keyToColorRecord,
  keysToDividerMap,
  onChange,
  onPopUp,
  onPopoverDismissed,
  style,
  label,
  tooltip,
  disabled,
  widthPx,
  popoverButtonMap,
  children
}: NestedCheckboxDropdownToolbarItemProps): ToolbarItemElement {
  const handleRef = (
    ref: PopoverButton | null | undefined,
    buttonMap: Map<number, PopoverButton> | null | undefined
  ): void => {
    if (ref && buttonMap) {
      buttonMap.set(1, ref);
    }
  };

  return (
    <div style={style ?? {}}>
      <PopoverButton
        label={label || ''}
        tooltip={tooltip || ''}
        disabled={disabled}
        popupContent={
          <div>
            <NestedCheckboxList
              checkBoxElements={checkBoxElements}
              keyToCheckedRecord={keyToCheckedRecord}
              keyToColorRecord={keyToColorRecord}
              keysToDividerMap={keysToDividerMap}
              onChange={onChange}
            />
            <div className="nested-checkbox__footer_text">{children}</div>
          </div>
        }
        onPopoverDismissed={onPopoverDismissed}
        widthPx={widthPx}
        onClick={onPopUp}
        ref={ref => handleRef(ref, popoverButtonMap)}
      />
    </div>
  );
}
