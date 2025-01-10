import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { FacetedTypes } from '@gms/common-model';
import type { VersionReference } from '@gms/common-model/lib/faceted';
import { isEntityReference, isFullyPopulated } from '@gms/common-model/lib/faceted';
import type { SignalDetectionHypothesis } from '@gms/common-model/lib/signal-detection';
import { findPhaseFeatureMeasurement } from '@gms/common-model/lib/signal-detection/util';
import { isRotatedChannelName } from '@gms/common-model/lib/station-definitions/channel-definitions/util';
import {
  degToKm,
  greatCircleAngularSeparation,
  QUARTER_CIRCLE_DEGREES,
  THREE_QUARTER_CIRCLE_DEGREES
} from '@gms/common-util';

import { getChannelNameComponents } from './channel-factory-util';

/**
 * Check if a list of channels consists entirely of fully populated channels
 *
 * @param channels a list of channels to check
 * @returns whether the list of channels is fully populated
 */
export function isListOfFullyPopulatedChannels(
  channels: ChannelTypes.Channel[] | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>[]
): channels is ChannelTypes.Channel[] {
  if (channels != null) {
    if (
      channels.every(chan =>
        FacetedTypes.isFullyPopulated<
          'name',
          ChannelTypes.Channel | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>
        >(chan, 'name')
      )
    ) {
      return true;
    }
  }
  return false;
}
/**
 * Used to assert channel is fully populated
 * @param channel
 */
export function assertIsFullyPopulatedChannel(
  channel: ChannelTypes.Channel
): asserts channel is ChannelTypes.Channel {
  if (!isFullyPopulated(channel, 'name')) {
    throw new Error(`Channel is not fully populated: ${channel.name}`);
  }
}

/**
 * Checks a channel's name to see if it is a rotated, derived channel
 *
 * @throws if the channel name does not indicated that it is a rotated, derived channel
 * @param channel The channel to check for whether it is rotated
 */
export function assertIsRotatedChannel(channel: ChannelTypes.Channel) {
  if (!isRotatedChannelName(channel.name)) {
    throw new Error(`Channel ${channel.name} is not a rotated channel`);
  }
}

/**
 * Gets the azimuth from a rotated channel
 *
 * @param fullyPopulatedChannel A fully populated channel from which to get the STEERING_BACK_AZIMUTH
 * out of the channel's processingMetadata
 * @returns the STEERING_BACK_AZIMUTH value out of the processing metadata. Will be undefined if
 * the channel is not rotated.
 */
export function getReceiverToSourceAzimuthDegFromChannel(
  fullyPopulatedChannel: ChannelTypes.Channel
) {
  assertIsFullyPopulatedChannel(fullyPopulatedChannel);
  assertIsRotatedChannel(fullyPopulatedChannel);
  const steeringBackAzimuth = fullyPopulatedChannel.processingMetadata?.STEERING_BACK_AZIMUTH;
  if (typeof steeringBackAzimuth !== 'number') {
    throw new Error(
      `No back azimuth found in processing metadata for channel ${fullyPopulatedChannel.name}`
    );
  }
  return steeringBackAzimuth;
}

/**
 * function which compares two values to see if they are within a tolerance of each other
 *
 * @param tolerance The tolerance value to capture
 */
const areWithinTolerance = (tolerance: number, value1: number, value2: number) => {
  if (value1 != null && value2 != null) {
    const diff = Math.abs(value1 - value2);
    return diff <= tolerance;
  }
  return false;
};

/**
 * Curried function which compares two values to see if they are within a tolerance of each other
 *
 * @param tolerance The tolerance value to capture
 */
const isWithinTolerance = (tolerance: number) => (value1?: number) => (value2?: number) => {
  if (value1 != null && value2 != null) {
    const diff = Math.abs(value1 - value2);
    return diff <= tolerance;
  }
  return false;
};

/**
 * Function to check and see if channel azimuth values in processingMetadata are within tolerance
 *
 * @param tolerance the azimuth tolerance
 * @param fullyPopulatedChannelA a fully populated channel
 * @param fullyPopulatedChannelB another  fully populated channel
 * @returns true if the steering back azimuth values within the channel processingMetadata are within tolerance
 */
export function areChannelAzimuthsWithinTolerance(
  tolerance: number,
  fullyPopulatedChannelA: ChannelTypes.Channel,
  fullyPopulatedChannelB: ChannelTypes.Channel
): boolean {
  return areWithinTolerance(
    tolerance,
    getReceiverToSourceAzimuthDegFromChannel(fullyPopulatedChannelA),
    getReceiverToSourceAzimuthDegFromChannel(fullyPopulatedChannelB)
  );
}

/**
 * Curried function which checks if two channels are orthogonal to within a tolerance.
 *
 * @example ```ts
 * const areChannelsOrthogonalWithinTolerance = areChannelsOrthogonal(2);
 * console.log(areChannelsOrthogonalWithinTolerance(chanABC)(chanXYZ)); // true if the channels are within 2 degrees of 90 from each other
 * const isWithinToleranceOfABC = areChannelsOrthogonalWithinTolerance(chanABC);
 * console.log(isWithinToleranceOfABC(chanXYZ)); // true if channel XYZ is within 2 degrees of 90 from channel ABC
 * ```
 */
