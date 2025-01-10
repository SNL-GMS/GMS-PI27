import { commonActions, getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { StationProperties } from '../../../../../src/ts/components/analyst-ui/components/station-properties';
import { StationPropertiesComponent } from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-component';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('station-properties-panel', () => {
  test('can mount', () => {
    expect(StationProperties).toBeDefined();
  });

  test('matches snapshot', () => {
    const store = getStore();
    store.dispatch(commonActions.setSelectedStationIds(['targetEntity.id']));

    const rederStationProperties = render(
      <Provider store={store}>
        <StationProperties />
      </Provider>
    );
    expect(rederStationProperties.container).toMatchSnapshot();

    const rederStationPropertiesComponent = render(
      <Provider store={store}>
        <StationPropertiesComponent />
      </Provider>
    );
    expect(rederStationPropertiesComponent.container).toMatchSnapshot();
  });

  test('matches snapshot 1 station', () => {
    const store = getStore();
    store.dispatch(commonActions.setSelectedStationIds(['station1']));
    const { container } = render(
      <Provider store={store}>
        <StationProperties />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('matches snapshot multiple stations', () => {
    const store = getStore();
    store.dispatch(commonActions.setSelectedStationIds(['station1', 'station2']));
    const { container } = render(
      <Provider store={store}>
        <StationProperties />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('matches snapshot no stations', () => {
    const store = getStore();
    const { container } = render(
      <Provider store={store}>
        <StationProperties />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
