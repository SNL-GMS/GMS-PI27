import { Logger } from '@gms/common-util';
import { getStore } from '@gms/ui-state';
import { setAppAuthenticationStatus } from '@gms/ui-state/lib/app/state/operations';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { App } from '~app/ui-ian-app/app';

// eslint-disable-next-line import/namespace
import * as Index from '../../../src/ts/app/ui-ian-app/index';

const logger = Logger.create('GMS_LOG_JEST', process.env.GMS_LOG_JEST);

jest.mock('../../../src/ts/components/analyst-ui/components', () => {
  return { IANMap: () => logger.debug('hi') };
});

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual
  };
});

describe('Root IAN app', () => {
  const store = getStore();
  store.dispatch(
    setAppAuthenticationStatus({
      authenticated: true,
      authenticationCheckComplete: true,
      failedToConnect: false,
      userName: 'username'
    })
  );

  it('exists', () => {
    expect(Index).toBeDefined();
  });

  it('matches a snapshot', () => {
    const { container } = render(
      <Provider store={getStore()}>
        <App />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
