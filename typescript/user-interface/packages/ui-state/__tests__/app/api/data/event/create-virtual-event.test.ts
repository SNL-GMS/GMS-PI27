import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { eventData } from '@gms/common-model/__tests__/__data__/event/event-data';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../../../../../src/ts/app/api';
import {
  createVirtualEventAction,
  createVirtualEventReducer
} from '../../../../../src/ts/app/api/data/event/create-virtual-event';

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    epochSecondsNow: () => 100,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    uuid4: () => 123456789
  };
});

describe('CreateVirtualEvent', () => {
  test('createVirtualEventReducer', () => {
    const MOCK_TIME = 1606818240000;
    const mockDate = new Date(MOCK_TIME);
    const mockLatitudeDeg = 30;
    const mockLongitudeDeg = -60;
    const mockDepthKm = -40;

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
        newEventId: '123456789',
        eventDate: mockDate,
        latitudeDegrees: mockLatitudeDeg,
        longitudeDegrees: mockLongitudeDeg,
        depthKm: mockDepthKm,
        monitoringOrganization: 'testOrg',
        workflowDefinitionId: {
          name: 'AL1'
        },
        username: 'test'
      },
      type: createVirtualEventAction
    };

    createVirtualEventReducer(state as any, action as any);

    expect(state).toMatchSnapshot();
  });
});
