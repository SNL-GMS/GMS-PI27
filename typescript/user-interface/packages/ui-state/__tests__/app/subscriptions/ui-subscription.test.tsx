import type { UserSessionState } from '../../../src/ts/app/state/user-session/types';
import type { Subscriber } from '../../../src/ts/app/subscription/subscription';
import {
  addSubscriber,
  establishWsConnection,
  getSubscriptionCallbacks,
  getSubscriptionMetadata,
  onClose,
  onError,
  onMessage,
  onOpen,
  registerConnectionStatusCallback,
  removeSubscriber,
  sendSubscriptionEventTypes
} from '../../../src/ts/app/subscription/subscription';

const webSocketMock = {
  onopen: console.log,
  onerror: console.log,
  onmessage: console.log,
  onclose: console.log
};
Object.assign(WebSocket, webSocketMock);

const fetchMock = jest.fn(async () => Promise.resolve(() => 'yay!'));
Object.assign(fetch, fetchMock);

const connCreateCloudEventData: string = JSON.stringify({
  id: 'bace0ba1-4491-4dbc-9801-ff12683da8a4',
  source: 'rig',
  specversion: '0.2',
  time: '2021-05-31T15:24:42.331717+00:00',
  type: 'api-gateway-connected'
});

const updateEventMessageData = (eventType: string): string =>
  JSON.stringify({
    data: 'This is the event data!',
    id: '116',
    source: 'api-gateway',
    specversion: '0.2',
    type: eventType
  });

const event: unknown = {
  bubbles: false,
  cancelBubble: false,
  cancelable: false,
  composed: false,
  currentTarget: undefined,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: undefined,
  target: undefined,
  timeStamp: 6501.700000000186,
  type: 'event'
};

const messageEvent: any = {
  ...(event as Event),
  data: undefined,
  lastEventId: '',
  origin: 'ws://localhost:8000',
  ports: [],
  type: 'message',
  source: null
};

const mockConnectionStatusCallback = jest.fn();
const mockUserSessionState: UserSessionState = {
  authenticationStatus: {
    userName: 'foo',
    authenticated: true,
    authenticationCheckComplete: true,
    failedToConnect: false
  },
  connected: false
};

describe('UI Subscription', () => {
  beforeEach(() => {
    getSubscriptionCallbacks().forEach((subscribers, eventType) => {
      subscribers.forEach((s, id) => {
        removeSubscriber(id, eventType);
      });
    });
  });

  it(`Can create websocket, even multiple times`, () => {
    expect(() => establishWsConnection()).not.toThrow();
    expect(() => establishWsConnection()).not.toThrow();
  });

  // First thing register callback  before calling open
  it('can register connected status callback', () => {
    expect(
      registerConnectionStatusCallback(mockConnectionStatusCallback, mockUserSessionState)
    ).toBeUndefined();
  });

  it('subscribeWebsocket conducts successful SEG handshake', () => {
    // Parse the event data to get the data call back from
    // onMessage(updateEventMessage) below
    const expectedData = JSON.parse(updateEventMessageData('event.type')).data;
    addSubscriber(
      'ui-subscription-test',
      'event.type',
      data => {
        expect(data).toBe(expectedData);
      },
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    webSocketMock.onopen('opened!');
    webSocketMock.onerror('error!');
    webSocketMock.onclose('closed!');

    const connCreateCloudEvent = {
      ...messageEvent,
      data: connCreateCloudEventData
    };
    onMessage(connCreateCloudEvent);
    const updateEventMessage = {
      ...messageEvent,
      data: updateEventMessageData('event.type')
    };
    onMessage(updateEventMessage);

    // Call with bad type
    const bogusTypeMessage = {
      ...messageEvent,
      data: updateEventMessageData('bogus.type')
    };
    expect(() => onMessage(bogusTypeMessage)).not.toThrow();

    // Test onOpen
    expect(() => onOpen(event as Event)).not.toThrow();
    // Test onError
    expect(() => onError(event as Event)).not.toThrow();
  });

  it('onClose confirm calls subscription for reconnect', () => {
    // Subscribe to socket connection
    addSubscriber('ui-subscription-test', 'event.type', data => {
      expect(data).toMatchSnapshot();
    });

    // test the on close event
    onClose(event as Event).catch(e => {
      throw new Error(e);
    });
  });

  it('sendSubscriptionEventTypes test', () => {
    expect(sendSubscriptionEventTypes).toBeDefined();
    expect(sendSubscriptionEventTypes()).toBeUndefined();
  });

  it('add/removeSubscriber test', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();

    const eventType = 'TEST';

    const id1 = addSubscriber('ui-subscription-test1', eventType, cb1);
    const id2 = addSubscriber('ui-subscription-test2', eventType, cb2);

    expect(getSubscriptionCallbacks().size).toBe(1);
    expect(getSubscriptionCallbacks().get(eventType)?.size).toBe(2);
    expect(getSubscriptionCallbacks().get(eventType)?.first<Subscriber<unknown>>().onMessage).toBe(
      cb1
    );
    expect(getSubscriptionCallbacks().get(eventType)?.last<Subscriber<unknown>>().onMessage).toBe(
      cb2
    );
    expect(getSubscriptionMetadata().size).toBe(1);
    expect(getSubscriptionMetadata().filter(e => e.eventType !== eventType).size).toBe(0);

    removeSubscriber(id1, eventType);

    expect(getSubscriptionCallbacks().size).toBe(1);
    expect(getSubscriptionCallbacks().get(eventType)?.size).toBe(1);
    expect(getSubscriptionCallbacks().get(eventType)?.first<Subscriber<unknown>>().onMessage).toBe(
      cb2
    );
    expect(getSubscriptionCallbacks().get(eventType)?.last<Subscriber<unknown>>().onMessage).toBe(
      cb2
    );
    expect(getSubscriptionMetadata().size).toBe(1);
    expect(getSubscriptionMetadata().filter(e => e.eventType !== eventType).size).toBe(0);

    removeSubscriber(id2, eventType);

    expect(getSubscriptionCallbacks().size).toBe(0);
    expect(getSubscriptionCallbacks().get(eventType)?.size).toBeUndefined();
    expect(
      getSubscriptionMetadata().filter(metadata => metadata.eventType === eventType).size
    ).toBe(0);
  });
});
