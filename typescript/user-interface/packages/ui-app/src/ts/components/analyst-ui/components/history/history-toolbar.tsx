import { IconNames } from '@blueprintjs/icons';
import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonGroupToolbarItem, Toolbar } from '@gms/ui-core-components';
import { useHistoryKeyboardShortcutConfig, useHistoryUndoRedo } from '@gms/ui-state';
import React from 'react';

import { systemConfig } from '~analyst-ui/config/system-config';
import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';
import { formatHotkeysForOs } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import { setFocusToHistoryDisplay } from './history-util';

const buttonWidth = 120;

/**
 * Renders the {@link HistoryToolbar} with props {@link HistoryPanelProps}
 */
export const HistoryToolbar = React.memo(function HistoryToolbar() {
  const [displayWidthPx] = useBaseDisplaySize();
  const [undo, , redo, , isEventMode, , , canUndo, canRedo] = useHistoryUndoRedo();

  const undoKeyboardShortcutConfig = useHistoryKeyboardShortcutConfig('undo');
  const redoKeyboardShortcutConfig = useHistoryKeyboardShortcutConfig('redo');
  const eventUndoKeyboardShortcutConfig = useHistoryKeyboardShortcutConfig('eventUndo');
  const eventRedoKeyboardShortcutConfig = useHistoryKeyboardShortcutConfig('eventRedo');

  const eventMode = isEventMode ? 'Event ' : '';

  const buttonGroup: ToolbarTypes.ToolbarItemElement = React.useMemo(
    () => (
      <ButtonGroupToolbarItem
        key={`${eventMode}undo/redo buttons`}
        buttons={[
          {
            buttonKey: `${eventMode}Undo`,
            disabled: !canUndo,
            label: `${eventMode}Undo`,
            tooltip: isEventMode
              ? `${eventUndoKeyboardShortcutConfig?.description} (${formatHotkeysForOs(
                  eventUndoKeyboardShortcutConfig?.combos[0]
                )})`
              : `${undoKeyboardShortcutConfig?.description} (${formatHotkeysForOs(
                  undoKeyboardShortcutConfig?.combos[0]
                )})`,
            icon: IconNames.UNDO,
            onButtonClick: () => {
              undo();
              // Catches the case when the button becomes disabled if undo entry is last in stack
              setFocusToHistoryDisplay();
            },
            widthPx: buttonWidth
          },
          {
            buttonKey: `${eventMode}Redo`,
            disabled: !canRedo,
            label: `${eventMode}Redo`,
            tooltip: isEventMode
              ? `${eventRedoKeyboardShortcutConfig?.description} (${formatHotkeysForOs(
                  eventRedoKeyboardShortcutConfig?.combos[0]
                )})`
              : `${redoKeyboardShortcutConfig?.description} (${formatHotkeysForOs(
                  redoKeyboardShortcutConfig?.combos[0]
                )})`,
            icon: IconNames.REDO,
            onButtonClick: () => {
              redo();
              // Catches the case when the button becomes disabled if redo entry is last in stack
              setFocusToHistoryDisplay();
            },
            widthPx: buttonWidth
          }
        ]}
        label={`${eventMode}undo/redo`}
      />
    ),
    [
      canRedo,
      canUndo,
      eventMode,
      eventRedoKeyboardShortcutConfig?.combos,
      eventRedoKeyboardShortcutConfig?.description,
      eventUndoKeyboardShortcutConfig?.combos,
      eventUndoKeyboardShortcutConfig?.description,
      isEventMode,
      redo,
      redoKeyboardShortcutConfig?.combos,
      redoKeyboardShortcutConfig?.description,
      undo,
      undoKeyboardShortcutConfig?.combos,
      undoKeyboardShortcutConfig?.description
    ]
  );
  return (
    <div className="list-toolbar-wrapper">
      <Toolbar
        toolbarWidthPx={displayWidthPx}
        parentContainerPaddingPx={systemConfig.marginForToolbarPx}
        itemsLeft={[]}
        itemsRight={[buttonGroup]}
      />
    </div>
  );
});
