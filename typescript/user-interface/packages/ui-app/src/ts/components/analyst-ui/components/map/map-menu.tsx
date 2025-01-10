import { Menu } from '@blueprintjs/core';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu } from '@gms/ui-state';
import React from 'react';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';

import { CreateEventMenuItem } from '../../common/menus/create-event-menu-item';

/**
 * Props which are passed to the {@link MapMenu}
 */
export interface MapMenuProps {
  /** In degrees */
  readonly latitude: number;
  /** In degrees */
  readonly longitude: number;
  /** set the create event menu state (visibility, latitude, longitude) */
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}

/**
 * Map context menu
 */
export function MapMenu(props: MapMenuProps) {
  const { latitude, longitude, setCreateEventMenuState } = props;

  return (
    <Menu>
      <CreateEventMenuItem
        latitude={latitude}
        longitude={longitude}
        setCreateEventMenuState={setCreateEventMenuState}
      />
    </Menu>
  );
}

/**
 * Shows the {@link MapMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link MapMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showMapMenu = (
  event: React.MouseEvent | MouseEvent,
  props: MapMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { latitude, longitude, setCreateEventMenuState } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <MapMenu
        latitude={latitude}
        longitude={longitude}
        setCreateEventMenuState={setCreateEventMenuState}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
