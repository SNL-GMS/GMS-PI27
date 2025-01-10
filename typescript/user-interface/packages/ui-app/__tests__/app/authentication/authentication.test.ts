import { ianAuthenticator } from '../../../src/ts/app/authentication/authentication';

describe('ian-authentication', () => {
  test('imports should be defined', () => {
    expect(ianAuthenticator).toBeDefined();
  });

  test('ianAuthenticator should have defined object fields', () => {
    /* eslint-disable @typescript-eslint/unbound-method */
    expect(ianAuthenticator.authenticateWith).toBeDefined();
    expect(ianAuthenticator.checkIsAuthenticated).toBeDefined();
    expect(ianAuthenticator.unAuthenticateWith).toBeDefined();
    expect(ianAuthenticator.logout).toBeDefined();
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  test("authenticateWith('test') should return an authenticated session", async () => {
    const result = await ianAuthenticator.authenticateWith('test');
    expect(result.authenticated).toBeTruthy();
    expect(result).toMatchSnapshot();
  });

  test('authenticateWith() should return an authenticated session', async () => {
    const result = await ianAuthenticator.authenticateWith('username');
    expect(result.authenticated).toBeTruthy();
    expect(result).toMatchSnapshot();
  });

  test('authenticateWith() should return an unauthenticated session', async () => {
    const result = await ianAuthenticator.authenticateWith('');
    expect(result.authenticated).toBeFalsy();
    expect(result).toMatchSnapshot();
  });

  test('checkIsAuthenticated should return an authenticated session', async () => {
    const result = await ianAuthenticator.checkIsAuthenticated();
    expect(result.authenticated).toBeTruthy();
    expect(result).toMatchSnapshot();
  });

  test('logout should call back with an unauthenticated session', () => {
    ianAuthenticator.logout(result => {
      expect(result.authenticated).toBeFalsy();
      expect(result).toMatchSnapshot();
    });
  });

  test('checkIsAuthenticated should return an unauthenticated session', async () => {
    const result = await ianAuthenticator.checkIsAuthenticated();
    expect(result.authenticated).toBeFalsy();
    expect(result).toMatchSnapshot();
  });

  test('unauthenticated if logout should fail', () => {
    ianAuthenticator.logout(result => {
      // eslint-disable-next-line no-eval
      eval('💣'); // Exercise the "catch" of the logout
      expect(result.authenticated).toBeFalsy();
    });
  });

  test('logs an error if logout should fail', () => {
    const errorMessage = 'Failed to un - authenticate: SyntaxError: Invalid or unexpected token';
    ianAuthenticator.logout(() => {
      // eslint-disable-next-line no-eval
      eval('💣'); // Exercise the "catch" of the logout
      console.error = jest.fn();
      expect(console.error).toHaveBeenCalledWith(errorMessage);
    });
  });
});
