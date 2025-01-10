import type { CommonTypes, EventTypes } from '@gms/common-model';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import chunk from 'lodash/chunk';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';
import memoize from 'lodash/memoize';
import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';

import type { AsyncFetchHistory, AsyncFetchHistoryEntry, AsyncFetchResult } from '../../../query';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  PrepareRequestConfig,
  ShouldSkip,
  TransformArgs,
  TransformResult,
  UpdateState
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { AppState } from '../../../store';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

/**
 * The maximum phases per request.
 */
const MAX_PHASES = 15;

/**
 * The maximum {@link ReceiverCollection} per request.
 */
const MAX_RECEIVERS = 1;

/**
 * The maximum {@link ReceiverLocation}s per request.
 */
const MAX_RECEIVER_LOCATIONS_BY_NAME = 300;

const logger = UILogger.create(
  'GMS_PREDICT_FEATURES_FOR_EVENT_LOCATION',
  process.env.GMS_PREDICT_FEATURES_FOR_EVENT_LOCATION
);

export interface ReceiverCollection {
  receiverDataType?: string;
  receiverBandType?: string;
  /**
   * keyed on station or channel name
   */
  receiverLocationsByName: Record<string, CommonTypes.Location>;
}

export interface PredictFeaturesForEventLocationArgs {
  receivers: ReceiverCollection[];
  sourceLocation: EventTypes.EventLocation | undefined;
  phases: string[];
}

export interface ReceiverLocation {
  featurePredictions: EventTypes.FeaturePrediction[];
}

export interface PredictFeatures {
  receiverLocationsByName: Record<string, ReceiverLocation>;
}

export type PredictFeaturesForEventLocation = Record<string, PredictFeatures>;

export type PredictFeaturesForEventLocationQueryResult = AsyncFetchResult<PredictFeatures>;

export type PredictFeaturesForEventLocationHistory =
  AsyncFetchHistory<PredictFeaturesForEventLocationArgs>;

export interface PredictFeaturesForEventLocationQueryProps {
  featurePredictionQuery: PredictFeaturesForEventLocationQueryResult;
}

type ReceiversByPhasesBandByDataByChannel = Record<
  string,
  Record<string, Record<string, Record<string, CommonTypes.Location>>>
>;

/**
 * @returns a string representation of a {@link EventTypes.EventLocation}
 */
export function eventLocationToString(
  value: EventTypes.EventLocation | undefined
): string | undefined {
  return value
    ? `${value.time}_${value.depthKm}_${value.latitudeDegrees}_${value.longitudeDegrees}`
    : undefined;
}

/**
 * @returns a string representation of a {@link ReceiverCollection}
 */
function receiverCollectionToString(value: ReceiverCollection): string | undefined {
  return value
    ? `${value.receiverBandType}_${value.receiverDataType}_${uniqSortStrings(
        Object.keys(value.receiverLocationsByName).map(k => k)
      )}`
    : undefined;
}

/**
 * Filters the history entries based on the provided arguments.
 *
 * @param args the query arguments, {@link PredictFeaturesForEventLocationArgs}
 * @param entries the history entries of previous queries
 * @returns the filtered history entries
 */
function filterHistoryEntries(
  args: PredictFeaturesForEventLocationArgs,
  entries: AsyncFetchHistoryEntry<PredictFeaturesForEventLocationArgs>[]
): AsyncFetchHistoryEntry<PredictFeaturesForEventLocationArgs>[] {
  const { sourceLocation, phases } = args;
  // only include entries for the same source location and at least one phase
  return entries.filter(
    e =>
      e.arg.sourceLocation?.time === sourceLocation?.time &&
      e.arg.sourceLocation?.depthKm === sourceLocation?.depthKm &&
      e.arg.sourceLocation?.latitudeDegrees === sourceLocation?.latitudeDegrees &&
      e.arg.sourceLocation?.longitudeDegrees === sourceLocation?.longitudeDegrees &&
      intersection(phases, e.arg.phases).length > 0
  );
}

/**
 * Finds the already requested phases for the provided arguments.
 *
 * @param entries the history entries of previous queries
 * @param receiverBandType the receiver band type
 * @param receiverDataType the receiver data type
 * @param name the channel name
 * @param location the channel location
 * @returns a collection of phases already requested for the provided:
 *   {@link receiverBandType}, {@link receiverDataType}, {@link name}, and {@link location}
 */
function findAlreadyRequestedPhases(
  entries: AsyncFetchHistoryEntry<PredictFeaturesForEventLocationArgs>[],
  receiverBandType: string | undefined,
  receiverDataType: string | undefined,
  name: string,
  location: CommonTypes.Location
): string[] {
  return entries.flatMap(entry => {
    return entry.arg.receivers.flatMap(rev => {
      if (
        rev.receiverBandType === receiverBandType &&
        rev.receiverDataType === receiverDataType &&
        rev.receiverLocationsByName[name] &&
        rev.receiverLocationsByName[name] === location
      ) {
        return entry.arg.phases;
      }
      return [];
    });
  });
}

