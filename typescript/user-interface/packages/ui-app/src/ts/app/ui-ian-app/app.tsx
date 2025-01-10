import { HotkeysProvider } from '@blueprintjs/core';
import { Displays } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import { useHistoryHotKeys, useUiTheme, withReduxProvider } from '@gms/ui-state';
import { useGlobalHotkeyListener } from '@gms/ui-util/lib/ui-util/hot-key-util';
import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { AnalystUiComponents } from '~analyst-ui/';
import { AnalystCommandRegistrar } from '~analyst-ui/commands/analyst-command-registrar';
import { useSaveLoadHotKeys } from '~analyst-ui/common/save-load/save-load-hooks';
import { FkManager } from '~analyst-ui/components/azimuth-slowness/fk-manager';
import { FilterManager } from '~analyst-ui/components/filters/filter-manager';
import { InteractionConsumer } from '~analyst-ui/interactions/interaction-consumer';
import { InteractionProvider } from '~analyst-ui/interactions/interaction-provider';
import { authenticator } from '~app/authentication';
import { useGlobalPreventDefault } from '~app/global-hotkey-hooks';
import { UIThemeWrapper } from '~app/initializers/ui-theme-wrapper';
import { LoadingIndicatorWrapper } from '~app/loading-indicator-wrapper';
import { ServiceWorkerController } from '~app/service-worker-controller';
import { ThemedToastContainer } from '~app/themed-toast-container';
import { UniqueComponent } from '~common-ui/components/unique-component';
import { CommonCommandRegistrar } from '~components/common-ui/commands';
import {
  CommandPalette,
  useToggleCommandPaletteVisibilityHotkeys
} from '~components/common-ui/components/command-palette';
import { LoadingScreen } from '~components/loading-screen';
import { LoginScreen } from '~components/login-screen';
import { ProtectedRoute } from '~components/protected-route';
import { GoldenLayoutContext } from '~components/workspace/components/golden-layout/types';
import { ReduxWorkspaceContainer as Workspace } from '~components/workspace/workspace-container';
import { GMS_DISABLE_KEYCLOAK_AUTH } from '~env';

import { createPopoutComponent } from '../create-popout-component';
import { glContextData } from './golden-layout-config';

const GMS = 'GMS';

/**
 * Wraps the component route.
 * Provides the required context providers to the component.
 *
 * @param Component the component route
 * @param props the props passed down from the route to the component
 * @param suppressPopinIcon true to force suppress the golden-layout popin icon
 */
function wrap(Component: any, name: string | undefined, props: any, suppressPopinIcon = false) {
  function WrappedComponent(p) {
    const [uiTheme] = useUiTheme();
    useGlobalHotkeyListener();
    useGlobalPreventDefault();
    useSaveLoadHotKeys();
    useHistoryHotKeys();
    useToggleCommandPaletteVisibilityHotkeys();

    const unique = name ? (
      <UniqueComponent name={name}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...p} />
      </UniqueComponent>
    ) : (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Component {...p} />
    );

    return (
      <ServiceWorkerController>
        <HotkeysProvider>
          <>
            <UIThemeWrapper key={uiTheme.name}>
              <CommandPalette>
                <LoadingIndicatorWrapper />
                {unique}
                <InteractionProvider>
                  <InteractionConsumer />
                </InteractionProvider>
                <CommonCommandRegistrar />
                <AnalystCommandRegistrar />
              </CommandPalette>
              <ThemedToastContainer />
            </UIThemeWrapper>
            <FilterManager />
            <FkManager />
          </>
        </HotkeysProvider>
      </ServiceWorkerController>
    );
  }

  return createPopoutComponent(withReduxProvider(WrappedComponent), props, suppressPopinIcon);
}

