/* eslint-disable react/destructuring-assignment */
import { Menu, MenuDivider, MenuItem, Tooltip } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { UserProfileTypes } from '@gms/common-model';
import type { KeyValue } from '@gms/common-util';
import { UI_BASE_PATH, UI_URL } from '@gms/common-util';
import {
  useKeyboardShortcutsDisplayVisibility,
  useUserPreferencesDisplayVisibility
} from '@gms/ui-state';
import { getOS, OSTypes } from '@gms/ui-util';
import kebabCase from 'lodash/kebabCase';
import React from 'react';
import { createSearchParams } from 'react-router-dom';

import { KeyCloakService } from '~app/authentication/gms-keycloak';
import { GMS_DISABLE_KEYCLOAK_AUTH } from '~env';

import { uniqueLayouts } from '../golden-layout/golden-layout-util';
import type {
  GLComponentConfig,
  GLComponentMap,
  GLComponentValue,
  GLMap
} from '../golden-layout/types';
import { GoldenLayoutContext, isGLComponentMap, isGLKeyValue } from '../golden-layout/types';
import { LoadStateMenuItem } from './load-state-menu-item';
import { SaveAsMenuItem } from './save-as-menu-item';
import { SaveStateMenuItem } from './save-state-menu-item';
import { SubMenuButton } from './sub-menu-button';
/**
 * Generates an array of sub menu items
 *
 * @param components map of components to create sub menu items for
 * @param openDisplay method that should be called after an onClick
 * @param getOpenDisplays
 */
export const generateAppMenuDisplayOptions = (
  components: GLMap | GLComponentMap,
  openDisplay: (componentKey: string) => void,
  getOpenDisplays: () => string[]
): (JSX.Element | null)[] => {
  const getValue = (key: string, val: GLComponentValue): string => {
    if (isGLComponentMap(val)) {
      return key.toLowerCase();
    }
    if (isGLKeyValue(val)) {
      return val.id.title.toLowerCase();
    }
    return '';
  };
  const sort = (values: GLMap) =>
    [...values].sort(([keyA, componentA], [keyB, componentB]) => {
      const componentAVal = getValue(keyA, componentA);
      const componentBVal = getValue(keyB, componentB);
      return componentAVal.localeCompare(componentBVal);
    });

  return sort(components).map(([key, component]) => {
    if (isGLComponentMap(component)) {
      return (
        <MenuItem text={`${key}`} key={key} icon={IconNames.DESKTOP} data-cy="app-menu__displays">
          {...generateAppMenuDisplayOptions(component, openDisplay, getOpenDisplays)}
        </MenuItem>
      );
    }

    if (isGLKeyValue(component)) {
      const isDisabled =
        getOpenDisplays().find(display => display === component.id.component) !== undefined;
      const openInNewTab = e => {
        e.stopPropagation();
        e.preventDefault();
        window.open(`${UI_URL}${UI_BASE_PATH}/#/${component.id.component}`);
      };
      return (
        <MenuItem
          text={component.id.title}
          className="app-menu-item"
          key={key}
          data-cy={`app-menu__displays__${kebabCase(component.id.title.toLowerCase())}`}
          onClick={(e: React.MouseEvent) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) {
              openInNewTab(e);
            } else {
              openDisplay(key);
            }
          }}
          disabled={isDisabled}
          labelElement={
            <Tooltip content={`Open ${component.id.title} in new tab`} placement="right">
              <SubMenuButton
                disabled={isDisabled}
                handleClick={openInNewTab}
                handleKeyDown={openInNewTab}
                iconName={IconNames.OPEN_APPLICATION}
              />
            </Tooltip>
          }
        />
      );
    }
    return null;
  });
};

export interface AppMenuProps {
  components: Map<
    string,
    | KeyValue<GLComponentConfig, React.ComponentClass | React.FunctionComponent>
    | Map<string, KeyValue<GLComponentConfig, React.ComponentClass | React.FunctionComponent>>
  >;
  logo: any;
  userProfile: UserProfileTypes.UserProfile | undefined;
  openLayoutName: string | undefined;
  getOpenDisplays(): string[];
  logout(): void;
  showLogs(): void;
  clearLayout(): void;
  openDisplay(componentKey: string): void;
  openWorkspace(layout: UserProfileTypes.UserLayout): void;
  showAboutDialog(): void;
  saveWorkspaceAs(): void;
}

export function KeyboardShortcutsAppMenuItem() {
  const { openKeyboardShortcuts } = useKeyboardShortcutsDisplayVisibility();
  const labelElement = getOS() === OSTypes.MAC ? '⌘ + /' : 'ctrl + /';
  return (
    <MenuItem
      className="app-menu__keyboard-shortcuts"
      onClick={openKeyboardShortcuts}
      text="Keyboard Shortcuts"
      title="Shows GMS keyboard shortcuts (hotkeys)"
      icon={IconNames.KEY}
      labelElement={labelElement}
      data-cy="app-menu__keyboard-shortcuts"
    />
  );
}

export function PreferencesAppMenuItem() {
  const { openUserPreferences } = useUserPreferencesDisplayVisibility();
  return (
    <MenuItem
      className="app-menu__user-preferences"
      onClick={openUserPreferences}
      text="Preferences"
      title="Opens user preferences"
      icon={IconNames.USER}
      data-cy="app-menu__user-preferences"
    />
  );
}

/**
 * Create the app menu component for use in the top-level app menu popover
 */
