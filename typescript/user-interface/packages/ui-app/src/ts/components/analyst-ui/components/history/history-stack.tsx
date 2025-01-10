/* eslint-disable react/jsx-props-no-spreading */
import { EventTypes } from '@gms/common-model';
import type { EventStatus, HistoryAction, HistoryItem } from '@gms/ui-state';
import {
  selectHistory,
  selectOpenEventId,
  useAppSelector,
  useEventStatusQuery,
  useHistoryUndoRedo
} from '@gms/ui-state';
import { findHistoriesByHistoryId } from '@gms/ui-state/lib/app/history/utils/find-histories-by-history-id';
import classNames from 'classnames';
import React from 'react';

import { HistoryEntry } from './history-entry';
import { HistoryMultipleEntry } from './history-multiple-entry';
import { HistoryStackRow } from './history-stack-row';
import type { History, HistoryChange, HistoryPointer } from './types';

/** converts a {@link HistoryItem} to a {@link HistoryChange} */
const convertToHistoryChange = (
  historyItem: HistoryItem,
  openEventId: string,
  isEventMode: boolean,
  eventStatus: Record<string, EventStatus>
): HistoryChange => {
  const isAssociated = historyItem.associatedIds.events[openEventId];
  const isAssociatedToOther =
    !isAssociated && Object.values(historyItem.associatedIds.events).some(v => v);
  const isUnAssociated = !isAssociated && !isAssociatedToOther;
  const isRelatedToEvent = openEventId
    ? historyItem.associatedIds.events[openEventId] != null
    : false;

  const status = eventStatus != null && openEventId != null ? eventStatus[openEventId] : undefined;
  const isCompleted = status
    ? status.eventStatusInfo.eventStatus === EventTypes.EventStatus.COMPLETE
    : false;

  return {
    id: historyItem.id,
    historyId: historyItem.historyId,
    label: historyItem.label,
    description: historyItem.description,
    type: historyItem.status === 'applied' ? 'undo' : 'redo',
    isApplied: historyItem.status === 'applied',
    isIncluded: !isEventMode || isRelatedToEvent,
    isAssociated,
    isAssociatedToOther,
    isUnAssociated,
    isRelatedToEvent,
    isCompleted,
    isConflictCreated: historyItem.conflictStatus === 'created conflict',
    isConflictResolved: historyItem.conflictStatus === 'resolved conflict',
    isDeletion: historyItem.isDeletion,
    isRejection: historyItem.isRejection
  };
};

/** returns the event related statuses */
const getEventStatuses = (
  changes: HistoryChange[]
): [boolean, boolean, boolean, boolean, boolean] => {
  const isAssociated = changes.some(c => c.isAssociated);
  const isAssociatedToOther = !isAssociated && changes.some(c => c.isAssociatedToOther);
  const isUnAssociated = !isAssociated && !isAssociatedToOther;
  const isRelatedToEvent = changes.some(c => c.isRelatedToEvent);
  const isCompleted = changes.some(c => c.isCompleted);
  return [isAssociated, isAssociatedToOther, isUnAssociated, isRelatedToEvent, isCompleted];
};

/** returns the conflict statuses */
const getConflictStatuses = (historyItem, changes: HistoryChange[]): [boolean, boolean] => {
  const isConflictCreated =
    historyItem.conflictStatus === 'created conflict' || changes.some(c => c.isConflictCreated);

  const isConflictResolved =
    historyItem.conflictStatus === 'resolved conflict' || changes.some(c => c.isConflictResolved);

  return [isConflictCreated, isConflictResolved];
};

