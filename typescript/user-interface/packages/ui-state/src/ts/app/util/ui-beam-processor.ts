import type { ChannelTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import { findOrThrow } from '@gms/common-model/lib/array-util/array-util';
import type { BeamDefinition } from '@gms/common-model/lib/beamforming-templates/types';
import type { ProcessingMask, TimeRangesByChannel } from '@gms/common-model/lib/channel-segment';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment';
import type { TimeRange } from '@gms/common-model/lib/common';
import type { VersionReference } from '@gms/common-model/lib/faceted';

import type { UiChannelSegment } from '../../types';
import { maskAndBeamWaveforms as maskAndBeamWaveformApi } from '../../workers/api/ui-beam-processor';
import type { MaskAndBeamWaveformResult } from '../../workers/waveform-worker/types';
import {
  BeamformingNoWaveformDataError,
  BeamformingWithStationChannelsError
} from '../processing/beamforming/errors';
import { validateChannels } from '../processing/validate-channels';
import { trimUiChannelSegment } from './util';

// Props for the ui-beam-processor maskAndBeamWaveforms operation
export interface MaskAndBeamWaveformProps {
  beamDefinition: BeamDefinition;
  beamStartTime: number;
  beamEndTime: number;
  station: StationTypes.Station;
  channels: ChannelTypes.Channel[];
  channelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
  createProcessingMasks: (
    channel: VersionReference<'name', ChannelTypes.Channel>,
    startTime: number,
    endTime: number,
    processingOperation: ProcessingOperation,
    phaseType: string
  ) => Promise<{
    processingMasks: ProcessingMask[];
    channel: ChannelTypes.Channel;
  }>;
  expandedTimeBuffer: number;
  currentInterval: TimeRange;
}

/**
 * Mask and beam waveform operation. Builds the parameters for the {@link maskAndBeamWaveforms} operation to call the WASM code for event beaming
 *
 * !This function contains the logic that must run on the main thread Mask and beam waveform operation.
 *
 * @param props of type {@link MaskAndBeamWaveformProps}
 */
export async function maskAndBeamWaveforms(
  props: MaskAndBeamWaveformProps
): Promise<MaskAndBeamWaveformResult> {
  const {
    beamDefinition,
    beamStartTime,
    beamEndTime,
    station,
    channels,
    channelSegments,
    createProcessingMasks,
    expandedTimeBuffer,
    currentInterval
  } = props;

  const expandedStart = beamStartTime - expandedTimeBuffer;
  const expandedEnd = beamEndTime + expandedTimeBuffer;

  validateChannels(
    {
      sampleRateHz: beamDefinition.beamParameters.sampleRateHz,
      sampleRateToleranceHz: beamDefinition.beamParameters.sampleRateToleranceHz,
      orientationAngles: beamDefinition.beamParameters.orientationAngles,
      orientationAngleToleranceDeg: beamDefinition.beamParameters.orientationAngleToleranceDeg
    },
    channels,
    station.name
  );

  // add any channels with no segments at all to the missing inputs
  const missingInputChannels: TimeRangesByChannel[] = [];
  const filteredChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[] = [];
  const processingMasksByChannel: {
    processingMasks: ProcessingMask[];
    channel: ChannelTypes.Channel;
  }[] = [];
  // for each channel
  await Promise.all(
    channels.map(async channel => {
      // grab any channel segments that match the channel and overlap the time range
      const matchingChannelSegments = channelSegments.filter(
        cs =>
          channel.name === cs.channelSegmentDescriptor.channel.name &&
          cs.channelSegmentDescriptor.startTime <= expandedEnd &&
          cs.channelSegmentDescriptor.endTime >= expandedStart
      );

      if (matchingChannelSegments.length > 0) {
        matchingChannelSegments.forEach(cs =>
          filteredChannelSegments.push(
            trimUiChannelSegment(cs, { startTimeSecs: expandedStart, endTimeSecs: expandedEnd })
          )
        );
      } else {
        const processingMasks = await createProcessingMasks(
          channel,
          expandedStart,
          expandedEnd,
          ProcessingOperation.EVENT_BEAM,
          beamDefinition.beamDescription.phase
        ).catch(error => {
          throw new BeamformingWithStationChannelsError(
            `Failed create processing masks. ${error.message}`,
            station,
            channels
          );
        });

        if (processingMasks.processingMasks.length === 0)
          missingInputChannels.push({
            channel: findOrThrow(channels, c => c.name === channel.name),
            timeRanges: [{ startTime: expandedStart, endTime: expandedEnd }]
          });
        else {
          processingMasksByChannel.push(processingMasks);
        }
      }
    })
  );

  if (filteredChannelSegments.length === 0) {
    return Promise.reject(new BeamformingNoWaveformDataError(channels, props));
  }

  await Promise.all(
    filteredChannelSegments.map(async channelSeg =>
      processingMasksByChannel.push(
        await createProcessingMasks(
          channelSeg.channelSegmentDescriptor.channel,
          channelSeg.channelSegmentDescriptor.startTime,
          channelSeg.channelSegmentDescriptor.endTime,
          ProcessingOperation.EVENT_BEAM,
          beamDefinition.beamDescription.phase
        ).catch(error => {
          throw new BeamformingWithStationChannelsError(
            `Failed create processing masks. ${error.message}`,
            station,
            channels
          );
        })
      )
    )
  );

  return maskAndBeamWaveformApi({
    beamDefinition,
    beamStartTime,
    beamEndTime,
    station,
    filteredChannelSegments,
    processingMasksByChannel,
    currentInterval,
    missingInputChannels
  }).catch(error => {
    throw new BeamformingWithStationChannelsError(`${error.message}`, station, channels);
  });
}
