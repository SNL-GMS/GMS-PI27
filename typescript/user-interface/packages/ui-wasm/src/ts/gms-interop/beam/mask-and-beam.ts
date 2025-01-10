import type { CommonTypes, WaveformTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';

import type { GmsInteropModule, Wasm } from '../gms-interop-module';
import { getInteropModule } from '../gms-interop-module';
import {
  convertToWasmBeamDefinition,
  convertToWasmChannelSegments,
  convertToWasmProcessingMasksByChannelMap,
  convertToWasmRelativePositionByChannelMap,
  convertToWasmTaperDefinition
} from '../ts-to-wasm-converters';
import { convertToTsTimeseriesWithMissingInputChannels } from '../wasm-to-ts-converters';
import { MaskAndBeamError } from './mask-and-beam-error';
import type { MaskAndBeamWaveformProps } from './types';

const logger = UILogger.create('GMS_MASK_AND_BEAM', process.env.GMS_MASK_AND_BEAM);

/**
 * Performs the mask and beam operation.
 *
 * ! Invokes the WASM algorithm
 *
 * @param props the mask and beam props, {@link MaskAndBeamWaveformProps}
 */
export async function maskAndBeamWaveforms(
  props: MaskAndBeamWaveformProps
): Promise<CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform>> {
  let gmsInteropModule: GmsInteropModule | null = await getInteropModule().catch(() => {
    throw new MaskAndBeamError(`Failed access the interop module.`, props);
  });

  const beamAlgorithm = new gmsInteropModule.BeamProvider();

  let beamDefinition: Wasm.BeamDefinition | undefined;
  let channelSegments: Wasm.VectorChannelSegment | undefined;
  let relativePositionByChannelMap: Wasm.RelativePositionByChannelMap | undefined;
  let processingMasks: Wasm.ProcessingMasksByChannelMap | undefined;
  let taperDefinition: Wasm.TaperDefinition | undefined;
  let result: Wasm.TimeseriesWithMissingInputChannels | undefined;
  try {
    beamDefinition = convertToWasmBeamDefinition(gmsInteropModule, props.beamDefinition);
    channelSegments = convertToWasmChannelSegments(gmsInteropModule, props.channelSegments);
    relativePositionByChannelMap = convertToWasmRelativePositionByChannelMap(
      gmsInteropModule,
      props.relativePositionsByChannel
    );
    processingMasks = convertToWasmProcessingMasksByChannelMap(
      gmsInteropModule,
      props.processingMasks
    );
    taperDefinition = props.taperDefinition
      ? convertToWasmTaperDefinition(gmsInteropModule, props.taperDefinition)
      : props.taperDefinition;

    const { beamStartTime, beamEndTime, mediumVelocity } = props;

    result = beamAlgorithm.maskAndBeamWaveforms(
      beamDefinition,
      channelSegments,
      relativePositionByChannelMap,
      beamStartTime,
      beamEndTime,
      mediumVelocity,
      processingMasks,
      taperDefinition
    );
    return convertToTsTimeseriesWithMissingInputChannels(gmsInteropModule, result);
  } catch (error) {
    try {
      const [type, message] = gmsInteropModule.getExceptionMessage(error);
      logger.error(`Failed to compute mask and beam waveforms`, { type, error, props });
      // eslint-disable-next-line no-underscore-dangle
      gmsInteropModule._free(error);
      throw new MaskAndBeamError(
        `Failed to compute mask and beam waveforms. ${type}: ${message}`,
        props
      );
    } catch (runtimeError) {
      if (runtimeError instanceof MaskAndBeamError) {
        throw runtimeError;
      }
      logger.error(`Failed to compute mask and beam waveforms (unable to get exception message)`, {
        error,
        props
      });
      throw new MaskAndBeamError(`Failed to compute mask and beam waveforms: ${error}`, props);
    }
  } finally {
    beamAlgorithm.delete();
    if (beamDefinition) beamDefinition.delete();
    if (channelSegments) channelSegments.delete();
    if (relativePositionByChannelMap) relativePositionByChannelMap.delete();
    if (processingMasks) processingMasks.delete();
    if (taperDefinition) taperDefinition.delete();
    if (result) result.delete();
    gmsInteropModule.flushPendingDeletes();
    gmsInteropModule = null;
  }
}
