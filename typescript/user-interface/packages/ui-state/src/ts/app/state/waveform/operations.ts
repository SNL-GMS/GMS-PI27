import type {
  ChannelTypes,
  CommonTypes,
  SignalDetectionTypes,
  StationTypes,
  WorkflowTypes
} from '@gms/common-model';
import { WaveformTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { SECONDS_IN_HOUR, SECONDS_IN_MINUTES } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import produce from 'immer';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import { batch } from 'react-redux';

import { processingConfigurationApiSlice } from '../../api/processing-configuration/processing-configuration-api-slice';
import type { StationGroupsByNamesProps } from '../../api/station-definition/station-definition-api-slice';
import { stationDefinitionSlice } from '../../api/station-definition/station-definition-api-slice';
import { UIStateError } from '../../error-handling/ui-state-error';
import type { AppDispatch, AppState } from '../../store';
import type {
  StationVisibilityChanges,
  StationVisibilityChangesDictionary,
  WaveformState,
  ZoomIntervalProperties
} from './types';
import { ZOOM_INTERVAL_TOO_LARGE_ERROR_MESSAGE } from './types';
import * as Utils from './util';
import { waveformActions } from './waveform-slice';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const FIFTEEN_MINUTES = 15 * SECONDS_IN_MINUTES;
const BOUNDARY_DURATION = SECONDS_IN_HOUR;
const NULLABLE_TIME_RANGE_FALLBACK: CommonTypes.TimeRange = { startTimeSecs: 0, endTimeSecs: 0 };

const logger = UILogger.create('[UI State Manager - Waveform]', process.env.GMS_LOG_UI_STATE_STORE);

/**
 * Checks for null and undefined of the replacement station visibility map
 *
 * @param sVis
 * @returns boolean false if input is undefined or null
 */
export const stationsVisibilityDictionaryIsDefined = (
  sVis: StationVisibilityChangesDictionary
): boolean => {
  return typeof sVis !== 'undefined' && sVis !== null;
};

/**
 * Overwrites the StationsVisibility dictionary in the Redux state.
 *
 * @param sVis a map from station names (string) to StationVisibilityObjects
 */
export const setStationsVisibility =
  (sVis: StationVisibilityChangesDictionary) =>
  (dispatch: AppDispatch): void => {
    if (stationsVisibilityDictionaryIsDefined(sVis)) {
      dispatch(waveformActions.setStationsVisibility(sVis));
    }
  };

/**
 * Internal function for resetting the station visibility to an empty map.
 *
 * @param dispatch the redux dispatch function
 */
export const resetStationsVisibility = (dispatch: AppDispatch): void => {
  dispatch(waveformActions.setStationsVisibility({}));
};

/**
 * Internal function for resetting the viewable interval and zoom interval to their default state: null.
 *
 * @param dispatch the redux dispatch function
 */
export const resetWaveformIntervals = (dispatch: AppDispatch): void => {
  batch(() => {
    dispatch(waveformActions.setViewableInterval({ startTimeSecs: null, endTimeSecs: null }));
    dispatch(waveformActions.setZoomInterval({ startTimeSecs: null, endTimeSecs: null }));
  });
};

/**
 * Internal function to calculate the boundaries for zoomInterval
 *
 * @param waveform
 */
export const calculateZoomIntervalProperties = (
  waveform: WaveformState
): ZoomIntervalProperties => {
  const viewableInterval = waveform.viewableInterval ?? null;
  const minOffset = waveform.minimumOffset ?? 0;
  const maxOffset = waveform.maximumOffset ?? 0;
  const startTimeSecs = viewableInterval?.startTimeSecs ?? 0;
  const endTimeSecs = viewableInterval?.endTimeSecs ?? 0;
  let diffStartTimeSecs = startTimeSecs + minOffset;
  let diffEndTimeSecs = endTimeSecs + maxOffset;
  let startTimeDiff = 0;
  let endTimeDiff = 0;
  const baseStationTime = waveform.baseStationTime ?? null;
  const prevZoomInterval = waveform.zoomInterval ?? null;
  if (baseStationTime) {
    startTimeDiff = baseStationTime - diffStartTimeSecs;
    endTimeDiff = diffEndTimeSecs - baseStationTime;
    if (startTimeDiff < endTimeDiff) {
      diffStartTimeSecs -= endTimeDiff - startTimeDiff;
      endTimeDiff = 0;
    } else {
      diffEndTimeSecs += startTimeDiff - endTimeDiff;
      startTimeDiff = 0;
    }
  }
  return {
    prevZoomInterval,
    viewableInterval,
    diffStartTimeSecs,
    diffEndTimeSecs,
    minOffset,
    maxOffset,
    startTimeDiff,
    endTimeDiff
  };
};

/**
 * Sets the zoom interval to the range provided. Rounds to the nearest millisecond.
 *
 * @param zoomInterval the interval to set it to. Must be within the viewable interval, and non-nullish.
 * @throws if the zoom interval is outside of the viewable interval, or if the viewable
 * interval is not set.
 */
export const setZoomInterval =
  (zoomInterval: Nullable<CommonTypes.TimeRange>) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { waveform } = getState().app;
    const {
      prevZoomInterval,
      viewableInterval,
      diffStartTimeSecs,
      diffEndTimeSecs,
      minOffset,
      maxOffset,
      startTimeDiff,
      endTimeDiff
    } = calculateZoomIntervalProperties(waveform);

    if (isEqual(zoomInterval, prevZoomInterval)) {
      return;
    }
    if (!zoomInterval) {
      dispatch(waveformActions.setZoomInterval({ startTimeSecs: null, endTimeSecs: null }));
      return;
    }
    if (!viewableInterval) {
      throw new UIStateError(ZOOM_INTERVAL_TOO_LARGE_ERROR_MESSAGE);
    }

    let zoomIntervalInRange = zoomInterval;
    if (
      zoomInterval.startTimeSecs &&
      zoomInterval.endTimeSecs &&
      (zoomInterval.startTimeSecs < diffStartTimeSecs || zoomInterval.endTimeSecs > diffEndTimeSecs)
    ) {
      logger.warn(
        `Cannot set a zoom interval that is outside of the viewable interval. zoomInterval: ${JSON.stringify(
          zoomInterval
        )}, viewableInterval: ${JSON.stringify(
          viewableInterval
        )}, offsets: ${minOffset}, ${maxOffset}, timeDiffs: ${startTimeDiff}, ${endTimeDiff}
      }. Truncating to fit within viewable interval.`
      );
      zoomIntervalInRange = {
        startTimeSecs: Math.max(zoomInterval.startTimeSecs, diffStartTimeSecs),
        endTimeSecs: Math.min(zoomInterval.endTimeSecs, diffEndTimeSecs)
      };
    }
    dispatch(waveformActions.setZoomInterval(zoomIntervalInRange));
  };