export function AppMenu(props: AppMenuProps) {
  const context = React.useContext(GoldenLayoutContext);

  const defaultAnalystLayoutName = props.userProfile?.defaultAnalystLayoutName;

  const { supportedUserInterfaceMode } = context;

  const defaultLayout = supportedUserInterfaceMode
    ? props.userProfile?.workspaceLayouts
        .filter(layout => layout.supportedUserInterfaceModes.includes(supportedUserInterfaceMode))
        .find(wl => wl.name === defaultAnalystLayoutName)
    : undefined;

  // Get a list of layouts that are uniq by name - this is a limitation due to the current
  // way layouts are stored in the database. It causes duplicates in the UI.
  const layouts =
    props.userProfile?.workspaceLayouts && defaultAnalystLayoutName && supportedUserInterfaceMode
      ? uniqueLayouts(
          props.userProfile.workspaceLayouts,
          defaultAnalystLayoutName,
          supportedUserInterfaceMode
        )
      : undefined;

  layouts?.sort((a, b) => a.name.localeCompare(b.name));
  const defaultLayoutClassName =
    defaultLayout?.name !== props.openLayoutName ? 'unopened-layout' : '';
  const defaultLayoutIcon = defaultLayout?.name === props.openLayoutName ? IconNames.TICK : null;
  const nonDefaultWorkspaceMenuItems =
    layouts && layouts.length > 0 ? (
      <>
        <MenuDivider />
        {layouts.map(wl => {
          const openInNewTab = e => {
            e.stopPropagation();
            e.preventDefault();
            window.open(`${UI_URL}${UI_BASE_PATH}/#/?${createSearchParams({ layout: wl.name })}`);
          };
          return (
            <MenuItem
              key={wl.name}
              data-cy={wl.name}
              className={wl.name !== props.openLayoutName ? 'unopened-layout' : ''}
              icon={wl.name === props.openLayoutName ? IconNames.TICK : null}
              text={`${wl.name}`}
              onClick={() => props.openWorkspace(wl)}
              labelElement={
                <Tooltip content={`Open ${wl.name} in new tab`} placement="right">
                  <SubMenuButton
                    disabled={wl.name === props.openLayoutName}
                    handleClick={openInNewTab}
                    handleKeyDown={openInNewTab}
                    iconName={IconNames.OPEN_APPLICATION}
                  />
                </Tooltip>
              }
            />
          );
        })}
      </>
    ) : null;
  const openDefaultLayoutInNewTab = e => {
    e.stopPropagation();
    e.preventDefault();
    window.open(
      `${UI_URL}${UI_BASE_PATH}/#/?${createSearchParams({ layout: defaultLayout.name })}`
    );
  };
  const userProfileMenu =
    props.userProfile !== undefined && defaultLayout ? (
      <MenuItem
        text="Open Workspace"
        title="Opens a previously saved workspace"
        data-cy="open-workspace-button"
        className="app-menu__open-workspace"
        icon={IconNames.FOLDER_OPEN}
      >
        <MenuItem
          data-cy={defaultLayout?.name}
          className={defaultLayoutClassName}
          icon={defaultLayoutIcon}
          text={`${defaultLayout?.name} (default)`}
          onClick={() => props.openWorkspace(defaultLayout)}
          labelElement={
            <Tooltip content={`Open ${defaultLayout.name} in new tab`} placement="right">
              <SubMenuButton
                disabled={defaultLayout.name === props.openLayoutName}
                handleClick={openDefaultLayoutInNewTab}
                handleKeyDown={openDefaultLayoutInNewTab}
                iconName={IconNames.OPEN_APPLICATION}
              />
            </Tooltip>
          }
        />
        {nonDefaultWorkspaceMenuItems}
      </MenuItem>
    ) : null;
  return (
    <Menu className="user-menu" data-cy="user-menu">
      <MenuItem
        className="app-menu__about"
        onClick={() => {
          props.showAboutDialog();
        }}
        text="About"
        title="Shows GMS system version info"
        icon={IconNames.INFO_SIGN}
        data-cy="app-menu__about"
      />
      <PreferencesAppMenuItem />
      <KeyboardShortcutsAppMenuItem />
      <SaveStateMenuItem />
      <SaveAsMenuItem />
      <LoadStateMenuItem />
      <MenuDivider title="Workspace" className="menu-title" />
      {userProfileMenu}
      <MenuItem
        onClick={() => {
          props.saveWorkspaceAs();
        }}
        text="Save Workspace As"
        data-cy="save-workspace-as-button"
        className="app-menu__save-as"
        title="Save your current workspace layout as a new layout"
        icon={IconNames.FLOPPY_DISK}
      />
      <MenuDivider title="Displays" className="menu-title" />
      {...generateAppMenuDisplayOptions(
        props.components,
        key => {
          props.openDisplay(key);
        },
        () => props.getOpenDisplays()
      )}
      <MenuDivider />
      <MenuItem
        text="Developer Tools"
        title="Shows advanced debugging tools"
        icon={IconNames.WRENCH}
        data-cy="app-menu__devtools"
      >
        <MenuItem
          onClick={() => {
            props.showLogs();
          }}
          className="app-menu__logs"
          data-cy="app-menu__logs"
          text="Logs"
          title="Shows logs between UI and API Gateway"
        />
        <MenuItem
          onClick={() => {
            props.clearLayout();
          }}
          text="Clear Layout"
          className="app-menu__clear-layout"
          data-cy="app-menu__clearlayout"
          title="Clears local golden layout configuration and replaces with pre-configured default"
        />
      </MenuItem>
      <MenuDivider />
      <MenuItem
        onClick={
          GMS_DISABLE_KEYCLOAK_AUTH ? () => props.logout() : () => KeyCloakService.callLogout()
        }
        text="Log out"
        className="app-menu__logout"
        data-cy="app-menu__logout"
        icon={IconNames.LOG_OUT}
      />
    </Menu>
  );
}
