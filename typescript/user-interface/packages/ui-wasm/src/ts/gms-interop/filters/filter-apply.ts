import type {
  CascadeFilterDescription,
  LinearFilterDescription
} from '@gms/common-model/lib/filter/types';
import { UILogger } from '@gms/ui-util';

import type { GmsInteropModule, Wasm } from '../gms-interop-module';
import { getInteropModule } from '../gms-interop-module';
import { defaultIndexInc, defaultIndexOffset } from './constants';
import { convertCascadeFilterDescription, convertIIRLinearFilterDescription } from './converter';

const logger = UILogger.create('GMS_FILTERS_FILTER_APPLY', process.env.GMS_FILTERS);

/**
 * Applies a Cascaded Filter Definition to the provided data (filters the data).
 *
 * @param filterDescription a Cascaded Filter Description
 * @param data  waveform data
 * @param taper the specified amount to taper waveform
 * @param removeGroupDelay optional boolean to determine if group delay should be applied, defaults to false
 * @param indexOffset the index offset (starting position) when accessing the data
 * @param indexInc the index incrementor (starting from indexOffset) used when accessing the data
 * @returns Float64Array of the filtered waveform data
 */
export async function cascadeFilterApply(
  filterDescription: CascadeFilterDescription,
  data: Float64Array,
  taper: number,
  removeGroupDelay: boolean,
  indexOffset: number = defaultIndexOffset,
  indexInc: number = defaultIndexInc
): Promise<Float64Array> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });

  let desc: Wasm.CascadeFilterDescription | null = null;
  let inputPtr: number | null = null;
  let result: Float64Array;

  try {
    desc = convertCascadeFilterDescription(gmsInteropModule, filterDescription);

    /* eslint-disable no-underscore-dangle */
    inputPtr = +gmsInteropModule._malloc(data.length * data.BYTES_PER_ELEMENT);
    gmsInteropModule.HEAPF64.set(data, inputPtr / data.BYTES_PER_ELEMENT);
    gmsInteropModule._cascadeFilterApply(
      (desc as unknown as { $$: { ptr: number } }).$$.ptr,
      inputPtr,
      data.length,
      taper,
      removeGroupDelay,
      indexOffset,
      indexInc
    );

    result = new Float64Array(
      gmsInteropModule.HEAPF64.subarray(
        inputPtr / data.BYTES_PER_ELEMENT,
        inputPtr / data.BYTES_PER_ELEMENT + data.length
      )
    );
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed to filter using GMS cascade filter`, { type, error });
      gmsInteropModule._free(error);
      throw new Error(`${type}: ${message}`);
    } catch (runtimeError) {
      logger.error(`Failed to filter using GMS cascade filter`, {
        error
      });
      throw runtimeError;
    }
  } finally {
    // ! free any memory used for WASM
    if (desc) desc.delete();
    if (inputPtr) gmsInteropModule._free(inputPtr);
    /* eslint-enable no-underscore-dangle */
    gmsInteropModule = null;
  }
  return result;
}

export async function iirFilterApply(
  filterDescription: LinearFilterDescription,
  data: Float64Array,
  taper: number,
  removeGroupDelay: boolean,
  indexOffset: number = defaultIndexOffset,
  indexInc: number = defaultIndexInc
): Promise<Float64Array> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });

  let linearIIRFilterDescription: Wasm.LinearIIRFilterDescription | null = null;
  let inputPtr: number | null = null;
  let result: Float64Array;

  try {
    linearIIRFilterDescription = convertIIRLinearFilterDescription(
      gmsInteropModule,
      filterDescription
    );

    /* eslint-disable no-underscore-dangle */
    inputPtr = +gmsInteropModule._malloc(data.length * data.BYTES_PER_ELEMENT);
    gmsInteropModule.HEAPF64.set(data, inputPtr / data.BYTES_PER_ELEMENT);
    gmsInteropModule._iirFilterApply(
      (linearIIRFilterDescription as unknown as { $$: { ptr: number } }).$$.ptr,
      inputPtr,
      data.length,
      taper,
      removeGroupDelay,
      indexOffset,
      indexInc
    );
    result = new Float64Array(
      gmsInteropModule.HEAPF64.subarray(
        inputPtr / data.BYTES_PER_ELEMENT,
        inputPtr / data.BYTES_PER_ELEMENT + data.length
      )
    );
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed to filter using GMS iir filter`, { type, error });
      gmsInteropModule._free(error);
      throw new Error(`${type}: ${message}`);
    } catch (runtimeError) {
      logger.error(`Failed to filter using GMS iir filter`, {
        error
      });
      throw runtimeError;
    }
  } finally {
    // ! free any memory used for WASM
    if (linearIIRFilterDescription) linearIIRFilterDescription.delete();
    if (inputPtr) gmsInteropModule._free(inputPtr);
    /* eslint-enable no-underscore-dangle */
    gmsInteropModule = null;
  }
  return result;
}
