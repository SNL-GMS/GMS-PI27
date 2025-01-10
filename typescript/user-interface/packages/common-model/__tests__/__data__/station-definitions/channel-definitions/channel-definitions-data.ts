import { Units } from '../../../../src/ts/common/types';
import type { VersionReference } from '../../../../src/ts/faceted';
import type {
  Channel,
  ChannelGroup
} from '../../../../src/ts/station-definitions/channel-definitions/channel-definitions';
import {
  ChannelBandType,
  ChannelInstrumentType,
  ChannelOrientationType
} from '../../../../src/ts/station-definitions/channel-definitions/channel-definitions';
import { ChannelDataType, ChannelGroupType } from '../../../../src/ts/station-processing/types';

export const PD01Channel: Channel = {
  name: 'PDAR.PD01.SHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  effectiveForRequestTime: 1636503405,
  canonicalName: 'PDAR.PD01.SHZ',
  description:
    'Raw Channel created from ReferenceChannel 2fabc2d3-858b-3e85-9f47-e2ee72060f0b with version d767395c-850e-36f8-a6f2-a1c7398440e4',
  station: { name: 'PDAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.SHORT_PERIOD,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.VERTICAL,
  channelOrientationCode: 'Z',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 20,
  location: {
    latitudeDegrees: 42.7765,
    longitudeDegrees: -109.58314,
    depthKm: 0.0381,
    elevationKm: 2.192
  },
  orientationAngles: {
    horizontalAngleDeg: -1,
    verticalAngleDeg: 0
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'PD01'
  }
};

export const PD02Channel: Channel = {
  name: 'PDAR.PD02.SHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  effectiveForRequestTime: 1636503405,
  canonicalName: 'PDAR.PD02.SHZ',
  description:
    'Raw Channel created from ReferenceChannel 04abdfb2-0fac-37cd-8b9e-18a997362ea6 with version d621a702-3f21-34ba-8bae-fd242438152b',
  station: { name: 'PDAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.SHORT_PERIOD,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.VERTICAL,
  channelOrientationCode: 'Z',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 20,
  location: {
    latitudeDegrees: 42.77818,
    longitudeDegrees: -109.5663,
    depthKm: 0.0381,
    elevationKm: 2.207
  },
  orientationAngles: {
    horizontalAngleDeg: -1,
    verticalAngleDeg: 0
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'PD02'
  }
};

export const PD03Channel: Channel = {
  name: 'PDAR.PD03.SHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'PDAR.PD03.SHZ',
  description:
    'Raw Channel created from ReferenceChannel a8c4a1f5-ff8c-330d-8e83-cb07b88da81f with version 11105cfd-4a56-38f6-82b4-0c56caec0057',
  station: { name: 'PDAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.SHORT_PERIOD,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.VERTICAL,
  channelOrientationCode: 'Z',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 20,
  location: {
    latitudeDegrees: 42.77582,
    longitudeDegrees: -109.5495,
    depthKm: 0.0381,
    elevationKm: 2.286
  },
  orientationAngles: {
    horizontalAngleDeg: -1,
    verticalAngleDeg: 0
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'PD03'
  }
};

export const PD31EChannel: Channel = {
  name: 'PDAR.PD31.BHE',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'PDAR.PD31.BHE',
  description: 'PDAR PD31 East Channel',
  station: { name: 'PDAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.SHORT_PERIOD,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.VERTICAL,
  channelOrientationCode: 'E',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 40,
  location: {
    latitudeDegrees: 42.77582,
    longitudeDegrees: -109.5495,
    depthKm: 0.046,
    elevationKm: 2.213
  },
  orientationAngles: {
    horizontalAngleDeg: -1,
    verticalAngleDeg: 0
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'PD31'
  }
};

export const PD31NChannel: Channel = {
  name: 'PDAR.PD31.BHN',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'PDAR.PD31.BHN',
  description: 'PDAR PD31 North Channel',
  station: { name: 'PDAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.SHORT_PERIOD,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.VERTICAL,
  channelOrientationCode: 'N',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 40,
  location: {
    latitudeDegrees: 42.77582,
    longitudeDegrees: -109.5495,
    depthKm: 0.046,
    elevationKm: 2.213
  },
  orientationAngles: {
    horizontalAngleDeg: -1,
    verticalAngleDeg: 0
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'PD31'
  }
};

export const PD01ChannelGroup: ChannelGroup = {
  name: 'PD01',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  description: 'Pinedale,_Wyoming:_USA_array_element',
  location: {
    latitudeDegrees: 42.7765,
    longitudeDegrees: -109.58314,
    depthKm: 0,
    elevationKm: 2.192
  },
  type: ChannelGroupType.SITE_GROUP,
  channels: [PD01Channel]
};

export const PD02ChannelGroup: ChannelGroup = {
  name: 'PD02',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  description: 'Pinedale,_Wyoming:_USA_array_element',
  location: {
    latitudeDegrees: 42.77818,
    longitudeDegrees: -109.5663,
    depthKm: 0,
    elevationKm: 2.207
  },
  type: ChannelGroupType.SITE_GROUP,
  channels: [PD02Channel]
};

export const PD03ChannelGroup: ChannelGroup = {
  name: 'PD03',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  description: 'Pinedale,_Wyoming:_USA_array_element',
  location: {
    latitudeDegrees: 42.77582,
    longitudeDegrees: -109.5495,
    depthKm: 0,
    elevationKm: 2.286
  },
  type: ChannelGroupType.SITE_GROUP,
  channels: [PD03Channel]
};

export const PD31ChannelGroup: ChannelGroup = {
  name: 'PD31',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  description: 'Pinedale,_Wyoming:_USA_array_element',
  location: {
    latitudeDegrees: 42.77582,
    longitudeDegrees: -109.5495,
    depthKm: 0,
    elevationKm: 2.215
  },
  type: ChannelGroupType.SITE_GROUP,
  channels: [PD31EChannel, PD31NChannel]
};

export const akasgBHEChannel: Channel = {
  name: 'AKASG.AKBB.BHE',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'AKASG.AKBB.BHE',
  description:
    'Raw Channel created from ReferenceChannel 55ec5a5c-0280-3d57-9128-87dce456e38b with version 2b8715d3-f39b-3a36-adff-6ec262f565d1',
  station: { name: 'AKASG' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.HIGH_BROADBAND,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.EAST_WEST,
  channelOrientationCode: 'E',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 100,
  location: {
    latitudeDegrees: 50.7012,
    longitudeDegrees: 29.2242,
    depthKm: 0.035,
    elevationKm: 0.16
  },
  orientationAngles: {
    horizontalAngleDeg: 90,
    verticalAngleDeg: 90
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'AKBB'
  }
};

export const akasgBHZChannel: Channel = {
  name: 'AKASG.AKASG.BHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'AKASG.AKASG.BHZ',
  description:
    'Raw Channel created from ReferenceChannel fa098cdc-0f58-30bd-88fa-faadaf40b671 with version 4a7ac51e-d21d-3443-883a-f1f444f08d16',
  station: { name: 'AKASG' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.HIGH_BROADBAND,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.VERTICAL,
  channelOrientationCode: 'Z',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 40,
  location: {
    latitudeDegrees: 50.7012,
    longitudeDegrees: 29.2242,
    depthKm: 0.035,
    elevationKm: 0.16
  },
  orientationAngles: {
    horizontalAngleDeg: -1,
    verticalAngleDeg: 0
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'AKBB'
  }
};
export const akasgBHNChannel: Channel = {
  name: 'AKASG.AKASG.BHN',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'AKASG.AKASG.BHN',
  description:
    'Raw Channel created from ReferenceChannel 8bd585b9-7795-3d62-965f-bb0e9b965b65 with version 39f21caf-a86a-3c24-94c0-994c9b89b98a',
  station: { name: 'AKASG' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.HIGH_BROADBAND,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.NORTH_SOUTH,
  channelOrientationCode: 'N',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 40,
  location: {
    latitudeDegrees: 50.7012,
    longitudeDegrees: 29.2242,
    depthKm: 0.035,
    elevationKm: 0.16
  },
  orientationAngles: {
    horizontalAngleDeg: 0,
    verticalAngleDeg: 90
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'AKBB'
  }
};

export const akasgChannelGroup: ChannelGroup = {
  name: 'AKASG',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  description: 'MALIN_ARRAY,_Ukraine',
  location: {
    latitudeDegrees: 50.6911,
    longitudeDegrees: 29.2131,
    depthKm: 0.037,
    elevationKm: 0.16
  },
  type: ChannelGroupType.SITE_GROUP,
  channels: [akasgBHEChannel, akasgBHNChannel, akasgBHZChannel]
};

export const asarAS01Channel: Channel = {
  name: 'ASAR.AS01.SHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'ASAR.AS01.SHZ',
  description:
    'Raw Channel created from ReferenceChannel 55ec5a5c-0280-3d57-9128-87dce456e38b with version 2b8715d3-f39b-3a36-adff-6ec262f565d1',
  station: { name: 'ASAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.HIGH_BROADBAND,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.EAST_WEST,
  channelOrientationCode: 'E',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 100,
  location: {
    latitudeDegrees: 37.53,
    longitudeDegrees: 71.66,
    depthKm: 0,
    elevationKm: 2.312
  },
  orientationAngles: {
    horizontalAngleDeg: 90,
    verticalAngleDeg: 90
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'ASAR'
  }
};

export const asarAS02Channel: Channel = {
  name: 'ASAR.AS02.SHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'ASAR.AS01.SHZ',
  description:
    'Raw Channel created from ReferenceChannel 55ec5a5c-0280-3d57-9128-87dce456e38b with version 2b8715d3-f39b-3a36-adff-6ec262f565d1',
  station: { name: 'ASAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.HIGH_BROADBAND,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.EAST_WEST,
  channelOrientationCode: 'E',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 100,
  location: {
    latitudeDegrees: 37.53,
    longitudeDegrees: 71.66,
    depthKm: 0,
    elevationKm: 2.312
  },
  orientationAngles: {
    horizontalAngleDeg: 90,
    verticalAngleDeg: 90
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'ASAR'
  }
};
export const asarAS03Channel: Channel = {
  name: 'ASAR.AS03.SHZ',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  canonicalName: 'ASAR.AS01.SHZ',
  description:
    'Raw Channel created from ReferenceChannel 55ec5a5c-0280-3d57-9128-87dce456e38b with version 2b8715d3-f39b-3a36-adff-6ec262f565d1',
  station: { name: 'ASAR' },
  channelDataType: ChannelDataType.SEISMIC,
  channelBandType: ChannelBandType.HIGH_BROADBAND,
  channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
  channelOrientationType: ChannelOrientationType.EAST_WEST,
  channelOrientationCode: 'E',
  units: Units.NANOMETERS_PER_COUNT,
  nominalSampleRateHz: 100,
  location: {
    latitudeDegrees: 37.53,
    longitudeDegrees: 71.66,
    depthKm: 0,
    elevationKm: 2.312
  },
  orientationAngles: {
    horizontalAngleDeg: 90,
    verticalAngleDeg: 90
  },
  configuredInputs: [],
  processingDefinition: {},
  processingMetadata: {
    CHANNEL_GROUP: 'ASAR'
  }
};

export const asarChannelGroup: ChannelGroup = {
  name: 'ASAR',
  effectiveUntil: 1660701599.984,
  effectiveAt: 1636503404,
  description: 'ASAR Channel',
  location: {
    latitudeDegrees: 37.53,
    longitudeDegrees: 71.66,
    depthKm: 0,
    elevationKm: 2.312
  },
  type: ChannelGroupType.SITE_GROUP,
  channels: [asarAS01Channel, asarAS02Channel, asarAS03Channel]
};

export const PD01ChannelVersionReference: VersionReference<'name'> = {
  name: PD01Channel.name,
  effectiveAt: PD01Channel.effectiveAt
};

export const PD02ChannelVersionReference: VersionReference<'name'> = {
  name: PD02Channel.name,
  effectiveAt: PD02Channel.effectiveAt
};

export const PD03ChannelVersionReference: VersionReference<'name'> = {
  name: PD03Channel.name,
  effectiveAt: PD03Channel.effectiveAt
};

export const allRawChannels = [
  PD01Channel,
  PD02Channel,
  PD03Channel,
  asarAS01Channel,
  asarAS02Channel,
  asarAS03Channel,
  akasgBHEChannel,
  akasgBHNChannel,
  akasgBHZChannel
];

export const allSHZRawChannels = [
  PD01Channel,
  PD02Channel,
  PD03Channel,
  asarAS01Channel,
  asarAS02Channel,
  asarAS03Channel
];

export const allSHZPdarRawChannels = [PD01Channel, PD02Channel, PD03Channel];
