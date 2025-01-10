import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { BlueprintIcons_16Id } from '@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16';
import classnames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import truncate from 'lodash/truncate';
import React from 'react';

import { CopyContents } from '../../copy-contents';
import type { Message } from '../types';

/** retrieves the icon type based on the message intent */
function getIcon(message: Message): BlueprintIcons_16Id {
  if (message.intent === 'danger') {
    return IconNames.ERROR;
  }
  if (message.intent === 'warning') {
    return IconNames.WARNING_SIGN;
  }
  return IconNames.INFO_SIGN;
}

/** returns a the summary and details as a simple string */
function getMessageAsString(message: Message): string {
  const details = message.details ? `. ${message.details}` : '';
  return `${message.summary}${details}`;
}

/**
 * The type of the props for the {@link FormMessage} component
 */
export interface FormMessageProps {
  message: Message | undefined;
  hasCopyButton?: boolean;
}

/**
 * A message for a form.
 */
export function FormMessage({ message, hasCopyButton }: FormMessageProps) {
  // require a message and a summary
  if (!message || message.summary == null || isEmpty(message.summary)) {
    return null;
  }

  const { intent } = message;
  const icon = getIcon(message);

  return (
    <div
      className={classnames('form-message', {
        'form-message--danger': intent === 'danger',
        'form-message--warning': intent === 'warning',
        'form-message--info': intent === 'success' || intent === 'primary'
      })}
    >
      <span className="form-message__summary">
        <Icon icon={icon} intent={intent} size={16} />
        {truncate(message.summary, { length: 75 })}
        {hasCopyButton && (
          <div className="form-message__copy-button">
            <CopyContents clipboardText={getMessageAsString(message)}>
              <Icon icon={IconNames.DUPLICATE} size={14} />
            </CopyContents>
          </div>
        )}
      </span>
      {message.details && (
        <span className="form-message__recommendation">
          {truncate(message.details, { length: 200 })}
        </span>
      )}
    </div>
  );
}
