import type { AppState } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';

import { ProtectedRouteComponent } from '../../src/ts/components/protected-route/protected-route-component';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Protected route', () => {
  it('should be defined', () => {
    expect(ProtectedRouteComponent).toBeDefined();
  });

  it('Authenticated should match snapshot', () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore();
    const authenticatedAppState: AppState = {
      ...appState,
      app: {
        ...appState.app,
        userSession: {
          ...appState.app.userSession,
          authenticationStatus: {
            ...appState.app.userSession.authenticationStatus,
            authenticated: true
          }
        }
      }
    };

    const store = mockStoreCreator(authenticatedAppState);

    render(
      <Provider store={store}>
        <HashRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRouteComponent>
                  <div>Test</div>
                </ProtectedRouteComponent>
              }
            />
          </Routes>
        </HashRouter>
      </Provider>
    );

    expect(screen.getByText('Test')).toBeDefined();
  });

  it('Not authenticated should redirect', () => {
    const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore();
    const unauthenticatedAppState: AppState = {
      ...appState,
      app: {
        ...appState.app,
        userSession: {
          ...appState.app.userSession,
          authenticationStatus: {
            ...appState.app.userSession.authenticationStatus,
            authenticated: false
          }
        }
      }
    };

    const store = mockStoreCreator(unauthenticatedAppState);

    render(
      <Provider store={store}>
        <HashRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRouteComponent>
                  <div>Test</div>
                </ProtectedRouteComponent>
              }
            />
          </Routes>
        </HashRouter>
      </Provider>
    );

    expect(screen.queryByText('Test')).toBeNull();
  });
});
