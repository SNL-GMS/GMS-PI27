import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';
import { CancelTokens } from '@gms/ui-workers';

import { createServiceDefinition } from '../../create-service-definition';
import { prioritizeRequests } from '../../request-priority';

/**
 * Data request config definition
 */
export interface SignalDetectionRequestConfig extends RequestConfig {
  readonly signalDetection: {
    readonly baseUrl: string;
    readonly services: {
      readonly getDetectionsWithSegmentsByStationsAndTime: ServiceDefinition;
      readonly getFilterDefinitionsForSignalDetections: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.SignalDetectionManagerUrls.baseUrl}`;

/**
 * The signal detection request config for all endpoints.
 */
export const config: SignalDetectionRequestConfig = {
  signalDetection: {
    baseUrl,
    // service endpoints
    services: prioritizeRequests({
      getDetectionsWithSegmentsByStationsAndTime: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalDetectionManagerUrls.getDetectionsWithSegmentsByStationsAndTime.url,
        friendlyName:
          Endpoints.SignalDetectionManagerUrls.getDetectionsWithSegmentsByStationsAndTime
            .friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getFilterDefinitionsForSignalDetections: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalDetectionManagerUrls.getFilterDefinitionsForSignalDetections.url,
        friendlyName:
          Endpoints.SignalDetectionManagerUrls.getFilterDefinitionsForSignalDetections.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

export type SignalDetectionServices = keyof typeof config.signalDetection.services;