/** hook that maps the Redux History state to {@link History} */
export const useHistory = (): [
  History[],
  (decrement?: number) => void,
  (id: string) => void,
  (increment?: number) => void,
  (id: string) => void,
  boolean,
  boolean,
  number,
  number,
  boolean
] => {
  const historyState = useAppSelector(selectHistory);
  const openEventId = useAppSelector(selectOpenEventId);
  const [
    undo,
    undoById,
    redo,
    redoById,
    isEventMode,
    undoPosition,
    redoPosition,
    canUndo,
    canRedo
  ] = useHistoryUndoRedo();

  const eventStatusQuery = useEventStatusQuery();

  const history: History[] = React.useMemo(
    () =>
      historyState.stack.map(historyItem => {
        const histories = findHistoriesByHistoryId(historyState, historyItem.historyId).filter(
          // filter out irrelevant changes; those changes that are associated but not directly related to the change
          entry => entry.historyItem.label != null && entry.historyItem.description != null
        );

        const changes: HistoryChange[] = histories
          .map<HistoryItem>(e => e.historyItem)
          .map<HistoryChange>(h =>
            convertToHistoryChange(h, openEventId, isEventMode, eventStatusQuery?.data)
          );

        let type: HistoryAction = historyItem.status === 'applied' ? 'undo' : 'redo';
        let isApplied = historyItem.status === 'applied';

        const isIncluded = !isEventMode || changes.some(c => c.isIncluded);

        if (isEventMode && changes.length > 0) {
          type = changes.filter(c => c.isIncluded).some(c => c.type === 'undo') ? 'undo' : 'redo';
          isApplied = changes.filter(c => c.isIncluded).some(c => c.isApplied);
        }

        const [isAssociated, isAssociatedToOther, isUnAssociated, isRelatedToEvent, isCompleted] =
          getEventStatuses(changes);

        const [isConflictCreated, isConflictResolved] = getConflictStatuses(historyItem, changes);

        const isDeletion = historyItem.isDeletion || changes.some(c => c.isDeletion);
        const isRejection = historyItem.isRejection || changes.some(c => c.isRejection);

        return {
          id: historyItem.id,
          historyId: historyItem.historyId,
          label: historyItem.label,
          description: historyItem.description,
          changes,
          type,
          isApplied,
          isIncluded,
          isAssociated,
          isAssociatedToOther,
          isUnAssociated,
          isRelatedToEvent,
          isCompleted,
          isConflictCreated,
          isConflictResolved,
          isDeletion,
          isRejection
        };
      }),
    [eventStatusQuery.data, historyState, isEventMode, openEventId]
  );
  return [
    history,
    undo,
    undoById,
    redo,
    redoById,
    canUndo,
    canRedo,
    undoPosition,
    redoPosition,
    isEventMode
  ];
};

/**
 * Renders the {@link HistoryStack}
 */
export const HistoryStack = React.memo(function HistoryStack() {
  const [historyPointer, setHistoryPointer] = React.useState<HistoryPointer>(undefined);
  const [
    history,
    ,
    undoById,
    ,
    redoById,
    canUndo,
    canRedo,
    undoPosition,
    redoPosition,
    isEventMode
  ] = useHistory();

  const areUndoRedoAdjacent = React.useMemo(
    () => undoPosition === redoPosition - 1,
    [redoPosition, undoPosition]
  );

  const handleAction = React.useCallback(
    (entry: History) => () => {
      const { id, isIncluded } = entry;
      if (isIncluded) {
        const { isApplied } = entry;
        if (canUndo && isApplied && entry.type === 'undo') {
          undoById(id);
        } else if (canRedo && !isApplied && entry.type === 'redo') {
          redoById(id);
        }
      }
    },
    [canUndo, canRedo, undoById, redoById]
  );

  const handleMouseEnterAndOut = React.useCallback(
    (index: number | undefined) => () => {
      setHistoryPointer(index != null ? { index } : undefined);
    },
    [setHistoryPointer]
  );

  return (
    <div
      className={classNames({ list: true, 'list--history': true, 'is-event-mode': isEventMode })}
    >
      {history.map((entry, index) => {
        const areUndoRedoJoined =
          redoPosition >= 0 && undoPosition === redoPosition && index === redoPosition;

        let isAffected = false;
        if (historyPointer?.index != null) {
          isAffected = entry.isApplied
            ? historyPointer.index <= index &&
              entry.isIncluded &&
              history[historyPointer.index].type === entry.type
            : historyPointer.index >= index &&
              entry.isIncluded &&
              history[historyPointer.index].type === entry.type;
        }

        return (
          <React.Fragment key={`row:${entry.id}`}>
            <HistoryStackRow
              isFirstRow={index === 0}
              undoTarget={index === undoPosition}
              redoTarget={index === redoPosition}
              areUndoRedoAdjacent={areUndoRedoAdjacent}
              areUndoRedoJoined={areUndoRedoJoined}
            >
              {entry.changes.length > 1 ? (
                <HistoryMultipleEntry
                  key={entry.id}
                  {...entry}
                  isAffected={isAffected}
                  handleAction={entry.isIncluded ? handleAction(entry) : undefined}
                  handleMouseEnter={handleMouseEnterAndOut(index)}
                  handleMouseOut={handleMouseEnterAndOut(undefined)}
                />
              ) : (
                <HistoryEntry
                  key={entry.id}
                  {...entry.changes[0]}
                  isAffected={isAffected}
                  handleAction={entry.isIncluded ? handleAction(entry) : undefined}
                  handleMouseEnter={handleMouseEnterAndOut(index)}
                  handleMouseOut={handleMouseEnterAndOut(undefined)}
                />
              )}
            </HistoryStackRow>
          </React.Fragment>
        );
      })}
    </div>
  );
});
