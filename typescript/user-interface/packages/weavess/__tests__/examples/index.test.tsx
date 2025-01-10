import React from 'react';
import { create } from 'react-test-renderer';

import { App } from '../../src/ts/examples/app';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

it('renders a component', () => {
  expect(create(<App />).toJSON()).toMatchSnapshot();
});
