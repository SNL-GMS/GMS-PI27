import type { ChannelSegmentTypes, FacetedTypes, FilterTypes, FkTypes } from '@gms/common-model';
import {
  ChannelTypes,
  isEntityReference,
  isVersionReference,
  StationTypes
} from '@gms/common-model';
import type { BeamDefinition } from '@gms/common-model/lib/beamforming-templates/types';
import type { RotationDefinition } from '@gms/common-model/lib/rotation/types';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import { setDecimalPrecision, toOSDTime } from '@gms/common-util';
import { digestMessageSHA256, UILogger } from '@gms/ui-util';
import cloneDeep from 'lodash/cloneDeep';

import type { ChannelRecord } from '../../types';

const logger = UILogger.create('GMS_CHANNEL_FACTORY_UTIL', process.env.GMS_CHANNEL_FACTORY_UTIL);

/**
 * Build a sorted array from channel param records. Used to generate channel name hashes.
 *
 * @param r the Record to be parsed
 * @returns a sorted array of the format [{key: value}, {key: value}, ...]
 */
export function buildSortedArrayFromRecord<T = unknown>(r: Record<string, T> | undefined) {
  if (!r) {
    return {};
  }
  return [...Object.keys(r)].sort().map(k => ({ [k]: r[k] }));
}

/**
 * Creates a filter parameter entry for a channel name.
 * Does not include the leading '/' character.
 * Replaces / characters in the filter name with | characters
 *
 * @param filterDefinition the filter to parse
 * @returns the string formatted in the format: filter,filter name
 */
export function createFilterAttributesForChannelName(
  filterDefinition: FilterTypes.FilterDefinition
) {
  if (filterDefinition?.name) {
    return `filter${ChannelTypes.ATTRIBUTE_SEPARATOR}${filterDefinition.name.replace(/\//, '|')}`;
  }
  return '';
}

/**
 * Creates the object that gets stringified for the derived channel name hash
 *
 * @param channel a channel to parse
 * @returns an object containing the channel data to be hashed
 */
export function generateChannelDataForHash(channel: ChannelTypes.HashableChannel) {
  const sortedProcessingDefinition = buildSortedArrayFromRecord(channel.processingDefinition);
  const sortedProcessingMetadata = buildSortedArrayFromRecord(channel.processingMetadata);
  const configuredInputs = [
    {
      effectiveAt: channel.effectiveAt ? toOSDTime(channel.effectiveAt) : toOSDTime(0),
      name: channel.name
    }
  ];
  return {
    channelBandType: channel.channelBandType,
    channelDataType: channel.channelDataType,
    channelInstrumentType: channel.channelInstrumentType,
    channelOrientationCode: channel.channelOrientationCode,
    channelOrientationType: channel.channelOrientationType,
    configuredInputs,
    description: channel.description,
    location: channel.location,
    nominalSampleRateHz: channel.nominalSampleRateHz,
    orientationAngles: channel.orientationAngles,
    processingDefinition: sortedProcessingDefinition,
    processingMetadata: sortedProcessingMetadata,
    response: channel.response?.id ?? null,
    station: channel.station.name,
    units: channel.units
  };
}

/**
 * Generates the JSON string used as the input for the channel name hash
 */
export function generateChannelJsonString(channel: ChannelTypes.HashableChannel): string {
  return JSON.stringify(generateChannelDataForHash(channel));
}

/**
 * Takes a channel and returns a promise for the channel name hash, using SHA256.
 * Uses a custom json property order based on architecture guidance so that the
 * front end and back end align.
 *
 * @param channel a channel to parse
 * @returns a deterministic hash based on the channel details
 */
export async function generateChannelHash(channel: ChannelTypes.HashableChannel): Promise<string> {
  const jsonStringToHash = generateChannelJsonString(channel);
  return digestMessageSHA256(jsonStringToHash);
}

/**
 * Strips the end hash from a channel name
 *
 * @param name channel name
 * @returns the channel name without the ending hash
 */
