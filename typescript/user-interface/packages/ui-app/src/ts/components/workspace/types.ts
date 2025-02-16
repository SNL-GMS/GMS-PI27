import type { DialogTypes } from '@gms/ui-core-components';
import type { AnalystWorkspaceTypes, AuthenticationStatus, UserSessionState } from '@gms/ui-state';
import type History from 'history';
import type Immutable from 'immutable';
import React from 'react';

/**
 * The workspace redux props.
 * Note: these props are mapped in from Redux state
 */
export interface WorkspaceReduxProps {
  userSessionState: UserSessionState;
  keyPressActionQueue: Record<string, number>;
  pushKeyPressAction(action: AnalystWorkspaceTypes.AnalystKeyAction): void;
  setAppAuthenticationStatus(auth: AuthenticationStatus): void;
  setKeyPressActionQueue(actions: Immutable.Map<string, number>): void;
}

/**
 * The workspace props.
 */
export type WorkspaceProps = WorkspaceReduxProps & {
  location: History.Location;
};

export type WorkspaceLayout = DialogTypes.SaveableItem;

/**
 * The workspace state.
 */
export interface WorkspaceState {
  triggerAnimation: boolean;
}

export const KeyContext = React.createContext({
  shouldTriggerAnimation: false,
  resetAnimation: () => {
    // This empty arrow function is intentional.  This comment satisfies removing a SonarQube's critical issue
  }
});
