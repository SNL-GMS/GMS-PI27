/* eslint-disable jest/expect-expect */
import { EventTypes } from '@gms/common-model';
import produce from 'immer';

import type {
  EventStatus,
  EventStatusResponse,
  FindEventStatusInfoByStageIdAndEventIdsProps
} from '../../../../src/ts/app/api/event-manager';
import {
  eventManagerApiSlice,
  eventStatusTransform,
  updateEventStatus,
  useUpdateEventStatusMutation
} from '../../../../src/ts/app/api/event-manager';
import { expectQueryHookToMakeAxiosRequest } from '../query-test-util';

process.env.GMS_EVENT_QUERIES = 'true';

describe('Event Manager API Slice', () => {
  it('provides', () => {
    expect(useUpdateEventStatusMutation).toBeDefined();
    expect(updateEventStatus).toBeDefined();
    expect(eventManagerApiSlice).toBeDefined();
  });

  it('can updated event status', () => {
    const eventStatus: EventStatus = {
      stageId: { name: 'sample' },
      eventId: '123',
      eventStatusInfo: {
        eventStatus: EventTypes.EventStatus.COMPLETE,
        activeAnalystIds: ['user1', 'user2']
      }
    };
    const eventStatuses: Record<string, EventStatus> = {
      '123': {
        stageId: { name: 'sample' },
        eventId: '123',
        eventStatusInfo: {
          eventStatus: EventTypes.EventStatus.IN_PROGRESS,
          activeAnalystIds: ['user1', 'user2']
        }
      }
    };
    const result = produce(eventStatuses, updateEventStatus([eventStatus]));
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['123'].eventStatusInfo.eventStatus).toEqual(EventTypes.EventStatus.COMPLETE);
  });

  it('hook queries for event statuses', async () => {
    const params: FindEventStatusInfoByStageIdAndEventIdsProps = {
      stageId: { name: 'TestStage' },
      eventIds: ['test ']
    };
    const useTestHook = () =>
      eventManagerApiSlice.useFindEventStatusInfoByStageIdAndEventIdsQuery(params);
    await expectQueryHookToMakeAxiosRequest(useTestHook);
  });
  it('transforms the event status initial response', () => {
    const mockResponse: EventStatusResponse = {
      eventStatusInfoMap: {
        testEvent: {
          eventStatus: EventTypes.EventStatus.NOT_STARTED,
          activeAnalystIds: ['larry', 'moe', 'curly']
        }
      },
      stageId: {
        name: 'testStage'
      }
    };
    const expectedResult: Record<string, EventStatus> = {
      testEvent: {
        stageId: { name: 'testStage' },
        eventId: 'testEvent',
        eventStatusInfo: {
          eventStatus: EventTypes.EventStatus.NOT_STARTED,
          activeAnalystIds: ['larry', 'moe', 'curly']
        }
      }
    };

    expect(eventStatusTransform(mockResponse)).toEqual(expectedResult);
  });
});
