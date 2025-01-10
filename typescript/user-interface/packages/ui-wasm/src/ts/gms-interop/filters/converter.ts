import { FilterTypes, FilterUtil } from '@gms/common-model';
import type {
  CascadeFilterDescription,
  CascadeFilterParameters,
  IirFilterParameters,
  LinearFilterDescription,
  LinearFilterParameters
} from '@gms/common-model/lib/filter/types';
import { UILogger } from '@gms/ui-util';

import type { GmsInteropModule, Wasm } from '../gms-interop-module';
import { isCascadeFilterDescriptionDesigned, isIirFilterParameters } from './util';
import { validateCascadeFilterDescription, validateLinearFilterDescription } from './validators';

const logger = UILogger.create('GMS_FILTERS_CONVERTER', process.env.GMS_FILTERS);

/**
 * Converts from WASM parameters to TS parameters
 *
 * @param parameters WASM parameters
 * @returns LinearFilterParameters
 */
function convertWasmIIRFilterParameters(parameters: Wasm.IIRFilterParameters): IirFilterParameters {
  return {
    sampleRateHz: parameters.sampleRateHz,
    sampleRateToleranceHz: parameters.sampleRateToleranceHz,
    groupDelaySec: parameters.groupDelaySec,
    sosDenominatorCoefficients: [...new Float64Array(parameters.getSosDenominatorAsTypedArray())],
    sosNumeratorCoefficients: [...new Float64Array(parameters.getSosNumeratorAsTypedArray())]
  };
}

/**
 * Converts the WASM LinearIIRFilterDescription  to the  UI LinearFilterDefinition
 *
 * @param filterDescription the WASM filter LinearIIRFilterDescription
 * @returns UI LinearFilterDescription
 */
export function convertWasmLinearIIRFilterDescription(
  filterDescription: Wasm.LinearIIRFilterDescription
): LinearFilterDescription {
  const uiParams = convertWasmIIRFilterParameters(filterDescription.parameters);
  return {
    comments: filterDescription.comments as string,
    causal: filterDescription.causal,
    filterType: FilterTypes.FilterType.LINEAR,
    linearFilterType: FilterTypes.LinearFilterType.IIR_BUTTERWORTH,
    lowFrequencyHz: filterDescription.lowFrequencyHz,
    highFrequencyHz: filterDescription.highFrequencyHz,
    order: filterDescription.order,
    zeroPhase: !!filterDescription.zeroPhase,
    passBandType: Object.values(FilterTypes.BandType)[filterDescription.passBandType.value],
    parameters: uiParams
  };
}

/**
 * Converts to WASM vector
 *
 * @param vector VectorFilterDescriptionWrapper to convert
 * @returns LinearFilterDescription[]
 */
function convertWasmVectorFilterDescriptionWrapper(
  gmsInteropModule: GmsInteropModule,
  vector: Wasm.VectorFilterDescriptionWrapper
): LinearFilterDescription[] {
  const clone: LinearFilterDescription[] = [];
  const size = vector.size();
  const { IIR_FILTER_DESCRIPTION } = gmsInteropModule.FilterDescriptionType;
  for (let i = 0; i < size; i += 1) {
    const desc: Wasm.FilterDescriptionWrapper | undefined = vector.get(i);
    if (desc && desc.getFilterTypeValue() === IIR_FILTER_DESCRIPTION.value) {
      if (desc.iirDescription != null) {
        const uiDesc = convertWasmLinearIIRFilterDescription(desc.iirDescription);
        clone.push(uiDesc);
      } else {
        throw new Error('IIR description missing from the provided filter description wrapper');
      }
    }
  }
  return clone;
}

/**
 * Converts from WASM type to TS
 *
 * @param parameters WasmCascadeFilterParameters
 * @returns CascadeFilterParameters
 */
function convertWasmCascadeFilterParameters(
  parameters: Wasm.CascadeFilterParameters
): CascadeFilterParameters {
  return {
    groupDelaySec: parameters.groupDelaySec,
    sampleRateHz: parameters.sampleRateHz,
    sampleRateToleranceHz: parameters.sampleRateToleranceHz
  };
}

/**
 * Converts from WASM to TS
 *
 * @param filterDescription WasmCascadeFilterDescription
 * @returns CascadeFilterDescription
 */
export function convertWasmCascadeFilterDescription(
  gmsInteropModule: GmsInteropModule,
  filterDescription: Wasm.CascadeFilterDescription
): CascadeFilterDescription {
  const descriptions: LinearFilterDescription[] = convertWasmVectorFilterDescriptionWrapper(
    gmsInteropModule,
    filterDescription.filterDescriptions
  );
  return {
    filterType: FilterTypes.FilterType.CASCADE,
    parameters: convertWasmCascadeFilterParameters(filterDescription.parameters),
    filterDescriptions: descriptions,
    comments: filterDescription.comments as string,
    causal: filterDescription.causal
  };
}

/**
 * Converts the UI LinearFilterParameters to the WASM Boundary model
 *
 *  ! This creates an object in WASM memory. It must be deleted and freed.
 *
 * @param parameters the {@link LinearFilterParameters} parameters
 * @returns WASM boundary parameters {@link WasmIIRFilterParameters}
 */