/**
 * Sets the zoom interval to the viewable interval.
 *
 * @param zoomInterval the interval to set it to. Must be within the viewable interval, and non-nullish.
 * @throws if the zoom interval is outside of the viewable interval, or if the viewable
 * interval is not set.
 */
export const setZoomIntervalToMax =
  () =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { viewableInterval } = getState().app.waveform;
    if (viewableInterval.startTimeSecs && viewableInterval.endTimeSecs) {
      dispatch(waveformActions.setZoomInterval(viewableInterval as CommonTypes.TimeRange));
    }
  };

/**
 * Initializes the viewable range and zoom interval based on the value of the current interval time range in
 * redux, and the lead and lag times set in processing configuration.
 */
export const initializeWaveformIntervals =
  () =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { timeRange: currentInterval } = getState().app.workflow;

    const processingAnalystConfigurationQuery =
      processingConfigurationApiSlice.endpoints.getProcessingAnalystConfiguration.select()(
        getState()
      );

    const leadBufferDuration = processingAnalystConfigurationQuery?.data?.leadBufferDuration ?? 0;
    const lagBufferDuration = processingAnalystConfigurationQuery?.data?.lagBufferDuration ?? 0;

    if (currentInterval.startTimeSecs != null && currentInterval.endTimeSecs != null) {
      const startTimeSecs = currentInterval.startTimeSecs - Number(leadBufferDuration);
      const endTimeSecs = currentInterval.endTimeSecs + Number(lagBufferDuration);

      const timeRange: Nullable<CommonTypes.TimeRange> = {
        startTimeSecs: Number.isNaN(startTimeSecs) ? null : startTimeSecs,
        endTimeSecs: Number.isNaN(endTimeSecs) ? null : endTimeSecs
      };
      batch(() => {
        dispatch(waveformActions.setViewableInterval(timeRange));
        setZoomInterval(timeRange)(dispatch, getState);
      });
    } else {
      throw new Error('Cannot initialize waveform intervals if no current interval is defined.');
    }
  };

/**
 * Initializes the station visibility map based on the value of the current station group in redux
 */
