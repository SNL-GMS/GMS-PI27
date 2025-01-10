import type { ChannelSegmentTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type {
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  ListenerErrorInfo
} from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import differenceWith from 'lodash/differenceWith';
import intersectionWith from 'lodash/intersectionWith';
import uniqWith from 'lodash/uniqWith';
import { batch } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';

import { areChannelSegmentDescriptorsEqual } from '../../../type-util';
import { analystActions } from '../../state';
import type { AppState } from '../../store';
import { ENV_GMS_HISTORY, GMS_HISTORY } from '../history-environment';
import { undoRedo } from '../reducers';

const logger = UILogger.create(GMS_HISTORY, ENV_GMS_HISTORY);

const INFO = 'Waveform Removed Middleware:' as const;

const onError: ListenerErrorHandler = (error: unknown, errorInfo: ListenerErrorInfo) => {
  logger.error(`${INFO} error occurred`, error, errorInfo);
};

type WaveformRemovedActions = typeof analystActions.setSelectedWaveforms.type;

type WaveformRemovedListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<WaveformRemovedActions>>,
  unknown
>;

/** returns the {@link ChannelSegmentTypes.ChannelSegmentDescriptor}s objects that were removed */
const determineRemoved = (
  originalIds: ChannelSegmentTypes.ChannelSegmentDescriptor[],
  ids: ChannelSegmentTypes.ChannelSegmentDescriptor[]
): ChannelSegmentTypes.ChannelSegmentDescriptor[] => {
  // determine the ids no longer in the current state
  return differenceWith(originalIds, ids, areChannelSegmentDescriptorsEqual);
};

/** returns the uiChannelSegments, {@link ChannelSegmentTypes.ChannelSegmentDescriptor}s that were removed */
const determineRemovedUiChannelSegments = (
  original: AppState,
  state: AppState
): ChannelSegmentTypes.ChannelSegmentDescriptor[] => {
  const originalIds = uniqWith(
    Object.values(original.data.uiChannelSegments).flatMap(entry =>
      Object.values(entry).flatMap(segments =>
        segments.map(segment => segment.channelSegmentDescriptor)
      )
    ),
    areChannelSegmentDescriptorsEqual
  );
  const ids = uniqWith(
    Object.values(state.data.uiChannelSegments).flatMap(entry =>
      Object.values(entry).flatMap(segments =>
        segments.map(segment => segment.channelSegmentDescriptor)
      )
    ),
    areChannelSegmentDescriptorsEqual
  );
  return determineRemoved(originalIds, ids);
};

/** returns the eventBeams, {@link ChannelSegmentTypes.ChannelSegmentDescriptor}s that were removed */
const determineRemovedEventBeams = (
  original: AppState,
  state: AppState
): ChannelSegmentTypes.ChannelSegmentDescriptor[] => {
  const originalIds = uniqWith(
    Object.values(original.data.eventBeams).flatMap(entry =>
      entry.map(segment => segment.channelSegmentDescriptor)
    ),
    areChannelSegmentDescriptorsEqual
  );
  const ids = uniqWith(
    Object.values(state.data.eventBeams).flatMap(entry =>
      entry.map(segment => segment.channelSegmentDescriptor)
    ),
    areChannelSegmentDescriptorsEqual
  );
  return determineRemoved(originalIds, ids);
};

/** returns the waveforms, {@link ChannelSegmentTypes.ChannelSegmentDescriptor}s that were removed */
const determineRemovedWaveforms = (
  original: AppState,
  state: AppState
): {
  uiChannelSegments: ChannelSegmentTypes.ChannelSegmentDescriptor[];
  eventBeams: ChannelSegmentTypes.ChannelSegmentDescriptor[];
} => {
  return {
    uiChannelSegments: determineRemovedUiChannelSegments(original, state),
    eventBeams: determineRemovedEventBeams(original, state)
  };
};

const waveformRemovedMiddlewareOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError,
  extra: {}
};

/** the waveform removed middleware - responsible updating state when waveforms are removed (e.g. selections) */
export const waveformRemovedMiddleware: WaveformRemovedListener = createListenerMiddleware(
  waveformRemovedMiddlewareOptions
);

waveformRemovedMiddleware.startListening({
  type: undoRedo.type,
  effect: async function waveformRemovedMiddlewareEffect(action, listenerApi) {
    const original = listenerApi.getOriginalState();
    const state = listenerApi.getState();

    const task = listenerApi.fork(() => determineRemovedWaveforms(original, state));
    const result = await task.result;

    if (result.status === 'ok') {
      logger.debug(`${INFO} completed`, action, result);
      const {
        value: { uiChannelSegments, eventBeams }
      } = result;

      if (uiChannelSegments.length > 0 || eventBeams.length > 0) {
        batch(() => {
          const removedWaveforms = intersectionWith(
            uiChannelSegments,
            state.app.analyst.selectedWaveforms,
            areChannelSegmentDescriptorsEqual
          ).concat(
            intersectionWith(
              eventBeams,
              state.app.analyst.selectedWaveforms,
              areChannelSegmentDescriptorsEqual
            )
          );

          if (removedWaveforms.length > 0) {
            // unselect any removed waveforms
            listenerApi.dispatch(
              analystActions.setSelectedWaveforms(
                state.app.analyst.selectedWaveforms.filter(
                  waveform =>
                    intersectionWith(
                      removedWaveforms,
                      [waveform],
                      areChannelSegmentDescriptorsEqual
                    ).length === 0 // keep the ones not removed
                )
              )
            );
          }
        });
      }
    } else if (result.status === 'cancelled') {
      logger.debug(`${INFO} canceled`, action, result);
    } else {
      logger.error(`${INFO} rejected`, action, result.error);
    }
  }
});
