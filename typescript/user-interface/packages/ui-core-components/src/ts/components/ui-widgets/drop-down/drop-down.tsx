import { Button, HTMLSelect } from '@blueprintjs/core';
import kebabCase from 'lodash/kebabCase';
import React from 'react';

/**
 * Props for {@link DropDown}. Takes a generic type for the options.
 */
export interface DropDownProps<T extends object> {
  value: string;
  /** Selectable items to be shown in the dropdown */
  dropDownItems: T;
  /** Option text to be shown instead of the drop down item values. */
  dropDownText?: {
    [key in keyof T]: string;
  };
  /** List of options to be disabled if they are found in the given items */
  disabledDropDownOptions?: string[];
  widthPx?: number;
  disabled?: boolean;
  title?: string;
  custom?: boolean;
  className?: string;
  label?: string;
  /** Defaults to false for legacy reasons. Set to true if you want a label for your dropdown */
  displayLabel?: boolean;
  isLoading?: boolean;
  onChange: (value: string) => void;
}

const UNSELECTABLE_CUSTOM_VALUE = 'UNSELECTED_CUSTOM_VALUE';

/**
 * Drop Down menu
 */
export function DropDown<T extends object>({
  value,
  dropDownItems,
  dropDownText,
  disabledDropDownOptions,
  widthPx,
  disabled,
  title,
  custom,
  className,
  label,
  displayLabel,
  isLoading = false,
  onChange
}: DropDownProps<T>) {
  if (dropDownText && Object.keys(dropDownText).length !== Object.keys(dropDownItems).length) {
    throw new Error('dropDownText must be of equal length to dropDownItems');
  }

  /**
   * Creates the HTML for the dropdown items for the type input
   */
  const dropDownOptions = React.useMemo<JSX.Element[] | undefined>(() => {
    if (!dropDownItems) return undefined;
    return Object.keys(dropDownItems).map<JSX.Element>(type => (
      <option
        key={type}
        value={dropDownItems[type]}
        // If a disabledDropDownOptions is passed in, disable any options that exist in the array
        disabled={
          disabledDropDownOptions
            ? disabledDropDownOptions.indexOf(dropDownItems[type]) > -1
            : false
        }
      >
        {dropDownText ? dropDownText[type] : dropDownItems[type]}
      </option>
    ));
  }, [disabledDropDownOptions, dropDownItems, dropDownText]);

  const minWidth = `${widthPx}px`;
  const altStyle = {
    minWidth,
    width: minWidth
  };
  const kebabLabel = kebabCase(label);

  return (
    <div className="dropdown-container">
      {displayLabel && label && (
        <span className="dropdown-label">{label.length !== 0 ? `${label}: ` : ''}</span>
      )}
      {isLoading ? (
        <Button loading className="dropdown-selector is-loading" />
      ) : (
        <span className="dropdown-selector" data-cy={`${kebabLabel}-dropdown`}>
          <HTMLSelect
            title={`${title}`}
            disabled={disabled}
            style={widthPx !== undefined ? altStyle : undefined}
            className={className}
            onChange={e => {
              const input = e.target.value;
              if (custom && input === UNSELECTABLE_CUSTOM_VALUE) {
                return;
              }
              onChange(input);
            }}
            value={custom ? UNSELECTABLE_CUSTOM_VALUE : value}
          >
            {dropDownOptions}
            {custom ? (
              <option key={UNSELECTABLE_CUSTOM_VALUE} value={UNSELECTABLE_CUSTOM_VALUE}>
                Custom
              </option>
            ) : null}
          </HTMLSelect>
        </span>
      )}
    </div>
  );
}
