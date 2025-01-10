import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';
import { CancelTokens } from '@gms/ui-workers';

import { createServiceDefinition } from '../../create-service-definition';
import { prioritizeRequests } from '../../request-priority';

/**
 * Event request config definition
 */
export interface EventRequestConfig extends RequestConfig {
  readonly event: {
    readonly baseUrl: string;
    readonly services: {
      readonly getEventsWithDetectionsAndSegmentsByTime: ServiceDefinition;
      readonly findEventsByAssociatedSignalDetectionHypotheses: ServiceDefinition;
      readonly predictFeaturesForEventLocation: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.EventManagerUrls.baseUrl}`;

/**
 * The event request config for all services.
 */
export const config: EventRequestConfig = {
  event: {
    baseUrl,
    // Service endpoints for this component
    services: prioritizeRequests({
      getEventsWithDetectionsAndSegmentsByTime: createServiceDefinition({
        baseUrl,
        url: Endpoints.EventManagerUrls.getEventsWithDetectionsAndSegmentsByTime.url,
        friendlyName:
          Endpoints.EventManagerUrls.getEventsWithDetectionsAndSegmentsByTime.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      findEventsByAssociatedSignalDetectionHypotheses: createServiceDefinition({
        baseUrl,
        url: Endpoints.EventManagerUrls.findEventsByAssociatedSignalDetectionHypotheses.url,
        friendlyName:
          Endpoints.EventManagerUrls.findEventsByAssociatedSignalDetectionHypotheses.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      predictFeaturesForEventLocation: createServiceDefinition({
        baseUrl,
        url: Endpoints.EventManagerUrls.predictFeaturesForEventLocation.url,
        friendlyName: Endpoints.EventManagerUrls.predictFeaturesForEventLocation.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

export type EventServices = keyof typeof config.event.services;