export function stripHashFromChannelName(name: string | undefined): string {
  if (!name) return '';
  // future proofing in case the COMPONENT_SEPARATOR changes, escapes the character for use in regex
  const escapedComponentSeparator = ChannelTypes.COMPONENT_SEPARATOR.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
  const stripHash = new RegExp(`${escapedComponentSeparator}[a-f0-9]{64}`);
  return name.replace(stripHash, '');
}

/**
 * Gets the three components of a standard FDSN style channel name (station.group.code)
 *
 * @param name the channel name
 * @returns an object containing the the stationName, groupName and codeName
 */
export function getChannelNameComponents(name: string): {
  stationName: string;
  groupName: string;
  codeName: string;
} {
  const strippedName = /^\w+\.\w+\.[\w-]+/.exec(name) ?? '';
  if (!strippedName) {
    logger.warn('Failed to strip channel name for channel name components composition');
  }
  const [stationName, groupName, codeName] = strippedName[0].split(
    ChannelTypes.CHANNEL_COMPONENT_SEPARATOR
  );
  return { stationName, groupName, codeName };
}

/**
 * Checks channels to see if they have the same channel code (in the format station.group.code)
 *
 * @param channelName1 the first channel name to check
 * @param channelName2 the second channel name to check
 * @returns whether the channels have the same code
 */
export function channelsHaveSameCode(channelName1: string, channelName2: string) {
  return (
    getChannelNameComponents(channelName1).codeName ===
    getChannelNameComponents(channelName2).codeName
  );
}

/**
 * Given a channelOrientationType this will return the corresponding channel code (single character)
 *
 * @param channelOrientationType the orientation type to convert
 * @returns a channel orientation code (ex: Z, N, E...)
 */
export function channelOrientationTypeToCode(
  channelOrientationType: ChannelOrientationType
): string | undefined {
  const channelOrientationTypeToChannelOrientationCode: Record<
    ChannelOrientationType,
    string | undefined
  > = {
    [ChannelOrientationType.UNKNOWN]: undefined,
    [ChannelOrientationType.VERTICAL]: 'Z',
    [ChannelOrientationType.NORTH_SOUTH]: 'N',
    [ChannelOrientationType.EAST_WEST]: 'E',
    [ChannelOrientationType.TRIAXIAL_A]: 'A',
    [ChannelOrientationType.TRIAXIAL_B]: 'B',
    [ChannelOrientationType.TRIAXIAL_C]: 'C',
    [ChannelOrientationType.TRANSVERSE]: 'T',
    [ChannelOrientationType.RADIAL]: 'R',
    [ChannelOrientationType.ORTHOGONAL_1]: '1',
    [ChannelOrientationType.ORTHOGONAL_2]: '2',
    [ChannelOrientationType.ORTHOGONAL_3]: '3',
    [ChannelOrientationType.OPTIONAL_U]: 'U',
    [ChannelOrientationType.OPTIONAL_V]: 'V',
    [ChannelOrientationType.OPTIONAL_W]: 'W'
  };

  return channelOrientationTypeToChannelOrientationCode?.[channelOrientationType];
}

/**
 * Builds a channel name for a filtered, derived channel, in the format
 * [PREVIOUS_CHANNEL_NAME_WITHOUT_HASH]/[FILTER_PROCESSING_ATTRIBUTES]/[CHANNEL_HASH]
 *
 * @param inputChannel the channel that is being named (not the old channel)
 * @param filterDefinition the filter that is being applied
 */
export async function buildFilteredChannelName(
  inputChannel: ChannelTypes.HashableChannel,
  filterDefinition: FilterTypes.FilterDefinition
): Promise<string> {
  const hash = await generateChannelHash(inputChannel);
  const channelNameWithoutHash = stripHashFromChannelName(inputChannel.name);
  return `${channelNameWithoutHash}${
    ChannelTypes.COMPONENT_SEPARATOR
  }${createFilterAttributesForChannelName(filterDefinition)}${
    ChannelTypes.COMPONENT_SEPARATOR
  }${hash}`;
}

