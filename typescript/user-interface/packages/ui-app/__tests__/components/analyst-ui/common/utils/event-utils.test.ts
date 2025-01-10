import type { CommonTypes } from '@gms/common-model';
import { EventTypes, LegacyEventTypes } from '@gms/common-model';
import { eventData, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type { EventStatus } from '@gms/ui-state';
import cloneDeep from 'lodash/cloneDeep';

import {
  getDistanceToStationsForPreferredLocationSolutionId,
  isAssociatedToCurrentEventHypothesisLegacy,
  isSignalDetectionAssociated,
  isSignalDetectionCompleteAssociated,
  isSignalDetectionOpenAssociated,
  isSignalDetectionOtherAssociated
} from '../../../../../src/ts/components/analyst-ui/common/utils/event-util';
import { data } from '../../components/station-properties/mock-station-data';

describe('Event utils', () => {
  const mockOpenInterval = 'AL1';

  it('getDistanceToStationsForPreferredLocationSolutionId returns a valid distance array', () => {
    const stationLocation2: CommonTypes.Location = {
      latitudeDegrees: 2,
      longitudeDegrees: 2,
      elevationKm: 2,
      depthKm: 0
    };

    const { station } = data;
    const station2 = cloneDeep(station);
    station2.location = stationLocation2;
    const sdData = cloneDeep(signalDetectionsData);
    sdData[0].station.name = 'STA';
    const associatedEvent = cloneDeep(eventData);
    // associate  the detection to the event
    associatedEvent.eventHypotheses[0].associatedSignalDetectionHypotheses.push(
      sdData[0].signalDetectionHypotheses[0]
    );

    expect(
      getDistanceToStationsForPreferredLocationSolutionId(
        associatedEvent,
        [station, station2],
        mockOpenInterval,
        station.allRawChannels.concat(station2.allRawChannels)
      )
    ).toEqual([
      { azimuth: 275.4598095469989, distance: { degrees: 95.796, km: 10652 }, id: 'STA' },
      {
        azimuth: 275.4598095469989,
        distance: { degrees: 119.079, km: 13241 },
        id: 'BPPPP.BPP01.CNN'
      },
      {
        azimuth: 275.4598095469989,
        distance: { degrees: 119.088, km: 13242 },
        id: 'BPPPP.BPP01.BBC'
      },
      { azimuth: 167.47278987436994, distance: { degrees: 0.926, km: 103 }, id: 'STA' },
      {
        azimuth: 167.47278987436994,
        distance: { degrees: 119.079, km: 13241 },
        id: 'BPPPP.BPP01.CNN'
      },
      {
        azimuth: 167.47278987436994,
        distance: { degrees: 119.088, km: 13242 },
        id: 'BPPPP.BPP01.BBC'
      }
    ]);
  });

  it('isSignalDetectionOpenAssociated detects signal detections  associated with the open event', () => {
    const associatedEvent = cloneDeep(eventData);
    const detection = cloneDeep(signalDetectionsData[0]);
    // associate  the detection to the event
    associatedEvent.eventHypotheses[0].associatedSignalDetectionHypotheses.push(
      detection.signalDetectionHypotheses[0]
    );
    // test with open event == associatedEvent
    expect(
      isSignalDetectionOpenAssociated(
        detection,
        [associatedEvent],
        associatedEvent.id,
        mockOpenInterval
      )
    ).toBeTruthy();
    // test with open event != associatedEvent
    expect(
      isSignalDetectionOpenAssociated(
        detection,
        [associatedEvent],
        'otherEventId',
        mockOpenInterval
      )
    ).toBeFalsy();
  });

  it('isSignalDetectionCompleteAssociated detects signal detections associated with a complete event', () => {
    const eventStatuses: Record<string, EventStatus> = {};

    // test with event status == complete
    eventStatuses[eventData.id] = {
      stageId: { name: 'sample' },
      eventId: 'eventData.id',
      eventStatusInfo: {
        eventStatus: EventTypes.EventStatus.COMPLETE,
        activeAnalystIds: ['user1', 'user2']
      }
    };
    expect(
      isSignalDetectionCompleteAssociated(
        signalDetectionsData[0],
        [eventData],
        eventStatuses,
        mockOpenInterval
      )
    ).toBeTruthy();

    // test with open event != in progress

    eventStatuses[eventData.id] = {
      stageId: { name: 'sample' },
      eventId: 'eventData.id',
      eventStatusInfo: {
        eventStatus: EventTypes.EventStatus.IN_PROGRESS,
        activeAnalystIds: ['user1', 'user2']
      }
    };
    expect(
      isSignalDetectionCompleteAssociated(
        signalDetectionsData[0],
        [eventData],
        eventStatuses,
        mockOpenInterval
      )
    ).toBeFalsy();
  });

  it('isSignalDetectionOtherAssociated detects signal detections  associated with a non open event', () => {
    // test with open event == associatedEvent
    expect(
      isSignalDetectionOtherAssociated(
        signalDetectionsData[0],
        [eventData],
        eventData.id,
        mockOpenInterval
      )
    ).toBeFalsy();
    // test with open event != associatedEvent
    expect(
      isSignalDetectionOtherAssociated(
        signalDetectionsData[0],
        [eventData],
        'otherEventId',
        mockOpenInterval
      )
    ).toBeTruthy();
  });

  it('isSignalDetectionAssociated detects signal detections  associated an event', () => {
    // test with associated SD
    expect(
      isSignalDetectionAssociated(signalDetectionsData[0], [eventData], mockOpenInterval)
    ).toBeTruthy();
    // test with unassociated SD
    expect(
      isSignalDetectionAssociated(signalDetectionsData[1], [eventData], mockOpenInterval)
    ).toBeFalsy();
  });
});

describe('Determine if a signal detection is associated to a legacy event', () => {
  const nullEvent = null;
  const undefinedEvent = undefined;
  const event: LegacyEventTypes.Event = {
    id: '1',
    status: LegacyEventTypes.EventStatus.AwaitingReview,
    modified: false,
    hasConflict: false,
    currentEventHypothesis: {
      processingStage: { id: '1' },
      eventHypothesis: {
        id: '1',
        rejected: false,
        event: {
          id: '1',
          status: LegacyEventTypes.EventStatus.AwaitingReview
        },
        associationsMaxArrivalTime: 1000000,
        signalDetectionAssociations: [
          {
            id: '1',
            deleted: false,
            signalDetectionHypothesis: {
              id: '20cc9505-efe3-3068-b7d5-59196f37992c',
              deleted: false,
              parentSignalDetectionId: '0'
            },
            eventHypothesisId: '1'
          }
        ],
        locationSolutionSets: [{ id: '1', count: 1, locationSolutions: [] }],
        preferredLocationSolution: { locationSolution: undefined }
      }
    },
    conflictingSdIds: []
  };
  const signalDetectionHypothesis = signalDetectionsData[0].signalDetectionHypotheses[0];
  test('Null event', () => {
    expect(
      isAssociatedToCurrentEventHypothesisLegacy(signalDetectionHypothesis, nullEvent)
    ).toEqual(false);
  });
  test('Undefined event', () => {
    expect(
      isAssociatedToCurrentEventHypothesisLegacy(signalDetectionHypothesis, undefinedEvent)
    ).toEqual(false);
  });
  test('Non-null event', () => {
    expect(isAssociatedToCurrentEventHypothesisLegacy(signalDetectionHypothesis, event)).toEqual(
      true
    );
  });
});
