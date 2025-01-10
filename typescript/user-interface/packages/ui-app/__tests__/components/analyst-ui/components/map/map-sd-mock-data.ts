import { SignalDetectionTypes } from '@gms/common-model';

import { EventFilterOptions } from '~analyst-ui/components/events/types';
import type { MapSDEntityPropertyBagDefinitions } from '~analyst-ui/components/map/types';

export const mockSd: MapSDEntityPropertyBagDefinitions = {
  id: '1c92ac77-c01b-3f96-b64e-f0d73df0d977',
  type: 'Signal detection',
  isSelectedOrActionTarget: true,
  detectionTime: {
    detectionTimeValue: '2022-05-19 05:10:00.000',
    detectionTimeUncertainty: 0.12
  },
  azimuth: {
    azimuthValue: 220.33629,
    azimuthUncertainty: 0.12
  },
  slowness: {
    slownessValue: 26.793263,
    slownessUncertainty: 0.0005
  },
  phaseValue: {
    value: 'Pn',
    referenceTime: 1546711499.4,
    confidence: 0.75
  },
  associatedEventTimeValue: '2022-05-19 05:10:00.000',
  signalDetectionBaseColor: '#FFFFFF33',
  associated: true,
  status: SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED,
  edgeSDType: EventFilterOptions.BEFORE,
  stationName: 'AAA',
  deleted: false
};

export const mockDeletedSd: MapSDEntityPropertyBagDefinitions = {
  id: '1c92ac77-c01b-3f96-b64e-f0d73df0d977',
  type: 'Signal detection',
  isSelectedOrActionTarget: true,
  detectionTime: {
    detectionTimeValue: '2022-05-19 05:10:00.000',
    detectionTimeUncertainty: 0.12
  },
  azimuth: {
    azimuthValue: 220.33629,
    azimuthUncertainty: 0.12
  },
  slowness: {
    slownessValue: 26.793263,
    slownessUncertainty: 0.0005
  },
  phaseValue: {
    value: 'Pn',
    referenceTime: 1546711499.4,
    confidence: 0.75
  },
  associatedEventTimeValue: '2022-05-19 05:10:00.000',
  signalDetectionBaseColor: '#FFFFFF33',
  associated: true,
  status: SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED,
  edgeSDType: EventFilterOptions.BEFORE,
  stationName: 'AAA',
  deleted: true
};

export const mockEmptySd: MapSDEntityPropertyBagDefinitions = {
  id: '1c92ac77-c01b-3f96-b64e-f0d73df0d977',
  type: 'Signal detection',
  isSelectedOrActionTarget: true,
  detectionTime: undefined,
  azimuth: undefined,
  slowness: undefined,
  phaseValue: undefined,
  associatedEventTimeValue: undefined,
  signalDetectionBaseColor: undefined,
  associated: undefined,
  status: undefined,
  edgeSDType: undefined,
  stationName: undefined,
  deleted: false
};
