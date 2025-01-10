import type { WaveformTypes } from '@gms/common-model';
import { convertToVersionReference } from '@gms/common-model';
import type { ChannelSegment, ProcessingMask } from '@gms/common-model/lib/channel-segment';
import { TimeseriesType } from '@gms/common-model/lib/channel-segment';
import type { ProcessingMaskDefinition } from '@gms/common-model/lib/processing-mask-definitions/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions';
import { epochSecondsNow } from '@gms/common-util';
import { maskAndBeamWaveforms } from '@gms/ui-wasm';
import { MaskAndBeamError } from '@gms/ui-wasm/lib/gms-interop/beam/mask-and-beam-error';
import { doTimeRangesOverlap } from '@gms/weavess-core/lib/util';
import flatMap from 'lodash/flatMap';

import {
  BeamformingAlgorithmError,
  BeamformingWithStationChannelsError
} from '../../../app/processing/beamforming/errors';
import { createBeamed, createFiltered } from '../../../app/util/channel-factory';
import type { MaskAndBeamWaveformResult, MaskAndBeamWaveformWorkerProps } from '../types';
import { convertChannelSegmentToTypedArray } from '../util/channel-segment-util';
import { convertUiChannelSegmentsToChannelSegments } from './export-channel-segments';

/**
 * Second half of the maskAndBeamWaveform implementation.  This function contains the logic that must run on the waveform worker thread
 * Mask and beam waveform operation.  Builds the parameters for the {@link maskAndBeamWaveforms} operation to call the WASM code for event beaming
 *
 * @param beamDefinition beam definition used to build the beam
 * @param beamStartTime start time for the new beam
 * @param beamEndTime end time for the new beam
 * @param station station to beam
 * @param channels channels to beam
 *
 * @param channelSegments UI parameter - Channel segment object from redux
 * @param createProcessingMasks UI parameter - createProcessingMasks function returned from the {@link useCreateProcessingMasksFromChannelSegment} hook
 * @param expandedTimeBuffer UI parameter
 */
export async function maskAndBeamWaveformsWorker(
  props: MaskAndBeamWaveformWorkerProps
): Promise<MaskAndBeamWaveformResult> {
  const {
    beamDefinition,
    beamStartTime,
    beamEndTime,
    station,
    filteredChannelSegments,
    processingMasksByChannel,
    currentInterval,
    missingInputChannels
  } = props;

  const channelSegments: ChannelSegment<WaveformTypes.Waveform>[] =
    await convertUiChannelSegmentsToChannelSegments(filteredChannelSegments).catch(async error => {
      return Promise.reject(
        new BeamformingWithStationChannelsError(
          `Failed to convert UiChannelSegments to ChannelSegments. ${error.message}`,
          station
        )
      );
    });

  let processedChannels: Channel[] = [];
  const processingMasks: Record<string, ProcessingMask[]> = {};
  processingMasksByChannel.forEach(mc => {
    processedChannels.push(mc.channel);
    processingMasks[mc.channel.name] = mc.processingMasks;
  });

  // grab the taper definition from the first channel with a mask
  const channelsWithMasks = processingMasksByChannel.filter(
    collection => collection.processingMasks.length > 0
  );

  let taperDefinition;
  if (channelsWithMasks.length > 0) {
    taperDefinition = (
      channelsWithMasks[0].channel.processingDefinition as ProcessingMaskDefinition
    ).taperDefinition;
  }

  const timeseriesWithMissingInputChannels = await maskAndBeamWaveforms({
    station,
    beamDefinition,
    channelSegments,
    relativePositionsByChannel: station.relativePositionsByChannel,
    beamStartTime,
    beamEndTime,
    processingMasks,
    taperDefinition
  }).catch(async error => {
    if (error instanceof MaskAndBeamError) {
      return Promise.reject(new BeamformingAlgorithmError(error, error.props.station));
    }
    return Promise.reject(
      new BeamformingWithStationChannelsError(
        `Failed to mask and beam waveforms. ${error.message}`,
        station,
        processedChannels
      )
    );
  });

  const { preFilterDefinition } = beamDefinition.beamDescription;

  // if a prefilter definition exists filter the channels
  if (preFilterDefinition !== undefined) {
    processedChannels = await Promise.all(
      processedChannels.map(async channel => createFiltered(channel, preFilterDefinition))
    ).catch(async error => {
      return Promise.reject(
        new BeamformingWithStationChannelsError(
          `Failed to create filtered derived channels. ${error.message}`,
          station,
          processedChannels
        )
      );
    });
  }

  // TODO: Update channel weights once added
  const newBeamDefinition = beamDefinition;

  // created the beamed channel
  const beamedChannel = await createBeamed(processedChannels, newBeamDefinition, station).catch(
    async error => {
      return Promise.reject(
        new BeamformingWithStationChannelsError(
          `Failed to create beamed derived channels. ${error.message}`,
          station,
          processedChannels
        )
      );
    }
  );

  // collect all input masks and filter them to only include masks that overlap the waveform
  const filteredMasks = flatMap(Object.values(processingMasks)).filter(mask =>
    doTimeRangesOverlap(
      { startTimeSecs: mask.startTime, endTimeSecs: mask.endTime },
      { startTimeSecs: beamStartTime, endTimeSecs: beamEndTime }
    )
  );

  // Create the new channel segment
  const newChannelSegment: ChannelSegment<WaveformTypes.Waveform> = {
    id: {
      channel: convertToVersionReference(beamedChannel, 'name'),
      startTime: beamStartTime,
      endTime: beamEndTime,
      creationTime: epochSecondsNow()
    },
    units: beamedChannel.units,
    timeseriesType: TimeseriesType.WAVEFORM,
    timeseries: timeseriesWithMissingInputChannels.timeseries,
    maskedBy: filteredMasks,
    // concatenate missing input channels to include channels where there is NO data
    missingInputChannels: [
      ...missingInputChannels,
      ...timeseriesWithMissingInputChannels.missingInputChannels
    ]
  };

  // Store in waveform cache and convert to UiChannelSegment
  return {
    channel: beamedChannel,
    uiChannelSegment: await convertChannelSegmentToTypedArray(
      newChannelSegment,
      currentInterval
    ).catch(async error => {
      return Promise.reject(
        new BeamformingWithStationChannelsError(
          `Failed to convert channel segments to typed array. ${error.message}`,
          station,
          [beamedChannel]
        )
      );
    })
  };
}
