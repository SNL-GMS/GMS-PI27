import type {
  FacetedTypes,
  FilterTypes,
  SignalDetectionTypes,
  WorkflowTypes
} from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import includes from 'lodash/includes';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import memoizeOne from 'memoize-one';

import type { AsyncFetchHistory, DataState, SignalDetectionsRecord } from '../../../../ui-state';
import { fetchFilterDefinitionsForSignalDetections } from '../../../../workers/api';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  ShouldSkip,
  TransformArgs,
  UpdateState
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import { config } from './endpoint-configuration';

export interface GetFilterDefinitionsForSignalDetectionsQueryArgs {
  stageId: {
    name: string;
  };
  signalDetections: FacetedTypes.EntityReference<'id', SignalDetectionTypes.SignalDetection>[];
}

export type GetFilterDefinitionsForSignalDetectionsHistory =
  AsyncFetchHistory<GetFilterDefinitionsForSignalDetectionsQueryArgs>;

interface FacetedFilterDefinitionByUsageBySignalDetectionHypothesis {
  signalDetectionHypothesis: SignalDetectionTypes.SignalDetectionHypothesisFaceted;
  filterDefinitionByFilterDefinitionUsage: FilterTypes.FilterDefinitionByFilterDefinitionUsage;
}

export interface FetchFilterDefinitionsForSignalDetectionsResponse {
  filterDefinitionByUsageBySignalDetectionHypothesis: FacetedFilterDefinitionByUsageBySignalDetectionHypothesis[];
}

const logger = UILogger.create(
  'GMS_GET_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS',
  process.env.GMS_GET_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS
);

const idGenerator: IdGenerator<GetFilterDefinitionsForSignalDetectionsQueryArgs> = args => {
  const stage = `stageId:${args.stageId.name}`;
  const signalDetections = `signalDetections:${args.signalDetections
    .map(sd => sd.id)
    .sort()
    .join(';')}`;
  return `${stage}/${signalDetections}`;
};

const shouldSkip: ShouldSkip<GetFilterDefinitionsForSignalDetectionsQueryArgs> = args =>
  args == null ||
  args.stageId?.name == null ||
  args.signalDetections == null ||
  args.signalDetections.length === 0;

const transformArgs: TransformArgs<GetFilterDefinitionsForSignalDetectionsQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  const { stageId, signalDetections } = args;
  // only include entries for the same stage id
  const filteredEntries = entries.filter(e => e.arg.stageId.name === stageId.name);
  const existingIds = uniq(filteredEntries.flatMap(e => e.arg.signalDetections.map(sd => sd.id)));
  return {
    stageId,
    signalDetections: sortBy(
      signalDetections.filter(sd => !includes(existingIds, sd.id)),
      sd => sd.id
    )
  };
};

const updateState: UpdateState<
  GetFilterDefinitionsForSignalDetectionsQueryArgs,
  FetchFilterDefinitionsForSignalDetectionsResponse,
  DataState
> = (action, state) => {
  if (action.payload) {
    const { filterDefinitionByUsageBySignalDetectionHypothesis } = action.payload;

    const filterDefinitionsForSignalDetectionRecords =
      filterDefinitionByUsageBySignalDetectionHypothesis.reduce((record, data) => {
        return {
          ...record,
          [data.signalDetectionHypothesis.id.id]: data.filterDefinitionByFilterDefinitionUsage
        };
      }, {});

    state.filterDefinitionsForSignalDetections = {
      ...state.filterDefinitionsForSignalDetections,
      ...filterDefinitionsForSignalDetectionRecords
    };
  }
};

export const getFilterDefinitionsForSignalDetectionsQuery: CreateAsyncThunkQueryProps<
  GetFilterDefinitionsForSignalDetectionsQueryArgs,
  FetchFilterDefinitionsForSignalDetectionsResponse,
  DataState
> = {
  typePrefix: 'signalDetection/getFilterDefinitionsForSignalDetections',
  config: config.signalDetection.services.getFilterDefinitionsForSignalDetections.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getFilterDefinitionsForSignalDetections,
  idGenerator,
  shouldSkip,
  transformArgs,
  customQueryFunc: fetchFilterDefinitionsForSignalDetections,
  updateState
};

/**
 * Filters out signal detections with unsaved changes, the backend will not know about these ids.
 * Reduces the Signal Detections to include the bare minimum information for the query, we don't need to send the whole Signal Detection
 * Also called in the @link populateFilterDefinitionsForSignalDetectionsMiddleware on a failed query to determine if args have changed and if retries are necessary
 * @param signalDetections for the query
 * @returns FacetedTypes.EntityReference<'id', SignalDetectionTypes.SignalDetection>[]
 */
export function reduceSignalDetectionsForFilterDefinitionQuery(
  signalDetections: SignalDetectionsRecord
): FacetedTypes.EntityReference<'id', SignalDetectionTypes.SignalDetection>[] {
  return sortBy(
    Object.values(signalDetections)
      .filter(sd => sd._uiHasUnsavedChanges == null && sd._uiHasUnsavedEventSdhAssociation == null)
      .map(sd => ({ id: sd.id })),
    sd => sd.id
  );
}

export const {
  asyncQuery: getFilterDefinitionsForSignalDetectionsAsyncThunkQuery,
  addMatchReducers: getFilterDefinitionsForSignalDetectionsMatchReducers
} = createAsyncThunkQuery<
  GetFilterDefinitionsForSignalDetectionsQueryArgs,
  FetchFilterDefinitionsForSignalDetectionsResponse,
  DataState
>(getFilterDefinitionsForSignalDetectionsQuery);

export const addGetFilterDefinitionsForSignalDetectionsMatchReducers =
  getFilterDefinitionsForSignalDetectionsMatchReducers;

export const getFilterDefinitionsForSignalDetections = memoizeOne(
  (
    intervalId: WorkflowTypes.WorkflowDefinitionId,
    signalDetections: FacetedTypes.EntityReference<'id', SignalDetectionTypes.SignalDetection>[]
  ) =>
    getFilterDefinitionsForSignalDetectionsAsyncThunkQuery({
      stageId: intervalId,
      signalDetections
    })
);
