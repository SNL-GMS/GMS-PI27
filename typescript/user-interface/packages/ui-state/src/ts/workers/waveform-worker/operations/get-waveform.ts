import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessUtil } from '@gms/weavess-core';

import { WaveformStore } from '../worker-store/waveform-store';

export interface GetWaveformParams {
  id: string;
  startTime: number;
  endTime: number;
  domainTimeRange: WeavessTypes.TimeRange;
}

export const trimWaveform = (
  waveform: Float64Array,
  startTime: number,
  endTime: number,
  domainTimeRange: WeavessTypes.TimeRange
): Float64Array => {
  if (!waveform || !ArrayBuffer.isView(waveform)) {
    throw new Error(
      'Waveform retrieved is not an ArrayBuffer. Data is malformed. Cannot get waveform.'
    );
  }
  const emptyFloat64Array: Float64Array = new Float64Array(0);
  const scale = WeavessUtil.scaleLinear(
    [domainTimeRange.startTimeSecs, domainTimeRange.endTimeSecs],
    [0, 100]
  );

  // Get gl based on start and end time
  const targetGlStart = scale(startTime);
  const targetGlEnd = scale(endTime);

  const lastIndex = waveform.length;
  const scaleGlToIndices = WeavessUtil.scaleLinear(
    [waveform[0], waveform[waveform.length - 2]],
    [0, lastIndex / 2]
  );

  let startIndex = Math.floor(scaleGlToIndices(targetGlStart)) * 2;
  const endIndex = Math.ceil(scaleGlToIndices(targetGlEnd)) * 2;

  // Slice doesn't handle negative numbers so get the first point at index 0
  if (startIndex < 0) {
    startIndex = 0;
  }
  // Return empty buffer if the start/end time are before or start/end time are after this
  // waveform or after this waveform
  if (endIndex < 0 || startIndex > waveform.length) {
    return emptyFloat64Array;
  }
  // Nothing to slice return the whole waveform
  if (startIndex <= 0 && endIndex >= waveform.length - 2) {
    return waveform;
  }
  if (startIndex < endIndex) {
    return waveform.slice(startIndex, endIndex);
  }
  throw new Error(
    'Start index should never be greater than end index. Something is wrong with the logic.'
  );
};

export const getWaveform = async ({
  id,
  startTime,
  endTime,
  domainTimeRange
}: GetWaveformParams): Promise<Float32Array> => {
  const wave = await WaveformStore.retrieve(id);
  // no waveform for claim check id
  if (!wave) {
    throw new Error(`No waveform found for claim check ${id}.`);
  }
  return new Float32Array(trimWaveform(wave, startTime, endTime, domainTimeRange));
};
