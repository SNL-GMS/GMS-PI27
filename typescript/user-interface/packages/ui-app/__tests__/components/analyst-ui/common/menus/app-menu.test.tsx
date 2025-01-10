import type { CommonTypes } from '@gms/common-model';
import { UserProfileTypes } from '@gms/common-model';
import { getStore } from '@gms/ui-state';
import { act, fireEvent, render, screen } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import { KeyCloakService } from '~app/authentication/gms-keycloak';

import type {
  GLComponentConfig,
  GLComponentConfigList
} from '../../../../../src/ts/components/workspace/components/golden-layout/types';
import { AppMenu } from '../../../../../src/ts/components/workspace/components/menus/app-menu';
import { useQueryStateResult } from '../../../../__data__/test-util-data';

const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 2000
};
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;
jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    isIanMode: jest.fn(() => true)
  };
});

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockUserProfile = {
    userId: '1',
    defaultAnalystLayoutName: 'default',
    currentTheme: 'GMS Dark Theme',
    workspaceLayouts: [
      {
        name: 'default',
        layoutConfiguration: 'test',
        supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
      }
    ]
  };
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useWorkflowQuery: jest.fn(),
    useStageIntervalsQuery: jest.fn(),
    processingConfigurationApiSlice: jest.fn(() => {
      return {
        endpoints: {
          getOperationalTimePeriodConfiguration: {
            select: () => {
              return [];
            }
          }
        }
      };
    }),
    useGetAllUiThemes: jest.fn(() => [{ name: 'dark' }]),
    useKeyboardShortcutsDisplayVisibility: jest.fn(() => ({ openKeyboardShortcuts: jest.fn() })),
    useUiTheme: jest.fn(() => {
      const currentTheme = {};
      const setUiTheme = jest.fn();
      return [currentTheme, setUiTheme];
    }),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    ),
    getProcessingAnalystConfiguration: jest.fn(() => {
      return { data: mockUserProfile };
    }),
    useGetUserProfileQuery: jest.fn(() => ({ data: mockUserProfile }))
  };
});

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();
/**
 * Tests the app menu component
 */

const analystUIComponents: Map<string, GLComponentConfig> = new Map([
  [
    'waveform-display',
    {
      type: 'react-component',
      title: 'Waveforms',
      component: 'waveform-display'
    }
  ]
]);

const components: GLComponentConfigList = {};
[...analystUIComponents].forEach(([componentName, glComponent]) => {
  components[componentName] = glComponent;
});

const fauxAnalystComponents = new Map([
  [
    'Analyst',
    new Map([
      [
        components['waveform-display'].component,
        { id: components['waveform-display'], value: undefined }
      ]
    ])
  ]
]);

describe('app-menu', () => {
  const mockUserProfile: UserProfileTypes.UserProfile = {
    userId: '1',
    defaultAnalystLayoutName: 'default',
    preferences: {
      currentTheme: 'GMS Dark Mode',
      colorMap: 'turbo'
    },
    workspaceLayouts: [
      {
        name: 'default',
        layoutConfiguration: 'test',
        supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
      }
    ]
  };
  const showLogs = jest.fn();

  it('should be able to click all the buttons', async () => {
    const store = getStore();
    const aboutDialog = jest.fn();
    Object.defineProperty(KeyCloakService, 'callLogout', {
      writable: true,
      configurable: true,
      value: jest.fn()
    });
    const getOpenDisplaysFn = jest.fn(() => {
      return ['dark'];
    });
    const saveWorkspaceAsFn = jest.fn();
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await render(
        <AppMenu
          components={fauxAnalystComponents}
          openLayoutName=""
          clearLayout={jest.fn()}
          logout={jest.fn()}
          openDisplay={jest.fn()}
          openWorkspace={jest.fn()}
          showAboutDialog={aboutDialog}
          saveWorkspaceAs={saveWorkspaceAsFn}
          getOpenDisplays={getOpenDisplaysFn}
          showLogs={showLogs}
          logo={undefined}
          userProfile={mockUserProfile}
        />,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
    });
    // Called twice during setup phase. Once for disabled and once for populating the list of displays
    expect(getOpenDisplaysFn).toHaveBeenCalledTimes(1);
    // click the logout button
    fireEvent.click(await screen.findByText('Log out'));
    // should callLogout as we are defaulted to the keycloack auth
    expect(KeyCloakService.callLogout).toHaveBeenCalledTimes(1);

    // click the logout button
    fireEvent.click(await screen.findByText('About'));
    // should callLogout as we are defaulted to the keycloack auth
    expect(aboutDialog).toHaveBeenCalledTimes(1);
  });
});
