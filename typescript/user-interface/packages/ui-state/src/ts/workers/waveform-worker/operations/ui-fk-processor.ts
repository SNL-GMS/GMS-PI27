import type { ChannelTypes, FkTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter';
import { isWaveformTimeseries } from '@gms/common-model/lib/waveform/util';
import { epochSecondsNow } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import { type ComputeFkArgs, computeFkWasm, getPeakFkAttributesWasm } from '@gms/ui-wasm';
import type { ExtraOptions } from '@gms/ui-workers';
import { axiosBaseQuery } from '@gms/ui-workers';
import { doTimeRangesOverlap } from '@gms/weavess-core/lib/util';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import type { AxiosRequestConfig } from 'axios';

import type { ComputeFkSpectraArgs } from '../../../app';
import { CANCELED } from '../../../app';
import { convertProcessingMasksByChannelToRecord } from '../../../app/api/data/fk/update-fk-util';
import { createFiltered, createFkChannel } from '../../../app/util/channel-factory';
import { getTrimmedSamples } from '../util/sample-util';

const logger = UILogger.create('GMS_LOG_UI_FK_PROCESSOR', process.env.GMS_LOG_UI_FK_PROCESSOR);

/**
 * TODO: Remove this code once WASM is implemented
 * Sends a request to the server using the provided request configuration.
 *
 * @param requestConfig the request configuration
 * @throws {@link Error} any exceptions
 * @throws {@link Error} any Axios request/response failures
 *
 * @returns a promise containing computed Fk Spectra
 */
export const computeLegacyFkSpectra = async (
  requestConfig: AxiosRequestConfig<FkTypes.ComputeFkInput>
): Promise<ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra> | undefined> => {
  if (!requestConfig.baseURL) {
    return Promise.reject(
      new Error('Cannot make a request on the worker without a baseUrl in the config')
    );
  }

  const controller = new AbortController();
  try {
    const queryFn = axiosBaseQuery<ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra>>({
      baseUrl: requestConfig.baseURL
    });

    // ! pass {} as the second and third args because our axios request doesn't use the api or extra options
    const result = await queryFn(
      {
        requestConfig: {
          ...requestConfig,
          signal: controller.signal
        }
      },
      {} as BaseQueryApi,
      {} as ExtraOptions
    );

    return result.data;
  } catch (error) {
    if (error.message !== CANCELED) {
      logger.error(`[Worker] Error computing Fk Spectra`, error);
    }
    return Promise.reject(error);
  }
};

/**
 *
 * @param args
 * @returns
 */
export const computeFkSpectraWorker = async (args: ComputeFkSpectraArgs) => {
  const {
    fkSpectraDefinition,
    station,
    inputChannels,
    startTime,
    endTime,
    detectionTime,
    uiChannelSegments,
    processingMasksByChannel, // need fully populated channels for createFiltered
    maskTaperDefinition,
    expandedTimeBufferSeconds
  } = args;

  // 1. Do NOT want to pass a claim-checked channelSegment that does not have data
  // 2. DO want to pass in a populated CS but only within starttime->endtime + the UIChannelSegment.domainTimeRange

  // Prep data for WASM code call
  const missingInputChannels: ChannelSegmentTypes.TimeRangesByChannel[] = [];

  const channelSegmentList: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[] = [];

  uiChannelSegments.forEach(seg => {
    const timeseriesList: WaveformTypes.Waveform[] = [];

    seg.channelSegment.timeseries.forEach(async timeseries => {
      if (
        isWaveformTimeseries(timeseries) &&
        timeseries._uiClaimCheckId !== null &&
        timeseries._uiClaimCheckId !== undefined
      ) {
        const startTimeWithBuffer = startTime - expandedTimeBufferSeconds;
        const endTimeWithBuffer = endTime + expandedTimeBufferSeconds;

        // Check if timeseries is within by not being outside (left or right) of range
        if (
          // If timeseries is not entirely to left
          !(
            timeseries.startTime < startTimeWithBuffer && timeseries.endTime < startTimeWithBuffer
          ) &&
          // and timeseries is not entirely to right
          !(timeseries.startTime > endTimeWithBuffer && timeseries.endTime > endTimeWithBuffer)
        ) {
          // trim and drop all even values
          const samples = await getTrimmedSamples(
            timeseries._uiClaimCheckId,
            startTimeWithBuffer,
            endTimeWithBuffer,
            seg.domainTimeRange
          );
          timeseriesList.push({
            // update the start and end time to match the samples
            startTime: startTimeWithBuffer,
            endTime: endTimeWithBuffer,
            type: timeseries.type,
            sampleCount: timeseries.sampleCount,
            sampleRateHz: timeseries.sampleRateHz,
            samples
          });
        }
      }
    });
    // If one or more of the trimmed timeseries fits within the timerange add it
    // otherwise add the channel to the missing channels list
    if (timeseriesList.length > 0) {
      channelSegmentList.push({
        ...seg.channelSegment,
        timeseries: timeseriesList
      });
    } else {
      const missingInputChannel: ChannelSegmentTypes.TimeRangesByChannel = {
        channel: seg.channelSegmentDescriptor.channel,
        timeRanges: [
          {
            startTime,
            endTime
          }
        ]
      };
      missingInputChannels.push(missingInputChannel);
    }
  });

  let processedChannels: ChannelTypes.Channel[] = processingMasksByChannel.flatMap(
    obj => obj.channel
  );

  // no longer need full channels, convert to record
  const processingMasksByChannelRecord =
    convertProcessingMasksByChannelToRecord(processingMasksByChannel);

  const computeFkProps: ComputeFkArgs = {
    fkSpectraDefinition,
    station,
    inputChannelNames: inputChannels.map(channel => channel.name),
    detectionTime,
    startTime,
    endTime,
    channelSegments: channelSegmentList,
    processingMasksByChannel: processingMasksByChannelRecord,
    maskTaperDefinition
  };
  // Call FK utility to compute FK
  const fkWithMissingChannels = await computeFkWasm(computeFkProps);

  if (fkSpectraDefinition.fkParameters?.preFilter !== undefined) {
    // create a filtered, derived Channel object
    processedChannels = await Promise.all(
      processedChannels.map(async channel =>
        createFiltered(channel, fkSpectraDefinition.fkParameters.preFilter as FilterDefinition)
      )
    );
  }

  const fkChannel: ChannelTypes.Channel = createFkChannel(processedChannels, fkSpectraDefinition);

  const filteredMasks = processingMasksByChannel
    .map(obj => obj.processingMasks)
    .flatMap(obj => obj)
    .filter(pMask =>
      doTimeRangesOverlap(
        { startTimeSecs: pMask.startTime, endTimeSecs: pMask.endTime },
        { startTimeSecs: startTime, endTimeSecs: endTime }
      )
    );

  // Create the new channel segment
  const newChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectraCOI> = {
    id: {
      channel: fkChannel,
      startTime,
      endTime,
      creationTime: epochSecondsNow()
    },
    units: fkChannel.units,
    timeseriesType: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
    timeseries: fkWithMissingChannels.timeseries,
    maskedBy: filteredMasks,
    // concatenate missing input channels to include channels where there is NO data
    missingInputChannels: [...missingInputChannels, ...fkWithMissingChannels.missingInputChannels]
  };

  return newChannelSegment;
};

/**
 * Finds the Peak FK Attributes in the supplied fkSpectra
 */
export const getPeakFkAttributesWorker = async (fkSpectraCOI: FkTypes.FkSpectraCOI) => {
  logger.warn(JSON.stringify(fkSpectraCOI));
  const peakFkAttributes = await getPeakFkAttributesWasm(fkSpectraCOI);
  logger.warn('getPeakFkAttributes returning', peakFkAttributes);
  return peakFkAttributes;
};
