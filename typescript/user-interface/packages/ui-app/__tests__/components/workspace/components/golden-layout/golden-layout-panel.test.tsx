import type { UserProfile } from '@gms/common-model/lib/user-profile/types';
import { UserMode } from '@gms/common-model/lib/user-profile/types';
import type { UserProfileQuery } from '@gms/ui-state';
import { QueryStatus } from '@reduxjs/toolkit/dist/query';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';

import { GoldenLayoutPanel } from '../../../../../src/ts/components/workspace/components/golden-layout/golden-layout-panel';
import type { GoldenLayoutPanelProps } from '../../../../../src/ts/components/workspace/components/golden-layout/types';
import { useQueryStateResult } from '../../../../__data__/test-util-data';
// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

jest.mock('@gms/golden-layout');

const processingAnalystConfigurationQuery = cloneDeep(useQueryStateResult);
const userProfileData = {
  defaultAnalystLayoutName: 'test',
  userId: 'test',
  preferences: {
    currentTheme: 'GMS Dark Mode',
    colorMap: 'turbo'
  },
  workspaceLayouts: [
    {
      name: 'test',
      supportedUserInterfaceModes: [UserMode.IAN],
      layoutConfiguration: JSON.stringify({
        data: 'test',
        settings: { showPopoutIcon: undefined }
      })
    }
  ]
};

const props: GoldenLayoutPanelProps = {
  logo: undefined,
  userName: 'test',
  openLayoutName: 'test',
  versionInfo: {
    commitSHA: 'test',
    versionNumber: '1'
  },
  setGlDisplayState: jest.fn(),
  userProfileQuery: {
    currentData: userProfileData as UserProfile,
    data: userProfileData as UserProfile,
    endpointName: 'getUserProfile',
    fulfilledTimeStamp: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: true,
    isUninitialized: false,
    requestId: undefined,
    startedTimeStamp: undefined,
    status: QueryStatus.fulfilled
  } as UserProfileQuery,
  // eslint-disable-next-line no-promise-executor-return
  setLayout: jest.fn(async () => new Promise(resolve => resolve())),
  setOpenLayoutName: jest.fn(),
  registerCommands: jest.fn(),
  logout: jest.fn(),
  processingAnalystConfigurationQuery
};

describe('Golden layout class Panel', () => {
  const goldenLayoutPanel: any = new GoldenLayoutPanel(props);
  goldenLayoutPanel.context = {
    supportedUserInterfaceMode: [UserMode.IAN],
    config: {
      workspace: undefined,
      components: []
    },
    glComponents: []
  };
  it('should be defined', () => {
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle getOpenLayout', () => {
    const expectedResults = {
      layoutConfiguration: '%7B%7D',
      name: 'test',
      supportedUserInterfaceModes: ['IAN']
    };
    expect(goldenLayoutPanel.getOpenLayout()).toEqual(expectedResults);
  });

  it('can handle submitSaveAs', async () => {
    await goldenLayoutPanel.submitSaveAs();
    expect(goldenLayoutPanel).toBeDefined();
  });

  it('can handle handleAffirmativeAction', async () => {
    await goldenLayoutPanel.handleAffirmativeAction();
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle finishLogout', () => {
    goldenLayoutPanel.finishLogout();
    expect(goldenLayoutPanel.props.logout).toHaveBeenCalled();
  });

  it('can handle isLayoutChanged', () => {
    expect(goldenLayoutPanel.isLayoutChanged()).toBeUndefined();
  });

  it('can handle discardLayoutChangesOnLogout', () => {
    goldenLayoutPanel.discardLayoutChangesOnLogout();
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle handleLogout', () => {
    goldenLayoutPanel.handleLogout();
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle saveLayoutChangesOnLogout', () => {
    goldenLayoutPanel.saveLayoutChangesOnLogout();
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle toggleAboutDialog', () => {
    goldenLayoutPanel.toggleAboutDialog();
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle toggleSaveWorkspaceAsDialog', () => {
    goldenLayoutPanel.toggleSaveWorkspaceAsDialog();
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle registerComponent', () => {
    const component: React.FunctionComponent = () => <div>test</div>;
    goldenLayoutPanel.gl = {
      registerComponent: jest.fn()
    };
    goldenLayoutPanel.registerComponent('test', component);
    expect(goldenLayoutPanel.gl.registerComponent).toHaveBeenCalled();
  });
  it('can handle openDisplay when a display is maximized', () => {
    goldenLayoutPanel.gl = {
      registerComponent: jest.fn(),
      root: {
        contentItems: [
          {
            contentItems: [
              {
                isRow: true,
                isMaximised: true,
                addChild: jest.fn(),
                contentItems: [
                  {
                    isMaximised: true,
                    addChild: jest.fn()
                  }
                ]
              }
            ]
          }
        ],
        addChild: jest.fn()
      }
    };

    goldenLayoutPanel.openDisplay('test');
    expect(goldenLayoutPanel).toBeDefined();
    expect(() => goldenLayoutPanel.addContentAndIsMaximized('Workflow', false)).not.toThrow();
  });

  it('can handle openDisplay when no other displays are open', () => {
    goldenLayoutPanel.gl = {
      registerComponent: jest.fn(),
      root: {
        contentItems: [],
        addChild: jest.fn()
      }
    };
    goldenLayoutPanel.openDisplay('test');
    expect(goldenLayoutPanel).toBeDefined();
  });
  it('can handle componentDidUpdate', () => {
    goldenLayoutPanel.gl = {
      updateSize: jest.fn(),
      registerComponent: jest.fn(),
      destroy: jest.fn(),
      toConfig: jest.fn(() => [{ content: [] }]),
      root: {
        contentItems: [
          {
            contentItems: [
              {
                isRow: true,
                isMaximised: true,
                addChild: jest.fn(),
                contentItems: [
                  {
                    isMaximised: true,
                    addChild: jest.fn()
                  }
                ]
              }
            ]
          }
        ],
        addChild: jest.fn()
      }
    };
    goldenLayoutPanel.registerComponentsAndGoldenLayout = jest.fn();
    goldenLayoutPanel.componentDidUpdate(props);
    expect(goldenLayoutPanel).toBeDefined();
  });
});
