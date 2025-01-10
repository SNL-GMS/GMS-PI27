import { MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { useFileSaveLoad } from '../../../analyst-ui/common/save-load/save-load-hooks';

/**
 * Creates a menu item that lets the user choose a file to load
 */
export function LoadStateMenuItem() {
  const { loadGmsFromFile } = useFileSaveLoad();
  return (
    <MenuItem
      onClick={loadGmsFromFile}
      text="Open file..."
      title="Open a saved file"
      icon={IconNames.FOLDER_CLOSE}
    />
  );
}
