import { act } from 'react-test-renderer';

import { registerServiceWorker } from '../src/ts/register-service-worker';
import { ServiceWorkerMessages } from '../src/ts/ui-workers';

// do this in here so that it is defined early enough
Object.defineProperty((global as any).navigator, 'serviceWorker', {
  value: {
    register: jest.fn(),
    addEventListener: jest.fn()
  }
});

describe('register service worker', () => {
  it('exists', () => {
    expect(registerServiceWorker).toBeDefined();
  });

  it('can be called', () => {
    const mockAddEventListener = (
      _eventName: string,
      callback: (message: { data: string }) => unknown
    ) => {
      act(() => {
        callback({ data: ServiceWorkerMessages.listenersActiveMessage });
      });
    };

    jest
      .spyOn((global as any).navigator.serviceWorker, 'addEventListener')
      .mockImplementation(mockAddEventListener as any);

    expect(async () => {
      await registerServiceWorker(() => {
        /* do nothing */
      });
    }).not.toThrow();
  });
});
