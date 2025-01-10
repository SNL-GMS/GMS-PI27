import '@testing-library/jest-dom';

import { getStore } from '@gms/ui-state';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { StatusBar } from '~components/workspace/components/status-bar/status-bar';

describe('StatusBar', () => {
  const store = getStore();

  let container;
  beforeEach(() => {
    container = render(
      <Provider store={store}>
        <StatusBar />
      </Provider>
    ).container;
  });
  afterEach(cleanup);
  it('matches a snapshot', () => {
    expect(container).toMatchSnapshot();
  });
  it('has the status-bar class', () => {
    expect(container.firstChild).toHaveClass('status-bar');
  });
});
