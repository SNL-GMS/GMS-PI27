import { UserProfileTypes } from '@gms/common-model';
import axios from 'axios';
import React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';

import type { SetLayoutArgs } from '../../../src/ts/app/api/user-manager/user-manager-api-slice';
import {
  useSetLayout,
  useSetThemeInUserProfile
} from '../../../src/ts/app/hooks/user-manager-hooks';
import { getStore } from '../../../src/ts/app/store';

const currentProfile: UserProfileTypes.UserProfile = {
  defaultAnalystLayoutName: 'testLayout',
  userId: 'fooman',
  preferences: {
    currentTheme: 'GMS Dark Mode',
    colorMap: 'turbo'
  },
  workspaceLayouts: [
    {
      layoutConfiguration: 'abc123',
      name: UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT,
      supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
    }
  ]
};

const setLayoutInput: SetLayoutArgs = {
  defaultLayoutName: UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT,
  workspaceLayoutInput: {
    layoutConfiguration: 'xyz123',
    name: 'newLayout',
    supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
  }
};

jest.mock('../../../src/ts/app/api/user-manager/user-manager-api-slice', () => {
  const actual = jest.requireActual('../../../src/ts/app/api/user-manager/user-manager-api-slice');
  return {
    ...actual,
    useGetUserProfileQuery: jest.fn(() => ({
      data: currentProfile
    }))
  };
});

jest.mock('axios');
describe('user manager hooks', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {},
      headers: [],
      config: {}
    });
  });
  it('exists', () => {
    expect(useSetLayout).toBeDefined();
    expect(useSetThemeInUserProfile).toBeDefined();
  });

  it('can set layout', async () => {
    const store = getStore();

    let setLayout: (args: SetLayoutArgs) => Promise<void> = jest.fn();

    function Component() {
      setLayout = useSetLayout();
      React.useEffect(() => {
        setLayout(setLayoutInput).catch(e => {
          throw new Error(e);
        });
      }, []);
      return <>{JSON.stringify('set layout')}</>;
    }

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    expect(async () => {
      await setLayout(setLayoutInput);
    }).not.toThrow();

    await setLayout(setLayoutInput);
  });

  it('can set user theme', async () => {
    const store = getStore();

    let setCurrentTheme: (currentTheme: string) => Promise<void> = jest.fn();

    function Component() {
      setCurrentTheme = useSetThemeInUserProfile();
      React.useEffect(() => {
        setCurrentTheme('GMS Dark Theme').catch(e => {
          throw new Error(e);
        });
      }, []);
      return <>{JSON.stringify('set current theme')}</>;
    }

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();

    expect(async () => {
      await setCurrentTheme('GMS Dark Theme');
    }).not.toThrow();

    await setCurrentTheme('GMS Dark Theme');
  });
});
