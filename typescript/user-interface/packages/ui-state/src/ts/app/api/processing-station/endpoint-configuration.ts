import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';

/**
 * Processing station request config definition
 */
export interface ProcessingStationRequestConfig extends RequestConfig {
  readonly gateway: {
    readonly baseUrl: string;
    readonly services: {
      readonly getProcessingStationGroups: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.FrameworksOsdSUrls.baseUrl}`;

/**
 * The processing station request config for all services.
 */
export const config: ProcessingStationRequestConfig = {
  gateway: {
    baseUrl: `${UI_URL}${Endpoints.FrameworksOsdSUrls.baseUrl}`,
    services: {
      getProcessingStationGroups: createServiceDefinition({
        baseUrl,
        url: Endpoints.FrameworksOsdSUrls.getProcessingStationGroups.url,
        friendlyName: Endpoints.FrameworksOsdSUrls.getProcessingStationGroups.friendlyName,
        accept: 'application/json'
      })
    }
  }
};