export const areChannelsOrthogonal = (tolerance: number) => (chan1: ChannelTypes.Channel) =>
  function isChannelOrthogonal(chan2: ChannelTypes.Channel): boolean | null {
    if (
      chan1.orientationAngles?.horizontalAngleDeg != null &&
      chan2.orientationAngles?.horizontalAngleDeg != null
    ) {
      const diff = Math.abs(
        chan1.orientationAngles.horizontalAngleDeg - chan2.orientationAngles.horizontalAngleDeg
      );
      const isDiffWithinTolerance = isWithinTolerance(tolerance)(diff);
      // 90 degrees and 270 degrees
      return (
        isDiffWithinTolerance(QUARTER_CIRCLE_DEGREES) ||
        isDiffWithinTolerance(THREE_QUARTER_CIRCLE_DEGREES)
      );
    }
    return false;
  };

/**
 * Curried function which checks if a channel's vertical angle is within the tolerance
 *
 * @example ```ts
 * const isWithinVerticalTolerance = isChannelWithinVerticalTolerance(3);
 * console.log(isWithinVerticalTolerance(chanABC)) // true if the channel is within three degrees of vertical
 * ```
 */
export const isChannelWithinVerticalTolerance = (tolerance: number) =>
  function isChannelLessThanVerticalToleranceForHorizontalRotation(
    chan1: ChannelTypes.Channel
  ): boolean | null {
    if (chan1.orientationAngles?.verticalAngleDeg != null) {
      const isDiffWithinTolerance = isWithinTolerance(tolerance)(
        Math.abs(chan1.orientationAngles.verticalAngleDeg)
      );
      return isDiffWithinTolerance(QUARTER_CIRCLE_DEGREES);
    }
    return false;
  };

/**
 * Curried function which compares two channels' `nominalSampleRateHz` values to see if they are within a tolerance
 *
 * @example ```ts
 * const areChannelsWithinTolerance = areChannelsWithinSampleRateTolerance(2);
 * console.log(areChannelsWithinTolerance(chanABC, chanXYZ)) // true if their sample rates are within 2 of each other
 * const isWithinToleranceOfABC = areChannelsWithinTolerance(chanABC);
 * console.log(isWithinToleranceOfABC(chanXYZ)) // true if ABC and XYZ are with 2 of each other
 * ```
 */
export const areChannelsWithinSampleRateTolerance =
  (sampleRateTolerance: number) =>
  (chan1: ChannelTypes.Channel) =>
  (chan2: ChannelTypes.Channel): boolean | null => {
    if (chan1?.nominalSampleRateHz != null && chan2?.nominalSampleRateHz != null) {
      return isWithinTolerance(sampleRateTolerance)(chan1.nominalSampleRateHz)(
        chan2.nominalSampleRateHz
      );
    }
    return false;
  };

/**
 * Function for checking location tolerance
 *
 * Curried function so that we can generate partially applied functions, such as
 * ```ts
 * const areChannelsCloseEnough = areChannelLocationsWithinTolerance(5);
 * console.log(areChannelsCloseEnough(chan1)(chan2)); // true if they are within 5km
 *```
 *
 * @param locationToleranceKm the location tolerance from configuration
 * @param chan1 the first channel to compare
 * @param chan1 the second channel to compare
 */
export const areChannelLocationsWithinTolerance =
  (locationToleranceKm: number) =>
  (chan1: ChannelTypes.Channel) =>
  (chan2: ChannelTypes.Channel): boolean => {
    if (chan1?.location != null && chan2?.location != null) {
      return (
        degToKm(
          greatCircleAngularSeparation(
            chan1.location.latitudeDegrees,
            chan1.location.longitudeDegrees,
            chan2.location.latitudeDegrees,
            chan2.location.longitudeDegrees
          )
        ) <= locationToleranceKm
      );
    }
    return false;
  };

function assertNotNullish<T>(val: T, name: string): asserts val is NonNullable<T> {
  if (val == null) {
    throw new Error(`Null assertion failure. ${name} cannot be null`);
  }
}

/**
 * Check channel compatibility comparison by orientation codes (N, E, 1, 2).
 * Note, this is a curried function allowing partial application.
 *
 * @throws if given a channel with a code other than N, E, 1, or 2
 * @param chan1 A channel for which to check compatibility
 * @returns a function which checks compatibility of a second channel against this channel.
 */
export const areChannelOrientationCodesCompatible =
  (chan1: ChannelTypes.Channel) => (chan2: ChannelTypes.Channel) => {
    assertNotNullish(chan1, 'channel');
    assertNotNullish(chan2, 'channel');
    if (chan1.channelOrientationCode === 'N') {
      return chan2.channelOrientationCode === 'E' || chan2.channelOrientationCode === '2';
    }
    if (chan1.channelOrientationCode === 'E') {
      return chan2.channelOrientationCode === 'N' || chan2.channelOrientationCode === '1';
    }
    if (chan1.channelOrientationCode === '1') {
      return chan2.channelOrientationCode === 'E' || chan2.channelOrientationCode === '2';
    }
    if (chan1.channelOrientationCode === '2') {
      return chan2.channelOrientationCode === 'N' || chan2.channelOrientationCode === '1';
    }

    // All other cases are not handled. The rotation dialog will notify the user that the channel
    // orientations are incompatible.
    return false;
  };

