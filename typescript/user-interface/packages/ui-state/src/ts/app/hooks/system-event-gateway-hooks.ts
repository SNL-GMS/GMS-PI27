import type { ChannelTypes, CommonTypes } from '@gms/common-model';
import { Logger } from '@gms/common-util';
import type { BaseQueryFn, MutationDefinition } from '@reduxjs/toolkit/dist/query';
import type { MutationTrigger } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import {
  useClientLogMutation,
  usePublishDerivedChannelsMutation
} from '../api/system-event-gateway';

const logger = Logger.create(
  'GMS_LOG_SYSTEM_EVENT_GATEWAY',
  process.env.GMS_LOG_SYSTEM_EVENT_GATEWAY
);
/**
 * A hook that sends the client log messages to the system event gateway
 */
export const useClientLog = (): MutationTrigger<
  MutationDefinition<
    CommonTypes.ClientLogInput[],
    BaseQueryFn<any, unknown, unknown, Record<string, never>, Record<string, never>>,
    never,
    void,
    'systemEventGatewayApi'
  >
> => {
  const [clientLogMutation] = useClientLogMutation();
  return clientLogMutation;
};

/**
 * A hook that gets the derived channel to send to the system event gateway
 */
export const useGetPublishDerivedChannelsMutation = (): MutationTrigger<
  MutationDefinition<
    ChannelTypes.Channel[],
    BaseQueryFn<any, unknown, unknown, Record<string, never>, Record<string, never>>,
    never,
    void,
    'systemEventGatewayApi'
  >
> => {
  const [publishDerivedChannelsMutation] = usePublishDerivedChannelsMutation();
  return publishDerivedChannelsMutation;
};

/**
 * Hook that takes the derived channel to send to the System Event gateway
 */
export const usePublishDerivedChannel = (): ((
  channelsToPublish: ChannelTypes.Channel[]
) => Promise<void>) => {
  const callMutation = useGetPublishDerivedChannelsMutation();
  return async channelsToPublish => {
    logger.info(`Publishing derived channel list size: ${channelsToPublish.length}`);

    await callMutation(channelsToPublish);
  };
};
