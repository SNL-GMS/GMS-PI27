/* eslint-disable react/destructuring-assignment */
import type { DefaultPopoverTargetHTMLProps, TooltipProps } from '@blueprintjs/core';
import { PopoverPosition, Tooltip } from '@blueprintjs/core';
import * as React from 'react';

/**
 * Creates a Blueprint Tooltip around the children of this, with sensible defaults.
 */
export function TooltipWrapper<
  T extends DefaultPopoverTargetHTMLProps = DefaultPopoverTargetHTMLProps
>(props: React.PropsWithChildren<TooltipProps<T>>): JSX.Element {
  const defaultHoverOpenDelay = 300;
  return (
    <Tooltip
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={props.className || 'core-tooltip'}
      content={props.content}
      onOpened={props.onOpened}
      position={props.position || PopoverPosition.BOTTOM}
      targetTagName={props.targetTagName || 'div'}
      hoverOpenDelay={props.hoverOpenDelay ?? defaultHoverOpenDelay}
    >
      {props.children}
    </Tooltip>
  );
}
