import { Classes, Popover, PopoverPosition } from '@blueprintjs/core';
import classNames from 'classnames';
import React from 'react';

import { LoadingCounter } from './loading-counter';
import { LoadingInfo } from './loading-info';
import { LoadingInfoTooltip } from './loading-info-tooltip';
import { LoadingStatusIndicator } from './loading-status-indicator';

/**
 * Creates a loading widget for the status bar that shows a loading spinner, the number of requests complete,
 * the number in flight, and a description of the latest request made.
 */
export const LoadingWidget = React.memo(function LoadingWidget() {
  return (
    <Popover
      content={<LoadingInfoTooltip />}
      popoverClassName={classNames([Classes.TOOLTIP, Classes.DARK])}
      hoverOpenDelay={300}
      position={PopoverPosition.TOP_LEFT}
      autoFocus={false}
      enforceFocus={false}
      canEscapeKeyClose
      minimal
    >
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
      <div className="loading-widget" role="button">
        <LoadingStatusIndicator />
        <LoadingCounter />
        <LoadingInfo />
      </div>
    </Popover>
  );
});
