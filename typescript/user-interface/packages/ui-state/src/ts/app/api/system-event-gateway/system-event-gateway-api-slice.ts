import type { ChannelTypes, CommonTypes } from '@gms/common-model';
import { axiosBaseQuery } from '@gms/ui-workers';
import { createApi } from '@reduxjs/toolkit/query/react';

import { config } from './endpoint-configuration';

/**
 * The client log api reducer slice.
 */
export const systemEventGatewayApiSlice = createApi({
  reducerPath: 'systemEventGatewayApi',
  baseQuery: axiosBaseQuery({
    baseUrl: config.gateway.baseUrl
  }),
  endpoints(build) {
    return {
      /**
       * defines the post method to send client logs
       */
      clientLog: build.mutation<void, CommonTypes.ClientLogInput[]>({
        query: (data: CommonTypes.ClientLogInput[]) => ({
          requestConfig: {
            ...config.gateway.services.sendClientLogs.requestConfig,
            data
          }
        })
      }),
      publishDerivedChannels: build.mutation<void, ChannelTypes.Channel[]>({
        query: (data: ChannelTypes.Channel[]) => ({
          requestConfig: {
            ...config.gateway.services.publishDerivedChannels.requestConfig,
            data
          }
        })
      })
    };
  }
});

export const { useClientLogMutation } = systemEventGatewayApiSlice;
export type ClientLogMutation = ReturnType<typeof systemEventGatewayApiSlice.useClientLogMutation>;

export const { usePublishDerivedChannelsMutation } = systemEventGatewayApiSlice;
export type PublishDerivedChannelMutation = ReturnType<
  typeof systemEventGatewayApiSlice.usePublishDerivedChannelsMutation
>;
