import type { ChannelTypes, FacetedTypes, StationTypes } from '@gms/common-model';

interface BaseChannelComparison {
  readonly sampleRateHz: number;
  readonly sampleRateToleranceHz: number;
  readonly orientationAngles: ChannelTypes.OrientationAngles;
  readonly orientationAngleToleranceDeg: number;
}

export class InvalidChannelsError extends Error {
  public readonly id: string;

  public readonly details: string;

  public readonly baseComparisons: BaseChannelComparison;

  public readonly channels: ChannelTypes.Channel[];

  public readonly stationName:
    | string
    | StationTypes.Station
    | FacetedTypes.VersionReference<'name'>
    | FacetedTypes.EntityReference<'name', StationTypes.Station>;

  public constructor(
    message: string,
    details: string,
    baseComparisons: BaseChannelComparison,
    channels: ChannelTypes.Channel[],
    stationName:
      | string
      | StationTypes.Station
      | FacetedTypes.VersionReference<'name'>
      | FacetedTypes.EntityReference<'name', StationTypes.Station>
  ) {
    super(message);
    Object.setPrototypeOf(this, InvalidChannelsError.prototype);
    this.id = 'invalid-channels';
    this.details = details;
    this.baseComparisons = baseComparisons;
    this.channels = channels;
    this.stationName = stationName;
  }
}

/**
 * Helper function for {link validateChannels}. Validates that a channel orientation angle is
 * within the tolerance of a base angle.
 *
 * @param firstAngle first angle to compare (should be of same orientation eg; horizontal or vertical)
 * @param secondAngle second angle to compare (should be of same orientation eg; horizontal or vertical)
 * @param angleTolerance inclusive tolerance between angles
 * @returns true if both angles exist and are within the tolerance of each other or if neither angle exists
 */
function validateAngle(
  firstAngle: number | undefined,
  secondAngle: number | undefined,
  angleTolerance: number
): boolean {
  if (firstAngle !== undefined && secondAngle === undefined) {
    return false;
  }
  if (firstAngle === undefined && secondAngle !== undefined) {
    return false;
  }
  if (
    firstAngle !== undefined &&
    secondAngle !== undefined &&
    Math.abs(firstAngle - secondAngle) > angleTolerance
  ) {
    return false;
  }
  return true;
}

/**
 * Helper function for {@link validateChannels}. Matches compatible orientation codes: Z+3. E+2. N+1.
 *
 * Exported for testing.
 *
 * @param channelOrientationCode1
 * @param channelOrientationCode2
 * @returns true if compatible, otherwise false
 */
export function areOrientationCodesCompatible(
  channelOrientationCode1: string,
  channelOrientationCode2: string
): boolean {
  if (channelOrientationCode1 === channelOrientationCode2) return true;
  if (
    (channelOrientationCode1 === 'Z' || channelOrientationCode1 === '3') &&
    (channelOrientationCode2 === 'Z' || channelOrientationCode2 === '3')
  )
    return true;
  if (
    (channelOrientationCode1 === 'E' || channelOrientationCode1 === '2') &&
    (channelOrientationCode2 === 'E' || channelOrientationCode2 === '2')
  )
    return true;
  if (
    (channelOrientationCode1 === 'N' || channelOrientationCode1 === '1') &&
    (channelOrientationCode2 === 'N' || channelOrientationCode2 === '1')
  )
    return true;

  return false;
}

/**
 * Helper function for {@link validateChannels}. Finds incompatible channel fields for
 * event beaming and fk spectra computation
 * @param selectedChannels channels to validate
 * @param angleTolerance tolerance for the orientation angle
 * @param orientationAngles orientation angle to validate against
 * @returns string: boolean record of error fields where 'true' denotes error
 */
