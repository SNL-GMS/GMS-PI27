import { Alignment, Button, Icon } from '@blueprintjs/core';
import React from 'react';

import type { ToolbarItemBase, ToolbarItemElement } from '../types';

/**
 * Type guard, for use when rendering overflow menu items.
 */
export function isButtonToolbarItem(object: unknown): object is ButtonToolbarItemProps {
  return (object as ButtonToolbarItemProps).onButtonClick !== undefined;
}

/**
 * Properties to pass to the {@link ButtonToolbarItem}
 *
 * @see {@link ToolbarItemBase} for base properties.
 */
export interface ButtonToolbarItemProps extends ToolbarItemBase {
  onButtonClick: ((event: React.MouseEvent<HTMLElement, MouseEvent>) => void) &
    React.MouseEventHandler<HTMLButtonElement>;
  marginRight?: number;
}

/**
 * Represents a group of buttons used within a toolbar
 *
 * @param buttonItem the buttonItem to display {@link ButtonItem}
 */
export function ButtonToolbarItem({
  widthPx,
  onlyShowIcon,
  style,
  disabled,
  label,
  labelRight,
  tooltip,
  icon,
  onMouseEnter,
  onMouseOut,
  cyData,
  onButtonClick,
  marginRight = 0
}: ButtonToolbarItemProps): ToolbarItemElement {
  const widthAsString = widthPx ? `${widthPx}px` : undefined;
  const width = widthAsString || (onlyShowIcon ? '30px' : undefined);

  return (
    <div style={style ?? {}}>
      <Button
        className={onlyShowIcon ? 'toolbar-button--icon-only' : 'toolbar-button'}
        style={{
          width,
          marginRight: marginRight ? `${marginRight}px` : undefined
        }}
        disabled={disabled}
        alignText={onlyShowIcon && !labelRight ? Alignment.CENTER : Alignment.LEFT}
        onClick={onButtonClick}
        title={tooltip}
        onMouseEnter={onMouseEnter}
        onMouseOut={onMouseOut}
        data-cy={cyData}
      >
        {!onlyShowIcon && <span key="toolbar-button--label">{label}</span>}
        {icon && <Icon icon={icon} title={false} />}
        {labelRight && <span key="toolbar-button--label-right">{labelRight}</span>}
      </Button>
    </div>
  );
}
