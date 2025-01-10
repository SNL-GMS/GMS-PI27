import type {
  ConfigurationTypes,
  EventTypes,
  SignalDetectionTypes,
  StationTypes
} from '@gms/common-model';
import { ChannelTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';

import type { InputMode } from './types';

export const rotationLogger = UILogger.create(
  'GMS_LOG_ROTATION_DIALOG',
  process.env.GMS_LOG_ROTATION_DIALOG
);

/**
 * Function to determine if a channel may be rotated.
 *
 * @param channel a channel to check
 * @returns whether the channel may be rotated. Channels that may be rotated include N, E, 1, and 2 channels
 */
export function canChannelBeRotated(channel: ChannelTypes.Channel): boolean {
  const channelType = channel.name.split('.')?.[2];
  return (
    channelType?.endsWith('N') ||
    channelType?.endsWith('E') ||
    channelType?.endsWith('1') ||
    channelType?.endsWith('2') ||
    channel.channelOrientationType === ChannelTypes.ChannelOrientationType.NORTH_SOUTH ||
    channel.channelOrientationType === ChannelTypes.ChannelOrientationType.EAST_WEST ||
    channel.channelOrientationType === ChannelTypes.ChannelOrientationType.ORTHOGONAL_1 ||
    channel.channelOrientationType === ChannelTypes.ChannelOrientationType.ORTHOGONAL_2
  );
}

/**
 * Determine if a station has any channels that may be rotated (with N, E, 1, 2 codes)
 *
 * @param station a station to check
 * @returns
 */
export function doesStationHaveRotatableChannels(station: StationTypes.Station) {
  return !!station.allRawChannels.find(canChannelBeRotated);
}

/**
 * Factory function that generates a getter to determine if any of the initially provided
 * signal detections is on that station.
 *
 * @param signalDetections get the station name from a signal detection
 * @returns a function that determines if a signal detection from the list provided
 * is on a the provided station.
 */
export const getStationsFromSignalDetections =
  (signalDetections: SignalDetectionTypes.SignalDetection[]) => (station: StationTypes.Station) => {
    return signalDetections.filter(sd => sd.station.name === station.name);
  };

/**
 * Factory function to create a predicate function that determines if a station should
 * be included in the station selector based on signal detection targets.
 *
 * @example ```
 * const shouldStationBeShown = getShouldStationBeShownInSelector(selectedSignalDetections);
 * const shouldStationBeShown(myStation1); // true if a provided signal detection was on this station
 * const shouldStationBeShown(myStation2); // true if station has rotatable channels
 * const shouldStationBeShown(myStation3); // false otherwise
 * ```
 *
 * @param signalDetections Stations from these detections will be included
 * @returns
 */
export const getShouldStationBeShownInSelector =
  (signalDetections: SignalDetectionTypes.SignalDetection[]) => (station: StationTypes.Station) => {
    return (
      doesStationHaveRotatableChannels(station) &&
      !!getStationsFromSignalDetections(signalDetections)(station)
    );
  };

/**
 * Get the default interpolation mode for rotation
 *
 * @param openEvent the open event. If an event is open, default to `default-station-phase`.
 * Otherwise, default to the configured default rotation interpolation
 * @param rotationConfig the rotation config from processing config
 */
export const getDefaultInterpolation = (
  openEvent: EventTypes.Event | undefined,
  rotationConfig: ConfigurationTypes.RotationConfiguration | undefined
) => {
  if (!rotationConfig) return 'default-station-phase';
  return openEvent == null ? rotationConfig.defaultRotationInterpolation : 'default-station-phase';
};

/**
 * Get the default steering mode for rotation
 *
 * @param targetSignalDetections the signal detections which are targeted for rotation. If empty, default to `reference-location`.
 * Otherwise, default to `measured-azimuth`
 */
export const getDefaultSteeringMode = (
  targetSignalDetections: SignalDetectionTypes.SignalDetection[]
) => {
  return targetSignalDetections?.length > 0 ? 'measured-azimuth' : 'reference-location';
};

/**
 * Get the default lead/duration mode for rotation
 *
 * @param openEvent the open event. If an event is open, default to `default-station-phase`. Otherwise, use `custom-lead-duration`
 * @param inputMode if we are in signal-detection-mode, then default to `default-station-phase`
 */
export const getDefaultLeadDurationMode = (
  openEvent: EventTypes.Event | undefined,
  inputMode: InputMode
) => {
  if (openEvent != null || inputMode === 'signal-detection-mode') {
    return 'default-station-phase';
  }
  return 'custom-lead-duration';
};

/**
 * Get the default input mode, either signal detection mode or station/phase mode
 *
 * @param targetSignalDetections the signal detections which are targeted for rotation. If empty, default to `station-phase-mode`.
 * Otherwise, default to `signal-detection-mode`
 */
export const getDefaultInputMode = (
  targetSignalDetections: SignalDetectionTypes.SignalDetection[]
) => {
  return targetSignalDetections?.length > 0 ? 'signal-detection-mode' : 'station-phase-mode';
};

/**
 * Get the default phase for rotation from config based on the currently open activities.
 *
 * @param openActivityNames workflow IDs of the open activities, for example, "AL1 Event Review"
 * @param rotationConfig The configuration from which to get the default phase
 * @returns a phase. Defaults to "S" if something goes wrong
 */
export function getDefaultRotationPhase(
  openActivityNames: string[],
  rotationConfig: ConfigurationTypes.RotationConfiguration | undefined
) {
  const defaultRotationPhase = rotationConfig?.defaultRotationPhaseByActivity?.find(
    defaultByActivity => {
      return openActivityNames.find(aName => defaultByActivity.workflowDefinitionId === aName);
    }
  )?.defaultRotationPhase;

  if (openActivityNames.length > 0 && defaultRotationPhase == null) {
    rotationLogger.warn(
      `Cannot find a default phase for any of the open activities: ${openActivityNames.join(', ')}`
    );
  }

  return defaultRotationPhase ?? 'S';
}

/**
 * Given a signal detection, returns associated station from provided list (if any)
 * Logs an error and returns undefined if no station is found
 *
 * @param signalDetection Signal detection you need the station for
 * @param stations array of stations to search through (ex: visible stations)
 * @returns Station if found, undefined if nothing found.
 */
export function getStationFromSD(
  signalDetection: SignalDetectionTypes.SignalDetection,
  stations: StationTypes.Station[]
): StationTypes.Station {
  const station = stations.find(({ name }) => name === signalDetection.station.name);

  if (station === undefined) {
    rotationLogger.error(
      `Cannot find station ${signalDetection.station.name} for signal detection ${signalDetection.id}`
    );
  }
  return station;
}
