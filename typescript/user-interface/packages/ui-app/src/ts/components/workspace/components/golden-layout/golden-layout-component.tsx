import { VERSION_INFO } from '@gms/common-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import type { GLDisplayState } from '@gms/ui-state';
import {
  resetApiState,
  resetAppState,
  setGlDisplayState,
  useAppDispatch,
  useGetProcessingAnalystConfigurationQuery,
  useGetUserProfileQuery,
  useSetLayout
} from '@gms/ui-state';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  processingAnalystConfigNonIdealStateDefinitions,
  userProfileNonIdealStateDefinitions
} from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { authenticator } from '~app/authentication';
import { CommandPaletteContext } from '~components/common-ui/components/command-palette/command-palette-context';
import type { Command, CommandScope } from '~components/common-ui/components/command-palette/types';

import { GoldenLayoutPanel } from './golden-layout-panel';
import type { GoldenLayoutComponentProps, GoldenLayoutPanelProps } from './types';

function useSetOpenLayoutNameWithSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const setOpenLayoutNameWithSearchParams = React.useCallback(
    (layoutName: string) => {
      setSearchParams({ layout: layoutName });
    },
    [setSearchParams]
  );
  const layout = searchParams.get('layout') ?? undefined;
  return { openLayoutName: layout, setOpenLayoutName: setOpenLayoutNameWithSearchParams };
}

export const GoldenLayoutPanelOrNonIdealState = WithNonIdealStates<GoldenLayoutPanelProps>(
  [...processingAnalystConfigNonIdealStateDefinitions, ...userProfileNonIdealStateDefinitions],
  GoldenLayoutPanel
);

export function GoldenLayoutComponent({
  logo,
  userName,
  setAppAuthenticationStatus
}: GoldenLayoutComponentProps) {
  const context = React.useContext(CommandPaletteContext);

  const setLayout = useSetLayout();
  const userProfileQuery = useGetUserProfileQuery();
  const processingAnalystConfigurationQuery = useGetProcessingAnalystConfigurationQuery();
  const dispatch = useAppDispatch();
  const registerCommands = React.useCallback(
    (commandsToRegister: Command[], scope: CommandScope) =>
      context?.registerCommands && context.registerCommands(commandsToRegister, scope),
    [context]
  );

  const logout = React.useCallback(() => {
    dispatch(resetAppState);
    resetApiState(dispatch);

    authenticator.logout(setAppAuthenticationStatus);
  }, [dispatch, setAppAuthenticationStatus]);

  const setGlDisplayStateCallback = React.useCallback(
    (displayName: string, displayState: GLDisplayState) => {
      dispatch(setGlDisplayState(displayName, displayState));
    },
    [dispatch]
  );
  const { openLayoutName, setOpenLayoutName } = useSetOpenLayoutNameWithSearchParams();
  return (
    <GoldenLayoutPanelOrNonIdealState
      logo={logo}
      openLayoutName={openLayoutName}
      setOpenLayoutName={setOpenLayoutName}
      setGlDisplayState={setGlDisplayStateCallback}
      userName={userName}
      userProfileQuery={userProfileQuery}
      versionInfo={VERSION_INFO}
      setLayout={setLayout}
      registerCommands={registerCommands}
      logout={logout}
      processingAnalystConfigurationQuery={processingAnalystConfigurationQuery}
    />
  );
}
