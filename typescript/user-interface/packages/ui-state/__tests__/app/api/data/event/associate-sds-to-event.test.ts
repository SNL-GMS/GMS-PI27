import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { eventData } from '@gms/common-model/__tests__/__data__/event/event-data';
import type { WritableDraft } from 'immer/dist/internal';
import cloneDeep from 'lodash/cloneDeep';

import type { DataState } from '../../../../../src/ts/app/api';
import type { associateSignalDetectionsToEvent } from '../../../../../src/ts/app/api/data/event/associate-sds-to-event';
import {
  associateSignalDetectionsToEventAction,
  associateSignalDetectionToEventReducer
} from '../../../../../src/ts/app/api/data/event/associate-sds-to-event';

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 100,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    uuid4: () => 123456789
  };
});

jest.mock('@gms/common-model/lib/event/util', () => {
  const actual = jest.requireActual('@gms/common-model/lib/event/util');
  const mockPreferredEventHypothesisByStage = {
    associatedSignalDetectionHypotheses: [
      {
        id: {
          id: 'already-associated-value', // the SD in the event hypothesis that is already associated
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
          id: 'already-associated-value', // the SD in the event hypothesis that is already associated
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

describe('Associate Signal Detections to Event', () => {
  test('associateSignalDetectionToEventReducer', () => {
    const state = cloneDeep({
      filterDefinitionsForSignalDetections: {},
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    });
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
      type: associateSignalDetectionsToEventAction
    };

    associateSignalDetectionToEventReducer(state as any, action as any);
    expect(state).toMatchSnapshot();
  });

  test('Restore rejected SD hypothesis association', () => {
    eventData.rejectedSignalDetectionAssociations.push(signalDetectionsData[1]);
    const state: Partial<WritableDraft<DataState>> = cloneDeep({
      filterDefinitionsForSignalDetections: {},
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    });
    const action: ReturnType<typeof associateSignalDetectionsToEvent> = {
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
      type: associateSignalDetectionsToEventAction
    };

    associateSignalDetectionToEventReducer(state as any, action);

    expect(state).toMatchSnapshot();
    expect(
      (state.events || {})[eventData.id].rejectedSignalDetectionAssociations.length === 0
    ).toBe(true);
  });
});
