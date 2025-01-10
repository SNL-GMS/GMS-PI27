import { eventData, eventData2 } from '@gms/common-model/__tests__/__data__/event/event-data';
import { getStore } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { EventsTablePanel } from '~analyst-ui/components/events/events-table-panel';
import { setFocusToEventsDisplay } from '~analyst-ui/components/events/events-util';

import { EventsPanel } from '../../../../../src/ts/components/analyst-ui/components/events/events-panel';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { glContainer } from '../workflow/gl-container';
import { eventResults } from './event-data-types';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});

const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('Event Panel', () => {
  const storeDefault = getStore();

  it('is exported', () => {
    expect(EventsPanel).toBeDefined();
  });

  // This is required so that jest.spyOn doesn't throw a type error
  jest.mock('@gms/ui-state', () => {
    const actual = jest.requireActual('@gms/ui-state');
    const allEvents = {
      [eventData.id]: eventData,
      [eventData2.id]: eventData2
    };
    return {
      ...actual,
      useGetEvents: jest.fn().mockReturnValue({
        data: Object.values(allEvents)
      }),
      ...appState,
      app: {
        ...appState.app,
        userSession: {
          ...appState.app.userSession,
          authenticationStatus: {
            ...appState.app.userSession.authenticationStatus,
            userName: 'test-user',
            authenticated: true
          }
        }
      }
    };
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Provider store={storeDefault}>
        <BaseDisplay glContainer={glContainer}>
          <EventsPanel />
        </BaseDisplay>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  // TODO: Test causes Jest to Hang indefinitely
  test.skip('event table panel matches snapshot', () => {
    const { container } = render(
      <Provider store={storeDefault}>
        <BaseDisplay glContainer={glContainer}>
          <EventsTablePanel eventResults={eventResults} />
        </BaseDisplay>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  describe('Events Display focus', () => {
    function FocusEventsDisplay(props: { shouldSetFocus: boolean }) {
      const { shouldSetFocus } = props;

      React.useEffect(() => {
        if (shouldSetFocus) {
          setFocusToEventsDisplay();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      const store = getStore();
      return (
        <BaseDisplay glContainer={glContainer}>
          <Provider store={store}>
            <EventsPanel />
          </Provider>
        </BaseDisplay>
      );
    }

    test('Can mount events panel and does not have focus', async () => {
      let resultWithoutFocus = null;
      await act(async () => {
        // wait for all the state calls to come back
        // eslint-disable-next-line @typescript-eslint/await-thenable
        resultWithoutFocus = await render(<FocusEventsDisplay shouldSetFocus={false} />);
      });
      await waitFor(() =>
        expect(
          resultWithoutFocus.container.getElementsByClassName('events-panel')[0]
        ).not.toBeNull()
      );
    });

    test('Can mount events panel and set focus', async () => {
      let resultWithFocus = null;
      await act(async () => {
        // wait for all the state calls to come back
        // eslint-disable-next-line @typescript-eslint/await-thenable
        resultWithFocus = await render(<FocusEventsDisplay shouldSetFocus />);
      });
      await waitFor(() =>
        expect(resultWithFocus.container.getElementsByClassName('events-panel')[0]).not.toBeNull()
      );
    });
  });
});
