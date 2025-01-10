import type { UserProfileTypes } from '@gms/common-model';
import type { ColorMapName } from '@gms/common-model/lib/color/types';
import { DEFAULT_COLOR_MAP } from '@gms/common-model/lib/color/types';
import { UILogger } from '@gms/ui-util';
import produce from 'immer';
import React from 'react';
import { batch } from 'react-redux';

import type { SetLayoutArgs } from '../api/user-manager';
import {
  createNewProfileFromSetLayoutInput,
  useGetUserProfileQuery,
  useSetUserProfileMutation
} from '../api/user-manager';
import { commonActions, isCommandPaletteOpen, isUserPreferencesPopupOpen } from '../state';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';

const logger = UILogger.create('GMS_LOG_USER_MANAGER_API', process.env.GMS_LOG_USER_MANAGER_API);

/**
 * Creates a set of helper functions for manipulating the user preferences dialog state.
 * Functions are referentially stable.
 *
 * @returns toggleUserPreferences a function to turn on and off the user preferences dialog,
 * isUserPreferencesDialogOpen a function to determine if the dialog is open
 * closeUserPreferences closes the dialog
 * openUserPreferences opens the dialog
 */
export const useUserPreferencesDisplayVisibility = (): {
  toggleUserPreferences: () => void;
  isUserPreferencesDialogOpen: boolean;
  closeUserPreferences: () => void;
  openUserPreferences: () => void;
} => {
  const dispatch = useAppDispatch();
  const areUserPreferencesVisible = useAppSelector(isUserPreferencesPopupOpen);
  const isCommandPaletteVisible = useAppSelector(isCommandPaletteOpen);

  const toggleUserPreferences = React.useCallback(() => {
    if (!isCommandPaletteVisible) {
      dispatch(commonActions.setUserPreferencesVisibility(!areUserPreferencesVisible));
    }
  }, [isCommandPaletteVisible, dispatch, areUserPreferencesVisible]);

  const closeUserPreferences = React.useCallback(() => {
    dispatch(commonActions.setUserPreferencesVisibility(false));
  }, [dispatch]);
  const openUserPreferences = React.useCallback(() => {
    batch(() => {
      if (isCommandPaletteVisible) {
        dispatch(commonActions.setCommandPaletteVisibility(false));
      }
      dispatch(commonActions.setUserPreferencesVisibility(true));
    });
  }, [dispatch, isCommandPaletteVisible]);

  return {
    toggleUserPreferences,
    isUserPreferencesDialogOpen: areUserPreferencesVisible,
    closeUserPreferences,
    openUserPreferences
  };
};

/**
 * Hook that provides a function (mutation) for setting the user layout.
 *
 * @returns a mutation function for setting the layout
 */
export const useSetLayout = (): ((args: SetLayoutArgs) => Promise<void>) => {
  const userProfileQuery = useGetUserProfileQuery();
  const [setUserProfileMutation] = useSetUserProfileMutation();
  const userProfile: UserProfileTypes.UserProfile | undefined = userProfileQuery?.data;

  return React.useCallback(
    async (args: SetLayoutArgs) => {
      if (!userProfile) {
        logger.error('Failed to update layout, user profile is not defined', args);
        return;
      }

      const updatedProfile: UserProfileTypes.UserProfile = createNewProfileFromSetLayoutInput(
        userProfile,
        args
      );
      await setUserProfileMutation(updatedProfile).catch(error =>
        logger.error('Failed to set layout', error)
      );
    },
    [userProfile, setUserProfileMutation]
  );
};

/**
 * Returns a mutation function that sets a value in the user profile to be the value provided.
 *
 * @example ```
 * useSetValueInUserProfile('currentTheme') // creates a setter function for the 'currentTheme' key
 *
 * @throws if the mutation fails
 */
export const useSetValueInUserProfile = (
  key: keyof UserProfileTypes.UserProfile
): ((value: UserProfileTypes.UserProfile[keyof UserProfileTypes.UserProfile]) => Promise<void>) => {
  const userProfileQuery = useGetUserProfileQuery();
  const userProfile: UserProfileTypes.UserProfile | undefined = userProfileQuery?.data;
  const [setUserProfileMutation] = useSetUserProfileMutation();
  return async (value: UserProfileTypes.UserProfile[keyof UserProfileTypes.UserProfile]) => {
    if (!userProfile) {
      logger.error('Failed to update user profile, user profile is not defined', value);
      return;
    }

    const newUserProfile = produce(userProfile, draft => {
      draft[key] = value as unknown as any;
    });
    await setUserProfileMutation(newUserProfile).catch(error => {
      logger.error(`Failed to set ${key} in user profile`, error);
    });
  };
};