/**
 * Builds a temporary channel name for a filtered, derived channel, in the format
 * [PREVIOUS_CHANNEL_NAME_WITHOUT_HASH]/[CHANNEL_HASH]
 *
 * @param inputChannel the channel that is being named (not the old channel)
 */
export async function buildTemporaryChannelName(
  inputChannel: ChannelTypes.HashableChannel
): Promise<string> {
  const hash = await generateChannelHash(inputChannel);
  const channelNameWithoutHash = stripHashFromChannelName(inputChannel.name);

  return `${channelNameWithoutHash}.${ChannelTypes.TEMPORARY_CHANNEL_GROUP}.${ChannelTypes.TEMPORARY_CHANNEL_CODE}${ChannelTypes.COMPONENT_SEPARATOR}${hash}`;
}

/**
 *
 * Builds a masked channel name for a masked derived channel formatted:
 * [PREVIOUS_CHANNEL_NAME_WITHOUT_HASH]/masked/[CHANNEL_HASH]
 */
export async function buildMaskedChannelName(
  inputChannel: ChannelTypes.HashableChannel
): Promise<string> {
  const hash = await generateChannelHash(inputChannel);
  const channelNameWithoutHash = stripHashFromChannelName(inputChannel.name);
  return `${channelNameWithoutHash}${ChannelTypes.COMPONENT_SEPARATOR}masked${ChannelTypes.COMPONENT_SEPARATOR}${hash}`;
}

/**
 *
 * Builds a masked channel name for a masked derived channel formatted:
 * [PREVIOUS_CHANNEL_NAME_WITHOUT_HASH]/masked/[CHANNEL_HASH]
 */
export async function buildBeamedChannelName(
  inputChannel: ChannelTypes.HashableChannel,
  beamDefinition: BeamDefinition
): Promise<string> {
  const hash = await generateChannelHash(inputChannel);
  const channelNameWithoutHash = stripHashFromChannelName(inputChannel.name);
  const channelNameComponents = channelNameWithoutHash.split(
    ChannelTypes.CHANNEL_COMPONENT_SEPARATOR
  );
  const newChannelName = `${channelNameComponents[0]}.beam.${channelNameComponents[2]}`;
  return `${newChannelName}${ChannelTypes.COMPONENT_SEPARATOR}beam${
    ChannelTypes.ATTRIBUTE_SEPARATOR
  }${beamDefinition.beamDescription.beamType.toLowerCase()}${
    ChannelTypes.ATTRIBUTE_SEPARATOR
  }${beamDefinition.beamDescription.beamSummation.toLowerCase()}${
    ChannelTypes.COMPONENT_SEPARATOR
  }steer${ChannelTypes.ATTRIBUTE_SEPARATOR}backaz_${setDecimalPrecision(
    beamDefinition.beamParameters.receiverToSourceAzimuthDeg,
    3
  )}deg${ChannelTypes.ATTRIBUTE_SEPARATOR}slow_${setDecimalPrecision(
    beamDefinition.beamParameters.slownessSecPerDeg,
    3
  )}s_per_deg${ChannelTypes.COMPONENT_SEPARATOR}${hash}`;
}

export function buildFkChannelName(
  inputChannel: ChannelTypes.Channel,
  fkSpectraDefinition: FkTypes.FkSpectraDefinition
): string {
  const channelNameWithoutHash = stripHashFromChannelName(inputChannel.name);
  const channelNameComponents = channelNameWithoutHash.split(
    ChannelTypes.CHANNEL_COMPONENT_SEPARATOR
  );
  const newChannelName = `${channelNameComponents[0]}.FK.${channelNameComponents[2]}`;

  return `${newChannelName}${ChannelTypes.COMPONENT_SEPARATOR}fk${ChannelTypes.COMPONENT_SEPARATOR}${fkSpectraDefinition.fkParameters.phase}`;
}

