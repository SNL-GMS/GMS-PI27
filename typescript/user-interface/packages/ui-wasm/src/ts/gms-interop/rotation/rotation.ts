import type { CommonTypes, ProcessingMaskDefinitionTypes, WaveformTypes } from '@gms/common-model';
import type { ChannelSegment, ProcessingMask } from '@gms/common-model/lib/channel-segment';
import type { RotationDefinition } from '@gms/common-model/lib/rotation/types';
import { UILogger } from '@gms/ui-util';

import type { GmsInteropModule, Wasm } from '../gms-interop-module';
import { getInteropModule } from '../gms-interop-module';
import {
  convertToWasmChannelSegments,
  convertToWasmProcessingMasksByChannelMap,
  convertToWasmRotationDefinition,
  convertToWasmTaperDefinition
} from '../ts-to-wasm-converters';
import { convertToTsTimeseriesWithMissingInputChannels } from '../wasm-to-ts-converters';

const logger = UILogger.create('GMS_WASM_ROTATION', process.env.GMS_WASM_ROTATION);

/**
 * Rotates orthogonal waveforms by the back-azimuth
 * @param rotationDefinition
 * @param channelSegments orthogonal paired channel segments
 * @param startTime epochSeconds representing the time to start rotation
 * @param endTime epochSeconds representing the time to end rotation
 * @param processingMasks masks to apply to the provided channels
 * @returns
 */
export async function maskAndRotate2d(
  rotationDefinition: RotationDefinition,
  channelSegments: [ChannelSegment<WaveformTypes.Waveform>, ChannelSegment<WaveformTypes.Waveform>],
  startTime: number,
  endTime: number,
  processingMasks: Record<string, ProcessingMask[]>,
  maskTaperDefinition?: ProcessingMaskDefinitionTypes.TaperDefinition
): Promise<CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform>[]> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new Error(`Failed access the interop module.`);
  });

  const rotationAlgorithm = new gmsInteropModule.RotationProvider();

  let wasmRotationDefinition: Wasm.RotationDefinition | undefined;
  let wasmChannelSegments: Wasm.VectorChannelSegment | undefined;
  let wasmProcessingMasks: Wasm.ProcessingMasksByChannelMap | undefined;
  let wasmTaperDefinition: Wasm.TaperDefinition | undefined;
  let wasmResult: Wasm.ChannelToTimeseriesWithMissingInputMap | undefined;
  const result: CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform>[] = [];
  try {
    wasmRotationDefinition = convertToWasmRotationDefinition(gmsInteropModule, rotationDefinition);
    wasmChannelSegments = convertToWasmChannelSegments(gmsInteropModule, channelSegments);

    wasmProcessingMasks = convertToWasmProcessingMasksByChannelMap(
      gmsInteropModule,
      processingMasks
    );

    if (maskTaperDefinition) {
      wasmTaperDefinition = convertToWasmTaperDefinition(gmsInteropModule, maskTaperDefinition);
    }

    wasmResult = rotationAlgorithm.maskAndRotate2d(
      wasmRotationDefinition,
      wasmChannelSegments,
      startTime,
      endTime,
      wasmProcessingMasks,
      wasmTaperDefinition
    );
    if (wasmResult === undefined) {
      logger.error(`Rotation of waveforms failed, result was undefined`);
    } else {
      const radialResult: CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform> =
        convertToTsTimeseriesWithMissingInputChannels(
          gmsInteropModule,
          wasmResult.get(channelSegments[1].id.channel.name)
        );

      const transverseResult: CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform> =
        convertToTsTimeseriesWithMissingInputChannels(
          gmsInteropModule,
          wasmResult.get(channelSegments[0].id.channel.name)
        );
      result.push(radialResult);
      result.push(transverseResult);
    }
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed rotation of waveforms`, { type, error });
      // eslint-disable-next-line no-underscore-dangle
      gmsInteropModule._free(error);
      throw new Error(`${type}: ${message}`);
    } catch (runtimeError) {
      logger.error(`Failed rotation of waveforms`, {
        error
      });
      throw runtimeError;
    }
  } finally {
    rotationAlgorithm.delete();
    if (wasmRotationDefinition) wasmRotationDefinition.delete();
    if (wasmChannelSegments) wasmChannelSegments.delete();
    if (wasmProcessingMasks) wasmProcessingMasks.delete();
    if (wasmTaperDefinition) wasmTaperDefinition.delete();
    if (wasmResult) wasmResult.delete();
    gmsInteropModule = null;
  }
  return result;
}