/**
 * Reduces the arguments to a record type {@link ReceiversByPhasesBandByDataByChannel}.
 * Used to dedup queries.
 *
 * @param args the query arguments, {@link PredictFeaturesForEventLocationArgs}
 * @param entries the history entries of previous queries
 * @returns a record that maps receivers by phases by band type by data type
 */
function reduceArgs(
  args: PredictFeaturesForEventLocationArgs,
  entries: AsyncFetchHistoryEntry<PredictFeaturesForEventLocationArgs>[]
): ReceiversByPhasesBandByDataByChannel {
  const { receivers, phases } = args;
  const filteredEntries = filterHistoryEntries(args, entries);

  // reduce and dedup the receivers based on band/data/phases
  const receiversByPhasesBandByDataByChannel: ReceiversByPhasesBandByDataByChannel = {};
  receivers.forEach(receiver => {
    const { receiverBandType, receiverDataType, receiverLocationsByName } = receiver;

    Object.entries(receiverLocationsByName).forEach(([name, location]) => {
      const foundPhases = findAlreadyRequestedPhases(
        filteredEntries,
        receiverBandType,
        receiverDataType,
        name,
        location
      );

      const missingPhases = uniqSortStrings(difference(phases, foundPhases));
      if (missingPhases.length > 0) {
        const phasesStr = missingPhases.join(';');
        const receiverBandTypeProp = receiverBandType || 'undefined';
        const receiverDataTypeProp = receiverDataType || 'undefined';

        if (!receiversByPhasesBandByDataByChannel[phasesStr]) {
          receiversByPhasesBandByDataByChannel[phasesStr] = {};
        }

        if (!receiversByPhasesBandByDataByChannel[phasesStr][receiverBandTypeProp]) {
          receiversByPhasesBandByDataByChannel[phasesStr][receiverBandTypeProp] = {};
        }

        if (
          !receiversByPhasesBandByDataByChannel[phasesStr][receiverBandTypeProp][
            receiverDataTypeProp
          ]
        ) {
          receiversByPhasesBandByDataByChannel[phasesStr][receiverBandTypeProp][
            receiverDataTypeProp
          ] = {};
        }

        receiversByPhasesBandByDataByChannel[phasesStr][receiverBandTypeProp][receiverDataTypeProp][
          name
        ] = location;
      }
    });
  });

  return receiversByPhasesBandByDataByChannel;
}

const idGenerator: IdGenerator<PredictFeaturesForEventLocationArgs> = args => {
  const sourceLocation = `sourceLocation:${eventLocationToString(args.sourceLocation)}`;
  const receiverStrings = args.receivers.map(receiverCollectionToString);
  const receivers = `receivers:${uniqSortStrings(
    receiverStrings.some(str => str === undefined) ? [''] : (receiverStrings as string[])
  ).join(';')}`;
  const phases = `phases:${uniqSortStrings(args.phases).join(';')}`;
  return `${sourceLocation}/${receivers}/${phases}`;
};

const memoizedReduceArgs = memoize(
  reduceArgs,
  (args, entries) => `${idGenerator(args)}+${entries.length}`
);
const shouldSkip: ShouldSkip<PredictFeaturesForEventLocationArgs> = args =>
  args == null ||
  args.sourceLocation == null ||
  args.receivers == null ||
  args.receivers.length < 1 ||
  args.phases == null ||
  args.phases.length < 1;

const transformArgs: TransformArgs<PredictFeaturesForEventLocationArgs> = (
  args,
  history,
  id,
  entries
) => {
  const { sourceLocation } = args;
  const receiversByPhasesBandByDataByChannel = memoizedReduceArgs(args, entries);
  const receivers = Object.keys(receiversByPhasesBandByDataByChannel).flatMap(phasesStr =>
    Object.keys(receiversByPhasesBandByDataByChannel[phasesStr]).flatMap(band =>
      Object.keys(receiversByPhasesBandByDataByChannel[phasesStr][band]).flatMap(data => {
        const receiverBandType = band === 'undefined' ? undefined : band;
        const receiverDataType = data === 'undefined' ? undefined : data;
        return {
          receiverBandType,
          receiverDataType,
          receiverLocationsByName: receiversByPhasesBandByDataByChannel[phasesStr][band][data]
        };
      })
    )
  );
  return {
    sourceLocation,
    receivers: uniqBy(
      sortBy(receivers, r => receiverCollectionToString(r)),
      r => receiverCollectionToString(r)
    ),
    phases: uniqSortStrings(
      Object.keys(receiversByPhasesBandByDataByChannel).flatMap(p => p.split(';'))
    )
  };
};

