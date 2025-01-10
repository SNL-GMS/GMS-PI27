import { Button, ButtonGroup, Classes, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import type { ColorMapName } from '@gms/common-model/lib/color/types';
import { AllColorMaps } from '@gms/common-model/lib/color/types';
import type { UserPreferences } from '@gms/common-model/lib/user-profile/types';
import { FormContent, FormGroup } from '@gms/ui-core-components';
import {
  useGetAllUiThemes,
  useGetUserProfileQuery,
  useSetUserProfileMutation,
  useUiTheme
} from '@gms/ui-state';
import produce from 'immer';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { StringSelect } from '~analyst-ui/common/forms/inputs/string-select';

/**
 * The type of the props for the {@link UserPreferencesDialog} component
 */
export interface UserPreferencesDialogProps {
  readonly isUserPreferencesDialogOpen: boolean;
  readonly closeUserPreferences: () => void;
}

/**
 * Creates a dialog popup the allows a user to update user preferences
 */
export function UserPreferencesDialog({
  isUserPreferencesDialogOpen,
  closeUserPreferences
}: UserPreferencesDialogProps) {
  const [uiTheme] = useUiTheme();
  const userProfileQueryResults = useGetUserProfileQuery();
  const uiThemes: ConfigurationTypes.UITheme[] = useGetAllUiThemes();
  const colorMapItems = React.useMemo(() => [...AllColorMaps], []);
  const themeItems = React.useMemo(() => uiThemes.map(theme => theme.name), [uiThemes]);
  const [userChanges, setUserChanges] = React.useState<UserPreferences>({
    colorMap: userProfileQueryResults?.data?.preferences.colorMap ?? colorMapItems[0],
    currentTheme: userProfileQueryResults?.data?.preferences.currentTheme ?? themeItems[0]
  });
  const [setUserProfileMutation] = useSetUserProfileMutation();
  const isLoading = React.useRef(false);
  React.useEffect(() => {
    setUserChanges({
      colorMap: userProfileQueryResults?.data?.preferences.colorMap ?? colorMapItems[0],
      currentTheme: userProfileQueryResults?.data?.preferences.currentTheme ?? themeItems[0]
    });
  }, [colorMapItems, themeItems, userProfileQueryResults?.data?.preferences]);
  return (
    <Dialog
      isOpen={isUserPreferencesDialogOpen}
      onClose={closeUserPreferences}
      className={`${uiTheme.isDarkMode ? Classes.DARK : 'gms-light-mode'} user-preferences__dialog`}
      title={<span>User Preferences</span>}
    >
      <DialogBody className="user-preferences-dialog">
        <FormContent className="user-preferences-dialog__content">
          <FormGroup label="Colors">
            <FormGroup helperText="The colors used for FK images" label="Color Map">
              <StringSelect
                filterable={false}
                selected={userChanges.colorMap}
                items={colorMapItems}
                setSelected={updatedColorMap => {
                  setUserChanges({
                    ...userChanges,
                    colorMap: updatedColorMap as ColorMapName
                  });
                }}
                fill
              />
            </FormGroup>
            <FormGroup helperText="Application colors" label="Theme">
              <StringSelect
                filterable={false}
                selected={userChanges.currentTheme}
                items={themeItems}
                setSelected={theme => {
                  setUserChanges({
                    ...userChanges,
                    currentTheme: theme
                  });
                }}
                fill
              />
            </FormGroup>
          </FormGroup>
        </FormContent>
      </DialogBody>
      <DialogFooter
        minimal
        actions={
          <ButtonGroup>
            <Button
              text="Cancel"
              onClick={() => {
                closeUserPreferences();
              }}
            />
            <Button
              intent="primary"
              type="submit"
              loading={isLoading.current}
              disabled={isEqual(userProfileQueryResults?.data?.preferences, userChanges)}
              onClick={async () => {
                isLoading.current = true;
                const newUserProfile = produce(userProfileQueryResults?.data, draft => {
                  if (draft) {
                    draft.preferences.colorMap = userChanges.colorMap;
                    draft.preferences.currentTheme = userChanges.currentTheme;
                  }
                });
                if (newUserProfile) {
                  await setUserProfileMutation(newUserProfile).then(() => {
                    isLoading.current = false;
                    closeUserPreferences();
                  });
                }
              }}
              title="Update user preferences"
            >
              Update Preferences
            </Button>
          </ButtonGroup>
        }
      />
    </Dialog>
  );
}