/**
 * Builds the description for a beamed channel based on a base channel description and a beam definition.
 *
 * @param inputChannel input channel to use the base description from
 * @param beamDefinition the beam definition to get the event id, sd id, lat/lon, azimuth,and beam summation
 * @returns channel description string
 */
export function buildBeamedChannelDescription(
  inputChannels: ChannelTypes.Channel[],
  beamDefinition: BeamDefinition,
  stationName: string
): string {
  let baseDescription = inputChannels[0].description;
  const index = inputChannels.findIndex(channel => channel.description !== baseDescription);

  if (index !== -1) {
    baseDescription = stationName;
  }

  return `${baseDescription} ${beamDefinition.beamDescription.beamType} beamed for ${
    beamDefinition.beamParameters.eventHypothesis
      ? `event ${beamDefinition.beamParameters.eventHypothesis.id.hypothesisId},`
      : ''
  } ${
    beamDefinition.beamParameters.signalDetectionHypothesis
      ? `signal detection hypothesis ${beamDefinition.beamParameters.signalDetectionHypothesis.id.id},`
      : ''
  }at location ${beamDefinition.beamParameters.location?.latitudeDegrees}/${beamDefinition
    .beamParameters.location?.longitudeDegrees} ${
    beamDefinition.beamDescription.phase
  }, back azimuth ${beamDefinition.beamParameters.receiverToSourceAzimuthDeg}deg, slowness ${
    beamDefinition.beamParameters.slownessSecPerDeg
  }sec/deg, ${beamDefinition.beamDescription.beamSummation}, ${
    beamDefinition.beamDescription.twoDimensional
  }.`;
}

/**
 * builds the description for a beamed channel based on a base channel description and a beam definition.
 *
 * @param inputChannel input channel to use the base description from
 * @param fkSpectraDefinition the fkSpectra definition to get the phaseType, frequency range, and prefilter.
 * @returns channel description string
 */
export function buildFkChannelDescription(
  inputChannels: ChannelTypes.Channel[],
  fkSpectraDefinition: FkTypes.FkSpectraDefinition
) {
  const baseDescription = inputChannels[0].description;
  const { fkParameters } = fkSpectraDefinition;

  if (
    isVersionReference(inputChannels[0].station, 'name') ||
    isEntityReference(inputChannels[0].station, 'name')
  ) {
    throw new Error('the first channel must have a fully populated station');
  }

  const station = inputChannels[0].station as Station;

  return (
    `${baseDescription} FK spectra channel, Phase ${fkParameters.phase}, ` +
    `Frequency range ${fkParameters.fkFrequencyRange.lowFrequencyHz} to ${fkParameters.fkFrequencyRange.highFrequencyHz}, ` +
    `Prefilter ${fkParameters.preFilter}, location ${station.location.latitudeDegrees}/${
      station.location.longitudeDegrees
    } elevation ${station.location.elevationKm}${
      station.location.depthKm !== undefined ? ` depth ${station.location.depthKm}` : ''
    }`
  );
}

/*
 * Builds a rotated channel name for a rotated derived channel
 *
 * @param inputChannels the input channels being rotated
 * @param rotationDefinition the rotation definition to be applied
 * @param orientationType the orientation type of the incoming operation
 * @returns the rotated channel name
 */
