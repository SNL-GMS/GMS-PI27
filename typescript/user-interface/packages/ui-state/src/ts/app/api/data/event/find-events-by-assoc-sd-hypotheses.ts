import type { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { IS_NODE_ENV_DEVELOPMENT, LogLevel, uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import { isDraft, original } from 'immer';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';
import uniq from 'lodash/uniq';

import type { AppState } from '../../..';
import type {
  CreateAsyncThunkQueryProps,
  IdGenerator,
  ShouldSkip,
  TransformArgs,
  TransformResult,
  UpdateState,
  ValidateResult
} from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';
import type { FindEventsByAssociatedSignalDetectionHypothesesQueryArgs } from './types';

// TODO: Remove error default value when teh end point doesn't return duplicate ids
const logger = UILogger.create(
  'GMS_LOG_FETCH_EVENTS',
  process.env.GMS_LOG_FETCH_EVENTS || LogLevel.ERROR
);

export interface FindEventsByAssociatedSignalDetectionHypothesesArgs {
  signalDetectionHypotheses: SignalDetectionTypes.SignalDetectionHypothesis[];
  stageId: { name: string };
}

const shouldSkip: ShouldSkip<FindEventsByAssociatedSignalDetectionHypothesesQueryArgs> = args =>
  !args || args.signalDetectionHypotheses.length === 0 || args.stageId == null;

/** validate event data received from the backend; check for duplicates */
const validateEventData = (state: DataState, event: EventTypes.Event) => {
  // validate the received events; check for any duplicates and differences
  if (IS_NODE_ENV_DEVELOPMENT) {
    if (state.events[event.id] !== undefined) {
      const originalEvent = isDraft(state.events[event.id])
        ? original<EventTypes.Event>(state.events[event.id])
        : state.events[event.id];
      if (originalEvent) {
        if (!isEqual(originalEvent, event)) {
          logger.warn(
            `findEventsByAssociatedSignalDetectionHypotheses - received duplicate event that are different for id ${originalEvent.id}`,
            originalEvent,
            event
          );
        } else {
          logger.warn(
            `findEventsByAssociatedSignalDetectionHypotheses - received duplicate event that are equal for id ${originalEvent.id}`
          );
        }
      }
    }
  }
};

const idGenerator: IdGenerator<FindEventsByAssociatedSignalDetectionHypothesesQueryArgs> = args => {
  const sdIds = `sdIds:${uniqSortStrings(args?.signalDetectionHypotheses?.map(sd => sd.id.id)).join(
    ';'
  )}`;

  return `stage:${args.stageId?.name}-${sdIds}`;
};

const updateState: UpdateState<
  FindEventsByAssociatedSignalDetectionHypothesesQueryArgs,
  EventTypes.Event[],
  DataState
> = (action, state) => {
  action.payload?.forEach(event => {
    state.events[event.id] = event;
  });
};

const validateResult: ValidateResult<
  FindEventsByAssociatedSignalDetectionHypothesesQueryArgs,
  EventTypes.Event[],
  AppState
> = (args, result, state) => {
  result?.forEach(event => {
    validateEventData(state.data, event);
  });

  return undefined;
};

const transformResult: TransformResult<
  FindEventsByAssociatedSignalDetectionHypothesesQueryArgs,
  EventTypes.Event[]
> = (args, results) => {
  return flatMap(results.map(result => result ?? []));
};

const transformArgs: TransformArgs<FindEventsByAssociatedSignalDetectionHypothesesQueryArgs> = (
  args,
  history,
  id,
  entries
) => {
  const utilizedSdHypothesesIds = uniqSortStrings(
    flatMap(entries.map(v => v.arg.signalDetectionHypotheses)).map(sdh => sdh.id.id)
  );

  return {
    signalDetectionHypotheses: uniq(
      args.signalDetectionHypotheses.filter(
        sdHypothesis => !utilizedSdHypothesesIds.includes(sdHypothesis.id.id)
      )
    ),
    stageId: args.stageId
  };
};

export const findEventsByAssociatedSignalDetectionHypothesesQuery: CreateAsyncThunkQueryProps<
  FindEventsByAssociatedSignalDetectionHypothesesQueryArgs,
  EventTypes.Event[],
  DataState
> = {
  typePrefix: 'eventManagerApi/findEventsByAssociatedSignalDetectionHypotheses',
  config: config.event.services.findEventsByAssociatedSignalDetectionHypotheses.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.findEventsByAssociatedSignalDetectionHypotheses,
  idGenerator,
  shouldSkip,
  updateState,
  transformArgs,
  transformResult,
  validateResult
};

export const {
  asyncQuery: findEventsByAssociatedSignalDetectionHypotheses,
  addMatchReducers: addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers
} = createAsyncThunkQuery<
  FindEventsByAssociatedSignalDetectionHypothesesQueryArgs,
  EventTypes.Event[],
  DataState
>(findEventsByAssociatedSignalDetectionHypothesesQuery);
