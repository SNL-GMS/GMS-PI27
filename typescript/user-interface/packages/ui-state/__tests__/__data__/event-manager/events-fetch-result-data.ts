import {
  eventData,
  rejectedEventData
} from '@gms/common-model/__tests__/__data__/event/event-data';

import type { EventsFetchResult } from '../../../src/ts/app';

export const eventResults: EventsFetchResult = {
  fulfilled: 1,
  isError: false,
  isLoading: false,
  pending: 0,
  rejected: 0,
  data: [eventData]
};

export const eventResultsWithRejected: EventsFetchResult = {
  fulfilled: 1,
  isError: false,
  isLoading: false,
  pending: 0,
  rejected: 0,
  data: [eventData, rejectedEventData]
};
