import { render } from '@testing-library/react';
import React from 'react';

import { RecordSectionExample } from '../../src/ts/examples/example-record-section';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

it('renders a component', () => {
  const { container } = render(<RecordSectionExample />);
  expect(container).toMatchSnapshot();
});
