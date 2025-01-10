import { MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { useFileSaveLoad } from '../../../analyst-ui/common/save-load/save-load-hooks';

/**
 * Creates a menu item that saves the state of the application to a file
 */
export function SaveStateMenuItem() {
  const { isSaveEnabled, saveGmsToFile } = useFileSaveLoad();

  return (
    <MenuItem
      disabled={!isSaveEnabled}
      onClick={React.useCallback(async () => {
        await saveGmsToFile();
      }, [saveGmsToFile])}
      text="Save to file"
      title="Save your work to a file"
      icon={IconNames.FLOPPY_DISK}
    />
  );
}
