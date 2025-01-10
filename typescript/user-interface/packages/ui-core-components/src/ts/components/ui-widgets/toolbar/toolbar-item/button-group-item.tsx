import React from 'react';

import type { ToolbarItemBase, ToolbarItemElement } from '../types';
import type { ButtonToolbarItemProps } from './button-item';
import { ButtonToolbarItem } from './button-item';

/**
 * Type guard, for use when rendering overflow menu items.
 */
export function isButtonGroupToolbarItem(object: unknown): object is ButtonGroupToolbarProps {
  return (object as ButtonGroupToolbarProps).buttons !== undefined;
}

export type ButtonToolbarItemWithKey = ButtonToolbarItemProps & {
  /** Must be stable and unique */
  buttonKey: React.Key;
};

/**
 * Properties to pass to the {@link ButtonGroupToolbarItem}
 *
 * @see {@link ToolbarItemBase} for base properties.
 */
export interface ButtonGroupToolbarProps extends ToolbarItemBase {
  /** Array of props for {@link ButtonToolbarItem} items to be rendered. */
  buttons: ButtonToolbarItemWithKey[];
}

/**
 * Represents a group of buttons used within a toolbar
 *
 * @param groupItem Properties to pass to the ButtonGroup {@link ButtonGroupToolbarProps}
 */
export function ButtonGroupToolbarItem({
  buttons,
  style,
  cyData
}: ButtonGroupToolbarProps): ToolbarItemElement {
  const indexOfLastButton = buttons.length - 1;
  return (
    <div className="toolbar-button-group" data-cy={cyData} style={style ?? {}}>
      {buttons.map((button, index) => {
        return (
          <ButtonToolbarItem
            key={button.buttonKey}
            widthPx={button.widthPx}
            onlyShowIcon={button.onlyShowIcon}
            style={button.style}
            disabled={button.disabled}
            label={button.label}
            labelRight={button.labelRight}
            tooltip={button.tooltip}
            icon={button.icon}
            onButtonClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) =>
              button.onButtonClick(e)
            }
            onMouseEnter={() => {
              if (button.onMouseEnter) {
                button.onMouseEnter();
              }
            }}
            onMouseOut={() => {
              if (button.onMouseOut) {
                button.onMouseOut();
              }
            }}
            marginRight={index !== indexOfLastButton ? 2 : 0}
            cyData={button.cyData}
          />
        );
      })}
    </div>
  );
}
