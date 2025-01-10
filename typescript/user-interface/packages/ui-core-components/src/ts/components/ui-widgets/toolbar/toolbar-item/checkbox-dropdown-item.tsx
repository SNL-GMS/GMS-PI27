import React from 'react';

import type { CheckboxListProps } from '../../checkbox-list';
import { CheckboxList } from '../../checkbox-list';
import { PopoverButton } from '../../popover-button';
import type { ToolbarItemBase, ToolbarItemElement } from '../types';

/**
 * Type guard, for use when rendering overflow menu items.
 */
export function isCheckboxDropdownToolbarItem(
  object: unknown
): object is CheckboxDropdownToolbarItemProps {
  return (object as CheckboxDropdownToolbarItemProps).checkboxEnum !== undefined;
}

/**
 * props for {@link CheckboxDropdownToolbarItem}
 *
 * @see {@link ToolbarItemBase} for base properties.
 */
export type CheckboxDropdownToolbarItemProps = ToolbarItemBase &
  CheckboxListProps & {
    /** callback to onPopUp (list appearing) event */
    onPopUp?(ref?: HTMLDivElement): void;

    /** callback to onPopoverDismissed (list disappears) event */
    onPopoverDismissed?(): void;
  };

/**
 * Represents a dropdown list of checkbox items used within a toolbar
 *
 * @param checkboxItem the checkboxItem to display {@link CheckboxDropdownItem}
 */
export function CheckboxDropdownToolbarItem({
  popoverButtonMap,
  style,
  label,
  tooltip,
  disabled,
  widthPx,
  enumToCheckedMap,
  enumToColorMap,
  checkboxEnum,
  enumKeysToDisplayStrings,
  enumKeysToDividerMap,
  enumKeysToLabelMap,
  onChange,
  onPopUp,
  onPopoverDismissed
}: CheckboxDropdownToolbarItemProps): ToolbarItemElement {
  const handleRef = React.useCallback(
    (ref: PopoverButton): void => {
      if (ref && popoverButtonMap) {
        popoverButtonMap.set(1, ref);
      }
    },
    [popoverButtonMap]
  );

  return (
    <div style={style ?? {}}>
      <PopoverButton
        label={label || ''}
        tooltip={tooltip || ''}
        disabled={disabled}
        popupContent={
          <CheckboxList
            enumToCheckedMap={enumToCheckedMap}
            enumToColorMap={enumToColorMap}
            checkboxEnum={checkboxEnum}
            enumKeysToDisplayStrings={enumKeysToDisplayStrings}
            enumKeysToDividerMap={enumKeysToDividerMap}
            enumKeysToLabelMap={enumKeysToLabelMap}
            onChange={onChange}
          />
        }
        onPopoverDismissed={onPopoverDismissed}
        widthPx={widthPx}
        onClick={onPopUp}
        ref={handleRef}
      />
    </div>
  );
}
