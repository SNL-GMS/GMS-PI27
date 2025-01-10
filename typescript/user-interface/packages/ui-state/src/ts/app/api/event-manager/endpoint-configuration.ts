import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import { CancelTokens, type RequestConfig, type ServiceDefinition } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';
import { prioritizeRequests } from '../request-priority';

/**
 * Event Manager definition request config definition
 */
export interface EventManagerRequestConfig extends RequestConfig {
  readonly eventManager: {
    readonly baseUrl: string;
    readonly services: {
      readonly findEventStatusInfoByStageIdAndEventIds: ServiceDefinition;
      readonly updateEventStatus: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.EventManagerUrls.baseUrl}`;

/**
 * The Event Manager definition request config for all services.
 */
export const config: EventManagerRequestConfig = {
  eventManager: {
    baseUrl,
    services: prioritizeRequests({
      findEventStatusInfoByStageIdAndEventIds: createServiceDefinition({
        baseUrl,
        url: Endpoints.EventManagerUrls.status.url,
        friendlyName: Endpoints.EventManagerUrls.status.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      updateEventStatus: createServiceDefinition({
        baseUrl,
        url: Endpoints.EventManagerUrls.update.url,
        friendlyName: Endpoints.EventManagerUrls.update.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

export type EventManagerServices = keyof typeof config.eventManager.services;
