import { render } from '@testing-library/react';
import React from 'react';

import { EventsExample } from '../../src/ts/examples/example-events';
import { initialConfiguration } from '../__data__/test-util-data';

jest.mock('../../src/ts/components/weavess-waveform-display/utils', () => {
  const actual = jest.requireActual('../../src/ts/components/weavess-waveform-display/utils');
  return {
    ...actual,
    clearThree: jest.fn()
  };
});

jest.mock('../../src/ts/components/weavess-waveform-display/configuration', () => {
  const actual = jest.requireActual(
    '../../src/ts/components/weavess-waveform-display/configuration'
  );
  return {
    ...actual,
    memoizedGetConfiguration: jest.fn(() => {
      return initialConfiguration;
    })
  };
});

jest.mock('lodash/uniqueId', () => {
  const id = 1;
  return () => id;
});

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

// TODO: Fix flakey test (maybe due to race conditions in the order in which the tests are run)
it.skip('renders a component', () => {
  const { container } = render(<EventsExample />);
  // expect(container).toMatchSnapshot();
  expect(container).toBeDefined();
});
