import { eventData, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../../../../../src/ts/app/api';
import type { duplicateEvents } from '../../../../../src/ts/app/api/data/event/duplicate-events';
import {
  duplicateEventsAction,
  duplicateEventsReducer
} from '../../../../../src/ts/app/api/data/event/duplicate-events';

jest.mock('@gms/common-model/lib/signal-detection/util', () => {
  const actual = jest.requireActual('@gms/common-model/lib/signal-detection/util');
  return {
    ...actual,
    getCurrentHypothesis: jest.fn().mockReturnValue({
      id: {
        id: '20cc9505-efe3-3068-b7d5-59196f37992c',
        signalDetectionId: '012de1b9-8ae3-3fd4-800d-58123c3152cc'
      }
    })
  };
});

jest.mock('@gms/common-model/lib/event/util', () => {
  const actual = jest.requireActual('@gms/common-model/lib/event/util');
  const mockPreferredEventHypothesisByStage = {
    associatedSignalDetectionHypotheses: [
      {
        id: {
          id: 'already-associated-value',
          signalDetectionId: '012de1b9-8ae3-3fd4-800d-58123c3152cc'
        }
      }
    ],
    id: {
      eventId: 'eventID',
      hypothesisId: 'hypothesisID'
    },
    featureMeasurement: 'myFeatureMeasurement',
    locationSolutions: [
      {
        networkMagnitudeSolutions: [
          {
            magnitudeBehaviors: []
          }
        ],
        locationBehaviors: []
      }
    ]
  };
  return {
    ...actual,
    findPreferredEventHypothesisByOpenStageOrDefaultStage: jest
      .fn()
      .mockReturnValue(mockPreferredEventHypothesisByStage)
  };
});

jest.mock('../../../../../src/ts/app/api/data/event/get-working-event-hypothesis', () => {
  const actual = jest.requireActual(
    '../../../../../src/ts/app/api/data/event/get-working-event-hypothesis'
  );
  const mockPreferredEventHypothesisByStage = {
    associatedSignalDetectionHypotheses: [
      {
        id: {
          id: 'already-associated-value',
          signalDetectionId: '012de1b9-8ae3-3fd4-800d-58123c3152cc'
        }
      }
    ],
    id: {
      eventId: 'eventID',
      hypothesisId: 'hypothesisID'
    },
    featureMeasurement: 'myFeatureMeasurement',
    locationSolutions: [
      {
        networkMagnitudeSolutions: [
          {
            magnitudeBehaviors: []
          }
        ],
        locationBehaviors: []
      }
    ]
  };
  return {
    ...actual,
    getWorkingEventHypothesis: jest.fn().mockReturnValue(mockPreferredEventHypothesisByStage)
  };
});

describe('Duplicate Events', () => {
  test('duplicateEventsReducer', () => {
    const state: Partial<WritableDraft<DataState>> = {
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    };

    const action: ReturnType<typeof duplicateEvents> = {
      payload: {
        newEventIds: ['123456'],
        eventIds: [eventData.id],
        workflowDefinitionId: {
          name: 'AL1'
        },
        username: 'test',
        openIntervalName: 'AL1'
      },
      type: duplicateEventsAction
    };

    const initialEventsLength = Object.keys(state.events || {}).length;

    duplicateEventsReducer(state as any, action);

    expect(Object.keys(state.events || {}).length === initialEventsLength + 1).toBe(true);
  });
});
