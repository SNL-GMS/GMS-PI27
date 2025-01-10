import type {
  BeamformingTemplateTypes,
  ChannelTypes,
  FilterTypes,
  FkTypes,
  ProcessingMaskDefinitionTypes,
  RotationTypes,
  StationTypes,
  TypeUtil
} from '@gms/common-model';
import { ArrayUtil, CommonTypes, FacetedTypes } from '@gms/common-model';
import {
  ChannelBandType,
  ChannelInstrumentType,
  ChannelOrientationType
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import {
  batchAndDefer,
  Logger,
  recordHasStringOrNumberKeys,
  sortRecordByKeys
} from '@gms/common-util';
import type { ExtraOptions } from '@gms/ui-workers';
import {
  axiosBaseQuery,
  deserializeTypeTransformer,
  serializeTypeTransformer
} from '@gms/ui-workers';
import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query';

import { config } from '../api/system-event-gateway/endpoint-configuration';
import { CANCELED } from '../query';
import {
  buildBeamedChannelDescription,
  buildBeamedChannelName,
  buildConfiguredInputs,
  buildConfiguredInputsFromStation,
  buildFilteredChannelName,
  buildFkChannelDescription,
  buildFkChannelName,
  buildMaskedChannelName,
  buildProcessingMetadataForFilteredChannel,
  buildRotatedChannelDescription,
  buildRotatedChannelName,
  buildTemporaryChannelName,
  channelOrientationTypeToCode,
  getChannelDataTypeFromStation,
  getChannelNameComponents,
  stripNullishValuesFromHashableChannel
} from './channel-factory-util';

const logger = Logger.create('GMS_LOG_CHANNEL_FACTORY', process.env.GMS_LOG_CHANNEL_FACTORY);

/**
 * Publishes the newly created derived channel.
 */
function publishDerivedChannelsCreatedEvent(channels: ChannelTypes.Channel[]) {
  const queryFn = axiosBaseQuery<ChannelTypes.Channel[]>({
    baseUrl: config.gateway.baseUrl
  });
  // Do not await the results of this publish. It will slow down a number of operations like
  // filtering, beaming and rotation.
  // ! pass {} as the second and third args because our axios request doesn't use the api or extra options
  Promise.resolve(
    queryFn(
      {
        requestConfig: {
          ...config.gateway.services.publishDerivedChannels.requestConfig,
          data: channels
        }
      },
      {} as BaseQueryApi,
      {} as ExtraOptions
    )
  ).catch(error => {
    if (error.message !== CANCELED) {
      logger.error(`Error publishing channel`, error);
    }
  });
}

export const batchPublishDerivedChannelsCreatedEvents = batchAndDefer<ChannelTypes.Channel[]>(
  publishDerivedChannelsCreatedEvent
);

/**
 * This operation creates and returns a filtered derived Channel describing the Channel
 * created by applying the provided FilterDefinition to the provided input Channel.
 * After creating the filtered Channel, this operation calls the ChannelFactory's
 * publishDerivedChannelCreatedEvent operation which publishes a DerivedChannelCreatedEvent
 * containing the new Channel.
 *
 * @param inputChannel the channel to filter
 * @param filterDefinition the filter to apply
 * @returns a derived channel that represents the new filtered channel
 */
export async function createFiltered(
  inputChannel: ChannelTypes.Channel,
  filterDefinition: FilterTypes.FilterDefinition
): Promise<ChannelTypes.Channel> {
  if (inputChannel == null) {
    throw new Error('inputChannel may not be null');
  }
  if (filterDefinition == null) {
    throw new Error('filterDefinition may not be null');
  }

  // make sure the keys are sorted so that the json string generated is deterministic
  if (!recordHasStringOrNumberKeys(filterDefinition)) {
    throw new Error('FilterDefinition type is not sortable');
  }
  const sortedFilterDef: FilterTypes.FilterDefinition = sortRecordByKeys(
    serializeTypeTransformer(filterDefinition)
  );

  const newChannel: TypeUtil.Writeable<ChannelTypes.HashableChannel> = {
    channelBandType: inputChannel.channelBandType,
    canonicalName: undefined, // set later after creating the hash
    channelOrientationCode: inputChannel.channelOrientationCode,
    configuredInputs: buildConfiguredInputs(inputChannel),
    channelDataType: inputChannel.channelDataType,
    description: `${inputChannel.description} Filtered using a ${filterDefinition.name} filter.`,
    effectiveAt: inputChannel.effectiveAt,
    effectiveForRequestTime: inputChannel.effectiveForRequestTime,
    effectiveUntil: inputChannel.effectiveUntil,
    channelInstrumentType: inputChannel.channelInstrumentType,
    location: inputChannel.location,
    name: inputChannel.name, // override later after creating the hash
    nominalSampleRateHz: inputChannel.nominalSampleRateHz,
    orientationAngles: inputChannel.orientationAngles,
    channelOrientationType: inputChannel.channelOrientationType,
    processingDefinition: sortedFilterDef,
    processingMetadata: buildProcessingMetadataForFilteredChannel(inputChannel, sortedFilterDef),
    response: undefined,
    station: FacetedTypes.convertToVersionReference(inputChannel.station, 'name'),
    units: inputChannel.units
  };

  // Build the name using the new channel, and then add that name to the new channel
  const name = await buildFilteredChannelName(newChannel, filterDefinition);
  newChannel.canonicalName = name;
  newChannel.name = name;
  return newChannel as ChannelTypes.Channel;
}

/**
 * This operation creates and returns a temporary derived Channel with defaults
 * and information from its associated station.
 *
 * @param inputStation the station used to create the new temporary channel
 * @returns a new temporary derived channel
 */
export async function createTemporary(inputStation: Station): Promise<ChannelTypes.Channel> {
  if (!inputStation) {
    throw new Error('inputStation may not be null');
  }

  const channelDataType = getChannelDataTypeFromStation(inputStation);

  if (!channelDataType) {
    throw new Error('There is no StationType to ChannelDataType map');
  }

  const temporaryChannel: TypeUtil.Writeable<ChannelTypes.HashableChannel> = {
    channelBandType: ChannelBandType.UNKNOWN,
    canonicalName: undefined, // override later after creating the hash
    channelOrientationCode: ChannelOrientationType.UNKNOWN,
    configuredInputs: buildConfiguredInputsFromStation(inputStation),
    channelDataType,
    description: `Temporary Channel for Station ${inputStation.name}.`,
    effectiveAt: inputStation.effectiveAt,
    // nulls may need to be removed (not set as null) to match backend
    // effectiveForRequestTime DOES NOT EXIST ON THE BACKEND YET
    effectiveForRequestTime: null,
    effectiveUntil: inputStation.effectiveUntil,
    channelInstrumentType: ChannelInstrumentType.UNKNOWN,
    location: inputStation.location,
    name: inputStation.name, // override later after creating the hash
    // nulls may need to be removed (not set as null) to match backend
    nominalSampleRateHz: null,
    // nulls may need to be removed (not set as null) to match backend
    orientationAngles: {
      horizontalAngleDeg: null,
      verticalAngleDeg: null
    },
    channelOrientationType: ChannelOrientationType.UNKNOWN,
    processingDefinition: {},
    processingMetadata: {},
    // nulls may need to be removed (not set as null) to match backend
    response: null,
    station: FacetedTypes.convertToVersionReference(inputStation, 'name'),
    units: CommonTypes.Units.UNITLESS
  };

  // Build the name using the new channel, and then add that name to the new channel
  const name = await buildTemporaryChannelName(temporaryChannel);
  stripNullishValuesFromHashableChannel(temporaryChannel);
  temporaryChannel.canonicalName = name;
  temporaryChannel.name = name;
  return temporaryChannel as ChannelTypes.Channel;
}

/**
 * This operation creates and returns a masked derived Channel describing the Channel
 * created by applying the provided ProcessingMaskDefinition to the provided input Channel.
 *
 * @param inputChannel
 * @param processingMaskDefinition
 * @returns masked channel
 * @throws error if input channel or processing mask definition is invalid
 */
export async function createMasked(
  inputChannel: ChannelTypes.Channel,
  processingMaskDefinition: ProcessingMaskDefinitionTypes.ProcessingMaskDefinition
): Promise<ChannelTypes.Channel> {
  if (inputChannel == null) {
    throw new Error('inputChannel may not be null');
  }
  if (processingMaskDefinition == null) {
    throw new Error('processingMaskDefinition may not be null');
  }

  // make sure the keys are sorted so that the json string generated is deterministic
  if (!recordHasStringOrNumberKeys(processingMaskDefinition)) {
    throw new Error('processingMaskDefinition type is not sortable');
  }

  const sortedProcessingMaskDef: ProcessingMaskDefinitionTypes.ProcessingMaskDefinition =
    sortRecordByKeys(deserializeTypeTransformer(processingMaskDefinition));

  const newChannel: TypeUtil.Writeable<ChannelTypes.HashableChannel> = {
    channelBandType: inputChannel.channelBandType,
    canonicalName: undefined, // set later after creating the hash
    channelOrientationCode: inputChannel.channelOrientationCode,
    configuredInputs: buildConfiguredInputs(inputChannel),
    channelDataType: inputChannel.channelDataType,
    description: `${inputChannel.description} Masked samples removed.`,
    effectiveAt: inputChannel.effectiveAt,
    effectiveForRequestTime: inputChannel.effectiveForRequestTime,
    effectiveUntil: inputChannel.effectiveUntil,
    channelInstrumentType: inputChannel.channelInstrumentType,
    location: inputChannel.location,
    name: inputChannel.name, // override later after creating the hash
    nominalSampleRateHz: inputChannel.nominalSampleRateHz,
    orientationAngles: inputChannel.orientationAngles,
    channelOrientationType: inputChannel.channelOrientationType,
    processingDefinition: sortedProcessingMaskDef,
    processingMetadata: inputChannel.processingMetadata,
    response: undefined,
    station: FacetedTypes.convertToVersionReference(inputChannel.station, 'name'),
    units: inputChannel.units
  };

  const name = await buildMaskedChannelName(inputChannel as ChannelTypes.HashableChannel);
  newChannel.canonicalName = name;
  newChannel.name = name;

  batchPublishDerivedChannelsCreatedEvents([newChannel as ChannelTypes.Channel]);

  return newChannel as ChannelTypes.Channel;
}
/**
 * This operation creates and returns a beamed derived Channel describing the Channel created by applying the provided BeamDefinition to the provided input Channels.
 * After creating the beamed Channel, this operation calls the ChannelFactory's publishDerivedChannelCreatedEvent(Channel) operation which publishes a DerivedChannelCreatedEvent containing the new Channel.
 *
 * @param inputChannels An array of channels with fully populated stations.
 * @param beamDefinition
 */
export async function createBeamed(
  inputChannels: ChannelTypes.Channel[],
  beamDefinition: BeamformingTemplateTypes.BeamDefinition,
  station: StationTypes.Station
): Promise<ChannelTypes.Channel> {
  if (inputChannels == null || inputChannels.length === 0) {
    throw new Error('inputChannels array may not be null or empty');
  }

  if (beamDefinition == null) {
    throw new Error('beamDefinition may not be null');
  }

  if (!inputChannels[0].processingMetadata) {
    throw new Error('processingMetadata must be present');
  }

  // Copy is required to prevent issue with assignment over a read only property
  const newMetaData = {
    ...inputChannels[0].processingMetadata,
    STEERING_BACK_AZIMUTH: beamDefinition.beamParameters.receiverToSourceAzimuthDeg,
    STEERING_SLOWNESS: beamDefinition.beamParameters.slownessSecPerDeg,
    BEAM_SUMMATION: beamDefinition.beamDescription.beamSummation,
    BEAM_PHASE: beamDefinition.beamDescription.phase,
    BEAM_TYPE: beamDefinition.beamDescription.beamType,
    BEAM_EVENT_HYPOTHESIS_ID: beamDefinition.beamParameters.eventHypothesis?.id,
    BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID:
      beamDefinition.beamParameters.signalDetectionHypothesis?.id,
    BEAM_LOCATION: beamDefinition.beamParameters.location,
    CHANNEL_GROUP: 'beam'
  };

  const newChannel: TypeUtil.Writeable<ChannelTypes.HashableChannel> = {
    channelBandType: inputChannels[0].channelBandType,
    canonicalName: undefined, // set later after creating the hash
    channelOrientationCode: inputChannels[0].channelOrientationCode,
    configuredInputs: inputChannels.map(ic => FacetedTypes.convertToVersionReference(ic, 'name')),
    channelDataType: inputChannels[0].channelDataType,
    description: buildBeamedChannelDescription(inputChannels, beamDefinition, station.name),
    effectiveAt: Math.max(...inputChannels.map(ic => ic.effectiveAt)),
    effectiveForRequestTime: Math.max(
      ...inputChannels.map(ic => ic.effectiveForRequestTime).filter(ArrayUtil.notEmpty)
    ),
    effectiveUntil: Math.min(...inputChannels.map(ic => ic.effectiveUntil)),
    channelInstrumentType: inputChannels[0].channelInstrumentType,
    location: station.location,
    name: inputChannels[0].name, // override later after creating the hash
    nominalSampleRateHz: beamDefinition.beamParameters.sampleRateHz,
    orientationAngles: beamDefinition.beamParameters.orientationAngles,
    channelOrientationType: inputChannels[0].channelOrientationType,
    processingDefinition: { ...beamDefinition.beamDescription, ...beamDefinition.beamParameters },
    processingMetadata: newMetaData,
    response: undefined,
    station: FacetedTypes.convertToVersionReference(station, 'name'),
    units: inputChannels[0].units
  };

  const maskedChannel = inputChannels.find(channel =>
    channel.name.includes('masked')
  ) as ChannelTypes.HashableChannel;

  const name = await buildBeamedChannelName(
    maskedChannel || (inputChannels[0] as ChannelTypes.HashableChannel),
    beamDefinition
  );
  newChannel.canonicalName = name;
  newChannel.name = name;

  batchPublishDerivedChannelsCreatedEvents([newChannel as ChannelTypes.Channel]);

  return newChannel as ChannelTypes.Channel;
}

/**
 * This operation creates and returns a FkSpectra derived Channel describing the Channel created by applying the provided FkSpecraDefinition to the provided input Channels.
 * After creating the FkSpectra Channel, this operation calls {@link publishDerivedChannelCreatedEvent} which publishes a DerivedChannelCreatedEvent containing the new Channel.
 *
 * @param inputChannels An array of channels with fully populated stations.
 * @param FkSpectraDefinition Used to populate the new channel.
 * @returns Channel derived using the provided FkSpectraDefinition
 */
export function createFkChannel(
  inputChannels: ChannelTypes.Channel[],
  fkSpectraDefinition: FkTypes.FkSpectraDefinition
): ChannelTypes.Channel {
  if (inputChannels == null || inputChannels.length === 0) {
    throw new Error('inputChannels array may not be null or empty');
  }
  if (fkSpectraDefinition == null) {
    throw new Error('fkSpectraDefinition may not be null');
  }
  if (
    FacetedTypes.isVersionReference(inputChannels[0].station, 'name') ||
    FacetedTypes.isEntityReference(inputChannels[0].station, 'name')
  ) {
    throw new Error('the first channel must have a fully populated station');
  }
  if (!inputChannels[0].processingMetadata) {
    throw new Error('processingMetadata must be present');
  }
  const station = inputChannels[0].station as Station;

  // Copy is required to prevent issue with assignment over a read only property
  const newMetaData = { ...inputChannels[0].processingMetadata, CHANNEL_GROUP: 'FK' };

  const fkChannel: TypeUtil.Writeable<ChannelTypes.HashableChannel> = {
    channelBandType: inputChannels[0].channelBandType,
    canonicalName: undefined,
    channelOrientationCode: inputChannels[0].channelOrientationCode,
    configuredInputs: inputChannels.map(channel =>
      FacetedTypes.convertToVersionReference(channel, 'name')
    ),
    channelDataType: inputChannels[0].channelDataType,
    description: buildFkChannelDescription(inputChannels, fkSpectraDefinition),
    effectiveAt: Math.max(...inputChannels.map(ic => ic.effectiveAt)),
    effectiveForRequestTime: Math.max(
      ...inputChannels.map(ic => ic.effectiveForRequestTime).filter(ArrayUtil.notEmpty)
    ),
    effectiveUntil: Math.min(...inputChannels.map(ic => ic.effectiveUntil)),
    channelInstrumentType: inputChannels[0].channelInstrumentType,
    location: station.location,
    name: undefined,
    nominalSampleRateHz: fkSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
    orientationAngles: fkSpectraDefinition.orientationAngles,
    channelOrientationType: inputChannels[0].channelOrientationType,
    processingDefinition: {
      ...fkSpectraDefinition.fkParameters,
      ...fkSpectraDefinition.orientationAngles
    },
    processingMetadata: newMetaData,
    response: undefined,
    station: FacetedTypes.convertToVersionReference(station, 'name'),
    units: CommonTypes.Units.DECIBELS
  };

  const fkChannelName = buildFkChannelName(inputChannels[0], fkSpectraDefinition);

  fkChannel.name = fkChannelName;
  fkChannel.canonicalName = fkChannelName;

  batchPublishDerivedChannelsCreatedEvents([fkChannel as ChannelTypes.Channel]);

  return fkChannel as ChannelTypes.Channel;
}

/**
 * This operation creates and returns a rotated derived Channel describing the Channel created by applying the provided rotationDefinition and orientationType.
 * After creating the rotated Channel, this operation calls the ChannelFactory's publishDerivedChannelCreatedEvent(Channel) operation which publishes a DerivedChannelCreatedEvent containing the new Channel.
 *
 * @param inputChannels the input channels that will define this rotation
 * @param rotationDefinition the definition that will be used to rotate
 * @param orientationType the orientation of the rotation
 * @returns the derived channel
 */
export async function createRotated(
  inputChannels: ChannelTypes.Channel[],
  rotationDefinition: RotationTypes.RotationDefinition,
  orientationType: ChannelOrientationType
): Promise<ChannelTypes.Channel> {
  const orientationCode = channelOrientationTypeToCode(orientationType);
  // Handle errors
  if (!inputChannels?.length) throw new Error('inputChannels array may not be null or empty');
  if (inputChannels.length < 2) throw new Error('Two or more inputChannels must be provided');
  if (inputChannels.length > 3) throw new Error('No more then three inputChannels may be provided');
  if (!rotationDefinition) throw new Error('rotationDefinition may not be null');
  if (!orientationType) throw new Error('orientationType may not be null');
  if (!inputChannels[0].processingMetadata) {
    throw new Error('processingMetadata must be present');
  }
  if (!orientationCode) {
    throw new Error('channelOrientationType may not be UNKNOWN');
  }

  const groupNameSet = new Set(
    inputChannels.map(({ name }) => {
      const { groupName } = getChannelNameComponents(name);
      return groupName;
    })
  );

  const channelGroup = groupNameSet.size === 1 ? groupNameSet.values().next().value : 'rotation';

  // Copy is required to prevent issue with assignment over a read only property
  const newMetaData = {
    ...inputChannels[0].processingMetadata,
    // Assign to the same value as the "ChannelGroup" portion of the rotated Channel object's name (could be set 'rotation')
    CHANNEL_GROUP: channelGroup,
    STEERING_BACK_AZIMUTH: rotationDefinition.rotationParameters.receiverToSourceAzimuthDeg
  };

  const newChannel: TypeUtil.Writeable<ChannelTypes.HashableChannel> = {
    channelBandType: inputChannels[0].channelBandType,
    canonicalName: undefined, // set later after creating the hash
    channelOrientationCode: orientationCode,
    configuredInputs: inputChannels.map(ic => FacetedTypes.convertToVersionReference(ic, 'name')),
    channelDataType: inputChannels[0].channelDataType,
    description: buildRotatedChannelDescription(inputChannels, rotationDefinition),
    effectiveAt: Math.max(...inputChannels.map(ic => ic.effectiveAt)),
    effectiveForRequestTime: Math.max(
      ...inputChannels.map(ic => ic.effectiveForRequestTime).filter(ArrayUtil.notEmpty)
    ),
    effectiveUntil: Math.max(...inputChannels.map(ic => ic.effectiveUntil)),
    channelInstrumentType: inputChannels[0].channelInstrumentType,
    location: rotationDefinition.rotationParameters.location,
    name: inputChannels[0].name, // override later after creating the hash
    nominalSampleRateHz: inputChannels[0].nominalSampleRateHz,
    orientationAngles: rotationDefinition.rotationParameters.orientationAngles,
    channelOrientationType: orientationType,
    processingDefinition: {
      ...rotationDefinition.rotationDescription,
      ...rotationDefinition.rotationParameters
    },
    processingMetadata: newMetaData,
    response: undefined,
    station: FacetedTypes.convertToVersionReference(inputChannels[0].station, 'name'),
    units: inputChannels[0].units
  };

  const name = await buildRotatedChannelName(inputChannels, rotationDefinition, orientationType);
  newChannel.canonicalName = name;
  newChannel.name = name;

  batchPublishDerivedChannelsCreatedEvents([newChannel as ChannelTypes.Channel]);

  return newChannel as ChannelTypes.Channel;
}
