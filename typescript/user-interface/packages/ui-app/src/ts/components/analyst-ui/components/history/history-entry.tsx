/* eslint-disable jsx-a11y/mouse-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { Icon, Intent, Position, Tooltip } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useHistoryEventModeHotkeyConfig, useHistoryMode } from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';

import { messageConfig } from '~analyst-ui/config/message-config';
import { systemConfig } from '~analyst-ui/config/system-config';
import { formatHotkeysForOs } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import type { HistoryChange } from './types';

export interface HistoryEntryProps extends HistoryChange {
  readonly isChild?: boolean;
  readonly isAffected: boolean;
  readonly handleAction?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly handleMouseEnter?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly handleMouseOut?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

/** returns a string of class names based on the props for styling */
const useGetClassNames = (props: HistoryEntryProps): string => {
  const { isAffected, isChild, isApplied, isIncluded } = props;
  const { isAssociated, isAssociatedToOther, isUnAssociated, isRelatedToEvent } = props;
  const { isCompleted, isConflictCreated, isConflictResolved, isDeletion, isRejection } = props;
  const [, , isEventMode] = useHistoryMode();

  return classNames({
    'list__column history-entry': true,
    'history-entry--undo': props.type === 'undo',
    'history-entry--redo': props.type === 'redo',
    'is-child': isChild,
    'is-applied': isApplied,
    'is-included': isIncluded,
    'is-affected': isAffected,
    'is-associated': isAssociated,
    'is-associated-to-other': isAssociatedToOther,
    'is-unassociated': isUnAssociated,
    'is-related-to-event': isRelatedToEvent,
    'is-completed': isCompleted,
    'is-conflict-created': isConflictCreated,
    'is-conflict-resolved': isConflictResolved,
    'is-deletion': isDeletion,
    'is-rejection': isRejection,
    'is-event-mode': isEventMode
  });
};

/** renders the conflict icon based on the flags `isConflictCreated` and `isConflictResolved` */
const ConflictIcon = React.memo(function ConflictIcon(
  props: Pick<HistoryEntryProps, 'isConflictCreated' | 'isConflictResolved'>
) {
  const { isConflictCreated, isConflictResolved } = props;

  if (!isConflictCreated && !isConflictResolved) {
    return undefined;
  }

  const icon = isConflictCreated ? IconNames.ISSUE : IconNames.ISSUE_CLOSED;
  const content = isConflictCreated
    ? 'This action created a conflict'
    : 'This action resolved a conflict';
  const intent = isConflictCreated ? Intent.DANGER : Intent.SUCCESS;

  return (
    <Tooltip
      content={content}
      hoverOpenDelay={systemConfig.interactionDelay.slow}
      position={Position.BOTTOM}
    >
      <Icon className="history-entry__icon" intent={intent} icon={icon} />
    </Tooltip>
  );
});

/**  renders an event undo icon if the action can be undone/redone with event undo/redo */
const EventUndoIcon = React.memo(function EventUndoIcon({
  type,
  isRelatedToEvent
}: Pick<HistoryEntryProps, 'type' | 'isRelatedToEvent'>) {
  const [config] = useHistoryEventModeHotkeyConfig();

  if (!isRelatedToEvent) return null;

  const action = type === 'undo' ? 'undone' : 'redone';
  const tooltip = `Action may be ${action}  in event mode (hold ${formatHotkeysForOs(
    config.combo
  )})`;
  return (
    <Tooltip
      content={tooltip}
      hoverOpenDelay={systemConfig.interactionDelay.slow}
      position={Position.BOTTOM}
    >
      <Icon
        className="history-entry__icon history-entry__icon--associated"
        icon={IconNames.History}
      />
    </Tooltip>
  );
});

/** renders the undo/redo icon based on the type; whether the change is applied or not */
const UndoRedoIcon = React.memo(function UndoRedoIcon(props: Pick<HistoryEntryProps, 'type'>) {
  const { type } = props;
  const [, , isEventMode] = useHistoryMode();

  if (!type) {
    return undefined;
  }

  const undoContent = isEventMode
    ? messageConfig.tooltipMessages.history.undoEventLevelActionMessage
    : messageConfig.tooltipMessages.history.undoActionMessage;

  const redoContent = isEventMode
    ? messageConfig.tooltipMessages.history.redoEventLevelActionMessage
    : messageConfig.tooltipMessages.history.redoActionMessage;

  return (
    <Tooltip
      content={type === 'undo' ? `${undoContent}` : `${redoContent}`}
      hoverOpenDelay={systemConfig.interactionDelay.slow}
      position={Position.BOTTOM}
    >
      <Icon
        className="history-entry__icon"
        icon={type === 'undo' ? IconNames.UNDO : IconNames.REDO}
      />
    </Tooltip>
  );
});

/**
 * Renders the {@link HistoryEntry} with props {@link HistoryEntryProps}
 */
export const HistoryEntry = React.memo(function HistoryEntry(props: HistoryEntryProps) {
  const { type, label, description } = props;
  const { isConflictCreated, isConflictResolved, isRelatedToEvent } = props;
  const { handleAction, handleMouseEnter, handleMouseOut } = props;
  const className = useGetClassNames(props);

  const handleFocusAndCallback = React.useCallback(
    (
      callback: (
        event: React.MouseEvent<HTMLDivElement, MouseEvent> | React.KeyboardEvent<HTMLDivElement>
      ) => void,
      focus = false
    ) =>
      (
        event: React.MouseEvent<HTMLDivElement, MouseEvent> | React.KeyboardEvent<HTMLDivElement>
      ) => {
        if (focus) {
          event.currentTarget.focus();
        }
        if (callback) {
          callback(event);
        }
      },
    []
  );

  return (
    <div
      className={className}
      tabIndex={0}
      onClick={handleAction ? e => handleAction(e) : undefined}
      onMouseOver={handleFocusAndCallback(handleMouseEnter)}
      onMouseOut={handleFocusAndCallback(handleMouseOut)}
      onKeyDown={handleFocusAndCallback(undefined, true)}
      onKeyUp={handleFocusAndCallback(undefined)}
    >
      <span className="history-entry__label">{`${label}:`}</span>
      <span className="history-entry__description">{description}</span>
      <ConflictIcon isConflictCreated={isConflictCreated} isConflictResolved={isConflictResolved} />
      <EventUndoIcon type={type} isRelatedToEvent={isRelatedToEvent} />
      <UndoRedoIcon type={type} />
    </div>
  );
});
