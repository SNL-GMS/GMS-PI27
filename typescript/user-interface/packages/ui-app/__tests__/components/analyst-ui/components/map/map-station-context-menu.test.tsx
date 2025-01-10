import { getStore } from '@gms/ui-state';
import { getByText, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { StationMenu } from '../../../../../src/ts/components/analyst-ui/components/map/station-menu';

const store = getStore();
describe('MapSignalDetectionContextMenu', () => {
  it('contents match snapshot', () => {
    const container = render(
      <Provider store={store}>
        <StationMenu
          target={
            {
              id: 'ABC',
              properties: {
                type: {
                  getValue: jest.fn(() => 'Station')
                }
              }
            } as any
          }
          canShowContextMenu
          isStationVisible={jest.fn(() => true)}
          latitude={0}
          longitude={0}
          setStationVisibility={jest.fn()}
          setCreateEventMenuState={jest.fn}
        />
      </Provider>
    );
    expect(container.baseElement).toMatchSnapshot();
  });
  it('has a hide multiples entry', () => {
    const { container } = render(
      <Provider store={store}>
        <StationMenu
          target={
            {
              id: 'ABC',
              properties: {
                type: {
                  getValue: jest.fn(() => 'Station')
                }
              }
            } as any
          }
          canShowContextMenu
          isStationVisible={jest.fn(() => true)}
          latitude={0}
          longitude={0}
          setStationVisibility={jest.fn()}
          setCreateEventMenuState={jest.fn}
        />
      </Provider>
    );
    const result = getByText(container, 'Hide selected stations on Waveform Display');
    expect(result).toBeDefined();
  });
});
