import React from 'react';

export interface HistoryStackRowProps {
  readonly isFirstRow: boolean;
  readonly undoTarget: boolean;
  readonly redoTarget: boolean;
  readonly areUndoRedoAdjacent: boolean;
  readonly areUndoRedoJoined: boolean;
}

/**
 * Renders the {@link HistoryStackRow} with props {@link HistoryStackRowProps}
 */
export const HistoryStackRow = React.memo(function HistoryStackRow(
  props: React.PropsWithChildren<HistoryStackRowProps>
) {
  const { undoTarget, redoTarget, areUndoRedoAdjacent } = props;
  const { areUndoRedoJoined, isFirstRow, children } = props;
  return (
    <li
      className={`list__row entry-row
      ${undoTarget ? 'action-indicator-bottom ' : ''}
      ${redoTarget && (!areUndoRedoAdjacent || isFirstRow) ? 'action-indicator-top ' : ''}`}
    >
      <div
        className={`list__column list__column--meta-container
        ${redoTarget ? 'bottom' : ''}
        ${redoTarget && areUndoRedoAdjacent ? 'move-up' : ''}
        ${areUndoRedoJoined ? 'mixed' : ''}`}
      >
        <span className="action-indicator__text">{redoTarget ? 'REDO' : ''}</span>
        <span className="action-indicator__text">{undoTarget ? 'UNDO' : ''}</span>
      </div>
      {children}
    </li>
  );
});
