import type {
  ChannelSegmentTypes,
  ChannelTypes,
  CommonTypes,
  FkTypes,
  ProcessingMaskDefinitionTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';
import { UILogger } from '@gms/ui-util';

import type { GmsInteropModule, Wasm } from '../gms-interop-module';
import { getInteropModule } from '../gms-interop-module';
import {
  convertToWasmChannelSegments,
  convertToWasmFkSpectra,
  convertToWasmFkSpectraDefinition,
  convertToWasmProcessingMasksByChannelMap,
  convertToWasmStation,
  convertToWasmTaperDefinition
} from '../ts-to-wasm-converters';
import {
  convertToTsFkAttributes,
  convertToTsFkTimeseriesWithMissingInputChannels
} from '../wasm-to-ts-converters';

const logger = UILogger.create('GMS_COMPUTE_FK', process.env.GMS_COMPUTE_FK);

/** Prop object for {@link ComputeFkArgs} */
export interface ComputeFkArgs {
  readonly fkSpectraDefinition: FkTypes.FkSpectraDefinition;
  readonly station: StationTypes.Station;
  readonly inputChannelNames: string[];
  readonly detectionTime: number;
  readonly startTime: number;
  readonly endTime: number;
  readonly channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
  readonly processingMasksByChannel: Record<
    ChannelTypes.Channel['name'],
    ChannelSegmentTypes.ProcessingMask[]
  >;
  readonly maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined;
}

/**
 * Performs the computeFk operation.
 *
 * ! Invokes the WASM algorithm
 *
 */
export async function computeFkWasm(
  props: ComputeFkArgs
): Promise<CommonTypes.TimeseriesWithMissingInputChannels<FkTypes.FkSpectraCOI>> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });

  const fkComputeProvider: Wasm.FkComputeUtility = new gmsInteropModule.FkComputeUtility();

  let fkSpectraDefinition: Wasm.FkSpectraDefinition | undefined;
  let station: Wasm.Station | undefined;
  const inputChannelNames: Wasm.VectorString = new gmsInteropModule.VectorString();
  let processingMasks: Wasm.ProcessingMasksByChannelMap | undefined;
  let taperDefinition: Wasm.TaperDefinition | undefined;
  let channelSegments: Wasm.VectorChannelSegment | undefined;

  try {
    fkSpectraDefinition = convertToWasmFkSpectraDefinition(
      gmsInteropModule,
      props.fkSpectraDefinition
    );
    station = convertToWasmStation(gmsInteropModule, props.station);
    props.inputChannelNames.forEach(channelName => inputChannelNames.push_back(channelName));
    processingMasks = convertToWasmProcessingMasksByChannelMap(
      gmsInteropModule,
      props.processingMasksByChannel
    );
    channelSegments = convertToWasmChannelSegments(gmsInteropModule, props.channelSegments);
    taperDefinition = props.maskTaperDefinition
      ? convertToWasmTaperDefinition(gmsInteropModule, props.maskTaperDefinition)
      : props.maskTaperDefinition;

    const result = convertToTsFkTimeseriesWithMissingInputChannels(
      gmsInteropModule,
      fkComputeProvider.computeFk(
        fkSpectraDefinition,
        station,
        inputChannelNames,
        props.detectionTime,
        props.startTime,
        props.endTime,
        channelSegments,
        processingMasks,
        taperDefinition
      )
    );
    logger.info(`Computed FK`, JSON.stringify(result));
    return result;
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed to compute fk`, { type, error });
      // eslint-disable-next-line no-underscore-dangle
      gmsInteropModule._free(error);
      throw new Error(`${type}: ${message}`);
    } catch (runtimeError) {
      logger.error(`Failed to compute fk`, {
        error
      });
      throw runtimeError;
    }
  } finally {
    fkComputeProvider.delete();
    if (fkSpectraDefinition) fkSpectraDefinition.delete();
    if (station) station.delete();
    if (inputChannelNames) inputChannelNames.delete();
    if (processingMasks) processingMasks.delete();
    if (taperDefinition) taperDefinition.delete();
    if (channelSegments) channelSegments.delete();
    gmsInteropModule = null;
  }
}

export async function getPeakFkAttributesWasm(
  fkSpectraTs: FkTypes.FkSpectraCOI
): Promise<FkTypes.FkAttributes> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });

  const fkComputeProvider = new gmsInteropModule.FkComputeUtility();
  let wasmResult: Wasm.FkAttributes | undefined;
  let fkSpectra: Wasm.FkSpectra | undefined;

  try {
    fkSpectra = convertToWasmFkSpectra(gmsInteropModule, fkSpectraTs);
    wasmResult = fkComputeProvider.getPeakFkAttributes(fkSpectra);
    const result = convertToTsFkAttributes(gmsInteropModule, wasmResult);
    logger.info(`Peak attributes`, result);
    return result;
  } catch (error) {
    logger.error(`Failed get peak attributes`, error);
    throw error;
  } finally {
    fkComputeProvider.delete();
    if (fkSpectra) fkSpectra.delete();
    if (wasmResult) wasmResult.delete();
    gmsInteropModule = null;
  }
}