function convertIIRLinearFilterParameters(
  gmsInteropModule: GmsInteropModule,
  parameters: LinearFilterParameters | IirFilterParameters
): Wasm.IIRFilterParameters {
  const sosNums: Wasm.VectorDouble = new gmsInteropModule.VectorDouble();
  const sosDenoms: Wasm.VectorDouble = new gmsInteropModule.VectorDouble();
  const sosCoeffs: Wasm.VectorDouble = new gmsInteropModule.VectorDouble();

  let isDesigned = false;

  if (isIirFilterParameters(parameters)) {
    isDesigned = true;
    parameters.sosDenominatorCoefficients?.forEach(element => {
      sosDenoms.push_back(element);
    });
    parameters.sosNumeratorCoefficients?.forEach(element => {
      sosNums.push_back(element);
    });
  }

  const result = new gmsInteropModule.IIRFilterParameters(
    sosNums,
    sosDenoms,
    sosCoeffs,
    parameters.groupDelaySec,
    isDesigned,
    parameters.sampleRateHz,
    parameters.sampleRateToleranceHz
  );
  return result;
}

/**
 * Converts the UI LinearFilterDescription to the WASM LinearIIRFilterDescription
 *
 *  ! This creates an object on the WASM heap. It must be deleted and freed
 *
 * @param filterDescription the UI filter Description
 * @returns WASM boundary LinearIIRFilterDescription
 */
export function convertIIRLinearFilterDescription(
  gmsInteropModule: GmsInteropModule,
  filterDescription: LinearFilterDescription
): Wasm.LinearIIRFilterDescription {
  if (!filterDescription.parameters) {
    throw new Error(
      `Unable to convert LinearFilterDescription to WasmLinearIIRFilterDescription, parameters are not defined`
    );
  }
  if (!FilterUtil.isLinearFilterDescription(filterDescription)) {
    throw new Error(`Not a valid LinearFilterDescription`);
  }

  validateLinearFilterDescription(filterDescription);
  if (!FilterUtil.isLinearFilterParameters(filterDescription.parameters)) {
    throw new Error(`Not valid LinearFilterParameters`);
  }
  const wasmParams = convertIIRLinearFilterParameters(
    gmsInteropModule,
    filterDescription.parameters
  );

  const { BAND_PASS, BAND_REJECT, HIGH_PASS, LOW_PASS } = gmsInteropModule.FilterBandType;

  let filterBandType: Wasm.FilterBandType;
  if (filterDescription.passBandType === FilterTypes.BandType.BAND_PASS) {
    filterBandType = BAND_PASS;
  } else if (filterDescription.passBandType === FilterTypes.BandType.BAND_REJECT) {
    filterBandType = BAND_REJECT;
  } else if (filterDescription.passBandType === FilterTypes.BandType.HIGH_PASS) {
    filterBandType = HIGH_PASS;
  } else {
    filterBandType = LOW_PASS;
  }

  // TODO: LinearFilterDescription should allow for more than Butterworth
  const { BUTTERWORTH } = gmsInteropModule.FilterDesignModel;
  const filterDesignModel: Wasm.FilterDesignModel = BUTTERWORTH;
  return new gmsInteropModule.LinearIIRFilterDescription(
    wasmParams,
    filterDescription.causal,
    filterDescription.comments ?? '',
    // TODO: change this default for highFrequencyHz, lowFrequencyHz when wasm optional double is added
    filterDescription.highFrequencyHz ?? 0, // will receive undefined for HIGH_PASS
    filterDescription.lowFrequencyHz ?? 0, // will receive undefined for LOW_PASS
    filterBandType,
    filterDesignModel,
    filterDescription.order,
    +filterDescription.zeroPhase
  );
}

function convertToWasmBandType(
  gmsInteropModule: GmsInteropModule,
  bandType: FilterTypes.BandType
): Wasm.FilterBandType {
  const { BAND_PASS, BAND_REJECT, HIGH_PASS, LOW_PASS } = gmsInteropModule.FilterBandType;

  if (bandType === FilterTypes.BandType.BAND_PASS) {
    return BAND_PASS;
  }
  if (bandType === FilterTypes.BandType.BAND_REJECT) {
    return BAND_REJECT;
  }
  if (bandType === FilterTypes.BandType.HIGH_PASS) {
    return HIGH_PASS;
  }
  return LOW_PASS;
}

/**
 * Creates an IIR filter wrapper
 * @param desc
 * @returns
 */
