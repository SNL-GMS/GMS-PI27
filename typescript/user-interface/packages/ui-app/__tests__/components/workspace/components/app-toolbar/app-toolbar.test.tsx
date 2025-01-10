/* eslint-disable react/jsx-props-no-spreading */
import { UserProfileTypes } from '@gms/common-model';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import * as DeprecatedToolbar from '../../../../../src/ts/components/workspace/components/toolbar/toolbar-component';
import type { DeprecatedToolbarProps } from '../../../../../src/ts/components/workspace/components/toolbar/types';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('App Toolbar', () => {
  const testProps: DeprecatedToolbarProps = {
    components: null,
    saveDialog: null,
    setLayout: null,
    logo: 'test_logo',
    userName: 'test_name',
    isAboutDialogOpen: false,
    isSaveWorkspaceAsDialogOpen: false,
    openLayoutName: 'default_layout_name',
    versionInfo: {
      versionNumber: 'string',
      commitSHA: 'string'
    },
    userProfile: {
      userId: 'userId',
      defaultAnalystLayoutName: 'default_layout_name',
      preferences: {
        currentTheme: 'GMS Dark Mode',
        colorMap: 'turbo'
      },
      workspaceLayouts: [
        {
          name: 'default_layout_name',
          layoutConfiguration: 'asdf',
          supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
        }
      ]
    },
    setOpenLayoutName: (): any => {
      jest.fn();
    },
    clearLayout: () => jest.fn(),
    getOpenDisplays: () => [],
    logout: () => jest.fn(),
    openDisplay: () => {
      jest.fn();
    },
    openWorkspace: () => {
      jest.fn();
    },
    showLogPopup: () => jest.fn(),
    showAboutDialog: () => jest.fn(),
    toggleSaveWorkspaceAsDialog: () => jest.fn()
  };

  const { container } = render(
    <Provider store={getStore()}>
      <DeprecatedToolbar.DeprecatedToolbar {...testProps} />
    </Provider>
  );

  it('renders a component', () => {
    expect(container).toMatchSnapshot();
  });

  it('can reset an animation', () => {
    const target = {
      current: {
        className: '',
        offsetWidth: -1
      }
    };
    DeprecatedToolbar.triggerAnimation(target as React.MutableRefObject<HTMLSpanElement>);
    expect(target.current.className).toEqual('workspace-logo__label keypress-signifier');
  });
});
