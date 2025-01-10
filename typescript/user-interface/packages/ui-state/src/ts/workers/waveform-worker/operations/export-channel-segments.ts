import type { WaveformTypes } from '@gms/common-model';
import type { ChannelSegment } from '@gms/common-model/lib/channel-segment/types';
import { Units } from '@gms/common-model/lib/common/types';
import { serializeTypeTransformer } from '@gms/ui-workers';
import omitBy from 'lodash/omitBy';

import type { FilterDefinitionAssociationsObject, UiChannelSegment } from '../../../types';
import { hydrateWaveformsWithTrimmedSamples } from '../util/sample-util';

/**
 * Converts UiChannelSegments to OSD model, with hydrated claim check's.
 *
 * @param uiChannelSegments A list of UIChannelSegments
 *
 * @returns Promise of converted OSD data including waveform data
 */
export const convertUiChannelSegmentsToChannelSegments = async (
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
): Promise<ChannelSegment<WaveformTypes.Waveform>[]> => {
  return Promise.all(
    uiChannelSegments.map(async uiChannelSegment => {
      const timeseries = await hydrateWaveformsWithTrimmedSamples(
        uiChannelSegment.channelSegment.timeseries,
        uiChannelSegment.domainTimeRange
      );
      return {
        ...omitBy(uiChannelSegment.channelSegment, (value, key) => key.startsWith('_ui')),
        id: {
          channel: {
            name: uiChannelSegment.channelSegmentDescriptor.channel.name,
            effectiveAt: uiChannelSegment.channelSegmentDescriptor.channel.effectiveAt
          },
          startTime: uiChannelSegment.channelSegmentDescriptor.startTime,
          endTime: uiChannelSegment.channelSegmentDescriptor.endTime,
          creationTime: uiChannelSegment.channelSegmentDescriptor.creationTime
        },
        units: Units[uiChannelSegment.channelSegment.units],
        timeseriesType: uiChannelSegment.channelSegment.timeseriesType,
        timeseries,
        maskedBy: uiChannelSegment.channelSegment.maskedBy,
        missingInputChannels: uiChannelSegment.channelSegment.missingInputChannels
      };
    })
  );
};

/**
 * Exports UIChannelSegments as a Blob containing OSD ChannelSegments in JSON format.
 *
 * @param uiChannelSegments A list of UIChannelSegments
 *
 * @returns Promise of Blob containing converted OSD format data
 */
export const exportChannelSegmentsWithFilterAssociations = async (
  params: FilterDefinitionAssociationsObject
): Promise<Blob> => {
  let data = {
    channelSegments: await convertUiChannelSegmentsToChannelSegments(params.channelSegments),
    filterAssociations: params.filterAssociations
  };
  data = serializeTypeTransformer(data);
  return new Blob(
    [
      JSON.stringify(data, (key, value) => {
        return ArrayBuffer.isView(value) && value instanceof Float64Array
          ? Array.from(value)
          : value;
      })
    ],
    { type: 'application/json' }
  );
};