export async function buildRotatedChannelName(
  inputChannels: ChannelTypes.Channel[],
  rotationDefinition: RotationDefinition,
  orientationType: ChannelOrientationType
): Promise<string> {
  // Given we have several inputChannels we just pick the first
  const hash = await generateChannelHash(inputChannels[0] as ChannelTypes.HashableChannel);

  // Station: Copy from the equivalent value selected from one of the inputChannels objects.
  const stationName = inputChannels[0].station.name;
  const { codeName } = getChannelNameComponents(inputChannels[0].name);
  const groupNameSet = new Set();
  const processingAttributesSet = new Set();

  inputChannels.forEach(({ name }) => {
    const channelNameWithoutHash = stripHashFromChannelName(name);
    const processingAttributes = channelNameWithoutHash
      .split(ChannelTypes.COMPONENT_SEPARATOR)
      .slice(1)
      .join(ChannelTypes.COMPONENT_SEPARATOR);

    if (processingAttributes?.length > 0) processingAttributesSet.add(processingAttributes);

    const { groupName } = getChannelNameComponents(name);
    groupNameSet.add(groupName);
  });

  const formattedAzimuth = setDecimalPrecision(
    rotationDefinition.rotationParameters.receiverToSourceAzimuthDeg,
    3
  );

  // ChannelGroup:
  //   If all of the provided inputChannels object's have name attributes with the same ChannelGroup, then use the same value in the rotated Channel object's name.
  //   Otherwise, assign to the string "rotation".
  const channelGroup = groupNameSet.size === 1 ? groupNameSet.values().next().value : 'rotation';

  // ChannelCode:
  //   Copy the band and instrument codes from the equivalent values selected from one of the inputChannels objects.
  //   Assign the orientation code to the character representation of the provided ChannelOrientationType.
  const channelCode = `${codeName.slice(0, 2)}${channelOrientationTypeToCode(orientationType)}`;

  // Assign the "processing attributes" portion of the rotated Channel object's name as follows:
  //   If each Channel in the inputChannel collection includes the same "processing attributes" strings, append that string.
  //   Append a string with format: "/rotate/steer,backaz_{$azimuth}deg,phase_{$phase}"
  //       Use exactly three decimal places for the azimuth (e.g. use format string: %.3f).
  //       Example string to append: "/rotate/steer,backaz_12.123deg,phase_P"
  const existingProcessingAttributes =
    processingAttributesSet.size === 1
      ? `${ChannelTypes.COMPONENT_SEPARATOR}${processingAttributesSet.values().next().value}`
      : '';
  const processingAttributes = `${existingProcessingAttributes}/rotate/steer,backaz_${formattedAzimuth}deg,phase_${rotationDefinition.rotationDescription.phaseType}`;

  return `${stationName}.${channelGroup}.${channelCode}${processingAttributes}${ChannelTypes.COMPONENT_SEPARATOR}${hash}`;
}

/**
 * Builds the description for a rotated channel based on a base channels descriptions and a rotation definition.
 *
 * @param inputChannels input channels to use the names and base description from
 * @param rotationDefinition the beam definition to get the azimuth from
 * @returns channel description string
 */
export function buildRotatedChannelDescription(
  inputChannels: ChannelTypes.Channel[],
  rotationDefinition: RotationDefinition
): string {
  // Begin with a string containing a comma separated list of the inputChannel entity names, sorted alphabetically.
  const baseDescription = inputChannels
    .map(({ name }) => name)
    .sort()
    .join(',');

  /*
    If each Channel in the inputChannel collection includes the same derived Channel description strings, append those in the same order.
      For example, if each input Channel has a description string of "{raw Channel description} Masked samples removed." then append "Masked samples removed." to the rotated Channel object's description string.
      Note the intent of this step is to capture the common processing operations applied to each input Channel.
  */
  const hasMaskedSamplesRemoved = !inputChannels
    .map(({ description }) => description.indexOf('Masked samples removed.') >= 0)
    .includes(false);
  const processingOperations = hasMaskedSamplesRemoved ? ' Masked samples removed.' : '';

  // Append the string: "Rotated to {azimuth}." Use exactly three decimal places for the azimuth (e.g. use format string: %.3f).
  const formattedAzimuth = setDecimalPrecision(
    rotationDefinition.rotationParameters.receiverToSourceAzimuthDeg,
    3
  );

  return `${baseDescription}${processingOperations} Rotated to ${formattedAzimuth}.`;
}

/**
 * Builds the processing metadata entry for a derived, filtered channel
 */
