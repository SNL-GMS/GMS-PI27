import type { ServiceWorkerMessages } from '../ui-workers';
import type { PriorityRequestConfig } from './axios';

/**
 * Service definition
 */
export interface ServiceDefinition {
  readonly requestConfig: PriorityRequestConfig;
  readonly friendlyName: string;
}

/**
 * Request config definition
 */
export interface RequestConfig {
  readonly [domain: string]: {
    readonly baseUrl: string;
    readonly services: {
      readonly [serviceName: string]: ServiceDefinition;
    };
  };
}

interface TrackerMessage {
  message:
    | typeof ServiceWorkerMessages.requestCompleted
    | typeof ServiceWorkerMessages.requestInitiated;
  id: string;
  status?: number; // the status code of the response
  error?: string; // the error status text of the response
  actionType: 'REQUEST' | 'CLIENT_SIDE_ACTION';
}

export interface RequestTrackerMessage extends TrackerMessage {
  url: string;
  actionType: 'REQUEST';
}

export interface ClientSideActionTrackerMessage extends TrackerMessage {
  clientAction: string;
  actionType: 'CLIENT_SIDE_ACTION';
}
