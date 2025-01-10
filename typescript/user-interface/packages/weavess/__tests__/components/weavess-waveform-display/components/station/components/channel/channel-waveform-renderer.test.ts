import type { WeavessTypes } from '@gms/weavess-core';
import type { Channel, ChannelSegment } from '@gms/weavess-core/lib/types';
import type { RenderHookResult } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { act } from 'react-test-renderer';

import { useDescription } from '../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/channel-waveform-renderer';

describe('ChannelWaveformRenderer', () => {
  describe('useDescription', () => {
    it('gets an undefined description of a channel if given undefined', () => {
      const description: RenderHookResult<
        {
          setError: (isError: boolean, errorMessage?: string) => void;
          description: string | WeavessTypes.ChannelDescription | undefined;
        },
        unknown
      > = renderHook(() => useDescription({ description: undefined } as Channel, []));
      expect(description.result.current.description).toBe(undefined);
    });
    it('gets the channel description if one is provided', () => {
      const description: RenderHookResult<
        {
          setError: (isError: boolean, errorMessage?: string) => void;
          description: string | WeavessTypes.ChannelDescription | undefined;
        },
        unknown
      > = renderHook(() =>
        useDescription(
          { description: 'channel description' } as Channel,
          [
            { description: 'channel segment description 1' },
            { description: 'channel segment description 2' }
          ] as ChannelSegment[]
        )
      );
      expect(description.result.current.description).toBe('channel description');
    });
    it('gets the channel segment description if no channel description is provided', () => {
      const description: RenderHookResult<
        {
          setError: (isError: boolean, errorMessage?: string) => void;
          description: string | WeavessTypes.ChannelDescription | undefined;
        },
        unknown
      > = renderHook(() =>
        useDescription(
          { description: undefined } as Channel,
          [
            { description: 'channel segment description' },
            { description: 'channel segment description' }
          ] as ChannelSegment[]
        )
      );
      expect(description.result.current.description).toBe('channel segment description');
    });
    it('gets the error message as the tooltip when channel contains error', async () => {
      const description: RenderHookResult<
        {
          setError: (isError: boolean, errorMessage?: string) => void;
          description: string | WeavessTypes.ChannelDescription | undefined;
        },
        unknown
      > = renderHook(() =>
        useDescription(
          {
            name: 'MTV',
            description: {
              message: 'FilterName',
              isError: false
            } as WeavessTypes.ChannelDescription
          } as Channel,
          [] as ChannelSegment[]
        )
      );
      await act(() => description.result.current.setError(true));
      const result = description.result.current.description as WeavessTypes.ChannelDescription;
      expect(result.tooltipMessage).toBe('Filtering operation failed');
    });

    it('gets the default error message as the tooltip when channel contains error but no error message has been set', async () => {
      const description: RenderHookResult<
        {
          setError: (isError: boolean, errorMessage?: string) => void;
          description: string | WeavessTypes.ChannelDescription | undefined;
        },
        unknown
      > = renderHook(() =>
        useDescription(
          {
            name: 'MTV',
            description: {
              message: 'This channel is super healthy',
              isError: false
            } as WeavessTypes.ChannelDescription
          } as Channel,
          [
            { description: 'channel segment description' },
            { description: 'channel segment description' }
          ] as ChannelSegment[]
        )
      );
      const errorMessage = 'This channel is super broken';
      await act(() => description.result.current.setError(true, errorMessage));
      const result = description.result.current.description as WeavessTypes.ChannelDescription;
      expect(result.tooltipMessage).toBe(errorMessage);
    });
    it('gets `mixed` if no channel description is provided and multiple different channel segment descriptions are provided', () => {
      const description: RenderHookResult<
        {
          setError: (isError: boolean, errorMessage?: string) => void;
          description: string | WeavessTypes.ChannelDescription | undefined;
        },
        unknown
      > = renderHook(() =>
        useDescription(
          { description: undefined } as Channel,
          [
            { description: 'channel segment description 1' },
            { description: 'channel segment description 2' }
          ] as ChannelSegment[]
        )
      );
      expect(description.result.current.description).toBe('mixed');
    });
  });
});
