import { createSelector } from '@reduxjs/toolkit';

import type { AssociationConflictRecord } from '../../../types';
import { selectAssociationConflict } from '../../api/data/selectors';
import type { AppState } from '../../store';

/**
 * Uses the associationConflict record from state, to return the SD Ids in conflict
 */
export const selectSignalDetectionAssociationConflictCount: (state: AppState) => string[] =
  createSelector([selectAssociationConflict], (associationConflict: AssociationConflictRecord) =>
    Object.keys(associationConflict)
  );

/**
 * Redux selector that returns the displayed signal detection configuration
 */
export const selectDisplaySignalDetectionConfiguration = (state: AppState) =>
  state.app.signalDetections.displayedSignalDetectionConfiguration;

/**
 * Redux selector that returns the signal detection table columns to be displayed
 */
export const selectSignalDetectionToDisplay = (state: AppState) =>
  state.app.signalDetections.signalDetectionsColumns;
