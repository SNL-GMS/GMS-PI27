/* eslint-disable jest/expect-expect */
import { UserProfileTypes } from '@gms/common-model';
import { UserMode } from '@gms/common-model/lib/user-profile/types';
import produce from 'immer';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';

import type { SetLayoutArgs } from '../../../../src/ts/app/api/user-manager';
import {
  createNewProfileFromSetLayoutInput,
  useGetUserProfileQuery,
  userManagerApiSlice,
  useSetUserProfileMutation
} from '../../../../src/ts/app/api/user-manager';
import { expectQueryHookToMakeAxiosRequest } from '../query-test-util';

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

describe('User Manager API Slice', () => {
  it('provides', () => {
    expect(useGetUserProfileQuery).toBeDefined();
    expect(useSetUserProfileMutation).toBeDefined();
    expect(createNewProfileFromSetLayoutInput).toBeDefined();
    expect(userManagerApiSlice).toBeDefined();
  });

  it('can createNewProfileFromSetLayoutInput', () => {
    const clonedCurrentProfile = cloneDeep(currentProfile);
    const clonedSetLayoutInput = cloneDeep(setLayoutInput);

    let newProfile = createNewProfileFromSetLayoutInput(clonedCurrentProfile, clonedSetLayoutInput);

    expect(JSON.stringify(currentProfile)).toEqual(JSON.stringify(clonedCurrentProfile));
    expect(JSON.stringify(setLayoutInput)).toEqual(JSON.stringify(clonedSetLayoutInput));
    expect(newProfile.workspaceLayouts).toHaveLength(
      clonedCurrentProfile.workspaceLayouts.length + 1
    );

    newProfile = createNewProfileFromSetLayoutInput(
      clonedCurrentProfile,
      produce(clonedSetLayoutInput, draft => {
        draft.workspaceLayoutInput.name = '';
      })
    );
    expect(newProfile.workspaceLayouts).toHaveLength(
      clonedCurrentProfile.workspaceLayouts.length + 1
    );

    newProfile = createNewProfileFromSetLayoutInput(
      clonedCurrentProfile,
      produce(clonedSetLayoutInput, draft => {
        draft.saveAsDefaultLayoutOfType = UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT;
      })
    );
    expect(newProfile.workspaceLayouts).toHaveLength(
      clonedCurrentProfile.workspaceLayouts.length + 1
    );

    newProfile = createNewProfileFromSetLayoutInput(
      clonedCurrentProfile,
      produce(clonedSetLayoutInput, draft => {
        draft.saveAsDefaultLayoutOfType = UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT;
        draft.workspaceLayoutInput.name = '';
      })
    );
    expect(newProfile.workspaceLayouts).toHaveLength(
      clonedCurrentProfile.workspaceLayouts.length + 1
    );

    newProfile = createNewProfileFromSetLayoutInput(
      clonedCurrentProfile,
      produce(clonedSetLayoutInput, draft => {
        draft.saveAsDefaultLayoutOfType = UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT;
      })
    );
    expect(newProfile.workspaceLayouts).toHaveLength(
      clonedCurrentProfile.workspaceLayouts.length + 1
    );

    newProfile = createNewProfileFromSetLayoutInput(
      clonedCurrentProfile,
      produce(clonedSetLayoutInput, draft => {
        draft.saveAsDefaultLayoutOfType = UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT;
        draft.workspaceLayoutInput.name = '';
      })
    );
    expect(newProfile.workspaceLayouts).toHaveLength(
      clonedCurrentProfile.workspaceLayouts.length + 1
    );

    newProfile = createNewProfileFromSetLayoutInput(
      clonedCurrentProfile,
      produce(clonedSetLayoutInput, draft => {
        draft.workspaceLayoutInput.name = clonedCurrentProfile.workspaceLayouts[0].name;
      })
    );
    expect(newProfile.workspaceLayouts).toHaveLength(currentProfile.workspaceLayouts.length);
  });

  it('hook queries for user profile', async () => {
    await expectQueryHookToMakeAxiosRequest(useGetUserProfileQuery);
  });

  it('set user profile', async () => {
    const useMutation = () => {
      const [mutation] = useSetUserProfileMutation();

      const result = React.useRef<any>();
      React.useEffect(() => {
        result.current = mutation({
          defaultAnalystLayoutName: 'test',
          userId: 'test',
          preferences: { colorMap: 'cividis', currentTheme: 'test' },
          workspaceLayouts: [
            {
              layoutConfiguration: 'test',
              name: 'test',
              supportedUserInterfaceModes: [UserMode.IAN]
            }
          ]
        });
      }, [mutation]);

      return <div>{result.current}</div>;
    };
    await expectQueryHookToMakeAxiosRequest(useMutation);
  });
});
