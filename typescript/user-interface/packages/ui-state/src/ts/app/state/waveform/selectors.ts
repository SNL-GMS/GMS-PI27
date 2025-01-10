import type { FilterTypes } from '@gms/common-model';

import type { AppState } from '../../../ui-state';

/**
 * Selector for hte channel filters from Redux. Returns a record of station/channel names
 * to the applied filters.
 */
export const selectChannelFilters = (state: AppState): Record<string, FilterTypes.Filter> => {
  return state.app.waveform.channelFilters;
};

export const selectWaveformDisplayedSignalDetectionConfiguration = (state: AppState) => {
  return state.app.waveform.displayedSignalDetectionConfiguration;
};

/**
 * A redux selector for returning the station visibility
 *
 * @example const stationsVisibility = useAppState(stationsVisibility);
 *
 * @param state the redux app state
 * @returns the station visibility
 */
export const selectStationsVisibility = (state: AppState) => {
  return state.app.waveform.stationsVisibility;
};

/**
 * A redux selector for returning the viewable interval
 *
 * @param state the redux app state
 * @returns the viewable interval
 */
export const selectViewableInterval = (state: AppState) => {
  return state.app.waveform.viewableInterval;
};
