import type { TimeRange } from '@gms/common-model/lib/common';
import { convertToVersionReference } from '@gms/common-model/lib/faceted';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import type { ThunkDispatch } from 'redux-thunk';

import { UIStateError } from '../../error-handling/ui-state-error';
import { waveformActions } from '../../state';
import { selectStationsVisibility, selectViewableInterval } from '../../state/waveform/selectors';
import type { StationVisibilityChangesDictionary } from '../../state/waveform/types';
import { isChannelVisible } from '../../state/waveform/util';
import type { AppState } from '../../store';
import { selectRawChannels } from '../data';
import type { GetChannelSegmentsByChannelQueryArgs } from '../data/waveform/get-channel-segments-by-channel';
import {
  getChannelSegmentsByChannel,
  getChannelSegmentsByChannelQuery
} from '../data/waveform/get-channel-segments-by-channel';
import { stationDefinitionSlice } from '../station-definition/station-definition-api-slice';
import { dataPopulationOnError, isRejectedAction } from './util';

const logger = UILogger.create(
  'GMS_FETCH_CHANNEL_SEGMENTS_MIDDLEWARE',
  process.env.GMS_FETCH_CHANNEL_SEGMENTS_MIDDLEWARE
);

/** rejected actions to listen for to retry the middleware action */
const listenerRejectedActions: string[] = [`${getChannelSegmentsByChannel.typePrefix}/rejected`];

/** actions to listen for to perform the middleware action */
const listenerActions: string[] = [
  waveformActions.setStationsVisibility.type,
  // registered reject action; used for retrying the request on failure
  ...listenerRejectedActions
];

type ActionType = typeof getChannelSegmentsByChannel;

type MiddlewareListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<ActionType>>,
  unknown
>;

export const populateChannelSegmentsByChannelMiddleware: MiddlewareListener =
  createListenerMiddleware({ onError: dataPopulationOnError, extra: {} });

/**
 * memoized function for determining if getChannelSegmentsByChannel should be called to
 * populate the channel segments.
 * @returns memo function
 */
export const memoizedDispatchGetChannelSegmentsByChannel = memoizeOne(
  (
    viewableInterval: Nullable<TimeRange>,
    stationsVisibility: StationVisibilityChangesDictionary,
    rawChannels: Record<string, Channel>,
    action: Action,
    dispatch: ThunkDispatch<AppState, unknown, Action<ActionType>>
  ) => {
    const visibleChannels = Object.values(rawChannels).filter(
      channel =>
        stationsVisibility?.[channel.station.name]?.visibility &&
        stationsVisibility[channel.station.name]?.isStationExpanded &&
        isChannelVisible(channel.name, stationsVisibility[channel.station.name])
    );
    const visibleChannelsVersionReferences = visibleChannels.map(visibleChannel =>
      convertToVersionReference(visibleChannel, 'name')
    );
    const args: GetChannelSegmentsByChannelQueryArgs = {
      startTime: viewableInterval.startTimeSecs ?? 0,
      endTime: viewableInterval.endTimeSecs ?? 0,
      channels: visibleChannelsVersionReferences
    };

    // only fetch if the args are valid
    if (getChannelSegmentsByChannelQuery.shouldSkip(args)) {
      return;
    }
    // if the previous request to {@link getChannelSegmentsByChannel} was rejected
    // and the args have changed then do not allow the retry of the request
    if (isRejectedAction(action, listenerRejectedActions) && !isEqual(args, action.meta.arg)) {
      return;
    }
    dispatch(getChannelSegmentsByChannel(args)).catch(error => {
      logger.error(`Failed to fetch channel segments by channel`, new UIStateError(error));
    });
  },
  (
    [newViewableInterval, newStationsVisibility, newRawChannels],
    [prevViewableInterval, prevStationsVisibility, prevRawChannels]
  ) =>
    newViewableInterval === prevViewableInterval &&
    newStationsVisibility === prevStationsVisibility &&
    newRawChannels === prevRawChannels
);

populateChannelSegmentsByChannelMiddleware.startListening({
  predicate: (action: Action): action is Action => {
    return (
      includes(listenerActions, action.type) ||
      stationDefinitionSlice.endpoints.getStations.matchFulfilled(action)
    );
  },
  effect: (action: Action, listenerApi) => {
    const state = listenerApi.getState();

    listenerApi.fork(() => {
      const viewableInterval = selectViewableInterval(state);
      const stationsVisibility = selectStationsVisibility(state);
      const rawChannels = selectRawChannels(state);
      memoizedDispatchGetChannelSegmentsByChannel(
        viewableInterval,
        stationsVisibility,
        rawChannels,
        action,
        listenerApi.dispatch
      );
    });
  }
});