export function buildProcessingMetadataForFilteredChannel(
  inputChannel: ChannelTypes.Channel,
  filterDefinition: FilterTypes.FilterDefinition
) {
  if (!inputChannel.processingMetadata) {
    throw new Error('processingMetadata must be present');
  }
  // Copy is required to prevent issue with assignment over a read only property
  const processingMetadata = cloneDeep(inputChannel.processingMetadata);
  processingMetadata.FILTER_TYPE = filterDefinition.filterDescription.filterType;
  processingMetadata.FILTER_CAUSALITY = filterDefinition.filterDescription.causal;
  return processingMetadata;
}

/**
 * @param inputChannel the source channel
 * @returns the configured inputs, consisting of a version reference of the channel in an array
 */
export function buildConfiguredInputs(
  inputChannel: ChannelTypes.Channel
): [FacetedTypes.VersionReference<'name', ChannelTypes.Channel>] {
  return [
    {
      effectiveAt: inputChannel.effectiveAt,
      name: inputChannel.name
    }
  ];
}

/**
 * Will build the channel version references from a given station's raw channels
 *
 * @param inputStation the source channel
 * @returns the configured inputs, consisting of a version reference of the channel in an array
 */
export function buildConfiguredInputsFromStation(
  inputStation: Station
): FacetedTypes.VersionReference<'name', ChannelTypes.Channel>[] {
  return inputStation.allRawChannels.map(channel => {
    return {
      effectiveAt: channel.effectiveAt,
      name: channel.name
    };
  });
}

/**
 * Gets the correct ChannelDataType for the given station
 *
 * @param station the source station
 * @returns a channel data type
 */
export function getChannelDataTypeFromStation(inputStation: Station): ChannelTypes.ChannelDataType {
  const stationDataTypeToChannelDataType = {
    [StationTypes.StationType.SEISMIC_1_COMPONENT]: ChannelTypes.ChannelDataType.SEISMIC,
    [StationTypes.StationType.SEISMIC_3_COMPONENT]: ChannelTypes.ChannelDataType.SEISMIC,
    [StationTypes.StationType.SEISMIC_ARRAY]: ChannelTypes.ChannelDataType.SEISMIC,
    [StationTypes.StationType.HYDROACOUSTIC]: ChannelTypes.ChannelDataType.HYDROACOUSTIC,
    [StationTypes.StationType.HYDROACOUSTIC_ARRAY]: ChannelTypes.ChannelDataType.HYDROACOUSTIC,
    [StationTypes.StationType.INFRASOUND]: ChannelTypes.ChannelDataType.INFRASOUND,
    [StationTypes.StationType.INFRASOUND_ARRAY]: ChannelTypes.ChannelDataType.INFRASOUND,
    [StationTypes.StationType.WEATHER]: ChannelTypes.ChannelDataType.WEATHER,
    [StationTypes.StationType.UNKNOWN]: ChannelTypes.ChannelDataType.UNKNOWN
  };

  return stationDataTypeToChannelDataType[inputStation.type];
}

/**
 * Given a the channel record and a uiChannelSegment this will return the the associated channel, or undefined if not found
 *
 * @param channelsRecord channels to search
 * @param uiChannelSegment the source uiChannelSegment
 * @returns the unfiltered or filtered channel
 */
export const getMeasuredChannel = (
  channelsRecord: ChannelRecord,
  channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined
) => {
  if (
    !channelSegmentDescriptor ||
    channelsRecord[channelSegmentDescriptor.channel.name] === undefined
  ) {
    logger.warn(
      `getMeasuredChannel could not find measured channel for ${JSON.stringify(
        channelSegmentDescriptor
      )} in channel record`
    );
    return undefined;
  }
  return channelsRecord[channelSegmentDescriptor.channel.name];
};

/**
 * Takes a hashable channel with requisite undefined and null fields matching backend
 * Returns same hashable channel with those fields stripped out
 * Uses param reassignment to avoid copying entire object
 *
 * @param channel the hashable channel
 */
export const stripNullishValuesFromHashableChannel = (channel: ChannelTypes.HashableChannel) => {
  // eslint-disable-next-line no-param-reassign
  Object.keys(channel).forEach(k => channel[k] == null && delete channel[k]);
};
