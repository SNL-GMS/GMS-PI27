import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * A function that returns a generic reducer for replacing entity values at the first level of the object.
 *
 * @param initial the initial or default value
 * @returns returns a {@link Reducer} for replacing each value of type T
 */
export function createReplaceEntityReducer<T extends object>(initial?: T) {
  return function replaceEntityReducer(state: T, action?: PayloadAction<T>) {
    const update = action?.payload ? action.payload : initial;
    if (update) {
      Object.keys(state).forEach(entry => {
        if (state[entry] !== update[entry]) {
          state[entry] = update[entry];
        }
      });
    }
  };
}
