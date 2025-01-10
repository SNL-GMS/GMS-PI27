import { UserProfileTypes } from '@gms/common-model';
import { axiosBaseQuery } from '@gms/ui-workers';
import { createApi } from '@reduxjs/toolkit/query/react';
import produce from 'immer';

import type { UseQueryStateResult } from '../../query';
import { config } from './endpoint-configuration';

/**
 * Set layout args:
 * The arguments needed to update a layout.
 * Takes a layout configuration input and optional parameter which defines
 * if we should save as a default, and if so, what default layout mode we should overwrite.
 */
export interface SetLayoutArgs {
  /**
   * The layout configuration and metadata like name, modes supported.
   */
  readonly workspaceLayoutInput: UserProfileTypes.UserLayout;

  /**
   * The layout name, used for updating the query cache.
   */
  readonly defaultLayoutName?: UserProfileTypes.DefaultLayoutNames;

  /**
   * The default layout type.
   * or undefined if we are not saving as a default.
   */
  readonly saveAsDefaultLayoutOfType?: UserProfileTypes.DefaultLayoutNames;
}

/**
 * Creates a new user profile that includes the new/updated layout
 *
 * @param currentProfile the current user profile
 * @param setLayoutInput the user input
 */
export const createNewProfileFromSetLayoutInput = (
  currentProfile: UserProfileTypes.UserProfile,
  setLayoutInput: SetLayoutArgs
): UserProfileTypes.UserProfile => {
  const layouts = produce(currentProfile.workspaceLayouts, draft => {
    const index = draft.findIndex(wl => wl.name === setLayoutInput.workspaceLayoutInput.name);
    if (index !== -1) draft.splice(index, 1);
    draft.push(setLayoutInput.workspaceLayoutInput);
  });

  return produce(currentProfile, draft => {
    draft.workspaceLayouts = [];
    draft.workspaceLayouts.push(...layouts);
    if (setLayoutInput.saveAsDefaultLayoutOfType !== undefined) {
      if (
        setLayoutInput.saveAsDefaultLayoutOfType ===
        UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT
      ) {
        draft.defaultAnalystLayoutName = setLayoutInput.workspaceLayoutInput.name;
      }
    }
  });
};

/**
 * The user manager api reducer slice.
 */
export const userManagerApiSlice = createApi({
  reducerPath: 'userManagerApi',
  baseQuery: axiosBaseQuery({
    baseUrl: config.user.baseUrl
  }),
  tagTypes: ['UserProfile'],
  endpoints(build) {
    return {
      /**
       * defines the user profile query
       */
      getUserProfile: build.query<UserProfileTypes.UserProfile, void>({
        query: () => ({ requestConfig: config.user.services.getUserProfile.requestConfig }),
        transformResponse: (
          response: UserProfileTypes.UserProfile
        ): UserProfileTypes.UserProfile => {
          // validate the user profile being received from the server
          UserProfileTypes.userProfileSchema.parse(response);
          return response;
        },
        providesTags: ['UserProfile']
      }),

      /**
       * defines the updateActivityIntervalStatus mutation
       */
      setUserProfile: build.mutation<void, UserProfileTypes.UserProfile>({
        query: (data: UserProfileTypes.UserProfile) => ({
          requestConfig: {
            ...config.user.services.setUserProfile.requestConfig,
            data
          }
        }),
        onQueryStarted(arg) {
          // validate the user profile being sent to the server
          UserProfileTypes.userProfileSchema.parse(arg);
        },
        // invalidate the user profile tag to force a re-query
        invalidatesTags: () => ['UserProfile']
      })
    };
  }
});

export const { useGetUserProfileQuery, useSetUserProfileMutation } = userManagerApiSlice;

export type UserProfileQuery = UseQueryStateResult<UserProfileTypes.UserProfile>;

export type SetUserProfileMutation = ReturnType<typeof useSetUserProfileMutation>;
