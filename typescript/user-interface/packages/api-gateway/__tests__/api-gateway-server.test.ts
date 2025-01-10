import type { CommonTypes } from '@gms/common-model';
import Immutable from 'immutable';

import {
  configureAdditionalRoutesClientLogs,
  consumeSystemEventMessages,
  initializeWebsocketServer,
  registerKafkaConsumerCallbacks
} from '../src/ts/server/api-gateway-server';
import { shutDownHttpServer } from '../src/ts/server/http-server';
import { shutDownWebsocketServer } from '../src/ts/server/websocket-server';

describe('api gateway server tests', () => {
  beforeAll(() => {
    shutDownWebsocketServer();
    shutDownHttpServer();
  });
  it('can parse system event type messages', () => {
    expect(() => registerKafkaConsumerCallbacks()).not.toThrow();
    const systemEvent: CommonTypes.SystemEvent = {
      id: '1',
      specversion: '0.2',
      source: 'api-gateway',
      type: 'message',
      data: 'message-data'
    };
    expect(() => consumeSystemEventMessages(Immutable.List([systemEvent]))).not.toThrow();
  });

  it('configure routes', () => {
    expect(() => configureAdditionalRoutesClientLogs()).not.toThrow();
  });

  it('initializeWebsocketServer', () => {
    expect(initializeWebsocketServer).toBeDefined();
  });
});
