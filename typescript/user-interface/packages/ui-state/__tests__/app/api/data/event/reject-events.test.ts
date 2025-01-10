import {
  eventData,
  openIntervalName,
  signalDetectionsData,
  user
} from '@gms/common-model/__tests__/__data__';
import type { WritableDraft } from 'immer/dist/internal';
import last from 'lodash/last';

import type { DataState } from '../../../../../src/ts/app/api';
import type { rejectEvents } from '../../../../../src/ts/app/api/data/event/reject-events';
import {
  rejectEventsAction,
  rejectEventsReducer
} from '../../../../../src/ts/app/api/data/event/reject-events';

describe('Reject Events', () => {
  test('rejectEventsReducer', () => {
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
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionsData[0].id]: signalDetectionsData[0],
        [signalDetectionsData[1].id]: signalDetectionsData[1],
        [signalDetectionsData[2].id]: signalDetectionsData[2]
      }
    };

    const action: ReturnType<typeof rejectEvents> = {
      payload: {
        eventIds: mockEventIds,
        stageId: mockStageId,
        username: mockUsername,
        openIntervalName: mockOpenIntervalName
      },
      type: rejectEventsAction
    };

    rejectEventsReducer(state as any, action);
    const maybeRejectedEvent = Object.values(state.events || {}).find(ev => ev.id === eventData.id);
    const maybeRejectedEventHypothesis = maybeRejectedEvent?.eventHypotheses.find(
      hypo => hypo.rejected
    );

    // preferredHypothesis should be rejected
    expect(maybeRejectedEventHypothesis?.rejected).toBe(true);
    // last item in hypothesis history should be id-only instance of the new event hypothesis
    expect(last(maybeRejectedEvent?.finalEventHypothesisHistory)?.id).toStrictEqual(
      maybeRejectedEventHypothesis?.id
    );
    expect(
      maybeRejectedEvent?.preferredEventHypothesisByStage?.find(
        hypo => hypo.stage === mockStageId?.definitionId
      )?.preferredBy
    ).toBe(mockUsername);
  });
});
