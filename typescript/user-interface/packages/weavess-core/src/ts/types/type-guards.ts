import type {
  ChannelSegment,
  DataBySampleRate,
  DataByTime,
  DataClaimCheck,
  DataSegment,
  TimeValuePair
} from './types';

const hasId = (data: unknown): data is { id: unknown } =>
  Object.prototype.hasOwnProperty.call(data, 'id');

/**
 * Return true if the data has an ID.
 *
 * @param data some kind of DataSegment data
 * @returns whether this data matches the DataClaimCheck interface
 */
export const isDataClaimCheck = (
  data: DataClaimCheck | DataBySampleRate | DataByTime
): data is DataClaimCheck => {
  return hasId(data) && typeof data.id === 'string' && !!data.id;
};

/**
 * Return true if all of the data segments are DataClaimChecks.
 *
 * @param dataSegments DataSegment list containing some kind of data
 * @returns whether this data matches the DataClaimCheck interface for all data segments
 */
export const areDataSegmentsAllClaimChecks = (dataSegments: DataSegment[]): boolean => {
  return dataSegments.every(ds => {
    return isDataClaimCheck(ds.data);
  });
};

/**
 * Return true if all of the channel segments' data segments are DataClaimChecks.
 *
 * @param channelSegments each contains a list of data segments to check
 * @returns whether each channel segment's dataSegments matches the DataClaimCheck interface
 */
export const areAllChannelSegmentsDataSegmentsClaimChecks = (
  channelSegments: ChannelSegment[]
): boolean => {
  return channelSegments.every(cs => areDataSegmentsAllClaimChecks(cs.dataSegments));
};
/**
 * Returns true if the data is of type Float32Array
 *
 * @param values the data to check
 */
export const isFloat32Array = (
  values:
    | Float64Array
    | Float32Array
    | number[]
    | {
        timeSecs: number;
        value: number;
      }[]
    | undefined
): values is Float32Array =>
  !!values && ArrayBuffer.isView(values) && values instanceof Float32Array;

/**
 * Returns true if the values array is of type TimeValuePair[]
 *
 * @param values the array to check
 */
export const isTimeValuePairArray = (
  values: Float64Array | Float32Array | number[] | TimeValuePair[] | undefined
): values is TimeValuePair[] =>
  values != null &&
  values.length > 0 &&
  (values[0] as TimeValuePair).timeSecs !== undefined &&
  (values[0] as TimeValuePair).value !== undefined;

/**
 * Returns true if the data is by sample rate and casts the data appropriately.
 *
 * @param data the data to check
 */
export const isDataBySampleRate = (
  data: DataBySampleRate | DataByTime | DataClaimCheck
): data is DataBySampleRate =>
  (data as DataBySampleRate).startTimeSecs !== undefined &&
  (data as DataBySampleRate).sampleRate !== undefined &&
  (data as DataBySampleRate).values !== undefined;

/**
 * Returns true if the data is by time and casts the data appropriately.
 *
 * @param data the data to check
 */
export const isDataByTime = (
  data: DataBySampleRate | DataByTime | DataClaimCheck
): data is DataByTime => !isDataBySampleRate(data) && data.values !== undefined;
