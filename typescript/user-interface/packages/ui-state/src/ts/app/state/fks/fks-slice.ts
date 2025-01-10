import type { FilterTypes, FkTypes } from '@gms/common-model';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { FksState } from './types';
import { FkThumbnailsFilterType } from './types';

/**
 * The initial fk state.
 */
export const fksInitialState: FksState = {
  sdIdsToShowFk: [],
  fkPlotsExpandToolbar: true,
  currentFkThumbnailFilter: FkThumbnailsFilterType.KEYACTIVITYPHASES,
  fkChannelFilters: {},
  displayedSignalDetectionId: '',
  displayedSDMeasuredValues: undefined
};

/**
 * The signal detections panel state reducer slice
 */
export const fksSlice = createSlice({
  name: 'fks',
  initialState: fksInitialState,
  reducers: {
    /**
     * Sets the signal detection ids that have been marked to show FK.
     *
     * @param state the state
     * @param action the action
     */
    setSdIdsToShowFk(state, action: PayloadAction<string[]>) {
      state.sdIdsToShowFk = action.payload;
    },
    /**
     * Sets the boolean that determines if FK toolbar should be expanded or collapsed
     */
    setFkPlotsExpandToolbar: (state, action: PayloadAction<boolean>) => {
      state.fkPlotsExpandToolbar = action.payload;
    },
    /**
     * Sets the FkThumbnailsFilterType for filtering the FK thumbnails
     */
    setCurrentFkThumbnailFilter: (state, action: PayloadAction<FkThumbnailsFilterType>) => {
      state.currentFkThumbnailFilter = action.payload;
    },
    /**
     * Sets the filter applied to a given channel for the current signal detection
     */
    setFkFilterForSignalDetectionAndChannel(
      state,
      action: PayloadAction<{
        displayedSignalDetectionId: string;
        channelOrSdName: string;
        filter: FilterTypes.Filter;
      }>
    ) {
      state.fkChannelFilters = {
        [action.payload.displayedSignalDetectionId]: {
          [action.payload.channelOrSdName]: action.payload.filter
        }
      };
    },
    /*
     * Sets the SD id for the Fk to be displayed
     */
    setDisplayedSignalDetectionId: (state, action: PayloadAction<string>) => {
      state.displayedSignalDetectionId = action.payload;
    },
    /*
     * Sets the Azimuth/Slowness measured values for displayed SD
     */
    setSignalDetectionMeasuredValue: (
      state,
      action: PayloadAction<FkTypes.FkMeasuredValues | undefined>
    ) => {
      state.displayedSDMeasuredValues = action.payload;
    }
  }
});
export const fksActions = fksSlice.actions;
