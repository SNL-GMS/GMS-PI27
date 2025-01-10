import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';
import { CancelTokens } from '@gms/ui-workers';

import { createServiceDefinition } from '../../create-service-definition';
import { prioritizeRequests } from '../../request-priority';

/**
 * Signal Enhancement Request Configuration
 */
export interface SignalEnhancementRequestConfig extends RequestConfig {
  readonly signalEnhancementConfiguration: {
    readonly baseUrl: string;
    readonly services: {
      readonly getDefaultFilterDefinitionByUsageForChannelSegments: ServiceDefinition;
      readonly getProcessingMaskDefinitions: ServiceDefinition;
      readonly getBeamformingTemplates: ServiceDefinition;
      readonly getRotationTemplates: ServiceDefinition;
      readonly getFkReviewablePhases: ServiceDefinition;
      readonly getFkSpectraTemplates: ServiceDefinition;
      readonly getDefaultFilterDefinitionByUsageMap: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.SignalEnhancementConfigurationUrls.baseUrl}`;

/**
 * Signal Enhancement Request Configuration
 */
export const config: SignalEnhancementRequestConfig = {
  signalEnhancementConfiguration: {
    baseUrl,
    services: prioritizeRequests({
      getDefaultFilterDefinitionByUsageForChannelSegments: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls
          .getDefaultFilterDefinitionByUsageForChannelSegments.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls
            .getDefaultFilterDefinitionByUsageForChannelSegments.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getProcessingMaskDefinitions: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getProcessingMaskDefinitions.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getProcessingMaskDefinitions.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getBeamformingTemplates: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getBeamformingTemplates.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getBeamformingTemplates.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getRotationTemplates: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getRotationTemplates.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getRotationTemplates.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getFkReviewablePhases: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getFkReviewablePhases.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getFkReviewablePhases.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getFkSpectraTemplates: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getFkSpectraTemplates.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getFkSpectraTemplates.friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      getDefaultFilterDefinitionByUsageMap: createServiceDefinition({
        baseUrl,
        url: Endpoints.SignalEnhancementConfigurationUrls.getDefaultFilterDefinitionByUsageMap.url,
        friendlyName:
          Endpoints.SignalEnhancementConfigurationUrls.getDefaultFilterDefinitionByUsageMap
            .friendlyName,
        accept: 'application/json',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

/**
 * Signal Enhancement Request Configuration Services
 */
export type SignalEnhancementConfigurationServices = keyof typeof config;
