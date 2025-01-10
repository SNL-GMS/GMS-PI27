import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { EventsToolbar } from '../../../../../src/ts/components/analyst-ui/components/events/toolbar/events-toolbar';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { glContainer } from '../workflow/gl-container';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('event list Toolbar', () => {
  const storeDefault = getStore();

  it('is exported', () => {
    expect(EventsToolbar).toBeDefined();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Provider store={storeDefault}>
        <BaseDisplay glContainer={glContainer}>
          <EventsToolbar
            countEntryRecord={{
              Total: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Complete: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Deleted: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Remaining: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Conflicts: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Rejected: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' }
            }}
            disableMarkSelectedComplete={false}
            handleMarkSelectedComplete={jest.fn()}
            setCreateEventMenuState={jest.fn()}
          />
        </BaseDisplay>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
