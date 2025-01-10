import { createExpressServer } from '../src/ts/server/express-server';
import {
  configureRouteAlive,
  configureRouteCheckInitialized,
  configureRouteCheckKafka,
  configureRouteCheckWebsocket,
  configureRouteHealthCheck,
  configureRouteReady
} from '../src/ts/server/routes';

const mockRequest = {
  headers: {
    host: 'foo'
  }
};

const mockResponse = {
  status: () => {
    return mockResponse;
  },
  send: () => {
    return mockResponse;
  },
  json: jest.fn()
};

const app = {
  use: jest.fn(),
  listen: jest.fn(),
  set: jest.fn(),
  get: (path, handler) => {
    handler(mockRequest, mockResponse);
  }
};
jest.doMock('express', () => {
  return () => {
    return app;
  };
});

describe('express routes', () => {
  it('express routes', () => {
    const express = createExpressServer();
    expect(() => configureRouteAlive(express)).not.toThrow();
    expect(() => configureRouteReady(express, 'https')).not.toThrow();
    expect(() => configureRouteHealthCheck(express, 'https')).not.toThrow();
    expect(() => configureRouteCheckInitialized(express)).not.toThrow();
    expect(() => configureRouteCheckWebsocket(express)).not.toThrow();
    expect(() => configureRouteCheckKafka(express)).not.toThrow();
  });
});
