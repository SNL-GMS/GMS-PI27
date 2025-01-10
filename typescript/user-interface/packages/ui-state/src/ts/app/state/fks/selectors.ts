import type { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { createSelector } from '@reduxjs/toolkit';

import type { ChannelFilterRecord, SignalDetectionsRecord } from '../../../types';
import { selectSignalDetections } from '../../api/data';
import type { AppState } from '../../store';
import type { FkThumbnailsFilterType } from './types';

/**
 * a selector to get the signal detection IDs to show in FK display out of the redux state.
 *
 * @example
 * const sdIdsToShowFk = useAppSelector(selectSdIdsToShowFk);
 *
 * @param state the AppState
 * @returns array signal detection IDs as strings
 */
export const selectSdIdsToShowFk: (state: AppState) => string[] = state =>
  state.app.fks.sdIdsToShowFk;

/**
 * a selector to get the FK plots hide/show beams and traces toolbar
 *
 * @example
 * const showToolbar = useAppSelector(selectFkPlotsExpandToolbar);
 *
 * @param state the AppState
 * @returns boolean
 */
export const selectFkPlotsExpandToolbar: (state: AppState) => boolean = state =>
  state.app.fks.fkPlotsExpandToolbar;

/**
 * a selector to get the current filter being applied to the Fk thumbnails
 *
 * @example
 * const currentFkThumbnailFilter = useAppSelector(selectCurrentFkThumbnailFilter);
 *
 * @param state the AppState
 * @returns FkThumbnailsFilterType
 */
export const selectCurrentFkThumbnailFilter: (state: AppState) => FkThumbnailsFilterType = state =>
  state.app.fks.currentFkThumbnailFilter;

/**
 * a selector to get the fk channel filters
 *
 * @example
 * const fkChannelFilters = useAppSelector(selectFkChannelFilters);
 *
 * @param state the AppState
 * @returns a record of signal detection id's to ChannelFilterRecord
 */
export const selectFkChannelFilters: (
  state: AppState
) => Record<string, ChannelFilterRecord> = state => state.app.fks.fkChannelFilters;

/**
 * a selector to get the current filter being applied to the Fk thumbnails
 *
 * @example
 * const currentFkThumbnailFilter = useAppSelector(selectCurrentFkThumbnailFilter);
 *
 * @param state the AppState
 * @returns FkThumbnailsFilterType
 */
export const selectDisplayedSignalDetectionId: (state: AppState) => string = state =>
  state.app.fks.displayedSignalDetectionId;

/**
 * a selector to get the currently-displayed Signal Detection
 *
 * @param state the AppState
 * @returns SignalDetection or undefined if not found
 */
export const selectedDisplayedSignalDetection: (
  state: AppState
) => SignalDetectionTypes.SignalDetection | undefined = createSelector(
  [selectSignalDetections, selectDisplayedSignalDetectionId],
  (signalDetections: SignalDetectionsRecord, displayedSdId: string) => {
    return signalDetections[displayedSdId];
  }
);

/**
 * Last SD's measured values set by FK's main display
 * @param state AppState
 * @returns Azimuth/Slowness values and signal detection ID
 */
export const selectSignalDetectionMeasuredValues = (
  state: AppState
): FkTypes.FkMeasuredValues | undefined => state.app.fks.displayedSDMeasuredValues;