/**
 * Returns a mutation function that sets a value in the user profile to be the value provided.
 *
 * @example ```
 * useSetValueInUserProfile('currentTheme') // creates a setter function for the 'currentTheme' key
 *
 * @throws if the mutation fails
 */
export const useSetValueInUserPreferences = (
  key: keyof UserProfileTypes.UserPreferences
): ((value: UserProfileTypes.UserProfile[keyof UserProfileTypes.UserProfile]) => Promise<void>) => {
  const userProfileQuery = useGetUserProfileQuery();
  const userProfile: UserProfileTypes.UserProfile | undefined = userProfileQuery?.data;
  const [setUserProfileMutation] = useSetUserProfileMutation();
  return async (value: UserProfileTypes.UserProfile[keyof UserProfileTypes.UserProfile]) => {
    if (!userProfile) {
      logger.error('Failed to update user preference value, user profile is not defined', value);
      return;
    }

    const newUserProfile = produce(userProfile, draft => {
      draft.preferences[key] = value as unknown as any;
    });
    await setUserProfileMutation(newUserProfile).catch(error => {
      logger.error(`Failed to set ${key} in user profile`, error);
    });
  };
};

/**
 * Returns a mutation function that sets the theme in the user profile to be the string provided.
 *
 * @throws if the mutation fails
 */
export const useSetThemeInUserProfile = (): ((themeName: string) => Promise<void>) => {
  return useSetValueInUserPreferences('currentTheme');
};

/**
 * @returns the value for a particular key in the user profile, and a setter to update that value in the profile
 * and stores your layout in local storage, which is a fall back if query fails
 */
export function useUserProfileConfigValue<T extends keyof UserProfileTypes.UserProfile>(
  key: T,
  defaultValue?: UserProfileTypes.UserProfile[T]
): [UserProfileTypes.UserProfile[T] | undefined, (val: UserProfileTypes.UserProfile[T]) => void] {
  const userProfileQueryResults = useGetUserProfileQuery();
  const currentUserProfile = userProfileQueryResults?.data;
  const currentVal = currentUserProfile?.[key];

  React.useLayoutEffect(() => {
    if (currentVal) {
      localStorage.setItem(key, JSON.stringify(currentVal));
    }
  }, [currentVal, key]);
  const setValueInUserProfile = useSetValueInUserProfile(key);

  let selectedVal = currentVal;
  const valInLocalStorage = localStorage.getItem(key);
  if (!currentVal && (valInLocalStorage == null || valInLocalStorage === 'undefined')) {
    selectedVal = defaultValue;
  } else if (!selectedVal) {
    if (valInLocalStorage) {
      selectedVal = JSON.parse(valInLocalStorage);
    }
  }
  return [selectedVal, setValueInUserProfile];
}

/**
 * @returns the value for a particular key in the user preference, and a setter to update that value in the user profile
 * and stores your layout in local storage, which is a fall back if query fails
 */
export function useUserPreferenceConfigValue<T extends keyof UserProfileTypes.UserPreferences>(
  key: T,
  defaultValue?: UserProfileTypes.UserPreferences[T]
): [
  UserProfileTypes.UserPreferences[T] | undefined,
  (val: UserProfileTypes.UserPreferences[T]) => void
] {
  const userProfileQueryResults = useGetUserProfileQuery();
  const currentUserPreferences = userProfileQueryResults?.data?.preferences;
  const currentVal = currentUserPreferences?.[key];

  React.useLayoutEffect(() => {
    if (currentVal) {
      localStorage.setItem(key, JSON.stringify(currentVal));
    }
  }, [currentVal, key]);
  const setValueInUserPreferences = useSetValueInUserPreferences(key);

  let selectedVal = currentVal;
  const valInLocalStorage = localStorage.getItem(key);
  if (!currentVal && (valInLocalStorage == null || valInLocalStorage === 'undefined')) {
    selectedVal = defaultValue;
  } else if (!selectedVal) {
    if (valInLocalStorage) {
      selectedVal = JSON.parse(valInLocalStorage);
    }
  }
  return [selectedVal, setValueInUserPreferences];
}

/**
 * @returns the currently selected color map, either from the user preferences, or from local storage
 * (if not found in preferences)
 */
export const useColorMap = (): [ColorMapName, (colorMap: ColorMapName) => void] => {
  const [colorMap, setColorMap] = useUserPreferenceConfigValue('colorMap', DEFAULT_COLOR_MAP);
  return React.useMemo(() => {
    return [colorMap ?? DEFAULT_COLOR_MAP, setColorMap];
  }, [colorMap, setColorMap]);
};
