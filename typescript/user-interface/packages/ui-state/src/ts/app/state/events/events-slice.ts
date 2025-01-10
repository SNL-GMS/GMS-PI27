import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { DisplayedEventsConfigurationEnum, EventsColumn, EventsState } from './types';

/**
 * The initial state for the signal detections panel.
 */
export const eventsInitialState: EventsState = {
  eventsColumns: {
    conflict: true,
    time: true,
    timeUncertainty: true,
    latitudeDegrees: true,
    longitudeDegrees: true,
    depthKm: true,
    depthUncertainty: true,
    region: true,
    confidenceSemiMajorAxis: true,
    confidenceSemiMinorAxis: true,
    coverageSemiMajorAxis: true,
    coverageSemiMinorAxis: true,
    coverageSemiMajorTrend: true,
    confidenceSemiMajorTrend: true,
    magnitudeMb: true,
    magnitudeMs: true,
    magnitudeMl: true,
    activeAnalysts: true,
    preferred: true,
    status: true,
    deleted: true,
    rejected: true,
    unsavedChanges: true,
    numberAssociated: true,
    numberDefining: true,
    observationsStandardDeviation: true
  },
  displayedEventsConfiguration: {
    edgeEventsBeforeInterval: true,
    edgeEventsAfterInterval: true,
    eventsCompleted: true,
    eventsRemaining: true,
    eventsConflict: true,
    eventsDeleted: false, // overridden by analyst config setting
    eventsRejected: false // overridden by analyst config setting
  }
};

/**
 * The signal detections panel state reducer slice
 */
export const eventsSlice = createSlice({
  name: 'events',
  initialState: eventsInitialState,
  reducers: {
    /**
     * Sets the boolean that determines if an events column should be displayed
     */
    updateEventsColumns: (state, action: PayloadAction<Record<EventsColumn, boolean>>) => {
      state.eventsColumns = action.payload;
    },
    /**
     * Sets the boolean that determines if a category of events should be displayed
     */
    updateDisplayedEventsConfiguration: (
      state,
      action: PayloadAction<Record<DisplayedEventsConfigurationEnum, boolean>>
    ) => {
      state.displayedEventsConfiguration = action.payload;
    }
  }
});
export const eventsActions = eventsSlice.actions;
