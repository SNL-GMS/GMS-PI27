import {
  defaultStations,
  deletedSignalDetectionData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import {
  eventData,
  eventId2,
  openIntervalName,
  user
} from '@gms/common-model/__tests__/__data__/event/event-data';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../../../../../src/ts/app/api';
import {
  createEventFromSignalDetectionsAction,
  createEventFromSignalDetectionsReducer
} from '../../../../../src/ts/app/api/data/event/create-event-from-sds';

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 100,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    uuid4: () => 123456789
  };
});

describe('CreateEventFromSignalDetections', () => {
  test('createEventFromSignalDetectionReducer', () => {
    const state: Partial<WritableDraft<DataState>> = {
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    };
    const action = {
      payload: {
        newEventId: eventId2,
        signalDetectionIds: [signalDetectionsData[1].id],
        monitoringOrganization: 'testOrg',
        workflowDefinitionId: {
          name: openIntervalName
        },
        username: user,
        stations: defaultStations
      },
      type: createEventFromSignalDetectionsAction
    };

    createEventFromSignalDetectionsReducer(state as any, action as any);

    expect(state).toMatchSnapshot();
  });

  test('creates an event from signal detections', () => {
    const state: Partial<WritableDraft<DataState>> = {
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0]
      }
    };
    const action = {
      payload: {
        newEventId: eventId2,
        signalDetectionIds: [signalDetectionsData[0].id],
        monitoringOrganization: 'testOrg',
        workflowDefinitionId: {
          name: openIntervalName
        },
        username: user,
        stations: defaultStations
      },
      type: createEventFromSignalDetectionsAction
    };

    createEventFromSignalDetectionsReducer(state as any, action as any);

    expect((state.events || {})[eventId2]).toBeDefined();
  });

  test('removes rejected signal detections before event creation', () => {
    const state: Partial<WritableDraft<DataState>> = {
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [deletedSignalDetectionData.id]: deletedSignalDetectionData
      }
    };
    const action = {
      payload: {
        newEventId: eventId2,
        signalDetectionIds: [signalDetectionsData[0].id, deletedSignalDetectionData.id],
        monitoringOrganization: 'testOrg',
        workflowDefinitionId: {
          name: openIntervalName
        },
        username: user,
        stations: defaultStations
      },
      type: createEventFromSignalDetectionsAction
    };

    createEventFromSignalDetectionsReducer(state as any, action as any);

    expect(
      (state.events || {})[eventId2].eventHypotheses[0].associatedSignalDetectionHypotheses
    ).toHaveLength(1);
  });
});
