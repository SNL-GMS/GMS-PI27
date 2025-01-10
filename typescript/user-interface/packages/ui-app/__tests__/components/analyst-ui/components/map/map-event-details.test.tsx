import { getStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';

import { EventDetails } from '~analyst-ui/common/dialogs/event-details/event-details';

describe('EventDetails', () => {
  test('functions are defined', () => {
    expect(EventDetails).toBeDefined();
  });

  it('matches snapshot', () => {
    const store = getStore();
    const component = renderer
      .create(
        <Provider store={store}>
          <EventDetails
            eventId="test"
            time={{ value: 0, uncertainty: 0 }}
            latitudeDegrees={45}
            longitudeDegrees={45}
            depthKm={{ value: 10, uncertainty: 0 }}
          />
        </Provider>
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
});
