import type { EventTypes, LegacyEventTypes, StationTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import produce from 'immer';

import { selectPreferredFilterListForActivity } from '../../api/signal-enhancement-configuration/selectors';
import { signalEnhancementConfigurationApiSlice } from '../../api/signal-enhancement-configuration/signal-enhancement-api-slice';
import type { AppDispatch, AppState } from '../../store';
import { fksActions } from '../fks';
import { selectChannelFilters } from '../waveform/selectors';
import { waveformActions } from '../waveform/waveform-slice';
import { analystActions } from './analyst-slice';
import { selectSelectedFilterList, selectSelectedFilterListName } from './selectors';
import { WaveformDisplayMode, WaveformSortType } from './types';

const logger = UILogger.create('[UI State Manager - Analyst]', process.env.GMS_LOG_UI_STATE_STORE);

/**
 * Redux operation for setting the mode.
 *
 * @param mode the mode to set
 */
export const setMode =
  (mode: WaveformDisplayMode) =>
  (dispatch: AppDispatch): void => {
    dispatch(analystActions.setMode(mode));
  };

/**
 * Redux operation for setting the measurement mode entries.
 *
 * @param entries the measurement mode entries to set
 */
export const setMeasurementModeEntries =
  (entries: Record<string, boolean>) =>
  (dispatch: AppDispatch): void => {
    dispatch(analystActions.setMeasurementModeEntries(entries));
  };

/**
 * Redux operation for setting the selected location solution.
 *
 * @param locationSolutionSetId the location solution set id
 * @param locationSolutionId the location solution id
 */
export const setSelectedLocationSolution =
  (locationSolutionSetId: string, locationSolutionId: string) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    if (getState().app.analyst.location.selectedLocationSolutionSetId !== locationSolutionSetId) {
      dispatch(analystActions.setSelectedLocationSolutionSetId(locationSolutionSetId));
    }

    if (getState().app.analyst.location.selectedLocationSolutionId !== locationSolutionId) {
      dispatch(analystActions.setSelectedLocationSolutionId(locationSolutionId));
    }
  };

/**
 * Redux operation for setting the selected preferred location solution.
 *
 * @param preferredLocationSolutionSetId the preferred location solution set id
 * @param preferredLocationSolutionId the preferred location solution id
 */
export const setSelectedPreferredLocationSolution =
  (preferredLocationSolutionSetId: string, preferredLocationSolutionId: string) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    if (
      getState().app.analyst.location.selectedPreferredLocationSolutionSetId !==
      preferredLocationSolutionSetId
    ) {
      dispatch(
        analystActions.setSelectedPreferredLocationSolutionSetId(preferredLocationSolutionSetId)
      );
    }

    if (
      getState().app.analyst.location.selectedPreferredLocationSolutionId !==
      preferredLocationSolutionId
    ) {
      dispatch(analystActions.setSelectedPreferredLocationSolutionId(preferredLocationSolutionId));
    }
  };

/**
 * Redux operation for setting the current open event id.
 *
 * @param event the event to set
 * @param latestLocationSolutionSet
 * @param preferredLocationSolutionId
 */
export const setOpenEventId =
  (
    event: EventTypes.Event | undefined,
    latestLocationSolutionSet: LegacyEventTypes.LocationSolutionSet | undefined,
    preferredLocationSolutionId: string | undefined
  ) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    if (getState().app.workflow.timeRange && event) {
      if (getState().app.analyst.openEventId !== event.id) {
        dispatch(analystActions.setOpenEventId(event.id));
        dispatch(analystActions.setSelectedEventIds([event.id]));
        dispatch(analystActions.setSelectedSortType(WaveformSortType.distance));

        // set the default (latest) location solution
        setSelectedLocationSolution(
          latestLocationSolutionSet ? latestLocationSolutionSet.id : '',
          latestLocationSolutionSet ? latestLocationSolutionSet.locationSolutions[0].id : ''
        )(dispatch, getState);

        // set the default (latest) preferred location solution
        setSelectedPreferredLocationSolution(
          latestLocationSolutionSet?.id ?? '',
          preferredLocationSolutionId ?? ''
        )(dispatch, getState);
      }
    } else {
      dispatch(analystActions.setOpenEventId(''));
      dispatch(analystActions.setSelectedEventIds([]));
      dispatch(analystActions.setSelectedSortType(WaveformSortType.stationNameAZ));
      dispatch(analystActions.setMeasurementModeEntries({}));
      // update the selected location and preferred location solutions
      setSelectedLocationSolution('', '')(dispatch, getState);
      setSelectedPreferredLocationSolution('', '')(dispatch, getState);
    }

    dispatch(analystActions.setSelectedSdIds([]));
    dispatch(fksActions.setSdIdsToShowFk([]));
    dispatch(fksActions.setDisplayedSignalDetectionId(''));
    setMode(WaveformDisplayMode.DEFAULT)(dispatch);
  };