const WrappedWorkflow: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.Workflow, IanDisplays.WORKFLOW, props);
const WrappedEvents: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.Events, IanDisplays.EVENTS, props);
const WrappedFilters: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.Filters, IanDisplays.FILTERS, props);
const WrappedWaveform: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.Waveform, IanDisplays.WAVEFORM, props);
const WrappedMap: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.IANMap, IanDisplays.MAP, props);
const WrappedSignalDetections: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.SignalDetections, IanDisplays.SIGNAL_DETECTIONS, props);
const WrappedStationProperties: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.StationProperties, IanDisplays.STATION_PROPERTIES, props);
const WrappedWorkspace: React.FC<unknown> = props => wrap(Workspace, undefined, props, true);
const WrappedAzimuthSlowness: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.AzimuthSlowness, IanDisplays.AZIMUTH_SLOWNESS, props);
const WrappedHistory: React.FC<unknown> = props =>
  wrap(AnalystUiComponents.History, IanDisplays.HISTORY, props);

export function App(): React.ReactElement {
  const redirectRoute = GMS_DISABLE_KEYCLOAK_AUTH ? (
    <>
      <Route path="/login/:redirectUrl" element={<LoginScreen authenticator={authenticator} />} />
      <Route path="/login" element={<LoginScreen authenticator={authenticator} />} />
    </>
  ) : undefined;

  return (
    <HashRouter>
      {
        // ! CAUTION: when changing the route paths
        // The route paths must match the `golden-layout` component name for popout windows
        // For example, the component name `my-route` must have the route path of `my-route`
      }
      {
        // For performance use `render` which accepts a functional component
        // that won't get unnecessarily remounted like with component.
      }
      <Routes>
        {
          // Authentication
          // React router dropped support for optional params
          // so we need separate routes for login and login with a redirect
        }
        {redirectRoute}
        <Route
          path="/loading"
          element={
            <ProtectedRoute redirectPath="loading" title={`${GMS}: Loading...`}>
              <LoadingScreen />
            </ProtectedRoute>
          }
        />
        {
          // Individual ProtectedRoutes
        }
        <Route
          path={`/${IanDisplays.WORKFLOW}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.WORKFLOW}
              title={Displays.toDisplayTitle(Displays.IanDisplays.WORKFLOW, `${GMS}: `)}
            >
              <WrappedWorkflow />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.EVENTS}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.EVENTS}
              title={Displays.toDisplayTitle(Displays.IanDisplays.EVENTS, `${GMS}: `)}
            >
              <WrappedEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.FILTERS}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.FILTERS}
              title={Displays.toDisplayTitle(Displays.IanDisplays.FILTERS, `${GMS}: `)}
            >
              <WrappedFilters />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.WAVEFORM}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.WAVEFORM}
              title={Displays.toDisplayTitle(Displays.IanDisplays.WAVEFORM, `${GMS}: `)}
            >
              <WrappedWaveform />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.MAP}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.MAP}
              title={Displays.toDisplayTitle(Displays.IanDisplays.MAP, `${GMS}: `)}
            >
              <WrappedMap />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.SIGNAL_DETECTIONS}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.SIGNAL_DETECTIONS}
              title={Displays.toDisplayTitle(Displays.IanDisplays.SIGNAL_DETECTIONS, `${GMS}: `)}
            >
              <WrappedSignalDetections />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.AZIMUTH_SLOWNESS}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.AZIMUTH_SLOWNESS}
              title={Displays.toDisplayTitle(Displays.IanDisplays.AZIMUTH_SLOWNESS, `${GMS}: `)}
            >
              <WrappedAzimuthSlowness />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.STATION_PROPERTIES}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.STATION_PROPERTIES}
              title={Displays.toDisplayTitle(Displays.IanDisplays.STATION_PROPERTIES, `${GMS}: `)}
            >
              <WrappedStationProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/${IanDisplays.HISTORY}`}
          element={
            <ProtectedRoute
              redirectPath={IanDisplays.HISTORY}
              title={Displays.toDisplayTitle(Displays.IanDisplays.HISTORY, `${GMS}: `)}
            >
              <WrappedHistory />
            </ProtectedRoute>
          }
        />
        {
          // Workspace
        }
        <Route
          path="*"
          element={
            <ProtectedRoute title={`${GMS}: App Workspace`}>
              <GoldenLayoutContext.Provider value={glContextData()}>
                <WrappedWorkspace />
              </GoldenLayoutContext.Provider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
