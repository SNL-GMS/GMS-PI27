import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SignalDetections } from '../../../../../src/ts/components/analyst-ui/components';

jest.mock(
  '../../../../../src/ts/components/analyst-ui/components/signal-detections/signal-detections-panel',
  () => {
    function MockSignalDetections() {
      return <div className="ian-signal-detections-wrapper" />;
    }
    return { SignalDetectionsPanel: () => MockSignalDetections() };
  }
);

const { container } = render(
  <Provider store={getStore()}>
    <SignalDetections glContainer={{} as any} />
  </Provider>
);

describe('ui ian signal detections', () => {
  test('is defined', () => {
    expect(SignalDetections).toBeDefined();
  });

  test('can mount signal detections', () => {
    expect(container).toMatchSnapshot();
  });
});
