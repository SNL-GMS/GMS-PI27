import { eventData, eventData2 } from '@gms/common-model/__tests__/__data__';
import cloneDeep from 'lodash/cloneDeep';

import type { AppState } from '../../../../src/ts/app';
import { findAllAssociationEventConflicts } from '../../../../src/ts/app/api/data/event/event-conflict-middleware';
import type { AssociationConflictRecord, EventsRecord } from '../../../../src/ts/types';
import { appState } from '../../../test-util';

describe('Event Conflict Finder', () => {
  describe('exists', () => {
    it('exists', () => {
      expect(findAllAssociationEventConflicts).toBeDefined();
    });
  });

  describe('conflicts', () => {
    it('can handle no conflicts', () => {
      const openIntervalName = 'AL1';
      const expectedConflictRecord: AssociationConflictRecord = {};
      const mockAppState: AppState = cloneDeep(appState);
      const events: EventsRecord = {};
      events[eventData.id] = eventData;
      events[eventData.id] = eventData;
      mockAppState.data.events = events;
      mockAppState.app.workflow.openIntervalName = openIntervalName;
      const result = findAllAssociationEventConflicts(mockAppState);
      expect(result).toEqual(expectedConflictRecord);
    });
    it('can find all events with conflicts', () => {
      const openIntervalName = 'AL1';
      const expectedConflictRecord: AssociationConflictRecord = {
        '012de1b9-8ae3-3fd4-800d-58665c3152cc': {
          eventHypothesisIds: [
            {
              eventId: 'eventID',
              hypothesisId: 'hypothesisID'
            },
            {
              eventId: 'eventID2',
              hypothesisId: 'hypothesisID2'
            }
          ],
          signalDetectionHypothesisId: {
            id: '20cc9505-efe3-3068-b7d5-59196f37992c',
            signalDetectionId: '012de1b9-8ae3-3fd4-800d-58665c3152cc'
          }
        }
      };
      const mockAppState: AppState = cloneDeep(appState);
      const events: EventsRecord = {};
      events[eventData.id] = eventData;
      events[eventData2.id] = eventData2;
      mockAppState.data.events = events;
      mockAppState.app.workflow.openIntervalName = openIntervalName;
      const result = findAllAssociationEventConflicts(mockAppState);
      expect(result).toEqual(expectedConflictRecord);
    });
  });
});
