import { EventTypes } from '@gms/common-model';
import { eventData, openIntervalName } from '@gms/common-model/__tests__/__data__';
import type { EventStatus } from '@gms/ui-state';

import { buildEventRow } from '../../../../../src/ts/components/analyst-ui/components/events/events-util';

describe('Events util', () => {
  const eventStatuses: Record<string, EventStatus> = {};
  eventStatuses[eventData.id] = {
    stageId: { name: openIntervalName },
    eventId: eventData.id,
    eventStatusInfo: {
      eventStatus: EventTypes.EventStatus.IN_PROGRESS,
      activeAnalystIds: ['user1', 'user2']
    }
  };
  it('builds a row correctly', () => {
    expect(
      buildEventRow(
        {
          event: eventData,
          eventStatus: eventStatuses[eventData.id],
          eventIsOpen: false,
          eventInConflict: false,
          eventIsActionTarget: false
        },
        openIntervalName,
        { startTimeSecs: 0, endTimeSecs: 100 },
        null
      )
    ).toMatchInlineSnapshot(`
      {
        "activeAnalysts": [
          "user1",
          "user2",
        ],
        "confidenceSemiMajorAxis": undefined,
        "confidenceSemiMajorTrend": undefined,
        "confidenceSemiMinorAxis": undefined,
        "conflict": false,
        "coverageSemiMajorAxis": undefined,
        "coverageSemiMajorTrend": undefined,
        "coverageSemiMinorAxis": undefined,
        "deleted": false,
        "depthKm": {
          "uncertainty": null,
          "value": 3.3,
        },
        "eventFilterOptions": [
          "After",
        ],
        "id": "eventID",
        "isActionTarget": false,
        "isOpen": false,
        "isUnqualifiedActionTarget": false,
        "latitudeDegrees": 1.1,
        "longitudeDegrees": 2.2,
        "magnitudeMb": 1.2,
        "magnitudeMl": undefined,
        "magnitudeMs": undefined,
        "numberAssociated": 1,
        "numberDefining": 0,
        "observationsStandardDeviation": undefined,
        "preferred": true,
        "region": "TBD",
        "rejected": false,
        "status": "IN_PROGRESS",
        "time": {
          "uncertainty": null,
          "value": 3600,
        },
        "unsavedChanges": false,
      }
    `);
  });
});
