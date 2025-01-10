import type {
  CascadeFilterDescription,
  LinearFilterDescription
} from '@gms/common-model/lib/filter/types';
import { UILogger } from '@gms/ui-util';

import type { GmsInteropModule, Wasm } from '../gms-interop-module';
import { getInteropModule } from '../gms-interop-module';
import {
  convertCascadeFilterDescription,
  convertIIRLinearFilterDescription,
  convertWasmCascadeFilterDescription,
  convertWasmLinearIIRFilterDescription
} from './converter';
import { validateCascadeFilterDescription, validateLinearFilterDescription } from './validators';

const logger = UILogger.create('GMS_FILTERS_FILTER_DESIGN', process.env.GMS_FILTERS);

/**
 * Designs a Cascaded Filter Description
 *
 * @param filterDescription the filter description to design
 * @returns the designed filter definition
 */
export async function cascadeFilterDesign(
  filterDescription: CascadeFilterDescription
): Promise<CascadeFilterDescription> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });
  let filterDesc: Wasm.CascadeFilterDescription | null = null;
  let clone: CascadeFilterDescription | null = null;
  let result: Wasm.CascadeFilterDescription | null = null;

  validateCascadeFilterDescription(filterDescription);

  try {
    filterDesc = convertCascadeFilterDescription(gmsInteropModule, filterDescription);
    result = gmsInteropModule.cascadeFilterDesign(filterDesc);
    clone = convertWasmCascadeFilterDescription(gmsInteropModule, result);
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed to design filter using GMS cascade filter design`, { type, error });
      // eslint-disable-next-line no-underscore-dangle
      gmsInteropModule._free(error);
      throw new Error(`${type}: ${message}`);
    } catch (runtimeError) {
      logger.error(`Failed to design filter using GMS cascade filter design`, {
        error
      });
      throw runtimeError;
    }
  } finally {
    // ! free any memory used for WASM
    if (filterDesc) filterDesc.delete();
    if (result) result.delete();
    gmsInteropModule = null;
  }

  return clone;
}

/**
 * Exposes the WASM IIR filter design algorithm
 *
 * @param filterDefinition the UI filter definition
 * @returns the designed UI LinearFilterDefinition
 */
export async function iirFilterDesign(
  filterDescription: LinearFilterDescription
): Promise<LinearFilterDescription> {
  let clone: LinearFilterDescription;
  let desc: Wasm.LinearIIRFilterDescription | null = null;

  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });

  validateLinearFilterDescription(filterDescription);
  let designedFilter: Wasm.LinearIIRFilterDescription | undefined;
  try {
    desc = convertIIRLinearFilterDescription(gmsInteropModule, filterDescription);
    designedFilter = gmsInteropModule.iirFilterDesign(desc);
    clone = convertWasmLinearIIRFilterDescription(designedFilter);
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed to design filter using GMS iir filter design`, { type, error });
      // eslint-disable-next-line no-underscore-dangle
      gmsInteropModule._free(error);
      throw new Error(`${type}: ${message}`);
    } catch (runtimeError) {
      logger.error(`Failed to design filter using GMS iir filter design`, {
        error
      });
      throw runtimeError;
    }
  } finally {
    // ! free any memory used for WASM
    if (desc) desc.delete();
    if (designedFilter) designedFilter.delete();
    gmsInteropModule = null;
  }
  return clone;
}