export const initializeStationVisibility =
  (stationGroup: WorkflowTypes.StationGroup, effectiveTime: number) =>
  async (dispatch: AppDispatch, getState: () => AppState): Promise<void> => {
    const stationGroupQueryProps: StationGroupsByNamesProps = {
      stationGroupNames: [stationGroup.name],
      effectiveTime
    };

    await dispatch(
      stationDefinitionSlice.endpoints.getStationGroupsByNames.initiate(stationGroupQueryProps)
    );

    const stationGroupsQuery =
      stationDefinitionSlice.endpoints.getStationGroupsByNames.select(stationGroupQueryProps)(
        getState()
      );

    const stationsVisibility = {};
    const stationNames = sortBy(
      uniq(
        flatMap(
          stationGroupsQuery?.data?.map(x =>
            x.name === stationGroup.name ? x.stations.map(y => y.name) : []
          )
        )
      )
    );

    const newStationsVisibility = produce(stationsVisibility, draft =>
      stationNames.forEach((stationName: string) => {
        draft[stationName] = {
          visibility: true,
          isStationExpanded: false,
          stationName
        };
      })
    );

    batch(() => {
      dispatch(waveformActions.setStationsVisibility(newStationsVisibility));
      dispatch(waveformActions.setCurrentStationGroupStationNames(stationNames));
    });
  };

/**
 * Helper function to reduce cognitive complexity in pan function
 *
 * @param initialTimeRange
 * @returns
 */
const timeRangeOrFallback = (initialTimeRange: Nullable<CommonTypes.TimeRange>) => {
  return initialTimeRange.startTimeSecs && initialTimeRange.endTimeSecs
    ? (initialTimeRange as CommonTypes.TimeRange)
    : NULLABLE_TIME_RANGE_FALLBACK;
};

/**
 * Creates a new time range for loading data based on request or triggers a toast
 *
 * @param viewableInterval viewable interval
 * @param loadType which direction to load data
 * @param earliestLoadableTime time boundary
 * @param latestLoadableTime time boundary
 * @param canLoadEarlierData can load more data
 * @param canLoadLaterData can load more data
 * @param onLoadingLimitReached toaster for loading limit reached
 * @returns new time range, or triggers a toast
 */
const updateLoadTimeRange = (
  viewableInterval: CommonTypes.TimeRange,
  loadType: WaveformTypes.LoadType,
  earliestLoadableTime: number,
  latestLoadableTime: number,
  canLoadEarlierData: boolean,
  canLoadLaterData: boolean,
  onLoadingLimitReached: (() => void) | undefined
): CommonTypes.TimeRange => {
  const loadTimeRange: CommonTypes.TimeRange = {
    startTimeSecs: viewableInterval.startTimeSecs,
    endTimeSecs: viewableInterval.endTimeSecs
  };
  if (loadType === WaveformTypes.LoadType.Earlier && canLoadEarlierData) {
    loadTimeRange.startTimeSecs -= FIFTEEN_MINUTES;
    if (loadTimeRange.startTimeSecs < earliestLoadableTime) {
      loadTimeRange.startTimeSecs = earliestLoadableTime;
    }
  } else if (loadType === WaveformTypes.LoadType.Later && canLoadLaterData) {
    loadTimeRange.endTimeSecs += FIFTEEN_MINUTES;
    if (loadTimeRange.endTimeSecs > latestLoadableTime) {
      loadTimeRange.endTimeSecs = latestLoadableTime;
    }
  } else if (
    (!canLoadEarlierData && loadType === WaveformTypes.LoadType.Earlier) ||
    (!canLoadLaterData && loadType === WaveformTypes.LoadType.Later)
  ) {
    if (onLoadingLimitReached) {
      onLoadingLimitReached();
    }
  }
  return loadTimeRange;
};

/**
 * Loads data and updates the viewableInterval accordingly
 *
 * @param loadType load type to know to load earlier or later data
 * @param options @param onLoadingLimitReached which is a callback that is called if loading limit is reached.
 */
export const loadData =
  (
    loadType: WaveformTypes.LoadType,
    { onLoadingLimitReached }: { onLoadingLimitReached?: () => void }
  ) =>
  (dispatch: AppDispatch, getState: () => AppState) => {
    const { waveform } = getState().app;
    const { viewableInterval } = waveform;
    const { timeRange: currentInterval } = getState().app.workflow;
    const processingAnalystConfigurationQuery =
      processingConfigurationApiSlice.endpoints.getProcessingAnalystConfiguration.select()(
        getState()
      );

    if (!viewableInterval || !viewableInterval.startTimeSecs || !viewableInterval.endTimeSecs) {
      return;
    }
    const currentTimeInterval = timeRangeOrFallback(currentInterval);
    const viewableTimeInterval = timeRangeOrFallback(viewableInterval);

    const waveformPanningBoundaryDuration =
      processingAnalystConfigurationQuery.data?.waveform.panningBoundaryDuration ??
      BOUNDARY_DURATION;
    const earliestLoadableTime =
      currentTimeInterval.startTimeSecs - waveformPanningBoundaryDuration;
    const latestLoadableTime = currentTimeInterval.endTimeSecs + waveformPanningBoundaryDuration;
    const canLoadEarlierData = viewableTimeInterval.startTimeSecs > earliestLoadableTime;
    const canLoadLaterData = viewableTimeInterval.endTimeSecs < latestLoadableTime;

    const currentViewableInterval: CommonTypes.TimeRange = {
      startTimeSecs: viewableInterval.startTimeSecs,
      endTimeSecs: viewableInterval.endTimeSecs
    };

    const loadTimeRange = updateLoadTimeRange(
      currentViewableInterval,
      loadType,
      earliestLoadableTime,
      latestLoadableTime,
      canLoadEarlierData,
      canLoadLaterData,
      onLoadingLimitReached
    );

    // determine if we need to load data or just pan the current view
    // floor/ceil the values to minimize the chance of erroneous reloading
    if (
      loadTimeRange.startTimeSecs !== viewableInterval.startTimeSecs ||
      loadTimeRange.endTimeSecs !== viewableInterval.endTimeSecs
    ) {
      dispatch(
        waveformActions.setViewableInterval({
          startTimeSecs: loadTimeRange.startTimeSecs,
          endTimeSecs: loadTimeRange.endTimeSecs
        })
      );
    }
  };

