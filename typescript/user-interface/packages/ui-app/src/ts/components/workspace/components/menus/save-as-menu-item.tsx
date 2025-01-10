import { MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { useFileSaveLoad } from '../../../analyst-ui/common/save-load/save-load-hooks';

/**
 * Creates a menu item that saves the state of the application to a file
 */
export function SaveAsMenuItem() {
  const { isSaveEnabled, saveGmsToFile } = useFileSaveLoad();

  return (
    <MenuItem
      disabled={!isSaveEnabled}
      onClick={React.useCallback(async () => {
        await saveGmsToFile(true);
      }, [saveGmsToFile])}
      text="Save file as..."
      title="Save your work to a file of your choice"
      icon={IconNames.FLOPPY_DISK}
    />
  );
}
