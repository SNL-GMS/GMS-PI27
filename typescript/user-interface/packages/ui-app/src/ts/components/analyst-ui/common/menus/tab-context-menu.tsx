import { Icon, Menu, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { UI_BASE_PATH, UI_URL } from '@gms/common-util';
import { showImperativeReduxContextMenu } from '@gms/ui-state';
import React from 'react';

function showTabContextMenu(event: MouseEvent, tabName: string) {
  showImperativeReduxContextMenu({
    content: (
      <Menu className="test-menu">
        <MenuItem
          text={`Open ${toDisplayTitle(tabName)} in new tab`}
          onClick={() => window.open(`${UI_URL}${UI_BASE_PATH}/#/${tabName}`)}
          labelElement={<Icon icon={IconNames.OPEN_APPLICATION} />}
        />
      </Menu>
    ),
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
}

export interface TabContextMenuProps {
  tabName: string;
}

/**
 * Tab Context Menu
 */
export function TabContextMenu(props: TabContextMenuProps) {
  const { tabName } = props;

  // Read the golden layout title property to get the tab header
  const tab = document.querySelector(`[title="${toDisplayTitle(tabName)}"]`);

  const onContextMenu = React.useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      showTabContextMenu(event, tabName);
    },
    [tabName]
  );

  React.useEffect(() => {
    // Tab wont be found if the component is open in its own window
    if (tab) {
      tab.addEventListener('contextmenu', onContextMenu);
      return () => {
        tab.removeEventListener('contextmenu', onContextMenu);
      };
    }
    return () => {
      /* nothing to clean up */
    };
  }, [onContextMenu, tab]);

  return <> </>;
}
