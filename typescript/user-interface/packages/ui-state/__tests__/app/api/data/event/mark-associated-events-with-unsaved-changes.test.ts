/* eslint-disable @typescript-eslint/no-magic-numbers */
import { eventData, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';
import produce from 'immer';

import type { AppState } from '../../../../../src/ts/app';
import { getStore } from '../../../../../src/ts/app';
import { markAssociatedEventsWithUnsavedChanges } from '../../../../../src/ts/app/api/data/event/mark-associated-events-with-unsaved-changes';

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 200
  };
});

const stageId: IntervalId = {
  definitionId: {
    name: 'test',
    effectiveTime: 100
  },
  startTime: 100
};

const username = 'user';
const preferredBy = username;

const store = getStore();
const state: AppState = {
  ...store.getState(),
  data: {
    ...store.getState().data,
    events: {
      A: {
        ...eventData,
        id: 'A',
        eventHypotheses: [
          {
            ...eventData.eventHypotheses[0],
            id: { eventId: 'A', hypothesisId: '111' },
            associatedSignalDetectionHypotheses: [{ id: { id: '111', signalDetectionId: 'A' } }]
          }
        ],
        preferredEventHypothesisByStage: [
          {
            stage: stageId.definitionId,
            preferred: { id: { eventId: 'A', hypothesisId: '111' } },
            preferredBy
          }
        ],
        _uiHasUnsavedChanges: 100
      },
      B: {
        ...eventData,
        id: 'B',
        eventHypotheses: [
          {
            ...eventData.eventHypotheses[0],
            id: { eventId: 'B', hypothesisId: '112' },
            associatedSignalDetectionHypotheses: [{ id: { id: '112', signalDetectionId: 'B' } }]
          }
        ],
        preferredEventHypothesisByStage: [
          {
            stage: stageId.definitionId,
            preferred: { id: { eventId: 'B', hypothesisId: '112' } },
            preferredBy
          }
        ],
        _uiHasUnsavedChanges: undefined
      }
    },
    signalDetections: {
      A: {
        ...signalDetectionsData[0],
        id: 'A',
        signalDetectionHypotheses: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0],
            id: { id: '111', signalDetectionId: 'A' }
          }
        ]
      },
      B: {
        ...signalDetectionsData[0],
        id: 'B',
        signalDetectionHypotheses: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0],
            id: { id: '112', signalDetectionId: 'B' }
          }
        ]
      }
    }
  }
};

describe('mark associated events with unsaved changes', () => {
  it('exists', () => {
    expect(markAssociatedEventsWithUnsavedChanges).toBeDefined();
  });

  it('mark associated events', () => {
    expect(Object.values(state.data.events)[0]._uiHasUnsavedChanges).toEqual(100);
    expect(Object.values(state.data.events)[1]._uiHasUnsavedChanges).toEqual(undefined);

    const updatedEvents = produce(Object.values(state.data.events), draft => {
      markAssociatedEventsWithUnsavedChanges(
        stageId.definitionId.name,
        state.data.signalDetections.A.signalDetectionHypotheses[0],
        draft
      );
    });

    expect(updatedEvents[0]._uiHasUnsavedChanges).toEqual(200);
    expect(updatedEvents[1]._uiHasUnsavedChanges).toEqual(undefined);
  });

  it('throw if event does not have working hypothesis', () => {
    expect(Object.values(state.data.events)[0]._uiHasUnsavedChanges).toEqual(100);
    expect(Object.values(state.data.events)[1]._uiHasUnsavedChanges).toEqual(undefined);

    expect(() => {
      produce(Object.values(state.data.events), draft => {
        markAssociatedEventsWithUnsavedChanges(
          stageId.definitionId.name,
          state.data.signalDetections.B.signalDetectionHypotheses[1],
          draft
        );
      });
    }).toThrow();
  });
});
