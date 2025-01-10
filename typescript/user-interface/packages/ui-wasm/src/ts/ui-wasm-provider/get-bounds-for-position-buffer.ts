import { UILogger } from '@gms/ui-util';

/**
 * !!! Super important info about returning array values
 * https://stackoverflow.com/questions/17883799/how-to-handle-passing-returning-array-pointers-to-emscripten-compiled-code
 */
import { uiWasmProviderModule } from './ui-wasm-module';

const logger = UILogger.create('GMS_UI_WASM', process.env.GMS_UI_WASM);

export const getBoundsForPositionBuffer = async (
  data: Float64Array,
  startIndex = 1,
  endIndex = data.length - 1
): Promise<{ min: number; minSecs: number; max: number; maxSecs: number }> => {
  const uiProviderModule = await uiWasmProviderModule;

  let inputPtr: number | null = null;
  let minPtr: number | null = null;
  let minSecsPtr: number | null = null;
  let maxPtr: number | null = null;
  let maxSecsPtr: number | null = null;
  let resultMin: number;
  let resultMinSecs: number;
  let resultMax: number;
  let resultMaxSecs: number;

  try {
    /* eslint-disable no-underscore-dangle */
    inputPtr = uiProviderModule._malloc(data.length * data.BYTES_PER_ELEMENT);
    uiProviderModule.HEAPF64.set(data, inputPtr / data.BYTES_PER_ELEMENT);
    minPtr = uiProviderModule._malloc(data.BYTES_PER_ELEMENT);
    minSecsPtr = uiProviderModule._malloc(data.BYTES_PER_ELEMENT);
    maxPtr = uiProviderModule._malloc(data.BYTES_PER_ELEMENT);
    maxSecsPtr = uiProviderModule._malloc(data.BYTES_PER_ELEMENT);
    /* eslint-enable no-underscore-dangle */

    uiProviderModule.ccall(
      'cGetBoundsForPositionBuffer',
      null,
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [inputPtr, data.length, startIndex, endIndex, minPtr, minSecsPtr, maxPtr, maxSecsPtr]
    );

    resultMin = uiProviderModule.HEAPF64.at(minPtr / data.BYTES_PER_ELEMENT) ?? 0;
    resultMinSecs = uiProviderModule.HEAPF64.at(minSecsPtr / data.BYTES_PER_ELEMENT) ?? 0;
    resultMax = uiProviderModule.HEAPF64.at(maxPtr / data.BYTES_PER_ELEMENT) ?? 0;
    resultMaxSecs = uiProviderModule.HEAPF64.at(maxSecsPtr / data.BYTES_PER_ELEMENT) ?? 0;
  } catch (e) {
    logger.error('Failed to calculate the position buffer', e);
    throw e;
  } finally {
    // ! free any memory used for WASM
    /* eslint-disable no-underscore-dangle */
    if (inputPtr) uiProviderModule._free(inputPtr);
    if (minPtr) uiProviderModule._free(minPtr);
    if (minSecsPtr) uiProviderModule._free(minSecsPtr);
    if (maxPtr) uiProviderModule._free(maxPtr);
    if (maxSecsPtr) uiProviderModule._free(maxSecsPtr);
    /* eslint-enable no-underscore-dangle */
  }
  return {
    min: resultMin,
    minSecs: resultMinSecs,
    max: resultMax,
    maxSecs: resultMaxSecs
  };
};
