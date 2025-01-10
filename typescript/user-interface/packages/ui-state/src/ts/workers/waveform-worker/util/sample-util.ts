import type { WaveformTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import type { ChannelSegment, Timeseries } from '@gms/common-model/lib/channel-segment';
import type { TimeRange } from '@gms/common-model/lib/common';
import { isWaveformTimeseries } from '@gms/common-model/lib/waveform/util';
import omitBy from 'lodash/omitBy';

import type { UiChannelSegment } from '../../../types';
import { trimWaveform } from '../operations/get-waveform';
import { WaveformStore } from '../worker-store';

/**
 * Will get waveform samples given a claim check id. Waveform samples are missing the X component
 * typically used in the UI.
 *
 * @param uiClaimCheckId the claim check id to retrieve
 * @returns samples
 */
export const getSamples = async (uiClaimCheckId: string | undefined): Promise<Float64Array> => {
  if (!uiClaimCheckId) {
    throw new Error('Cannot convert timeseries that is not data claim check');
  }
  const data = await WaveformStore.retrieve(uiClaimCheckId);
  if (data === undefined) throw new Error('Cannot hydrate claim check with undefined data');

  // Drop all even values. Even values are X and OSD data only contains Y values
  return data.filter((value, index) => index % 2 !== 0);
};

/**
 * Given an array of timeseries, this will hydrate the sample data, without trimming.
 *
 * @param waveforms A list of channel segment timeseries
 * @throws {@link Error} any exceptions
 * @returns waveforms with samples
 */
export const hydrateWaveformSamples = async (waveforms: Timeseries[]): Promise<Timeseries[]> => {
  return Promise.all(
    waveforms.map(async waveform => {
      if (!isWaveformTimeseries(waveform) || !waveform._uiClaimCheckId) {
        throw new Error('Cannot convert timeseries that is not data claim check');
      }

      // Drop all even values. Even values are X and OSD data only contains Y values
      const samples = await getSamples(waveform._uiClaimCheckId);

      return {
        ...(omitBy(waveform, (value, key) => key.startsWith('_ui')) as Timeseries),
        sampleCount: samples.length,
        samples
      };
    })
  );
};

/**
 * Will get waveform samples given a claim check id, trims the result to the trimStartSecs and trimEndSecs values.
 * Waveform samples are missing the X component typically used in the UI.
 *
 * @param uiClaimCheckId the claim check id to retrieve
 * @param trimStartSecs the start of the trim in seconds
 * @param trimEndSecs the end of the trim in seconds
 * @param domainTimeRange the domain of the channel segment (typically the viewableInterval or ui channel segment domainTimeRange)
 * @returns trimmed samples
 */
export const getTrimmedSamples = async (
  uiClaimCheckId: string | undefined,
  trimStartSecs: number,
  trimEndSecs: number,
  domainTimeRange: TimeRange
): Promise<Float64Array> => {
  if (!uiClaimCheckId) {
    throw new Error('Cannot convert timeseries that is not data claim check');
  }
  const data = await WaveformStore.retrieve(uiClaimCheckId);
  if (data === undefined) throw new Error('Cannot hydrate claim check with undefined data');

  // Drop all even values. Even values are X and OSD data only contains Y values
  return trimWaveform(data, trimStartSecs, trimEndSecs, domainTimeRange).filter(
    (value, index) => index % 2 !== 0
  );
};

/**
 * Will hydrate the given waveforms with trimmed sample data.
 * Waveform samples are missing the X component typically used in the UI.
 *
 * @param waveforms the array of waveforms to hydrate
 * @param domainTimeRange the domain of the channel segment (typically the viewableInterval or ui channel segment domainTimeRange)
 * @returns waveforms with trimmed samples
 */
export const hydrateWaveformsWithTrimmedSamples = async (
  waveforms: WaveformTypes.Waveform[],
  domainTimeRange: TimeRange
): Promise<WaveformTypes.Waveform[]> => {
  const results = Promise.all(
    waveforms.map<Promise<WaveformTypes.Waveform | undefined>>(async waveform => {
      const samples = await getTrimmedSamples(
        waveform._uiClaimCheckId,
        waveform.startTime,
        waveform.endTime,
        domainTimeRange
      );

      if (samples.length === 0) {
        return undefined;
      }
      return {
        ...(omitBy(waveform, (value, key) => key.startsWith('_ui')) as Timeseries),
        sampleCount: samples.length,
        samples
      };
    })
  );

  return (await results).filter(notEmpty);
};

/**
 * Will hydrate the given channel segment with trimmed sample data
 *
 * @param channelSegment the channel segment to hydrate
 * @param domainTimeRange the domain of the channel segment (typically the viewableInterval or ui channel segment domainTimeRange)
 * @returns channel segment with trimmed samples
 */
export const hydrateTrimmedChannelSegmentSamples = async (
  channelSegment: ChannelSegment<WaveformTypes.Waveform>,
  domainTimeRange: TimeRange
): Promise<ChannelSegment<WaveformTypes.Waveform>> => {
  return {
    ...channelSegment,
    timeseries: await hydrateWaveformsWithTrimmedSamples(channelSegment.timeseries, domainTimeRange)
  };
};

/**
 * Will hydrate the given ui channel segment with trimmed sample data
 *
 * @param uiChannelSegment the ui channel segment to hydrate
 * @returns ui channel segment with trimmed samples
 */
export const hydrateTrimmedUiChannelSegmentSamples = async (
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>
): Promise<UiChannelSegment<WaveformTypes.Waveform>> => {
  return {
    ...uiChannelSegment,
    channelSegment: await hydrateTrimmedChannelSegmentSamples(
      uiChannelSegment.channelSegment,
      uiChannelSegment.domainTimeRange
    )
  };
};
