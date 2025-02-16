import fill from 'lodash/fill';
import uniqueId from 'lodash/uniqueId';

import type {
  ChannelSegment,
  DataSegment,
  DisplayType,
  PickMarker,
  Station,
  TheoreticalPhaseWindow
} from '../types';
import { UNFILTERED } from '../types';
import { getSecureRandomNumber } from './random-number-util';

/**
 * Creates a flat line data segment.
 *
 * @param startTimeSecs the start time in seconds
 * @param endTimeSecs the end time in seconds
 * @param amplitude the amplitude of the flat segment
 * @param color? (optional) the color of the segment
 * @param displayType? (optional) the display type of the segment
 * @param pointSize? (optional) the point size of the segment
 * @param sampleRate (optional) the sample rate (default 1 hz)
 */
export function createFlatLineDataSegment(
  startTimeSecs: number,
  endTimeSecs: number,
  amplitude: number,
  color?: string,
  displayType?: DisplayType[],
  pointSize?: number,
  sampleRate = 1
): DataSegment {
  if (endTimeSecs <= startTimeSecs) {
    throw new Error('End time seconds must be greater than start time seconds');
  }

  if (sampleRate <= 0) {
    throw new Error('Sample Rate must be greater than zero');
  }

  const numberOfPoints = Math.floor((endTimeSecs - startTimeSecs) * sampleRate);

  const data: number[] = fill(Array(numberOfPoints), amplitude);
  return {
    color,
    displayType,
    pointSize,
    data: {
      startTimeSecs,
      endTimeSecs,
      sampleRate,
      values: data
    }
  };
}

/**
 * Creates a flat line channel segment.
 *
 * @param channelName
 * @param startTimeSecs the start time in seconds
 * @param endTimeSecs the endtime in seconds
 * @param amplitude the amplitude of the flat segment
 * @param color? (optional) the color of the segment
 * @param sampleRate? (optional) the sample rate (default 1 hz)
 * @param displayType? (optional) the display type of the segment
 * @param pointSize? (optional) the point size of the segment
 * @param description? (optional) the description of the segment
 * @param descriptionLabelColor? (optional) the description color of the segment
 * @param wfFilterId
 */
export function createFlatLineChannelSegment(
  configuredInputName: string,
  channelName: string,
  startTimeSecs: number,
  endTimeSecs: number,
  amplitude: number,
  color?: string,
  sampleRate?: number,
  displayType?: DisplayType[],
  pointSize?: number,
  description?: string,
  descriptionLabelColor?: string,
  wfFilterId = UNFILTERED
): ChannelSegment {
  return {
    configuredInputName,
    channelName,
    isSelected: false,
    description,
    descriptionLabelColor,
    wfFilterId,
    dataSegments: [
      createFlatLineDataSegment(
        startTimeSecs,
        endTimeSecs,
        amplitude,
        color,
        displayType,
        pointSize,
        sampleRate
      )
    ]
  };
}

/**
 * Update CurrentEventAmplitude
 *
 * @param eventBuildup
 * @param currentEventAmplitude
 * @param samples
 */
function updateCurrentEventAmplitude(
  eventBuildup: number,
  currentEventAmplitude: number,
  samples: number
): number {
  let updatedEventAmplitude = currentEventAmplitude;
  if (eventBuildup === 1) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    updatedEventAmplitude += updatedEventAmplitude * (1 / samples) * 125;
  } else if (eventBuildup === -1) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    updatedEventAmplitude -= updatedEventAmplitude * (1 / samples) * 62;
  }
  updatedEventAmplitude = updatedEventAmplitude < 0 ? 0 : updatedEventAmplitude;
  return updatedEventAmplitude;
}

/**
 * Creates a dummy Station data
 *
 * @param startTimeSecs start of the data, waveforms will start here
 * @param endTimeSecs end of the data, waveforms will end here
 * @param sampleRate how much data
 * @param eventAmplitude the const y value of the waveforms
 * @param noiseAmplitude percentage that calculates and effects the waveforms amplitude
 * @param hasSignalDetection true if signal detections should be created
 * @param hasTheoreticalPhaseWindows true if theoretical phase windows should be created
 *
 * @returns StationConfig dummy data generated station config
 */
export function createDummyWaveform(
  channelName: string,
  startTimeSecs: number,
  endTimeSecs: number,
  sampleRate: number,
  eventAmplitude: number,
  noiseAmplitude: number,
  hasSignalDetections = true,
  hasTheoreticalPhaseWindows = true,
  wfFilterId = UNFILTERED
): Station {
  let currentEventAmplitude = 0;
  let currentEventPeak = 0;
  let eventBuildup = 0;
  const data: number[] = [];
  const signalDetections: PickMarker[] = [];
  const theoreticalPhaseWindows: TheoreticalPhaseWindow[] = [];
  const theoreticalPhaseWindowColors = ['gold', 'plum', 'cyan'];

  const samples = (endTimeSecs - startTimeSecs) * sampleRate;
  for (let i = 1; i < samples; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (i % Math.round(samples / (getSecureRandomNumber() * 10)) === 0) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      currentEventAmplitude = 0.05;
      currentEventPeak = getSecureRandomNumber() * eventAmplitude;
      eventBuildup = 1;

      if (hasSignalDetections) {
        signalDetections.push({
          id: uniqueId(),
          color: 'red',
          label: 'P',
          timeSecs: startTimeSecs + 100,
          uncertaintySecs: 2.0,
          showUncertaintyBars: false,
          isConflicted: false,
          isSelected: false,
          isActionTarget: false,
          isDraggable: true
        });
      }

      if (hasTheoreticalPhaseWindows) {
        const startTimeModifier = 200;
        const endTimeModifier = 300;
        theoreticalPhaseWindows.push({
          color:
            theoreticalPhaseWindowColors[
              Math.floor(getSecureRandomNumber() * theoreticalPhaseWindowColors.length)
            ],
          id: uniqueId(),
          label: 'P',
          startTimeSecs: startTimeSecs + startTimeModifier,
          endTimeSecs: startTimeSecs + endTimeModifier
        });
      }
    }
    if (currentEventAmplitude >= currentEventPeak) {
      eventBuildup = -1;
    }

    currentEventAmplitude = updateCurrentEventAmplitude(
      eventBuildup,
      currentEventAmplitude,
      samples
    );

    data.push(
      currentEventAmplitude +
        noiseAmplitude -
        getSecureRandomNumber() * noiseAmplitude * 2 -
        getSecureRandomNumber() * currentEventAmplitude * 2
    );
  }

  const channelSegmentsRecord: Record<string, ChannelSegment[]> = {};
  channelSegmentsRecord.data = [
    {
      configuredInputName: channelName,
      channelName,
      isSelected: false,
      wfFilterId,
      description: `eventAmplitude: ${eventAmplitude.toFixed(
        2
      )}, noiseAmplitude: ${noiseAmplitude.toFixed(2)}`,
      dataSegments: [
        {
          data: {
            sampleRate,
            startTimeSecs,
            endTimeSecs,
            values: data
          }
        }
      ]
    }
  ];
  return {
    id: uniqueId(),
    name: 'dummy station',
    defaultChannel: {
      id: uniqueId(),
      name: 'dummy channel',
      height: 75,
      waveform: {
        channelSegmentId: 'data',
        channelSegmentsRecord,
        signalDetections,
        theoreticalPhaseWindows
      },
      isSelected: false
    },
    nonDefaultChannels: [],
    areChannelsShowing: false
  };
}
