import { getSecureRandomNumber } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';

import type * as Wasm from '../wasm/gms-interop-module';
import gmsInterop from '../wasm/gms-interop-module';

export type * as Wasm from '../wasm/gms-interop-module';

const logger = UILogger.create('GMS_INTEROP_MODULE', process.env.GMS_INTEROP_MODULE);

export type GmsInteropModule = EmscriptenModule &
  Wasm.MainModule & {
    /**
     * Catch and examine the type and the message of C++ exceptions from JavaScript, in case they inherit from std::exception and thus have what method.
     * @see https://emscripten.org/docs/porting/exceptions.html?highlight=throw
     *
     * @param error A WASM error.
     * @return a list of two strings: [type, message]. the message is the result of
     * calling what method in case the exception is a subclass of std::exception. Otherwise it will be just an empty string.
     */
    getExceptionMessage(error): [string, string];

    _iirFilterApply(
      filterDescriptionPtr: number,
      inputPtr: number,
      size: number,
      taper: number,
      removeGroupDelay: boolean,
      indexOffset: number,
      indexInc: number
    ): void;

    _cascadeFilterApply(
      filterDescriptionPtr: number,
      inputPtr: number,
      size: number,
      taper: number,
      removeGroupDelay: boolean,
      indexOffset: number,
      indexInc: number
    ): void;

    flushPendingDeletes(): void;
  };

// the maximum number of preloaded instances
const MAX_PRELOADED_INSTANCES = 10;

/**
 * GMS Interop Module promise; used to load the module only once
 *
 * !Allow pre-loading up to 10 instances of the module at a time
 * !Limit to only one module instance on the main threads
 */
const loadedGmsInteropModuleInstances: (GmsInteropModule | null)[] = Array(
  typeof window === 'undefined' ? MAX_PRELOADED_INSTANCES : 1
).fill(null);

/**
 * !Helper function to ensure that the module only loads once.
 *
 * @returns a promise to load the GMS Interop Module
 */
const getGmsInteropModule = async (index: number): Promise<GmsInteropModule> => {
  if (index < 0 || index > loadedGmsInteropModuleInstances.length) {
    throw new Error(`Invalid index ${index} for loading module`);
  }
  let instance = loadedGmsInteropModuleInstances[index];

  if (instance != null) {
    return instance;
  }

  // load the module only once
  instance = await (gmsInterop as () => Promise<GmsInteropModule>)();
  // Exception Handling Helpers
  // !functions are only available if `EXPORT_EXCEPTION_HANDLING_HELPERS` is enabled
  if (instance && instance.getExceptionMessage == null) {
    instance.getExceptionMessage = error => ['Error', error];
  }

  loadedGmsInteropModuleInstances[index] = instance;
  return instance;
};

// pre-load gms interop instances
// ! only on the worker thread
if (typeof window === 'undefined') {
  loadedGmsInteropModuleInstances.forEach(async (instance, index) =>
    getGmsInteropModule(index)
      .then(() => {
        logger.info(`GMS Interop WASM Module preloaded ${index}`);
      })
      .catch(error => logger.error(`Failed to get interop module`, index, error))
  );
}

const gmsInteropModuleInitialHeapSize = 524288000; // 500mb
export const getInteropModule = async (): Promise<GmsInteropModule> => {
  const index = Math.floor(getSecureRandomNumber() * loadedGmsInteropModuleInstances.length);
  return getGmsInteropModule(index).then(async instance => {
    // allow the heap to grow up to 2gb on an instance
    if (gmsInteropModuleInitialHeapSize * 4 < instance.HEAP8.buffer.byteLength) {
      logger.warn(
        `GMS Interop WASM Module heap size: ${instance.HEAP8.buffer.byteLength}; resetting instance ${index}`
      );
      // clear out instance from pre-cached array that has a large heap size (typically means a memory leak)
      loadedGmsInteropModuleInstances[index] = null;
      // load a new instance and return the newly created instance
      return getGmsInteropModule(index);
    }
    return instance;
  });
};
