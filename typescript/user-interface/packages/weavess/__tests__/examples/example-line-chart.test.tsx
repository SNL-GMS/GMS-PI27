import { render } from '@testing-library/react';
import React from 'react';

import { WeavessLineChartExample } from '../../src/ts/examples/example-line-chart';
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

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

it('renders a component', () => {
  const { container } = render(<WeavessLineChartExample />);
  expect(container).toMatchSnapshot();
});