/**
 * Sets the station visibility for the provided station. Will create a new StationVisibilityChanges object
 * if none exists in the existing store.
 *
 * @param station a station or station name for which to set the visibility
 * @param isVisible whether the station should be visible or not.
 */
export const setStationVisibility =
  (station: StationTypes.Station | string, isVisible: boolean) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { stationsVisibility } = getState().app.waveform;
    const newVisMap = produce(stationsVisibility, draft => {
      const stationName = Utils.getStationName(station);
      draft[stationName] =
        draft[stationName] ?? Utils.newStationVisibilityChangesObject(stationName);
      draft[stationName].visibility = isVisible;
    });
    dispatch(waveformActions.setStationsVisibility(newVisMap));
  };

/**
 * Sets the station to be expanded. Will create a new StationVisibilityChanges object
 * if none exists in the existing store.
 *
 * @param station a station or station name for which to set the visibility
 * @param isVisible whether the station should be visible or not.
 */
export const setStationExpanded =
  (station: StationTypes.Station | string, isExpanded = true) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { stationsVisibility } = getState().app.waveform;
    const newVisMap = produce(stationsVisibility, draft => {
      const stationName = Utils.getStationName(station);
      draft[stationName] =
        draft[stationName] ?? Utils.newStationVisibilityChangesObject(stationName);
      draft[stationName].isStationExpanded = isExpanded;
    });
    dispatch(waveformActions.setStationsVisibility(newVisMap));
  };

/**
 * Sets the channel visibility within the provided station. Will create a new StationVisibilityChanges object
 * if none exists in the existing store.
 *
 * @param station a station or station name for which to set the channel's visibility.
 * @param channel a channel or channel name for which to set the visibility.
 * @param isVisible whether the station should be visible or not.
 */
export const setChannelVisibility =
  (
    station: StationTypes.Station | string,
    channelName: ChannelTypes.Channel | string,
    isVisible: boolean
  ) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { stationsVisibility } = getState().app.waveform;
    const newVisMap = produce(stationsVisibility, draft => {
      const vis: StationVisibilityChanges =
        draft[Utils.getStationName(station)] ??
        Utils.newStationVisibilityChangesObject(Utils.getStationName(station));
      if (isVisible) {
        draft[Utils.getStationName(station)] = Utils.getChangesForVisibleChannel(vis, channelName);
      } else {
        draft[Utils.getStationName(station)] = Utils.getChangesForHiddenChannel(vis, channelName);
      }
    });

    dispatch(waveformActions.setStationsVisibility(newVisMap));
  };

/**
 * Sets all channels within a station to visible.
 *
 * @param station the station or station name for which to show all channels
 */
export const showAllChannels =
  (station: StationTypes.Station | string) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const { stationsVisibility } = getState().app.waveform;
    const newVisMap = produce(stationsVisibility, draft => {
      draft[Utils.getStationName(station)].hiddenChannels = undefined;
    });
    dispatch(waveformActions.setStationsVisibility(newVisMap));
  };

/**
 * Sets the stations associated to the signal detections to visible
 *
 * @param signalDetections The signal detections for which to show their stations
 */
export const updateStationsVisibilityForSignalDetections =
  (signalDetections: SignalDetectionTypes.SignalDetection[]) =>
  (dispatch: AppDispatch): void => {
    batch(() => {
      signalDetections.forEach(signalDetection => {
        dispatch(setStationVisibility(signalDetection.station.name, true));
      });
    });
  };

export const Operations = {
  initializeStationVisibility,
  initializeWaveformIntervals,
  loadData,
  resetStationsVisibility,
  setStationsVisibility,
  setStationVisibility,
  setStationExpanded,
  setChannelVisibility,
  setZoomInterval,
  showAllChannels,
  updateStationsVisibilityForSignalDetections
};
