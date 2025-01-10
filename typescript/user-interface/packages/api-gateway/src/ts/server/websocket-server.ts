import type { CommonTypes } from '@gms/common-model';
import { epochSecondsNow } from '@gms/common-util';
import config from 'config';
import https from 'http';
import includes from 'lodash/includes';
import isArray from 'lodash/isArray';
import uniq from 'lodash/uniq';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import { gatewayLogger as logger } from '../log/gateway-logger';

/** 5 minute heartbeat in milliseconds */
const HEARTBEAT_MS = 300000;

/** The HTTP Server */
let server: https.Server;

/** The connected clients */
const clients: Map<WebSocket, string[]> = new Map();

/**
 * Polling heartbeat timer that periodically keeps the connection alive and broadcasts the subscribed event types
 */
let pollingHeartbeatTimer: NodeJS.Timer;

/**
 * Checks to see if `object` is a valid SystemEventType and casts.
 *
 * @param object the object to validate; check if it is a valid SystemEventType
 * @returns boolean
 */
export function isSystemEventType(
  object: Record<'eventType', unknown>
): object is CommonTypes.SystemEventType {
  return object.eventType !== undefined;
}

/**
 * Parses and validates a system event type message.
 *
 * @param message the message
 * @returns an array of system event types; empty if invalid
 */
export const parseAndValidateSystemEventTypeMessage = (
  message: string
): CommonTypes.SystemEventType[] => {
  if (message !== undefined) {
    const parsed = JSON.parse(message);
    if (isArray(parsed)) {
      if (parsed.every(isSystemEventType)) {
        return parsed;
      }
    } else if (isSystemEventType(parsed)) {
      return [parsed];
    }
  }
  return [];
};

/**
 * Handles, parses and validates SystemEventType messages that were
 * received on the provided websocket.
 *
 * If valid, the system event types will be registered for the websocket.
 *
 * @param message the received message
 * @param ws the websocket connect
 */
export const handleSystemEventTypeMessage = (message: string, ws: WebSocket): void => {
  const systemEvents = parseAndValidateSystemEventTypeMessage(message);

  // filter out any heartbeat messages
  const filteredSystemEvents = systemEvents.filter(
    systemEvent => systemEvent.eventType !== 'heartbeat'
  );

  if (systemEvents.length !== filteredSystemEvents.length) {
    logger.debug(`Received heartbeat message from client`, ws);
  }

  if (filteredSystemEvents.length > 0) {
    clients.set(ws, uniq(filteredSystemEvents.map(systemEvent => systemEvent.eventType).sort()));
  }
};

/**
 * Sends a heartbeat message on the provided websocket
 *
 * @param ws the websocket
 */
const sendHeartbeat = (): void => {
  clients.forEach((topics, ws) => {
    const heartbeat: CommonTypes.SystemEvent = {
      id: 'heartbeat',
      specversion: '0.2',
      source: 'api-gateway',
      type: 'heartbeat',
      data: {
        time: epochSecondsNow(),
        topics
      }
    };
    ws.send(JSON.stringify(heartbeat));
  });
};

/**
 * Handles the on socket connection.
 *
 * @param ws the websocket
 */
const onSocketConnect = (ws: WebSocket) => {
  const systemEvent: CommonTypes.SystemEvent = {
    id: 'connected',
    specversion: '0.2',
    source: 'api-gateway',
    type: 'api-gateway-connected'
  };

  // register client with no topics
  clients.set(ws, []);

  ws.send(JSON.stringify(systemEvent));

  ws.on('message', (message: string) => {
    handleSystemEventTypeMessage(message, ws);
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
};

/**
 * Creates the WebSocket server
 */
export const createWebSocketServer = (): void => {
  logger.info(`Creating the web socket server...`);

  // Load configuration settings
  const serverConfig = config.get('server');

  // Websocket port
  const wsPort = serverConfig.ws.port;
  logger.info(`wsPort ${wsPort}`);

  server = https.createServer({ keepAlive: true });

  // disable connection timeouts
  server.keepAliveTimeout = 0;
  server.headersTimeout = 120;
  server.timeout = 0;

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', function upgrade(request) {
    // here we only handle websocket connections; upgrade the connection
    wss.handleUpgrade(request, request.socket, Buffer.alloc(0), onSocketConnect);
  });

  server.listen(wsPort);

  clearTimeout(pollingHeartbeatTimer);

  // send a heartbeat message every 5 minutes to any of the connected clients
  pollingHeartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);
};

/**
 * Route System Event wrapped messages to subscribers depending on System Event type
 *
 * @param systemEvent message to send back
 */
export const sendSubscriptionMessage = (systemEvent: CommonTypes.SystemEvent): void => {
  // send the message on each websocket connection is registered for the event type
  clients.forEach((topics, ws) => {
    if (includes(topics, systemEvent.type)) {
      ws.send(JSON.stringify(systemEvent));
    }
  });
};

/**
 * Cleanup available on shutdown
 */
export const shutDownWebsocketServer = (): void => {
  if (server) {
    server.close();
  }
};
