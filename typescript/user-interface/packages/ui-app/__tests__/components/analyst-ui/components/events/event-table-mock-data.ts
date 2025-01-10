import { EventTypes } from '@gms/common-model';
import { eventId, eventId2, location } from '@gms/common-model/__tests__/__data__';
import type { EventStatus } from '@gms/ui-state';

import type { EventRow } from '../../../../../src/ts/components/analyst-ui/components/events/types';
import { EventFilterOptions } from '../../../../../src/ts/components/analyst-ui/components/events/types';

export const dummyData: EventRow = {
  unsavedChanges: false,
  time: {
    value: location.time,
    uncertainty: 0
  },
  eventFilterOptions: [EventFilterOptions.BEFORE],
  activeAnalysts: ['Chillas', 'Echidnas', 'I&T', 'Platform', 'SMEs'],
  conflict: true,
  depthKm: {
    value: location.depthKm,
    uncertainty: 0
  },
  id: eventId,
  latitudeDegrees: location.latitudeDegrees,
  longitudeDegrees: location.longitudeDegrees,
  magnitudeMb: 5.211111111,
  magnitudeMs: 4.911111111,
  magnitudeMl: 5.011111111,
  confidenceSemiMajorAxis: 120.2511111111,
  confidenceSemiMinorAxis: 67.4111111111,
  confidenceSemiMajorTrend: 42,
  coverageSemiMajorAxis: 820.2444444444,
  coverageSemiMinorAxis: 677.4944444444,
  coverageSemiMajorTrend: 425,
  preferred: true,
  region: 'Global',
  status: EventTypes.EventStatus.IN_PROGRESS,
  isOpen: false,
  rejected: true,
  deleted: false,
  numberAssociated: 0,
  numberDefining: 0,
  observationsStandardDeviation: 0,
  isActionTarget: false,
  isUnqualifiedActionTarget: false
};

export const dummyData2: EventRow = {
  unsavedChanges: false,
  time: {
    value: location.time,
    uncertainty: 0
  },
  eventFilterOptions: [EventFilterOptions.INTERVAL],
  activeAnalysts: ['Bob', 'David', 'Bill'],
  conflict: false,
  depthKm: {
    value: location.depthKm,
    uncertainty: 0
  },
  id: eventId2,
  latitudeDegrees: location.latitudeDegrees,
  longitudeDegrees: location.longitudeDegrees,
  magnitudeMb: 5.244444444,
  magnitudeMs: 4.944444444,
  magnitudeMl: 5.044444444,
  confidenceSemiMajorAxis: 120.2511111111,
  confidenceSemiMinorAxis: 67.4111111111,
  confidenceSemiMajorTrend: 42.42,
  coverageSemiMajorAxis: 820.2444444444,
  coverageSemiMinorAxis: 677.4944444444,
  coverageSemiMajorTrend: 42.84,
  preferred: true,
  region: 'Universe',
  status: EventTypes.EventStatus.COMPLETE,
  isOpen: false,
  rejected: false,
  deleted: false,
  numberAssociated: 0,
  numberDefining: 0,
  observationsStandardDeviation: 0,
  isActionTarget: false,
  isUnqualifiedActionTarget: false
};

export const dummyData3: EventRow = {
  unsavedChanges: false,
  time: {
    value: 123456789,
    uncertainty: 0
  },
  eventFilterOptions: [EventFilterOptions.INTERVAL],
  activeAnalysts: ['Larry', 'Moe', 'Curly'],
  conflict: false,
  depthKm: {
    value: 0.544444444,
    uncertainty: 0
  },
  id: '67026c63-0a6f-4aad-b5f8-f359ccc681e5',
  latitudeDegrees: 141.41344444444,
  longitudeDegrees: 29.03644444444,
  magnitudeMb: 1.144444444,
  magnitudeMs: 1.044444444,
  magnitudeMl: 1.644444444,
  confidenceSemiMajorAxis: 120.2511111111,
  confidenceSemiMinorAxis: 67.4111111111,
  confidenceSemiMajorTrend: 234,
  coverageSemiMajorAxis: 820.2444444444,
  coverageSemiMinorAxis: 677.4944444444,
  coverageSemiMajorTrend: 98,
  preferred: true,
  region: 'Cinematic',
  status: EventTypes.EventStatus.IN_PROGRESS,
  isOpen: false,
  rejected: false,
  deleted: false,
  numberAssociated: 0,
  numberDefining: 0,
  observationsStandardDeviation: 0,
  isActionTarget: false,
  isUnqualifiedActionTarget: false
};

export const dummyData4: EventRow = {
  unsavedChanges: false,
  time: {
    value: 789456123,
    uncertainty: 0
  },
  eventFilterOptions: [EventFilterOptions.AFTER],
  activeAnalysts: [],
  conflict: false,
  depthKm: {
    value: 0.977777777,
    uncertainty: 0
  },
  id: '67026c63-0a6f-4aad-b5f8-f359ccc681e6',
  latitudeDegrees: 42.34777777777,
  longitudeDegrees: 139.03877777777,
  magnitudeMb: 6.277777777,
  magnitudeMs: 5.977777777,
  magnitudeMl: 6.077777777,
  confidenceSemiMajorAxis: 120.2511111111,
  confidenceSemiMinorAxis: 67.4111111111,
  confidenceSemiMajorTrend: 93,
  coverageSemiMajorAxis: 820.2444444444,
  coverageSemiMinorAxis: 677.4944444444,
  coverageSemiMajorTrend: 28,
  preferred: false,
  region: 'Multiverse',
  status: EventTypes.EventStatus.NOT_STARTED,
  isOpen: false,
  rejected: false,
  deleted: false,
  numberAssociated: 0,
  numberDefining: 0,
  observationsStandardDeviation: 0,
  isActionTarget: false,
  isUnqualifiedActionTarget: false
};

export const dummyEventsStatus: EventStatus = {
  stageId: { name: 'sample' },
  eventId: 'eventData.id',
  eventStatusInfo: {
    eventStatus: EventTypes.EventStatus.COMPLETE,
    activeAnalystIds: ['user1', 'user2']
  }
};

export const eventsStatusRecord: Record<string, EventStatus> = { eventId: dummyEventsStatus };
