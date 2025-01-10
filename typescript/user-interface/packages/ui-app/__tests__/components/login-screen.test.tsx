/* eslint-disable react/jsx-props-no-spreading */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { To } from 'react-router';
import { createSearchParams } from 'react-router-dom';

import { authenticator } from '~app/authentication';
import { LoginScreenPanel } from '~components/login-screen/login-screen-panel';
import type { LoginScreenReduxProps } from '~components/login-screen/types';

jest.mock('react-router', () => {
  const actualRouter = jest.requireActual('react-router');
  return {
    ...actualRouter,
    Navigate: ({ to }: { to: To }) => {
      // to.search is a string. We just validated that. There's something funny going on
      // with eslint thinking that it is an unbound method
      // eslint-disable-next-line @typescript-eslint/unbound-method
      if (typeof to.search === 'string') return <div>{to.search}</div>;
      return 'fail';
    }
  };
});

const reduxProps: LoginScreenReduxProps = {
  redirectPath: '',
  authenticated: false,
  authenticationCheckComplete: true,
  failedToConnect: false,
  setAppAuthenticationStatus: jest.fn()
};

describe('Login screen', () => {
  it('should be defined', () => {
    expect(LoginScreenPanel).toBeDefined();
  });

  it('failed to connect should return non ideal state, No connection to server', () => {
    const failProps = { ...reduxProps, failedToConnect: true, authenticationCheckComplete: false };
    const loginScreen = render(
      <LoginScreenPanel searchParams={undefined} authenticator={authenticator} {...failProps} />
    );
    const loginScreenNonIdealStateNoConnection = loginScreen.queryByText('No connection to server');
    expect(loginScreen).toMatchSnapshot();
    expect(loginScreenNonIdealStateNoConnection).not.toBeNull();
  });

  it('authentication check in progress shows spinner, attempts to login', () => {
    const failProps = { ...reduxProps, authenticationCheckComplete: false };

    const loginScreen: any = render(
      <LoginScreenPanel searchParams={undefined} authenticator={authenticator} {...failProps} />
    );
    const statusText = loginScreen.queryByText('Attempting to login...');
    expect(loginScreen).toMatchSnapshot();
    expect(statusText).not.toBeNull();
  });

  it('Connected, authentication check complete, and not authenticated should return login page', () => {
    const successProps = { ...reduxProps };

    const loginScreen: any = render(
      <LoginScreenPanel searchParams={undefined} authenticator={authenticator} {...successProps} />
    );
    const loginButton = loginScreen.getByRole('button', { name: 'Login' });
    expect(loginButton.getAttribute('data-cy')).toBe('login-btn');
    expect(loginScreen).toMatchSnapshot();
  });

  it('user authenticates, the app should try to update authentication status', async () => {
    const setAppAuthenticationStatus = jest.fn();
    const loginScreen: any = render(
      <LoginScreenPanel
        searchParams={undefined}
        authenticator={authenticator}
        {...reduxProps}
        setAppAuthenticationStatus={user => {
          setAppAuthenticationStatus(user);
        }}
      />
    );
    const usernameField = loginScreen.getByTestId('username-input');
    const loginButton = loginScreen.getByRole('button', { name: 'Login' });
    expect(usernameField).toBeDefined();
    expect(usernameField.value).toMatch('');
    fireEvent.change(usernameField, { target: { value: 'testUser' } });
    expect(usernameField.value).toMatch('testUser');
    fireEvent.click(loginButton);
    await waitFor(() => expect(setAppAuthenticationStatus).toHaveBeenCalled());
  });

  it('Success preserves url search parameters', async () => {
    const successProps = { ...reduxProps, authenticated: true, redirectPath: '/logged-in' };

    render(
      <LoginScreenPanel
        searchParams={createSearchParams({ layout: 'TestLayout' })}
        authenticator={authenticator}
        {...successProps}
      />
    );
    await waitFor(() => expect(screen.getByText('?layout=TestLayout')).toBeDefined(), {
      timeout: 1000
    });
  });
});
