import { getSecureRandomNumber } from '@gms/common-util';

const FREQUENCY = 40;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const TWO_HOUR_IN_SECONDS = 2 * 60 * 60;

/**
 * Generates the X data values for time.
 *
 * Example: [1,2,3,4,5,6,7,8,...]
 *
 *  Defaults to creating two hours worth of data, about 288k entries.
 *
 * @param ArrayConstructor the array constructor to use for generating the data
 * @param frequency the frequency of the data to use for generating the data
 * @param numberOfSeconds the number of seconds to use for generating the data
 * @returns a populated array with x values (time)
 */
export const generateXData = <T extends Float32ArrayConstructor | Float64ArrayConstructor>(
  ArrayConstructor: T,
  frequency: number = FREQUENCY,
  numberOfSeconds: number = TWO_HOUR_IN_SECONDS
): InstanceType<T> => {
  const dataSize = numberOfSeconds * frequency;
  let time = 0;
  return ArrayConstructor.from(
    Array.from({ length: dataSize }, () => {
      time += 1 / frequency;
      return time;
    })
  ) as unknown as InstanceType<T>;
};

/**
 * Generates sample (random) Y data values.
 *
 * Defaults to creating two hours worth of data, about 288k entries.
 *
 * @param ArrayConstructor the array constructor to use for generating the data
 * @param frequency the frequency of the data to use for generating the data
 * @param numberOfSeconds the number of seconds to use for generating the data
 * @returns a populated array with y values
 */
export const generateYData = <T extends Float32ArrayConstructor | Float64ArrayConstructor>(
  ArrayConstructor: T,
  frequency: number = FREQUENCY,
  numberOfSeconds: number = TWO_HOUR_IN_SECONDS
): InstanceType<T> => {
  const dataSize = numberOfSeconds * frequency;
  return ArrayConstructor.from(
    Array.from({ length: dataSize }, () => getSecureRandomNumber() * 100)
  ) as unknown as InstanceType<T>;
};

/**
 * Generates sample (random) XY data.
 *
 * Defaults to creating two hours worth of data, about 576k entries.
 *
 * @param ArrayConstructor the array constructor to use for generating the data
 * @param frequency the frequency of the data to use for generating the data
 * @param numberOfSeconds the number of seconds to use for generating the data
 * @returns a populated array with xy values
 */
export const generateXYData = <T extends Float32ArrayConstructor | Float64ArrayConstructor>(
  ArrayConstructor: T,
  frequency: number = FREQUENCY,
  numberOfSeconds: number = TWO_HOUR_IN_SECONDS
): InstanceType<T> => {
  const dataSize = numberOfSeconds * frequency;
  const twoHourTime = generateXData(ArrayConstructor, frequency, numberOfSeconds);
  const twoHourData = generateYData(ArrayConstructor, frequency, numberOfSeconds);

  const twoHourTimeData = new ArrayConstructor(dataSize * 2) as unknown as InstanceType<T>;
  for (let i = 0; i < dataSize; i += 1) {
    twoHourTimeData[i * 2] = twoHourTime[i];
    twoHourTimeData[i * 2 + 1] = twoHourData[i];
  }
  return twoHourTimeData;
};
