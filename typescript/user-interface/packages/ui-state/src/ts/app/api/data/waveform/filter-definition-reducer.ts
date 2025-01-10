import { FilterUtil } from '@gms/common-model';
import {
  type FilterDefinition,
  type FilterDefinitionByFilterDefinitionUsage
} from '@gms/common-model/lib/filter/types';
import { UILogger } from '@gms/ui-util';
import { isDesigned } from '@gms/ui-wasm';
import type { ActionReducerMapBuilder, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { SignalDetectionHypothesisId } from '../../../../types';
import type { DataState } from '../types';

const logger = UILogger.create('GMS_DATA_SLICE', process.env.GMS_DATA_SLICE);

/**
 * The add (designed) filter definitions action.
 */
export const addDesignedFilterDefinitions = createAction<
  FilterDefinition[],
  'data/addDesignedFilterDefinitions'
>('data/addDesignedFilterDefinitions');

/**
 * The add (designed) filter definitions by usage for signal detections action.
 */
export const addFilterDefinitionsForSignalDetections = createAction<
  {
    signalDetectionHypothesisId: SignalDetectionHypothesisId;
    filterDefinitionByFilterDefinitionUsage: FilterDefinitionByFilterDefinitionUsage;
  }[],
  'data/addFilterDefinitionsForSignalDetections'
>('data/addFilterDefinitionsForSignalDetections');

/**
 * Adds (designed) filter definitions to the Redux state store
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addDesignedFilterDefinitionsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addDesignedFilterDefinitions>
> = (state, action) => {
  action.payload.forEach(fd => {
    const { name } = fd;

    if (
      !FilterUtil.isLinearFilterParameters(fd.filterDescription.parameters) ||
      !FilterUtil.isCascadeFilterParameters(fd.filterDescription.parameters)
    ) {
      throw new Error(`Not valid LinearFilterParameters or CascadeFilterParameters`);
    }
    const sampleRateHz = fd.filterDescription.parameters?.sampleRateHz
      ? fd.filterDescription.parameters?.sampleRateHz
      : null;

    if (!name) {
      logger.error(
        'Failed to add filter definition to state store; unique name must be defined',
        fd
      );
      return;
    }

    if (sampleRateHz === null) {
      logger.error(
        'Failed to add filter definition to state store; sample rate must be defined',
        fd
      );
      return;
    }

    if (!isDesigned(fd, sampleRateHz)) {
      logger.error('Failed to add filter definition to state store; must be designed', fd);
      return;
    }

    if (state.filterDefinitions?.[name]?.[sampleRateHz]) return;

    state.filterDefinitions[name] = state.filterDefinitions?.[name] || {};

    // save as `[name][sample-rate]`
    state.filterDefinitions[name][sampleRateHz] = fd;
  });
};

/**
 * Adds filter definitions for signal detections to the Redux state store
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const addFilterDefinitionsForSignalDetectionsReducer: CaseReducer<
  DataState,
  ReturnType<typeof addFilterDefinitionsForSignalDetections>
> = (state, action) => {
  action.payload.forEach(
    ({ signalDetectionHypothesisId, filterDefinitionByFilterDefinitionUsage }) => {
      state.filterDefinitionsForSignalDetections[signalDetectionHypothesisId] =
        filterDefinitionByFilterDefinitionUsage;
    }
  );
};

/**
 * Injects the filter definition reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addFilterDefinitionReducers = (builder: ActionReducerMapBuilder<DataState>): void => {
  builder
    .addCase(addDesignedFilterDefinitions, addDesignedFilterDefinitionsReducer)
    .addCase(
      addFilterDefinitionsForSignalDetections,
      addFilterDefinitionsForSignalDetectionsReducer
    );
};
