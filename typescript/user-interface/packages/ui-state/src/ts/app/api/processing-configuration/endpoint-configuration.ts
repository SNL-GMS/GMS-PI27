import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';
import { prioritizeRequests } from '../request-priority';

/**
 * Processing configuration request config definition
 */
export interface ProcessingConfigurationRequestConfig extends RequestConfig {
  readonly processingConfiguration: {
    readonly baseUrl: string;
    readonly services: {
      readonly getProcessingConfiguration: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.ProcessingConfigUrls.baseUrl}`;

/**
 * The processing configuration request config for all services.
 */
export const config: ProcessingConfigurationRequestConfig = {
  processingConfiguration: {
    baseUrl,
    // Service endpoints for this component
    services: prioritizeRequests({
      getProcessingConfiguration: createServiceDefinition({
        baseUrl,
        url: Endpoints.ProcessingConfigUrls.getProcessingConfiguration.url,
        friendlyName: Endpoints.ProcessingConfigUrls.getProcessingConfiguration.friendlyName,
        accept: 'application/json'
      })
    })
  }
};

export type ProcessingConfigurationServices = keyof typeof config.processingConfiguration.services;
