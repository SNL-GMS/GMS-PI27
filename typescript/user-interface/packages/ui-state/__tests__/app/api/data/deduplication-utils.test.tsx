import type { FacetedTypes } from '@gms/common-model';
import {
  akasgVersionReference,
  PD01ChannelVersionReference,
  PD02ChannelVersionReference,
  pdarVersionReference
} from '@gms/common-model/__tests__/__data__';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';

import type {
  AsyncFetchHistoryEntry,
  GetBeamformingTemplatesQueryArgs
} from '../../../../src/ts/app';
import { AsyncActionStatus } from '../../../../src/ts/app';
import {
  determineChannelsTimeRangeRequest,
  determineMissingPairs
} from '../../../../src/ts/app/api/data/deduplication-utils';
import type { FindQCSegmentsByChannelAndTimeRangeQueryArgs } from '../../../../src/ts/app/api/data/waveform/find-qc-segments-by-channel-and-time-range';

describe('deduplication utils', () => {
  describe('determineChannelsTimeRangeRequest', () => {
    const mockRequest: FindQCSegmentsByChannelAndTimeRangeQueryArgs = {
      channels: [PD01ChannelVersionReference, PD02ChannelVersionReference],
      startTime: 0,
      endTime: 100000
    };

    it('is defined', () => {
      expect(determineChannelsTimeRangeRequest).toBeDefined();
    });
    it('filters out channels that are fully requested', () => {
      const mockHistory: AsyncFetchHistoryEntry<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = {
        arg: { channels: [PD01ChannelVersionReference], startTime: 0, endTime: 100000 },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      expect(determineChannelsTimeRangeRequest(mockRequest, [mockHistory])).toEqual({
        channels: [PD02ChannelVersionReference],
        startTime: 0,
        endTime: 100000
      });
    });
    it('filters out time segments that are fully requested', () => {
      const mockHistory: AsyncFetchHistoryEntry<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = {
        arg: {
          channels: [PD01ChannelVersionReference, PD02ChannelVersionReference],
          startTime: 0,
          endTime: 50000
        },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      expect(determineChannelsTimeRangeRequest(mockRequest, [mockHistory])).toEqual({
        channels: [PD01ChannelVersionReference, PD02ChannelVersionReference],
        startTime: 50000,
        endTime: 100000
      });
    });
    it('builds a request that covers all missing time ranges and channels even if it re-requests loaded data', () => {
      const mockHistory: AsyncFetchHistoryEntry<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = {
        arg: {
          channels: [PD01ChannelVersionReference, PD02ChannelVersionReference],
          startTime: 0,
          endTime: 50000
        },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      const mockHistory2: AsyncFetchHistoryEntry<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = {
        arg: { channels: [PD01ChannelVersionReference], startTime: 50000, endTime: 75000 },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      const mockHistory3: AsyncFetchHistoryEntry<FindQCSegmentsByChannelAndTimeRangeQueryArgs> = {
        arg: { channels: [PD02ChannelVersionReference], startTime: 75000, endTime: 100000 },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      expect(
        determineChannelsTimeRangeRequest(mockRequest, [mockHistory, mockHistory2, mockHistory3])
      ).toEqual({
        channels: [PD01ChannelVersionReference, PD02ChannelVersionReference],
        startTime: 50000,
        endTime: 100000
      });
    });
  });

  describe('determineMissingPairs', () => {
    const mockArgs: GetBeamformingTemplatesQueryArgs = {
      phases: ['P', 'S'],
      stations: [pdarVersionReference, akasgVersionReference],
      beamType: BeamType.EVENT
    };
    it('is defined', () => {
      expect(determineMissingPairs).toBeDefined();
    });
    it('filters out first parameters that fully match', () => {
      const mockHistory: AsyncFetchHistoryEntry<GetBeamformingTemplatesQueryArgs> = {
        arg: {
          phases: ['P', 'S'],
          stations: [akasgVersionReference],
          beamType: BeamType.EVENT
        },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      const [stations, phases] = determineMissingPairs<
        GetBeamformingTemplatesQueryArgs,
        FacetedTypes.VersionReference<'name'>
      >(mockArgs, [mockHistory], 'stations', 'phases');

      expect(stations).toEqual([pdarVersionReference]);
      expect(phases).toEqual(['P', 'S']);
    });

    it('filters out second parameters that fully match', () => {
      const mockHistory: AsyncFetchHistoryEntry<GetBeamformingTemplatesQueryArgs> = {
        arg: {
          phases: ['P'],
          stations: [pdarVersionReference, akasgVersionReference],
          beamType: BeamType.EVENT
        },
        status: AsyncActionStatus.fulfilled,
        attempts: 1,
        time: 1,
        error: undefined
      };
      const [stations, phases] = determineMissingPairs<
        GetBeamformingTemplatesQueryArgs,
        FacetedTypes.VersionReference<'name'>
      >(mockArgs, [mockHistory], 'stations', 'phases');

      expect(stations).toEqual([akasgVersionReference, pdarVersionReference]);
      expect(phases).toEqual(['S']);
    });
  });
});