export function buildIIR(
  gmsInteropModule: GmsInteropModule,
  desc:
    | FilterTypes.LinearFilterDescription
    | FilterTypes.PhaseMatchFilterDescription
    | FilterTypes.AutoRegressiveFilterDescription
) {
  if (!desc.parameters) {
    logger.error(`Parameters must be defined for all filter descriptions`, desc);
    throw new Error(`Parameters must be defined for all filter descriptions`);
  }

  const sosCoefficients = new gmsInteropModule.VectorDouble();
  const sosDenominator = new gmsInteropModule.VectorDouble();
  const sosNumerator = new gmsInteropModule.VectorDouble();

  let isDesigned = false;

  if (isIirFilterParameters(desc.parameters)) {
    isDesigned = true;
    desc.parameters.sosDenominatorCoefficients?.forEach(element => {
      sosDenominator.push_back(element);
    });
    desc.parameters.sosNumeratorCoefficients?.forEach(element => {
      sosNumerator.push_back(element);
    });
  }
  if (!FilterUtil.isLinearFilterDescription(desc)) {
    throw new Error(`Not a valid LinearFilterDescription`);
  }
  if (!FilterUtil.isLinearFilterParameters(desc.parameters)) {
    throw new Error(`Not valid LinearFilterParameters`);
  }
  // TODO handle phaseMatch, autoregressive, fir hamming
  const iirFilterParameters: Wasm.IIRFilterParameters = new gmsInteropModule.IIRFilterParameters(
    sosNumerator,
    sosDenominator,
    sosCoefficients,
    desc.parameters.groupDelaySec,
    isDesigned,
    desc.parameters.sampleRateHz,
    desc.parameters.sampleRateToleranceHz
  );

  const filterBandType: Wasm.FilterBandType = convertToWasmBandType(
    gmsInteropModule,
    desc.passBandType
  );

  // TODO: LinearFilterDescription should allow for more than Butterworth
  const { BUTTERWORTH } = gmsInteropModule.FilterDesignModel;
  const filterDesignModel: Wasm.FilterDesignModel = BUTTERWORTH;
  const linearIIRFilterDescription: Wasm.LinearIIRFilterDescription =
    new gmsInteropModule.LinearIIRFilterDescription(
      iirFilterParameters,
      desc.causal,
      desc.comments ?? '',
      // TODO: change this default for highFrequencyHz, lowFrequencyHz when wasm optional double is added
      desc.highFrequencyHz ?? 0, // will receive undefined for LOW_PASS
      desc.lowFrequencyHz ?? 0, // will receive undefined for HIGH_PASS
      filterBandType,
      filterDesignModel,
      desc.order,
      +desc.zeroPhase
    );

  const builder: Wasm.FilterDescriptionWrapperBuilder =
    new gmsInteropModule.FilterDescriptionWrapperBuilder();

  const result = builder.iirDescription(linearIIRFilterDescription).build();
  builder.delete();

  return result;
}

/**
 * Converts a GMS UI Filter Description to a GMS WASM Cascaded Filter Description
 *  BOTH SHOULD PROPERLY REPRESENT COI
 * ! Must properly free/delete the memory of the returned object
 *
 * @param filterDescription a GMS COI Filter Description to convert
 * @returns a converted GMS Filters Filter Description
 */
export function convertCascadeFilterDescription(
  gmsInteropModule: GmsInteropModule,
  filterDescription: CascadeFilterDescription
): Wasm.CascadeFilterDescription {
  if (!filterDescription.parameters) {
    throw new Error(
      `Unable to convert CascadeFilterDescription to WasmCascadeFilterDescription, parameters are not defined`
    );
  }

  validateCascadeFilterDescription(filterDescription);

  let wasmCascadeFilterDesc: Wasm.CascadeFilterDescription | null = null;
  let cascadeFilterParameters: Wasm.CascadeFilterParameters | null = null;
  const vectorFilterDescriptionWrapper: Wasm.VectorFilterDescriptionWrapper =
    new gmsInteropModule.VectorFilterDescriptionWrapper();

  try {
    // map GMS Filter Definition to GMS Filter Algorithm Definition

    const linearIIRFilterDescriptions = filterDescription.filterDescriptions.map(desc => {
      return buildIIR(gmsInteropModule, desc);
    });
    linearIIRFilterDescriptions.forEach(linearIIRFilterDescription => {
      vectorFilterDescriptionWrapper.push_back(linearIIRFilterDescription);
    });

    const isDesigned = isCascadeFilterDescriptionDesigned(
      filterDescription,
      filterDescription.parameters.sampleRateHz
    );
    if (filterDescription.parameters.groupDelaySec == null) {
      throw new Error(`CascadedFilterParameters is missing groupDelaySec`);
    }
    cascadeFilterParameters = new gmsInteropModule.CascadeFilterParameters(
      filterDescription.parameters.groupDelaySec,
      isDesigned,
      filterDescription.parameters.sampleRateHz,
      filterDescription.parameters.sampleRateToleranceHz
    );

    wasmCascadeFilterDesc = new gmsInteropModule.CascadeFilterDescription(
      vectorFilterDescriptionWrapper,
      cascadeFilterParameters,
      filterDescription.causal,
      filterDescription.comments ?? ''
    );
  } catch (e) {
    logger.error('Failed to design filter using GMS cascade filter design', e);

    // ! free any memory used for WASM
    if (cascadeFilterParameters) {
      cascadeFilterParameters.delete();
    }
    if (wasmCascadeFilterDesc) {
      wasmCascadeFilterDesc.delete();
    }
    if (vectorFilterDescriptionWrapper) {
      vectorFilterDescriptionWrapper.delete();
    }
    throw e;
  }
  return wasmCascadeFilterDesc;
}
