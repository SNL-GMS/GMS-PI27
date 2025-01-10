import { ChannelSegmentTypes } from '@gms/common-model';
import { eventData, signalDetectionsData } from '@gms/common-model/__tests__/__data__';

import {
  revertFkAction,
  revertFkReducer
} from '../../../../../src/ts/app/api/data/signal-detection/revert-fk-reducer';
import { getTestFkChannelSegment } from '../../../../__data__';

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

describe('Revert FK', () => {
  test('revertFkReducer', () => {
    const fkChannelSegment = getTestFkChannelSegment(signalDetectionsData[0]);
    const state = {
      filterDefinitionsForSignalDetections: {},
      fkChannelSegments: {
        [ChannelSegmentTypes.Util.createChannelSegmentString(fkChannelSegment.id)]: fkChannelSegment
      },
      signalDetections: {
        [signalDetectionsData[0].id]: {
          ...signalDetectionsData[0],
          _uiFkChannelSegmentDescriptorId: fkChannelSegment.id
        },
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      },
      events: { [eventData.id]: eventData }
    };

    const action = {
      payload: {
        signalDetectionId: signalDetectionsData[0].id
      },
      type: revertFkAction
    };

    revertFkReducer(state as any, action as any);

    expect(state).toMatchSnapshot();
  });
});
