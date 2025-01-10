import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';
import { CancelTokens } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';
import { prioritizeRequests } from '../request-priority';

/**
 * Signal enhancement request config definition
 */
export interface SignalEnhancementConfigurationRequestConfig extends RequestConfig {
  readonly signalEnhancementConfiguration: {
    readonly baseUrl: string;
    readonly services: {
      readonly getSignalEnhancementConfiguration: ServiceDefinition;
      readonly getDefaultFilterDefinitionsForSignalDetectionHypotheses: ServiceDefinition;
    };
  };
}
const baseUrl = `${UI_URL}${Endpoints.SignalEnhancementConfigurationUrls.baseUrl}`;
/**
 * The Signal enhancement request config for all services.
 */
export const config: SignalEnhancementConfigurationRequestConfig = {
  signalEnhancementConfiguration: {
    baseUrl,
    services: prioritizeRequests({
      getSignalEnhancementConfiguration: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getSignalEnhancementConfiguration.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getSignalEnhancementConfiguration
            .friendlyName,
        method: 'GET',
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getDefaultFilterDefinitionsForSignalDetectionHypotheses: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls
          .getDefaultFilterDefinitionsForSignalDetectionHypotheses.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls
            .getDefaultFilterDefinitionsForSignalDetectionHypotheses.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

export type SignalEnhancementConfigurationServices = keyof typeof config;
