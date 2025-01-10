import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { Tooltip2Wrapper } from '../ui-widgets';

export interface DialogTitleProps {
  /** The title text to display in the top bar of the dialog */
  titleText: string;
  /** If provided, creates an info icon that shows this content in a tooltip on hover */
  tooltipContent?: JSX.Element | string;
}

/**
 * Creates a dialog title with an info tooltip
 */
export const DialogTitle = React.memo(function DialogTitle({
  titleText,
  tooltipContent
}: DialogTitleProps) {
  return (
    <span className="dialog-title">
      {titleText}
      {!!tooltipContent && (
        <Tooltip2Wrapper content={tooltipContent}>
          <Icon icon={IconNames.INFO_SIGN} size={16} />
        </Tooltip2Wrapper>
      )}
    </span>
  );
});
