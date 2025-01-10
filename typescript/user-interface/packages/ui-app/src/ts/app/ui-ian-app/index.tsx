import '~css/ui-app.scss';

import { HotkeysProvider } from '@blueprintjs/core';
import { getStore } from '@gms/ui-state';
import { isDarkMode, replaceFavIcon } from '@gms/ui-util';
import { enableAllPlugins } from 'immer';
import * as JQuery from 'jquery';
import React from 'react';
import ReactDom from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { KeyCloakService } from '~app/authentication/gms-keycloak';
import { attachGmsHelp } from '~app/gms-help';
import { GMS_DISABLE_KEYCLOAK_AUTH } from '~env';

import { checkEnvConfiguration } from '../check-env-configuration';
import { checkUserAgent } from '../check-user-agent';
import { configureElectron } from '../configure-electron';
import { App } from './app';

// required for golden-layout
(window as any).React = React;
(window as any).ReactDOM = ReactDom;
(window as any).createRoot = createRoot;
(window as any).$ = JQuery;

const store = getStore();

window.onload = () => {
  checkEnvConfiguration();
  checkUserAgent();
  enableAllPlugins();

  // if the user is in dark mode, we replace the favicon with a lighter icon so it is visible
  if (isDarkMode()) {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const logo = require('../../../../resources/images/gms-logo-favicon-dark.png');
    replaceFavIcon(logo);
  }

  const app = document.getElementById('app');

  if (app == null) {
    throw new Error('Failed to find element `app`');
  }

  const root = createRoot(app);
  const renderApp = () =>
    root.render(
      <Provider store={store}>
        <HotkeysProvider>
          <App />
        </HotkeysProvider>
      </Provider>
    );
  if (GMS_DISABLE_KEYCLOAK_AUTH) {
    renderApp();
  } else KeyCloakService.callLogin(renderApp);
};

configureElectron();

// Custom dev tools API in the dev console
attachGmsHelp();
