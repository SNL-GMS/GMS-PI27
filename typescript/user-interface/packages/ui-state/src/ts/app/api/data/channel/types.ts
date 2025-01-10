import type { AsyncFetchHistory } from '../../../query';

export interface GetChannelsByNamesTimeRangeQueryArgs {
  channelNames: string[];
  startTime: number;
  endTime: number;
}

export type GetChannelsByNamesHistory = AsyncFetchHistory<GetChannelsByNamesTimeRangeQueryArgs>;
