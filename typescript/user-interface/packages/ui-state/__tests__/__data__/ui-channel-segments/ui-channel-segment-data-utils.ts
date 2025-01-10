import type { SignalDetectionTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';
import { TimeseriesType } from '@gms/common-model/lib/channel-segment/types';
import { Units } from '@gms/common-model/lib/common/types';
import { UNFILTERED } from '@gms/common-model/lib/filter';
import {
  findArrivalTimeFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import cloneDeep from 'lodash/cloneDeep';

import type { UiChannelSegment, UIChannelSegmentRecord } from '../../../src/ts/types';
import { WaveformStore } from '../../../src/ts/workers';
import { generateUniqueId } from '../../../src/ts/workers/waveform-worker/util/position-buffer-util';
import { testChannel } from '../channel-data';
import {
  filteredUiChannelSegmentWithClaimCheck,
  unfilteredClaimCheckUiChannelSegment,
  valuesAsFloat64Array
} from './ui-channel-segment-data';

/**
 * Creates a channel segment with a populated data claim check in the WaveformStore
 *
 * @return uiChannelSegment the channel segment with the populated claim check
 */
export const buildUiChannelSegmentWithPopulatedClaimCheck = async (): Promise<
  UiChannelSegment<WaveformTypes.Waveform>
> => {
  const newUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> = cloneDeep(
    unfilteredClaimCheckUiChannelSegment
  );
  let claimCheckId = '';
  const waveformCs: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> =
    newUiChannelSegment.channelSegment;
  if (waveformCs.timeseries[0]._uiClaimCheckId) {
    const domain = newUiChannelSegment.domainTimeRange;
    const wave: WaveformTypes.Waveform = {
      type: ChannelSegmentTypes.TimeseriesType.WAVEFORM,
      startTime: 0,
      endTime: 100,
      sampleCount: valuesAsFloat64Array.length,
      sampleRateHz: 100,
      samples: new Float64Array()
    };

    claimCheckId = generateUniqueId(newUiChannelSegment.channelSegment, wave, domain);
    waveformCs.timeseries[0]._uiClaimCheckId = claimCheckId;
  }

  // Populated data for the data segment id
  await WaveformStore.store(claimCheckId, valuesAsFloat64Array);

  return newUiChannelSegment;
};

/**
 * Creates a uiChannelSegment record from dummy data based on a list of station names.
 * Channels will be grouped under stations based on . (period) deliniation.
 * ex: ASAR.A and ASAR.B will group under ASAR
 *
 * @param listOfNames an array of station.channel names to associate with the record
 * @returns the uiChannelSegment record
 */
export const buildUiChannelSegmentRecordFromList = (
  listOfNames: string[],
  buildForStations: boolean = true // Add channel segment to the station or channel (raw)
): UIChannelSegmentRecord => {
  const baseChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[] = [
    unfilteredClaimCheckUiChannelSegment,
    filteredUiChannelSegmentWithClaimCheck
  ];

  const uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[] =
    [] as UiChannelSegment<WaveformTypes.Waveform>[];
  baseChannelSegments.forEach(channelSegment => {
    const tempSegments = listOfNames.map(name => {
      return {
        ...channelSegment,
        channelSegmentDescriptor: {
          ...channelSegment.channelSegmentDescriptor,
          channel: {
            ...channelSegment.channelSegmentDescriptor.channel,
            name
          }
        },
        channelSegment: {
          ...channelSegment.channelSegment,
          id: {
            ...channelSegment.channelSegment.id,
            channel: {
              ...channelSegment.channelSegment.id.channel,
              name
            }
          }
        }
      };
    });
    uiChannelSegments.push(...tempSegments);
  });

  const record = {};

  uiChannelSegments.forEach(uiChannelSegment => {
    const channelName = uiChannelSegment.channelSegment.id.channel.name;
    const stationName = buildForStations ? channelName.split('.')[0] : channelName;

    if (!record[stationName]) {
      record[stationName] = {};
    }

    if (!record[stationName][uiChannelSegment.channelSegment._uiFilterId]) {
      record[stationName][uiChannelSegment.channelSegment._uiFilterId] = [];
    }

    record[stationName][uiChannelSegment.channelSegment._uiFilterId].push(uiChannelSegment);
  });

  return record;
};

/**
 * Will return a uiChannelSegmentRecord that match up with the channels in the given signal detections
 *
 * @param signalDetections an array of signal detections to match against
 * @returns a uiChannelSegmentRecord
 */
export const getMatchingUiChannelSegmentRecordForSignalDetections = (
  signalDetections: SignalDetectionTypes.SignalDetection[]
): UIChannelSegmentRecord => {
  const record = {};

  signalDetections.forEach(signalDetection => {
    const stationName = signalDetection.station.name;

    if (!record[stationName]) record[stationName] = { Unfiltered: [] };
    const sdh = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
    const arrivalTimeFM = findArrivalTimeFeatureMeasurement(sdh.featureMeasurements);
    const startTime = arrivalTimeFM.channel.effectiveAt;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const endTime = arrivalTimeFM.channel.effectiveAt + 400;
    const creationTime = arrivalTimeFM.channel.effectiveAt;

    const channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor = {
      channel: arrivalTimeFM.channel,
      startTime,
      endTime,
      creationTime
    };

    const channelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> = {
      id: channelSegmentDescriptor,
      units: Units.UNITLESS,
      timeseriesType: TimeseriesType.WAVEFORM,
      timeseries: [],
      missingInputChannels: [],
      maskedBy: [],
      _uiFilterId: UNFILTERED
    };

    const uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> = {
      channelSegmentDescriptor: {
        channel: arrivalTimeFM.channel,
        startTime,
        endTime,
        creationTime
      },
      channelSegment,
      domainTimeRange: unfilteredClaimCheckUiChannelSegment.domainTimeRange
    };

    record[stationName].Unfiltered.push(uiChannelSegment);
  });

  return record;
};

/**
 * Will return an array of channels that match up with the channels in the given signal detections
 *
 * @param signalDetections an array of signal detections to match against
 * @returns an array of channels
 */
export const getMatchingUiChannelsForSignalDetections = (
  signalDetections: SignalDetectionTypes.SignalDetection[]
): Channel[] => {
  const record = {};

  signalDetections.forEach(signalDetection => {
    const stationName = signalDetection.station.name;
    const sdh = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
    const arrivalTimeFM = findArrivalTimeFeatureMeasurement(sdh.featureMeasurements);
    const channelName = arrivalTimeFM.channel.name;

    if (!record[channelName]) record[channelName] = {};

    record[channelName] = {
      ...testChannel,
      canonicalName: channelName,
      response: null,
      station: {
        ...testChannel.station,
        name: stationName
      },
      name: channelName
    };
  });

  return Object.values(record);
};
