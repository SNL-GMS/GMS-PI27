import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { Home } from '../../src/ts/examples/home';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

it('renders a component', () => {
  const { container } = render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
  expect(container).toMatchSnapshot();
});
