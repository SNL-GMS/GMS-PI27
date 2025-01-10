import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';

/**
 * System event gateway request config definition
 */
export interface SystemEventGatewayRequestConfig extends RequestConfig {
  readonly gateway: {
    readonly baseUrl: string;
    readonly services: {
      readonly sendClientLogs: ServiceDefinition;
      readonly publishDerivedChannels: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.SystemEventGatewayUrls.baseUrl}`;

/**
 * The system event gateway request config for all services.
 */
export const config: SystemEventGatewayRequestConfig = {
  gateway: {
    baseUrl,
    services: {
      sendClientLogs: createServiceDefinition({
        baseUrl,
        url: Endpoints.SystemEventGatewayUrls.sendClientLogs.url,
        friendlyName: Endpoints.SystemEventGatewayUrls.sendClientLogs.friendlyName,
        accept: 'application/json'
      }),
      publishDerivedChannels: createServiceDefinition({
        baseUrl,
        url: Endpoints.SystemEventGatewayUrls.publishDerivedChannels.url,
        friendlyName: Endpoints.SystemEventGatewayUrls.publishDerivedChannels.friendlyName,
        accept: 'application/json'
      })
    }
  }
};
