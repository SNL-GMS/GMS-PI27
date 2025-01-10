import {
  eventData,
  openIntervalName,
  user
} from '@gms/common-model/__tests__/__data__/event/event-data';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__/signal-detections/signal-detection-data';
import type { WritableDraft } from 'immer/dist/internal';
import last from 'lodash/last';

import type { DataState } from '../../../../../src/ts/app';
import type { deleteEvents } from '../../../../../src/ts/app/api/data/event/delete-events';
import {
  deleteEventsAction,
  deleteEventsReducer
} from '../../../../../src/ts/app/api/data/event/delete-events';

describe('Delete Events', () => {
  test('deleteEventsReducer', () => {
    const mockEventIds = [eventData.id];
    const mockStageId = {
      definitionId: {
        name: 'AL1'
      },
      startTime: 1669150800
    };
    const mockUsername = user;
    const mockOpenIntervalName = openIntervalName;

    const state: Partial<WritableDraft<DataState>> = {
      events: { [mockEventIds[0]]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    };

    const action: ReturnType<typeof deleteEvents> = {
      payload: {
        eventIds: mockEventIds,
        stageId: mockStageId,
        username: mockUsername,
        openIntervalName: mockOpenIntervalName
      },
      type: deleteEventsAction
    };

    deleteEventsReducer(state as any, action as any);

    const maybeDeletedEvent = Object.values(state.events || {}).find(ev => ev.id === eventData.id);
    const maybeDeletedEventHypothesis = maybeDeletedEvent?.eventHypotheses.find(
      hypo => hypo.deleted
    );

    expect(maybeDeletedEventHypothesis?.id.eventId).toBe(eventData.id);
    expect(maybeDeletedEventHypothesis?.deleted).toBe(true);
    expect(maybeDeletedEventHypothesis?.rejected).toBe(false);
    expect(
      maybeDeletedEvent?.preferredEventHypothesisByStage.find(
        hypo => hypo.preferred.id.eventId === eventData.id
      )?.preferredBy
    ).toBe(mockUsername);

    // overallPreferred should be an id-only instance of the new event hypothesis
    expect(maybeDeletedEvent?.overallPreferred?.id.eventId).toBe(
      maybeDeletedEventHypothesis?.id.eventId
    );
    // last item in hypothesis history should be id-only instance of the new event hypothesis
    expect(last(maybeDeletedEvent?.finalEventHypothesisHistory)?.id).toStrictEqual(
      maybeDeletedEventHypothesis?.id
    );
  });
});