const prepareRequestConfig: PrepareRequestConfig<PredictFeaturesForEventLocationArgs, AppState> = (
  args,
  requestConfig,
  history,
  id,
  entries
) => {
  const { sourceLocation } = args;
  const receiversByPhasesBandByDataByChannel = memoizedReduceArgs(args, entries);

  return Object.keys(receiversByPhasesBandByDataByChannel).flatMap(phasesStr => {
    const receivers = Object.keys(receiversByPhasesBandByDataByChannel[phasesStr]).flatMap(band =>
      Object.keys(receiversByPhasesBandByDataByChannel[phasesStr][band]).flatMap(data => {
        const receiverBandType = band === 'undefined' ? undefined : band;
        const receiverDataType = data === 'undefined' ? undefined : data;
        // chunk the size of receiver locations by name to a max size
        const receiverLocationsByNameChunks = chunk(
          Object.entries(receiversByPhasesBandByDataByChannel[phasesStr][band][data]),
          MAX_RECEIVER_LOCATIONS_BY_NAME
        );
        return receiverLocationsByNameChunks.map(c => ({
          receiverBandType,
          receiverDataType,
          receiverLocationsByName: Object.fromEntries(c)
        }));
      })
    );

    // chunk the size of phases to a max size
    const phaseChunks = chunk(uniqSortStrings(phasesStr.split(';')), MAX_PHASES);

    // chunk the size of receivers to a max size
    const receiverChunks = chunk(receivers, MAX_RECEIVERS);

    return receiverChunks.flatMap(r =>
      phaseChunks.flatMap(p => ({
        ...requestConfig,
        data: {
          sourceLocation,
          phases: p,
          receivers: r
        }
      }))
    );
  });
};

const transformResult: TransformResult<PredictFeaturesForEventLocationArgs, PredictFeatures> = (
  args,
  results
) => {
  const mergedResults: PredictFeatures = { receiverLocationsByName: {} };

  results.forEach(result => {
    if (result)
      Object.entries(result.receiverLocationsByName).forEach(value => {
        const [receiver, receiverLocation] = value;
        if (!mergedResults.receiverLocationsByName[receiver]) {
          mergedResults.receiverLocationsByName[receiver] = {
            featurePredictions: []
          };
        }
        mergedResults.receiverLocationsByName[receiver].featurePredictions =
          mergedResults.receiverLocationsByName[receiver].featurePredictions.concat(
            receiverLocation.featurePredictions
          );
      });
  });

  return mergedResults;
};

const updateState: UpdateState<PredictFeaturesForEventLocationArgs, PredictFeatures, DataState> = (
  action,
  state
) => {
  const id = eventLocationToString(action.meta.arg.sourceLocation);
  if (id) {
    if (!state.predictFeaturesForEventLocation[id]) {
      state.predictFeaturesForEventLocation[id] = { receiverLocationsByName: {} };
    }
    if (action.payload !== undefined) {
      Object.entries(action.payload.receiverLocationsByName).forEach(value => {
        const [receiver, receiverLocation] = value;
        if (
          state.predictFeaturesForEventLocation[id] &&
          !state.predictFeaturesForEventLocation[id]?.receiverLocationsByName[receiver]
        ) {
          state.predictFeaturesForEventLocation[id].receiverLocationsByName[receiver] = {
            featurePredictions: []
          };
        }

        state.predictFeaturesForEventLocation[id].receiverLocationsByName[
          receiver
        ].featurePredictions = state.predictFeaturesForEventLocation[id].receiverLocationsByName[
          receiver
        ].featurePredictions.concat(receiverLocation.featurePredictions);
      });
    }
  }
};

/**
 * Defines the Predict Features for Event Location Query as an {@link createAsyncThunkQuery}.
 */
export const predictFeaturesForEventLocationQuery: CreateAsyncThunkQueryProps<
  PredictFeaturesForEventLocationArgs,
  PredictFeatures,
  DataState
> = {
  typePrefix: 'eventManagerApi/predictFeaturesForEventLocation',
  config: config.event.services.predictFeaturesForEventLocation.requestConfig,
  logger,
  preCacheEnabled:
    process.env.GMS_DISABLE_PRE_CACHE_PREDICTION_FEATURES_FOR_EVENT_LOCATION !== 'true',
  getSliceState: state => state.data,
  getHistory: state => state.queries.predictFeaturesForEventLocation,
  idGenerator,
  shouldSkip,
  transformArgs,
  prepareRequestConfig,
  transformResult,
  updateState
};

export const {
  asyncQuery: predictFeaturesForEventLocation,
  addMatchReducers: addPredictFeaturesForEventLocationMatchReducers,
  usePreCache: usePreCachePredictFeaturesForEventLocation
} = createAsyncThunkQuery<PredictFeaturesForEventLocationArgs, PredictFeatures, DataState>(
  predictFeaturesForEventLocationQuery
);
