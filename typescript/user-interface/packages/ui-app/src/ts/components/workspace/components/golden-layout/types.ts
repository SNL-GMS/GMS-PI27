import type { CommonTypes, UserProfileTypes, WorkflowTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { KeyValue } from '@gms/common-util';
import type { ReactComponentConfig } from '@gms/golden-layout';
import type GoldenLayout from '@gms/golden-layout';
import type {
  AuthenticationStatus,
  GLDisplayState,
  ProcessingAnalystConfigurationQuery,
  SetLayoutArgs,
  UserProfileQuery
} from '@gms/ui-state';
import React from 'react';

import type { Command, CommandScope } from '~components/common-ui/components/command-palette/types';

export interface GoldenLayoutPanelProps {
  logo: any;
  userName: string;
  openLayoutName: string | undefined;
  versionInfo: CommonTypes.VersionInfo;
  userProfileQuery: UserProfileQuery;
  /** Used to determine non-ideal state */
  processingAnalystConfigurationQuery: ProcessingAnalystConfigurationQuery;
  logout(): void;
  registerCommands(commandActions: Command[], scope: CommandScope): void;
  setGlDisplayState(displayName: string, displayState: GLDisplayState);
  setLayout(args: SetLayoutArgs): Promise<void>;
  setOpenLayoutName(name: string);
}

export interface GoldenLayoutPanelState {
  selectedWorkspaceId: string | undefined;
  saveAsName: string;
  isSaveAsDefaultChecked: boolean;
  isSaveWorkspaceAsDialogOpen: boolean;
  isSaveWorkspaceOnChangeDialogOpen: boolean;
  isAboutDialogOpen: boolean;
  isSaveLayoutChangesOpen: boolean;
  userLayoutToOpen: UserProfileTypes.UserLayout | undefined;
}

export interface GoldenLayoutComponentBaseProps {
  logo: any;
  userName: string;
  currentTimeInterval: Nullable<CommonTypes.TimeRange>;
  analysisMode: WorkflowTypes.AnalysisMode;
  setAppAuthenticationStatus(auth: AuthenticationStatus): AuthenticationStatus;
}

export interface GoldenLayoutComponentReduxProps {
  keyPressActionQueue: Record<string, number>;
  setKeyPressActionQueue(actions: Record<string, number>): void;
}

/**
 * Mutations used in the event list
 */
export interface GoldenLayoutComponentMutations {
  setLayout(args: SetLayoutArgs): Promise<UserProfileTypes.UserProfile>;
}

export type GoldenLayoutComponentProps = GoldenLayoutComponentBaseProps &
  GoldenLayoutComponentReduxProps &
  GoldenLayoutComponentMutations;

/** Defines the GL component config */
export interface GLComponentConfig {
  type: string;
  title: string;
  component: string;
}

/** Defines the GL component config list */
export interface GLComponentConfigList {
  [componentKey: string]: GLComponentConfig;
}

/**
 * ! This seems to correspond to the result of gl.toConfig()
 * ! but the actual return type is any, therefore, it cannot be guaranteed
 * ! that this type is correct.
 */
export type GLConfigResult = ReactComponentConfig;

/** Defines the GL config */
export interface GLConfig {
  components: GLComponentConfigList;
  workspace: GoldenLayout.Config;
}

/** Defines the GL key value */
export type GLKeyValue = KeyValue<
  GLComponentConfig,
  React.ComponentClass | React.FunctionComponent
>;

/** Defines the GL component map */
export type GLComponentMap = Map<string, GLKeyValue>;

/** Defines the GL component value */
export type GLComponentValue = GLKeyValue | GLComponentMap;

/** Defines the GL Map */
export type GLMap = Map<string, GLComponentValue>;

/**
 * Returns true if the value is a GLComponentMap
 *
 * @param val the value to check
 */
export const isGLComponentMap = (val: GLComponentValue): val is GLComponentMap =>
  val instanceof Map;

/**
 * Returns true if the value is a GLKeyValue
 *
 * @param val the value to check
 */
export const isGLKeyValue = (val: GLComponentValue): val is GLKeyValue => !isGLComponentMap(val);

/** The Golden Layout context data */
export interface GoldenLayoutContextData {
  config: GLConfig | undefined;
  gl: GoldenLayout | undefined;
  glComponents: GLMap | undefined;
  supportedUserInterfaceMode: UserProfileTypes.UserMode | undefined;
  glRef: HTMLDivElement | null;
}

/** The Golden Layout context */
export const GoldenLayoutContext = React.createContext<GoldenLayoutContextData>({
  config: undefined,
  gl: undefined,
  glComponents: undefined,
  supportedUserInterfaceMode: undefined,
  glRef: null
});
