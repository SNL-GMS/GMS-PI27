import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import sortBy from 'lodash/sortBy';

import type { CommonState, GLDisplayState } from './types';

/**
 * The initial state for the common state.
 */
export const commonInitialState: CommonState = {
  commandPaletteIsVisible: false,
  keyboardShortcutsVisibility: false,
  userPreferencesVisibility: false,
  keyPressActionQueue: {},
  selectedStationIds: [],
  glLayoutState: {},
  uniqueComponent: {}
};

/**
 * The common reducer slice.
 */
export const commonSlice = createSlice({
  name: 'common',
  initialState: commonInitialState,
  reducers: {
    /**
     * Sets the command palette visibility
     *
     * @param state the state
     * @param action the action
     */
    setCommandPaletteVisibility(state, action: PayloadAction<boolean>) {
      state.commandPaletteIsVisible = action.payload;
    },

    /**
     * Sets the keyboard shortcuts dialog visibility
     */
    setKeyboardShortcutsVisibility(state, action: PayloadAction<boolean>) {
      state.keyboardShortcutsVisibility = action.payload;
    },

    /**
     * Sets the user preferences dialog visibility
     */
    setUserPreferencesVisibility(state, action: PayloadAction<boolean>) {
      state.userPreferencesVisibility = action.payload;
    },

    /**
     * Sets key press action queue
     *
     * @param state the state
     * @param action the action
     */
    setKeyPressActionQueue(state, action: PayloadAction<Record<string, number>>) {
      state.keyPressActionQueue = action.payload;
    },

    /**
     * Sets the selected station ids
     *
     * @param state the state
     * @param action the action
     */
    setSelectedStationIds(state, action: PayloadAction<string[]>) {
      state.selectedStationIds = sortBy(action.payload);
    },

    /**
     * Sets the golden layout state
     *
     * @param state the state
     * @param action the action
     */
    setGlLayoutState(state, action: PayloadAction<Record<string, GLDisplayState>>) {
      state.glLayoutState = action.payload;
    },
    setUniqueComponent(state, action: PayloadAction<{ name: string; id: number }>) {
      const { name, id } = action.payload;
      // If we haven't seen the key, initialize it
      if (!state.uniqueComponent[name]) {
        state.uniqueComponent[name] = 0;
      }
      // If the id is greater then the current id, set the id
      if (id >= state.uniqueComponent[name]) {
        state.uniqueComponent[name] = id;
      }
    }
  }
});

/**
 * The common actions.
 */
export const commonActions = commonSlice.actions;
