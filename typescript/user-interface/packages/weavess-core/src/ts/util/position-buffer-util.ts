import type { TypedArray } from 'd3';
import orderBy from 'lodash/orderBy';

import type { DataBySampleRate, TimeRange, TimeValuePair } from '../types';
import { scaleLinear } from './data-util';

/**
 * Input required to create the position buffer
 */
export interface CreatePositionBufferBySampleRateParams {
  /** Minimum GL value */
  glMin: number;

  /** Maximum GL value */
  glMax: number;

  /** Array containing the vertices */
  values: number[];

  /** Start Time Seconds formatted for display */
  displayStartTimeSecs: number;

  /** End Time Seconds formatted for display */
  displayEndTimeSecs: number;

  /** Start Time in seconds */
  startTimeSecs: number;

  /** End Time in seconds */
  endTimeSecs: number;

  /** End Time in seconds */
  sampleRate: number;
}

/**
 * Input required to create the position buffer
 */
export interface CreatePositionBufferByTimeParams {
  /** Minimum GL value */
  glMin: number;

  /** Maximum GL value */
  glMax: number;

  values: TimeValuePair[];

  /** Start Time Seconds formatted for display */
  displayStartTimeSecs: number;

  /** End Time Seconds formatted for display */
  displayEndTimeSecs: number;
}

/**
 * Convert data in the dataBySampleRate format into a TypedArray or number[] position buffer of the format: [x,y,x,y,...]
 *
 * @param dataBySampleRate the data to convert
 * @param domain the visible domain in Epoch Seconds, in the form [startTimeSec, endTimeSec]
 * @param glMin Gl unit scale range minimum
 * @param glMax Gl unit scale range maximum
 * @param ArrayConstructor The constructor for the output array desired Float32Array, Float64Array, Array, etc.
 *
 * @throws an error if the dataBySampleRate or its values are undefined
 *
 * @returns A TypedArray or number[] of vertices
 */
export const toPositionBuffer = <T extends TypedArray | number[]>(
  dataBySampleRate: DataBySampleRate,
  domain: TimeRange,
  glMin: number,
  glMax: number,
  ArrayConstructor
): T => {
  if (!dataBySampleRate || dataBySampleRate.values === undefined) {
    throw new Error(
      'Typed array conversion failed; Invalid waveform should contain an array of numbers.'
    );
  }
  if (!domain || domain.endTimeSecs === undefined || domain.endTimeSecs === undefined) {
    throw new Error('Typed array conversion failed; No visible domain was provided.');
  }
  const { values, startTimeSecs, sampleRate } = dataBySampleRate;
  try {
    const vertices: T = new ArrayConstructor(values.length * 2);
    const scaleToGlUnits = scaleLinear([domain.startTimeSecs, domain.endTimeSecs], [glMin, glMax]);

    // Index manipulation for speed
    for (let i = 0; i < values.length; i += 1) {
      vertices[i * 2] = scaleToGlUnits(startTimeSecs + i / sampleRate);
      vertices[i * 2 + 1] = values[i];
    }
    return vertices;
  } catch (error) {
    console.error('Error creating position buffer.', {
      'values.length': values.length,
      startTimeSecs,
      sampleRate
    });
    throw error;
  }
};

/**
 * Convert {time,value}[] to a TypedArray or number[] position buffer of [x,y,x,y,...].
 *
 * @param params
 * @param ArrayConstructor The constructor for the output array desired Float32Array, Float64Array, Array, etc.
 *
 * @returns A TypedArray or number[] of vertices
 */
export const positionBufferForDataByTime = <T extends TypedArray | number[]>(
  params: CreatePositionBufferByTimeParams,
  ArrayConstructor
): T => {
  // create a typed array to support 2d data
  const vertices: T = new ArrayConstructor(params.values.length * 2);

  const timeToGlScale = scaleLinear(
    [params.displayStartTimeSecs, params.displayEndTimeSecs],
    [params.glMin, params.glMax]
  );

  const values = orderBy(params.values, [value => value.timeSecs]);

  let i = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const value of values) {
    const x = timeToGlScale(value.timeSecs);
    // eslint-disable-next-line no-plusplus
    vertices[i++] = x;
    // eslint-disable-next-line no-plusplus
    vertices[i++] = value.value;
  }
  return vertices;
};

