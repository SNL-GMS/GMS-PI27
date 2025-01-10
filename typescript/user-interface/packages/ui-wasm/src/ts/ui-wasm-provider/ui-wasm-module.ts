import { UILogger } from '@gms/ui-util';

import type { Wasm } from '../gms-interop/gms-interop-module';
import uiWasmModule from '../wasm/ui-wasm-provider';
import type { UiProviderModule } from './ui-provider-module';

const logger = UILogger.create('GMS_UI_WASM', process.env.GMS_UI_WASM);

/**
 * Emscripten UI WASM Provider Module
 */
export interface UiWasmModule extends EmscriptenModule {
  // Module.cwrap() will be available by doing this; requires -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']"
  cwrap: typeof cwrap;

  ccall: typeof ccall;

  VectorDouble: Wasm.VectorDouble;

  UiProviderModule: UiProviderModule;
}

let loadedUiProviderModule: UiWasmModule;

/**
 * !Helper function to ensure that the module only loads once.
 *
 * @returns a promise to load the UI WASM Module
 */
const getUiProviderModule = async (): Promise<UiWasmModule> => {
  // load the module only once
  if (loadedUiProviderModule == null) {
    loadedUiProviderModule = await (uiWasmModule as () => Promise<UiWasmModule>)();
    logger.debug('Loaded UI WASM Module', loadedUiProviderModule);
  }
  return loadedUiProviderModule;
};

/**
 * UI WASM module promise; used to load the module only once
 */
export const uiWasmProviderModule: Promise<UiWasmModule> = getUiProviderModule();