/**
 * creates an action that sets the selected filter list to be the preferred filter list from the list of
 * preferred filter lists returned by the filter definition query.
 * Logs warnings if it is being misused, for example, if the preferred filter list for the activity is nullish,
 * or if the selectedFilterList was already set.
 *
 * @see signalEnhancementConfigurationApiSlice
 */
export const setPreferredFilterList =
  () =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const state = getState();
    const preferredFilterListForActivity = selectPreferredFilterListForActivity(state);
    const selectedFilterList = selectSelectedFilterListName(state);
    if (selectedFilterList == null && preferredFilterListForActivity != null) {
      dispatch(analystActions.setSelectedFilterList(preferredFilterListForActivity));
    } else if (selectedFilterList != null && preferredFilterListForActivity == null) {
      logger.warn(`Cannot set preferred filter list because it is not defined.`);
    } else if (selectedFilterList == null && preferredFilterListForActivity == null) {
      logger.warn(
        `Cannot set preferred filter list because neither it nor the selected filter list is defined.`
      );
    } else {
      logger.info(
        `Cannot set preferred filter list ${preferredFilterListForActivity} because ${selectedFilterList} was already selected.`
      );
    }
  };

/**
 * Sets the default filter from the currently selected filter list.
 * Logs a warning if no selected filter is found.
 * This will subscribe the component to the results of the filter list query.
 * TODO: We need to unsubscribe? How? Where?
 */
export const setDefaultFilter =
  () =>
  async (dispatch: AppDispatch, getState: () => AppState): Promise<void> => {
    const state = getState();
    // subscribe to this state
    await dispatch(
      signalEnhancementConfigurationApiSlice.endpoints.getFilterListsDefinition.initiate()
    );
    const fl = selectSelectedFilterList(state);
    if (fl == null) {
      logger.warn('cannot set default filter list');
      return;
    }
    dispatch(analystActions.setSelectedFilterIndex(fl.defaultFilterIndex));
  };

/**
 * Creates an operation that will set the channelFilters to the default filter for the selected
 * filter list.
 * If no filter list is found, this has no effect, which means that the filter is effectively
 * set to UNFILTERED
 *
 * @param stations the stations for which to set the default filter
 */
export const setDefaultFilterForStations =
  (stations: StationTypes.Station[]) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const channelFilters = selectChannelFilters(getState());
    const filterList = selectSelectedFilterList(getState());
    if (!filterList?.filters || filterList.defaultFilterIndex == null || stations == null) return;
    const newChannelFilters = produce(channelFilters, draft => {
      stations.forEach(station => {
        draft[station.name] = filterList.filters[filterList.defaultFilterIndex];
      });
    });
    dispatch(waveformActions.setChannelFilters(newChannelFilters));
  };

/**
 * Creates an operation that will set the channelFilters to the default filter for the selected
 * filter list IFF no filter is currently set for the channel.
 * If no filter list is found, this has no effect, which means that the filter is effectively
 * set to UNFILTERED
 *
 * @param stations the stations for which to set the default filter
 */
export const setDefaultFilterForStationsIfFilterIsNotSet =
  (stations: StationTypes.Station[]) =>
  (dispatch: AppDispatch, getState: () => AppState): void => {
    const channelFilters = selectChannelFilters(getState());
    const filterList = selectSelectedFilterList(getState());
    if (!filterList?.filters || filterList.defaultFilterIndex == null) return;
    const newChannelFilters = produce(channelFilters, draft => {
      stations.forEach(station => {
        draft[station.name] =
          channelFilters[station.name] ?? filterList.filters[filterList.defaultFilterIndex];
      });
    });
    dispatch(waveformActions.setChannelFilters(newChannelFilters));
  };
