// import { CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { eventData } from '@gms/common-model/__tests__/__data__/event/event-data';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../../../../../src/ts/app/api';
import type { unassociateSignalDetectionsToEvent } from '../../../../../src/ts/app/api/data/event/unassociate-sds-to-event';
import {
  unassociateSignalDetectionsToEventAction,
  unassociateSignalDetectionToEventReducer
} from '../../../../../src/ts/app/api/data/event/unassociate-sds-to-event';

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 100,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    uuid4: () => 123456789
  };
});

jest.mock('@gms/common-model/lib/signal-detection/util', () => {
  const actual = jest.requireActual('@gms/common-model/lib/signal-detection/util');
  return {
    ...actual,
    getCurrentHypothesis: jest.fn(() => signalDetectionsData[0].signalDetectionHypotheses[0])
  };
});

jest.mock('@gms/common-model/lib/event/util', () => {
  const actual = jest.requireActual('@gms/common-model/lib/event/util');
  const mockPreferredEventHypothesisByStage = {
    associatedSignalDetectionHypotheses: [
      {
        id: {
          // index 1
          id: '20cc9505-efe3-3068-b7d5-59196f37992c', // the SD in the event hypothesis that is already associated
          signalDetectionId: '012de1b9-8ae3-3fd4-800d-58665c3152cc'
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
          id: '20cc9505-efe3-3068-b7d5-59196f37992c', // the SD in the event hypothesis that is already associated
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

describe('Unassociate Signal Detections from Event', () => {
  test('unassociateSignalDetectionToEventReducer', () => {
    const state: Partial<WritableDraft<DataState>> = {
      filterDefinitionsForSignalDetections: {},
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    };
    const action = {
      payload: {
        username: 'test',
        openIntervalName: 'AL1',
        stageId: {
          definitionId: {
            name: 'AL1'
          },
          startTime: 1669150800
        },
        eventId: eventData.id,
        signalDetectionIds: [signalDetectionsData[1].id]
      },
      type: unassociateSignalDetectionsToEventAction
    };

    unassociateSignalDetectionToEventReducer(state as any, action as any);

    expect(state).toMatchSnapshot();
  });

  test('unassociateSignalDetectionToEventReducer with reject', () => {
    const state: Partial<WritableDraft<DataState>> = {
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    };
    const action: ReturnType<typeof unassociateSignalDetectionsToEvent> = {
      payload: {
        username: 'test',
        openIntervalName: 'AL1',
        stageId: {
          definitionId: {
            name: 'AL1'
          },
          startTime: 1669150800
        },
        eventId: eventData.id,
        signalDetectionIds: [signalDetectionsData[1].id],
        rejectAssociations: true
      },
      type: unassociateSignalDetectionsToEventAction
    };

    unassociateSignalDetectionToEventReducer(state as any, action);

    expect(state).toMatchSnapshot();
  });
});