export function findIncompatibleChannels(
  selectedChannels: ChannelTypes.Channel[],
  angleTolerance: number,
  orientationAngles: ChannelTypes.OrientationAngles
): Record<string, boolean> {
  const channelErrorFields: Record<string, boolean> = {};

  selectedChannels.forEach(channel => {
    if (channel.units !== selectedChannels[0].units) {
      channelErrorFields.units = true;
    }
    if (channel.channelBandType !== selectedChannels[0].channelBandType) {
      channelErrorFields.channelBandType = true;
    }
    if (channel.channelInstrumentType !== selectedChannels[0].channelInstrumentType) {
      channelErrorFields.channelInstrumentType = true;
    }

    if (
      channel.channelOrientationCode === 'unknown' ||
      !areOrientationCodesCompatible(
        selectedChannels[0].channelOrientationCode,
        channel.channelOrientationCode
      )
    ) {
      channelErrorFields.channelOrientationCode = true;
    }

    if (
      !validateAngle(
        channel.orientationAngles?.verticalAngleDeg,
        orientationAngles.verticalAngleDeg,
        angleTolerance
      )
    ) {
      channelErrorFields.verticalAngleDeg = true;
    }

    if (
      !validateAngle(
        channel.orientationAngles?.horizontalAngleDeg,
        orientationAngles.horizontalAngleDeg,
        angleTolerance
      )
    ) {
      channelErrorFields.horizontalAngleDeg = true;
    }
  });

  return channelErrorFields;
}

/**
 * Helper function for {@link validateChannels}, assembles an error message out
 * of a given record of error fields
 */
function buildChannelErrorMessage(
  channel: ChannelTypes.Channel,
  channelErrorFields: Record<string, boolean>
): string {
  let errorMessage = `${channel.name} (`;

  if (channelErrorFields.channelBandType) {
    errorMessage = errorMessage.concat(`band type: ${channel.channelBandType} `);
  }
  if (channelErrorFields.channelInstrumentType) {
    errorMessage = errorMessage.concat(`instrument type: ${channel.channelInstrumentType} `);
  }
  if (channelErrorFields.units) {
    errorMessage = errorMessage.concat(`units: ${channel.units} `);
  }
  if (channelErrorFields.channelOrientationCode) {
    errorMessage = errorMessage.concat(`orientation code: ${channel.channelOrientationCode} `);
  }
  if (channelErrorFields.horizontalAngleDeg) {
    errorMessage = errorMessage.concat(
      `horizontal angle: ${channel.orientationAngles?.horizontalAngleDeg} `
    );
  }
  if (channelErrorFields.verticalAngleDeg) {
    errorMessage = errorMessage.concat(
      `vertical angle: ${channel.orientationAngles?.verticalAngleDeg} `
    );
  }

  errorMessage = errorMessage.concat(')');
  return errorMessage;
}

/**
 * helper function to validate sample rate and build the error messages
 * @param baseComparisons Object containing the base values to be compared against
 * @param channels List of channels to compare against the base value
 * @param stationName Name of station
 */
export function validateChannels(
  /** Base values to compare against */
  baseComparisons: BaseChannelComparison,
  channels: ChannelTypes.Channel[],
  stationName: string
): asserts channels is ChannelTypes.Channel[] {
  const channelsOutOfTolerance = channels.filter(
    channel =>
      channel.nominalSampleRateHz === undefined ||
      channel.nominalSampleRateHz <
        baseComparisons.sampleRateHz - baseComparisons.sampleRateToleranceHz ||
      channel.nominalSampleRateHz >
        baseComparisons.sampleRateHz + baseComparisons.sampleRateToleranceHz
  );

  if (channelsOutOfTolerance.length > 0) {
    let channelString = '';
    channelsOutOfTolerance.forEach((channel, index) => {
      if (index > 0) {
        channelString = channelString.concat(', ');
      }
      channelString = channelString.concat(`${channel.name} (${channel.nominalSampleRateHz})`);
    });

    throw new InvalidChannelsError(
      `Incompatible channels for ${stationName}`,
      `Sample rates outside of tolerance (${baseComparisons.sampleRateHz.toFixed(3)}+/-${
        baseComparisons.sampleRateToleranceHz
      } hz): ${channelString}.`,
      baseComparisons,
      channels,
      stationName
    );
  }
  const channelErrorFields = findIncompatibleChannels(
    channels,
    baseComparisons.orientationAngleToleranceDeg,
    baseComparisons.orientationAngles
  );

  // if no error fields are found return null
  if (Object.entries(channelErrorFields).length > 0) {
    // build the error message showing all fields in error on all channels
    let details = `Inconsistent types of ground motion: `;

    channels.forEach((channel, index) => {
      if (index > 0) {
        details = details.concat(', ');
      }
      details = details.concat(buildChannelErrorMessage(channel, channelErrorFields));
    });

    throw new InvalidChannelsError(
      `Incompatible channels for ${stationName}`,
      details,
      baseComparisons,
      channels,
      stationName
    );
  }
}
