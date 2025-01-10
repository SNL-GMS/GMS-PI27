import type { RequestConfig } from '@gms/ui-workers';
import merge from 'lodash/merge';

import { config as ChannelSegmentServices } from './data/channel/endpoint-configuration';
import { config as EventServices } from './data/event/endpoint-configuration';
import { config as FkComputeServices } from './data/fk/endpoint-configuration';
import { config as SignalDetectionServices } from './data/signal-detection/endpoint-configuration';
import { config as SignalEnhancementConfigurationData } from './data/signal-enhancement/endpoint-configuration';
import { config as ChannelServices } from './data/waveform/endpoint-configuration';
import { config as EventManagerServices } from './event-manager/endpoint-configuration';
import { config as ProcessingConfigurationServices } from './processing-configuration';
import { config as SignalEnhancementConfigurationServices } from './signal-enhancement-configuration/endpoint-configuration';
import { config as StationManagerServices } from './station-definition/endpoint-configuration';
import { config as SystemEventGatewayServices } from './system-event-gateway/endpoint-configuration';
import { config as UserManagerServices } from './user-manager/endpoint-configuration';
import { config as WorkflowServices } from './workflow/endpoint-configuration';

const configs: RequestConfig = merge(
  ChannelSegmentServices,
  ChannelServices,
  EventManagerServices,
  EventServices,
  FkComputeServices,
  ProcessingConfigurationServices,
  SignalDetectionServices,
  SignalEnhancementConfigurationData,
  SignalEnhancementConfigurationServices,
  StationManagerServices,
  SystemEventGatewayServices,
  UserManagerServices,
  WorkflowServices
);

/**
 * @returns a human readable string describing the purpose of the endpoint
 */
export const getFriendlyNames = () => {
  const friendlyNamesByUrl: Record<string, string> = {};
  Object.entries(configs).forEach(([, config]) => {
    Object.entries(config.services).forEach(([, service]) => {
      const url = `${service.requestConfig.baseURL ?? config.baseUrl}${service.requestConfig.url}`;
      friendlyNamesByUrl[url] = service.friendlyName ?? url;
    });
  });
  return friendlyNamesByUrl;
};
