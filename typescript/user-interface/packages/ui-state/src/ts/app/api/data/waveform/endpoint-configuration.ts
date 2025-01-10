import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';
import { CancelTokens } from '@gms/ui-workers';

import { createServiceDefinition } from '../../create-service-definition';
import { prioritizeRequests } from '../../request-priority';

/**
 * Waveform request config definition
 */
export interface WaveformRequestConfig extends RequestConfig {
  readonly waveform: {
    readonly baseUrl: string;
    readonly services: {
      readonly getChannelSegment: ServiceDefinition;
      readonly findQCSegmentsByChannelAndTimeRange: ServiceDefinition;
      readonly findEventBeamsByEventHypothesisAndStations: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.WaveformManagerServiceUrls.baseUrl}`;

/**
 * The Waveform request config for all services.
 */
export const config: WaveformRequestConfig = {
  waveform: {
    baseUrl,
    // Service endpoints for this component
    services: prioritizeRequests({
      getChannelSegment: createServiceDefinition({
        baseUrl,
        url: Endpoints.WaveformManagerServiceUrls.getChannelSegment.url,
        friendlyName: Endpoints.WaveformManagerServiceUrls.getChannelSegment.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      findQCSegmentsByChannelAndTimeRange: createServiceDefinition({
        baseUrl,
        url: Endpoints.WaveformManagerServiceUrls.findQCSegmentsByChannelAndTimeRange.url,
        friendlyName:
          Endpoints.WaveformManagerServiceUrls.findQCSegmentsByChannelAndTimeRange.friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      }),
      findEventBeamsByEventHypothesisAndStations: createServiceDefinition({
        baseUrl,
        url: Endpoints.WaveformManagerServiceUrls.findEventBeamsByEventHypothesisAndStations.url,
        friendlyName:
          Endpoints.WaveformManagerServiceUrls.findEventBeamsByEventHypothesisAndStations
            .friendlyName,
        accept: 'application/msgpack',
        cancelToken: CancelTokens.CANCEL_ON_INTERVAL_CLOSE
      })
    })
  }
};

export type ChannelSegmentServices = keyof typeof config.waveform.services;