/**
 * Convert data in the dataBySampleRate format into a Float32Array position buffer of the format: [x,y,x,y,...]
 *
 * @param dataBySampleRate the data to convert
 * @param domain the visible domain in Epoch Seconds, in the form [startTimeSec, endTimeSec]
 *
 * @throws an error if the dataBySampleRate or its values are undefined
 *
 * @returns A promise of a Float32Array of vertices
 */
export const convertToPositionBuffer = (
  dataBySampleRate: DataBySampleRate,
  domain: TimeRange,
  glMin = 0,
  glMax = 100
): Float32Array => {
  return toPositionBuffer<Float32Array>(dataBySampleRate, domain, glMin, glMax, Float32Array);
};

/**
 * Calculate the min, max for the provided position buffer.
 *
 * @param data formatted buffer of the format x y x y x y x y...
 * @param startIndex inclusive
 * @param endIndex inclusive
 * @returns the min and max values y in the positionBuffer
 */
export const getBoundsForPositionBuffer = (
  data: Float32Array | Float64Array,
  startIndex = 1,
  endIndex = data.length - 1
): { max: number; maxSecs: number; min: number; minSecs: number } => {
  const sizeOfData = data.length;

  if (sizeOfData % 2 !== 0) {
    throw new Error('Cannot calculate position buffer: must have an even number of elements.');
  }

  if (startIndex < 0 || startIndex > endIndex) {
    throw new Error(
      'Cannot calculate position buffer: start index must be greater than 0 and less than end index.'
    );
  }

  if (endIndex >= sizeOfData) {
    throw new Error(
      'Cannot calculate position buffer: end index must be less than the length of data.'
    );
  }

  if (startIndex % 2 !== 1 || endIndex % 2 !== 1) {
    throw new Error(
      'Cannot calculate position buffer: must provide odd indices to access y values.'
    );
  }

  let minIndex = startIndex;
  let maxIndex = startIndex;

  // format is x y x y x y
  for (let i = startIndex + 2; i <= endIndex; i += 2) {
    // setting amplitudes min, max and total value
    if (data[i] > data[maxIndex]) {
      maxIndex = i;
    } else if (data[i] < data[minIndex]) {
      minIndex = i;
    }
  }

  return {
    max: data[maxIndex],
    maxSecs: data[maxIndex - 1],
    min: data[minIndex],
    minSecs: data[minIndex - 1]
  };
};

/**
 * Convert number[] + startTime + sample rate into a 2D position buffer of [x,y,x,y,...].
 *
 * @param params [[ CreatePositionBufferParams ]]
 *
 * @returns A Float32Array of vertices
 */
export const createPositionBufferForDataBySampleRate = ({
  values,
  displayStartTimeSecs,
  displayEndTimeSecs,
  startTimeSecs,
  endTimeSecs,
  sampleRate,
  glMin,
  glMax
}: CreatePositionBufferBySampleRateParams): Float32Array =>
  convertToPositionBuffer(
    { values, startTimeSecs, endTimeSecs, sampleRate },
    { startTimeSecs: displayStartTimeSecs, endTimeSecs: displayEndTimeSecs },
    glMin,
    glMax
  );

/**
 * Convert {time,value}[] to position buffer of [x,y,x,y,...].
 *
 * @param data the data by time
 * @param params
 * @returns A Float32Array of vertices
 */
export const createPositionBufferForDataByTime = (
  params: CreatePositionBufferByTimeParams
): Float32Array => {
  return positionBufferForDataByTime<Float32Array>(params, Float32Array);
};
