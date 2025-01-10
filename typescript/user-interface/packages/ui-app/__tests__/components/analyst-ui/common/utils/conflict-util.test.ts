import {
  eventData,
  eventData2,
  openIntervalName,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { AssociationConflictRecord } from '@gms/ui-state';

import {
  getConflictedEventsForSD,
  getConflictedSDsForEvent
} from '../../../../../src/ts/components/analyst-ui/common/utils/conflicts-utils';

describe('Conflict utils', () => {
  const eventsInInterval = [eventData, eventData2];
  const signalDetectionsInInterval = signalDetectionsData;
  const allConflicts: AssociationConflictRecord = {
    [signalDetectionsData[0].id]: {
      signalDetectionHypothesisId: signalDetectionsData[0].signalDetectionHypotheses[0].id,
      eventHypothesisIds: eventData.eventHypotheses.map(e => e.id)
    }
  };
  describe('getConflictedEventsForSD', () => {
    it('returns a list of EventInConflictInfo objects', () => {
      const result = getConflictedEventsForSD(
        eventsInInterval,
        allConflicts,
        openIntervalName,
        signalDetectionsData[0].id
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('returns an empty array when input events are undefined', () => {
      const result = getConflictedEventsForSD(
        undefined,
        allConflicts,
        openIntervalName,
        signalDetectionsData[0].id
      );
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('returns an empty array when SD does not have conflicts', () => {
      const result = getConflictedEventsForSD(
        eventsInInterval,
        allConflicts,
        openIntervalName,
        'someOtherSdId'
      );
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  describe('getConflictedSDsForEvent', () => {
    it('returns a list of SDInConflictInfo objects', () => {
      const result = getConflictedSDsForEvent(
        signalDetectionsInInterval,
        eventsInInterval,
        allConflicts,
        openIntervalName,
        eventData.id
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('returns an empty array when input signal detections is an empty array', () => {
      const result = getConflictedSDsForEvent(
        [],
        eventsInInterval,
        allConflicts,
        openIntervalName,
        eventData.id
      );
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('returns an empty array when input events are undefined', () => {
      const result = getConflictedSDsForEvent(
        signalDetectionsInInterval,
        undefined,
        allConflicts,
        openIntervalName,
        eventData.id
      );
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('returns an empty array when event does not have conflicts', () => {
      const result = getConflictedSDsForEvent(
        signalDetectionsInInterval,
        eventsInInterval,
        allConflicts,
        openIntervalName,
        'someOtherEventId'
      );
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });
});
