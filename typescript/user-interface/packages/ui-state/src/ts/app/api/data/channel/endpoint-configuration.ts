import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';
import { CancelTokens } from '@gms/ui-workers';

import { createServiceDefinition } from '../../create-service-definition';
import { prioritizeRequests } from '../../request-priority';

/**
 * Station definition request config definition
 */
export interface StationDefinitionRequestConfig extends RequestConfig {
  readonly stationDefinition: {
    readonly baseUrl: string;
    readonly services: {
      readonly getChannelsByNamesTimeRange: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.StationDefinitionUrls.baseUrl}`;

/**
 * The station definition request config for all services.
 */
export const config: StationDefinitionRequestConfig = {
  stationDefinition: {
    baseUrl,
    services: prioritizeRequests({
      getChannelsByNamesTimeRange: createServiceDefinition({
        baseUrl,
        url: Endpoints.StationDefinitionUrls.getChannelsByNamesTimeRange.url,
        friendlyName: Endpoints.StationDefinitionUrls.getChannelsByNamesTimeRange.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

export type StationManagerServices = keyof typeof config.stationDefinition.services;