/**
 * Check if all provided channels belong to the provided station. If multiple stations are given,
 * this is considered invalid.
 *
 * @throws if given faceted channels
 */
export function validateChannelsMatchStations(
  selectedChannels: ChannelTypes.Channel[],
  selectedStations: StationTypes.Station[]
) {
  if (selectedChannels == null || selectedStations == null || selectedChannels.length === 0) {
    // nothing to compare
    return true;
  }
  if (selectedChannels.length > 0) {
    let invalid = false;
    selectedChannels.forEach(channel => {
      if (isEntityReference<'name', ChannelTypes.Channel>(channel, 'name')) {
        throw new Error(
          'Cannot validate entity reference channels. Validation requires fully populated channels.'
        );
      }
      if (channel.station.name !== selectedChannels[0].station.name) invalid = true;
    });
    if (invalid) {
      return false;
    }
  }
  return true;
}

/**
 * Check that the first station provided matches the first channel provided. Other cases should be handled
 * in other validation functions, but this can happen if the user makes a strange selection and then opens
 * the dialog.
 *
 * @returns true if valid
 */
export function validateStationMatchesChannel(
  selectedChannels: ChannelTypes.Channel[],
  selectedStations: StationTypes.Station[]
) {
  if (selectedChannels == null || selectedStations == null) {
    throw new Error(
      `Cannot determine if station matches channels for stations ${JSON.stringify(
        selectedStations
      )} and channels ${JSON.stringify(selectedChannels)}`
    );
  }
  return (
    selectedStations.length === 0 ||
    selectedChannels.length === 0 ||
    selectedStations[0].name === selectedChannels[0].station.name
  );
}

/**
 * This will traverse an array of fully populated channels and match results by an array of names given.
 * It will automatically strip nulls, the return channels will be populated.
 *
 * @param channels an array of fully populated channels to search
 * @param names an array of names to match and find
 * @returns an array of matching channels without any nulls
 */
export function findChannelsByNames(
  channels: ChannelTypes.Channel[],
  names: string[]
): ChannelTypes.Channel[] {
  return names.reduce<ChannelTypes.Channel[]>((result, inputName) => {
    const channel = channels.find(({ name }) => name === inputName);

    if (channel != null) {
      return [...result, channel];
    }

    return result;
  }, []);
}

/**
 * This will traverse an array of fully populated channels and match results by a given group name.
 *
 * @param channels an array of fully populated channels to search
 * @param groupName a group name to match and find
 * @returns an array of matching channels without any nulls
 */
export function findChannelsByGroupName(
  channels: ChannelTypes.Channel[],
  groupName: string
): ChannelTypes.Channel[] {
  return channels.filter(
    ({ processingMetadata }) => processingMetadata?.CHANNEL_GROUP === groupName
  );
}

/**
 * Util for searching a list of channels (likely fully populated channels) to find a match of a version
 * reference channel.
 *
 * @param channels A list of channels to search
 * @param channelVersionReference a version reference of a channel to find in the list
 * @returns The channel from the list in @param channels that matches the name and effective time
 * of the version reference
 */
export function findChannelByVersionReference(
  channels: ChannelTypes.Channel[],
  channelVersionReference: VersionReference<'name', ChannelTypes.Channel>
) {
  return channels.find(
    chan =>
      chan.name === channelVersionReference.name &&
      chan.effectiveAt === channelVersionReference.effectiveAt
  );
}

/**
 * Compares the codeName portion of both channels
 * @param channelA
 * @param channelB
 * @returns true if both channels have matching Orientation Type code in the channel name
 */
export function channelsHaveMatchingOrientationType(
  channelA: ChannelTypes.Channel,
  channelB: ChannelTypes.Channel
) {
  return channelA.channelOrientationType === channelB.channelOrientationType;
}

/**
 * @param channelA channel for which to check the channel name
 * @param stationName the name of the station to check
 * @returns true if channel name contains the station string in the correct location (in the format station.channelGroup.orientationCode)
 */
export function channelBelongsToStation(
  channelA: ChannelTypes.Channel | VersionReference<'name', ChannelTypes.Channel>,
  stationName: string
) {
  const aComponents = getChannelNameComponents(channelA.name);
  return aComponents.stationName === stationName;
}

/**
 * @param sdHypothesis the SD Hypothesis for which to get the phase feature measurement's channel
 * @returns the version reference channel in the phase feature measurement
 */
export function getChannelFromPhaseFeatureMeasurement(sdHypothesis: SignalDetectionHypothesis) {
  const phaseFm = findPhaseFeatureMeasurement(sdHypothesis.featureMeasurements);
  return phaseFm.channel;
}
