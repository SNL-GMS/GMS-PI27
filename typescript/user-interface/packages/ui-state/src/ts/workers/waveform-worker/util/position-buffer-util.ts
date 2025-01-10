import type { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';

import { WaveformStore } from '../worker-store';

/**
 * Creates a linear scaling function
 *
 * @param domain the domain from which to scale (input)
 * @param range the range to which to scale (output)
 * @returns a scaling function that maps the domain to the range
 */
export const scaleLinear =
  (domain: [number, number], range: [number, number]) => (numSecs: number) =>
    ((numSecs - domain[0]) * (range[1] - range[0])) / (domain[1] - domain[0]) + range[0];

/**
 * Stores waveform data (if it is not already stored) to the waveform cache
 *
 * @param id the id of the waveform to save the data to
 * @param wave the waveform data
 * @returns the stored id of the saved waveform data
 */
export const storePositionBuffer = async (
  id: string,
  wave: Float64Array | Promise<Float64Array>
): Promise<string> => {
  if (!(await WaveformStore.has(id))) {
    await WaveformStore.store(id, wave);
  }
  return Promise.resolve(id);
};

/**
 * Convert data in the waveform samples into a Float64Array position buffer of the format: [x,y,x,y,...]
 *
 * @param waveform the data to convert
 * @param domain the visible domain in Epoch Seconds, in the form [startTimeSec, endTimeSec]
 *
 * @throws an error if the dataBySampleRate or its values are undefined
 *
 * @returns A promise of a Float64Array of vertices
 */
const convertWaveformSamplesToPositionBuffer = (
  waveform: WaveformTypes.Waveform,
  domain: WeavessTypes.TimeRange,
  glMin = 0,
  glMax = 100
): Float64Array => {
  if (!waveform || waveform.samples === undefined) {
    throw new Error(
      'Typed array conversion failed; Invalid waveform should contain an array of numbers.'
    );
  }
  if (!domain || domain.endTimeSecs === undefined || domain.endTimeSecs === undefined) {
    throw new Error('Typed array conversion failed; No visible domain was provided.');
  }
  const { samples, startTime, sampleRateHz } = waveform;
  const vertices: Float64Array = new Float64Array(samples.length * 2);
  const scaleToGlUnits = scaleLinear([domain.startTimeSecs, domain.endTimeSecs], [glMin, glMax]);

  // Index manipulation for speed
  for (let i = 0; i < samples.length; i += 1) {
    vertices[i * 2] = scaleToGlUnits(startTime + i / sampleRateHz);
    vertices[i * 2 + 1] = samples[i];
  }
  return vertices;
};

/**
 * Make a DataBySampleRate object from the provided waveform
 *
 * @param id the generated unique id of the waveform
 * @param wave the waveform data
 * @param domain the domain of the waveform
 * @param parallelize whether to parallelize the operation
 * @returns the stored id of the saved waveform data
 */
export const calculateAndStorePositionBuffer = async (
  id: string,
  wave: WaveformTypes.Waveform,
  domain: WeavessTypes.TimeRange,
  parallelize = false
): Promise<string> => {
  if (!(await WaveformStore.has(id))) {
    const positionBufferPromise = Promise.resolve(
      convertWaveformSamplesToPositionBuffer(wave, domain)
    );
    if (parallelize) {
      await WaveformStore.store(id, positionBufferPromise);
    } else {
      await WaveformStore.store(id, await positionBufferPromise);
    }
  }
  return Promise.resolve(id);
};

/**
 * Generate a unique id based on the data fields of the channel segment and waveform
 *
 * @param channelSegment
 * @param wave
 * @param domain
 * @param filter
 * @returns
 */
export const generateUniqueId = (
  channelSegment: ChannelSegmentTypes.ChannelSegment<ChannelSegmentTypes.Timeseries>,
  wave: WaveformTypes.Waveform,
  domain: WeavessTypes.TimeRange,
  filter = WeavessTypes.UNFILTERED
) => {
  return JSON.stringify({
    domain,
    id: channelSegment.id,
    type: channelSegment.timeseriesType,
    filter,
    waveform: {
      type: wave.type,
      startTime: wave.startTime,
      endTime: wave.endTime,
      sampleCount: wave.sampleCount,
      sampleRateHz: wave.sampleRateHz
    }
  });
};

/**
 * Updates an existing waveform store claim check id with a new filter name
 *
 * @param uniqueId returned from waveform cache or channel data claim check
 * @param filter Filter name from a FilterDefinition
 * @returns A string based uniqueId with just the filter param updated
 */
export const changeUniqueIdFilter = (uniqueId: string, filter = WeavessTypes.UNFILTERED) => {
  try {
    const uniqueIdData = JSON.parse(uniqueId);
    uniqueIdData.filter = filter;
    return JSON.stringify(uniqueIdData);
  } catch (error) {
    throw new Error('There was an error parsing the uniqueId');
  }
};

/**
 * Converts the ChannelSegmentTypes.ChannelSegment waveform to a WeavessTypes.DataSegment[]
 *
 * @param channelSegment returned from waveform query
 * @param domain TimeRange of Current Interval
 * @param semanticColors Color for raw waveform
 * @returns object with list of dataSegments, description, showLabel (boolean), channelSegmentBoundaries
 */
export async function convertAndStoreTimeseries(
  channelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>,
  domain: WeavessTypes.TimeRange
): Promise<WaveformTypes.Waveform[]> {
  // If there was no raw data and no filtered data return empty data segments
  if (!channelSegment || !channelSegment.timeseries || channelSegment.timeseries.length === 0) {
    return [];
  }

  return Promise.all(
    channelSegment.timeseries.map<Promise<WaveformTypes.Waveform>>(
      async (wave: WaveformTypes.Waveform) => {
        // generate a unique id based on the data fields
        const id = generateUniqueId(channelSegment, wave, domain);
        const claimCheckId = await calculateAndStorePositionBuffer(id, wave, domain);
        return {
          startTime: wave.startTime,
          endTime: wave.endTime,
          type: wave.type,
          sampleCount: wave.sampleCount,
          sampleRateHz: wave.sampleRateHz,
          _uiClaimCheckId: claimCheckId
        };
      }
    )
  );
}
