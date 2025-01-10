import type { WaveformTypes } from '@gms/common-model';
import { UNFILTERED } from '@gms/common-model/lib/filter';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { UILogger } from '@gms/ui-util';
import { maskAndRotate2d as wasmMaskAndRotate2d } from '@gms/ui-wasm';

import { createRotated } from '../../../app/util/channel-factory';
import { getChannelNameComponents } from '../../../app/util/channel-factory-util';
import {
  adjustRotationDefinitionForChannelOrientation,
  createRotatedUiChannelSegment,
  findOverlappingProcessingMasks
} from '../../../app/util/util';
import type { MaskAndRotate2dParams, MaskAndRotate2dResult } from '../../../types';
import { calculateAndStorePositionBuffer, generateUniqueId } from '../util/position-buffer-util';
import { hydrateTrimmedChannelSegmentSamples } from '../util/sample-util';

const logger = UILogger.create('GMS_UI_ROTATION_PROCESSOR', process.env.GMS_UI_ROTATION_PROCESSOR);

export const maskAndRotate2d = async ({
  rotationDefinition,
  station,
  channels,
  uiChannelSegmentPair,
  rotationTimeInterval,
  processingMasks,
  maskTaperDefinition
}: MaskAndRotate2dParams): Promise<MaskAndRotate2dResult[]> => {
  const hydratedChannelSegments = await Promise.all(
    uiChannelSegmentPair.map(async cs =>
      hydrateTrimmedChannelSegmentSamples(cs.channelSegment, cs.domainTimeRange)
    )
  );

  const missingDataFound = hydratedChannelSegments.some(cs => {
    return (
      cs.timeseries.reduce((result, ts) => {
        return result + (ts?.samples?.length || 0);
      }, 0) <= 0
    );
  });

  if (missingDataFound) {
    const { stationName } = getChannelNameComponents(
      uiChannelSegmentPair[0].channelSegment.id.channel.name
    );
    // Should be caught in toast
    throw new Error(`Failed to rotate station ${stationName}, is missing waveform data.`);
  }

  const waveforms = await wasmMaskAndRotate2d(
    rotationDefinition,
    [hydratedChannelSegments[0], hydratedChannelSegments[1]],
    rotationTimeInterval.startTimeSecs,
    rotationTimeInterval.endTimeSecs,
    processingMasks,
    maskTaperDefinition
  );

  const radialTimeseries = waveforms[0].timeseries;
  const radialMissingInputChannels = waveforms[0].missingInputChannels;
  const transverseTimeseries = waveforms[1].timeseries;
  const transverseMissingInputChannels = waveforms[1].missingInputChannels;

  const radialRotationDefinition = adjustRotationDefinitionForChannelOrientation(
    rotationDefinition,
    ChannelOrientationType.RADIAL
  );
  const radialChannel = await createRotated(
    channels,
    radialRotationDefinition,
    ChannelOrientationType.RADIAL
  );

  const transverseRotationDefinition = adjustRotationDefinitionForChannelOrientation(
    rotationDefinition,
    ChannelOrientationType.TRANSVERSE
  );
  const transverseChannel = await createRotated(
    channels,
    transverseRotationDefinition,
    ChannelOrientationType.TRANSVERSE
  );

  const radialProcessingMasks = findOverlappingProcessingMasks(
    uiChannelSegmentPair[0].channelSegment.maskedBy,
    radialTimeseries
  );

  const transverseProcessingMasks = findOverlappingProcessingMasks(
    uiChannelSegmentPair[1].channelSegment.maskedBy,
    transverseTimeseries
  );

  const results: MaskAndRotate2dResult[] = [
    createRotatedUiChannelSegment(
      radialChannel,
      rotationTimeInterval,
      uiChannelSegmentPair[0].domainTimeRange,
      radialTimeseries,
      uiChannelSegmentPair[0].channelSegment.timeseriesType,
      radialProcessingMasks,
      radialMissingInputChannels
    ),
    createRotatedUiChannelSegment(
      transverseChannel,
      rotationTimeInterval,
      uiChannelSegmentPair[0].domainTimeRange,
      transverseTimeseries,
      uiChannelSegmentPair[1].channelSegment.timeseriesType,
      transverseProcessingMasks,
      transverseMissingInputChannels
    )
  ].map(uiChannelSegment => {
    // Strip samples from the timeseries and store the waveforms
    const timeseries: WaveformTypes.Waveform[] = uiChannelSegment.channelSegment.timeseries.map(
      wave => {
        const id = generateUniqueId(uiChannelSegment.channelSegment, wave, rotationTimeInterval);
        // We don't need to wait for the result
        calculateAndStorePositionBuffer(id, wave, uiChannelSegment.domainTimeRange).catch(
          logger.error
        );

        return {
          startTime: wave.startTime,
          endTime: wave.endTime,
          type: wave.type,
          sampleCount: wave.sampleCount,
          sampleRateHz: wave.sampleRateHz,
          _uiClaimCheckId: id
        };
      }
    );

    return {
      stationName: station.name,
      phase: rotationDefinition.rotationDescription.phaseType,
      rotatedChannel:
        uiChannelSegment.channelSegmentDescriptor.channel.name === radialChannel.name
          ? radialChannel
          : transverseChannel,
      rotatedUiChannelSegment: {
        ...uiChannelSegment,
        channelSegment: {
          ...uiChannelSegment.channelSegment,
          timeseries,
          _uiFilterId: UNFILTERED
        }
      }
    };
  });

  return results;
};
