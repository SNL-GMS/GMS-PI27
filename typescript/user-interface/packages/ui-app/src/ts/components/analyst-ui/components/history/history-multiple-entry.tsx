/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { HistoryEntry } from './history-entry';
import type { History } from './types';

export interface HistoryMultipleEntryProps extends History {
  readonly isAffected: boolean;
  readonly handleAction?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly handleMouseEnter?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly handleMouseOut?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

/**
 * Renders the {@link HistoryMultipleEntry} with props {@link HistoryMultipleEntryProps}
 */
export const HistoryMultipleEntry = React.memo(function HistoryMultipleEntry(
  props: HistoryMultipleEntryProps
) {
  const { id, changes, type, isAffected } = props;
  const [expanded, toggleExpanded] = React.useState(false);
  return (
    <div className="history-row--multi">
      <HistoryEntry key={`Multi:${id}`} {...props} />
      <div className={`history-row__child-container ${expanded ? 'is-expanded' : ''}`}>
        {expanded
          ? changes.map(child => (
              <div key={child.id}>
                <div />
                <HistoryEntry
                  key={`Child={true}: ${id}-${child.id}`}
                  {...child}
                  isChild
                  handleAction={undefined}
                  isAffected={isAffected && child.isIncluded && child.type === type}
                />
              </div>
            ))
          : ''}
      </div>
      <div
        className={`toggle-button
          toggle-button--${type ? type.toLowerCase() : 'hidden'}`}
        onClick={() => {
          toggleExpanded(!expanded);
        }}
      >
        <Icon className={`${expanded ? 'is-inverted' : ''}`} icon={IconNames.CHEVRON_DOWN} />
      </div>
    </div>
  );
});
