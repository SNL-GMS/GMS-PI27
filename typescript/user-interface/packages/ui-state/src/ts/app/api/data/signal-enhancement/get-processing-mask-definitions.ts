import type {
  ChannelSegmentTypes,
  ChannelTypes,
  FacetedTypes,
  WorkflowTypes
} from '@gms/common-model';
import { uniqSortEntityOrVersionReference } from '@gms/common-model';
import type { ProcessingOperation } from '@gms/common-model/lib/channel-segment/types';
import type { ProcessingMaskDefinition } from '@gms/common-model/lib/processing-mask-definitions/types';
import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { WritableDraft } from 'immer/dist/internal';
import chunk from 'lodash/chunk';
import difference from 'lodash/difference';
import includes from 'lodash/includes';

import type { AsyncFetchHistory, AsyncFetchResult } from '../../../query';
import type { CreateAsyncThunkQueryProps } from '../../../query/create-async-thunk-query';
import { createAsyncThunkQuery } from '../../../query/create-async-thunk-query';
import { determineMissingPairs } from '../deduplication-utils';
import type { DataState } from '../types';
import { config } from './endpoint-configuration';

export const MAX_CHANNELS_PER_REQUEST = 100;

const logger = UILogger.create(
  'GMS_GET_PROCESSING_MASK_DEFINITIONS',
  process.env.GMS_GET_PROCESSING_MASK_DEFINITIONS
);

export interface GetProcessingMaskDefinitionsQueryArgs {
  stationGroup: WorkflowTypes.StationGroup;
  channels: FacetedTypes.VersionReference<'name', ChannelTypes.Channel>[];
  processingOperations: ChannelSegmentTypes.ProcessingOperation[];
  phaseTypes: string[];
}

type ProcessingMaskDefinitionsByPhase = Record<string, ProcessingMaskDefinition[]>;

export interface ProcessingMaskDefinitionsByPhaseByChannel {
  channel: FacetedTypes.VersionReference<'name', ChannelTypes.Channel>;
  processingMaskDefinitionByPhase: ProcessingMaskDefinitionsByPhase;
}

export interface GetProcessingMaskDefinitionsQueryResult {
  processingMaskDefinitionByPhaseByChannel: ProcessingMaskDefinitionsByPhaseByChannel[];
}

export type GetProcessingMaskDefinitionsHistory =
  AsyncFetchHistory<GetProcessingMaskDefinitionsQueryArgs>;

type ProcessingMaskDefinitionByProcessingOperation = Partial<
  Record<ProcessingOperation, ProcessingMaskDefinition>
>;

type ProcessingMaskDefinitionByProcessingOperationByPhase = Partial<
  Record<string /* phase */, ProcessingMaskDefinitionByProcessingOperation>
>;

export interface ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel {
  channel: FacetedTypes.VersionReference<'name', ChannelTypes.Channel>;
  processingMaskDefinitions: ProcessingMaskDefinitionByProcessingOperationByPhase;
}

/**
 * Help function for updating the processing mask definition state
 *
 * @param pmd {@link ProcessingMaskDefinitionsByPhaseByChannel}
 * @param draftEntry the draft entry to update
 */
const updateProcessingMaskDefinitions = (
  pmd: ProcessingMaskDefinitionsByPhaseByChannel,
  entry: WritableDraft<ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel>
) => {
  const draftEntry = entry;
  Object.entries(pmd.processingMaskDefinitionByPhase).forEach(([phase, defs]) => {
    defs.forEach(def => {
      if (!draftEntry.processingMaskDefinitions[phase]) {
        draftEntry.processingMaskDefinitions[phase] = {};
      }
      const draftEntryByPhase = draftEntry.processingMaskDefinitions[phase];
      if (draftEntryByPhase) {
        draftEntryByPhase[def.processingOperation] = def;
      }
    });
  });
};

/**
 * Defines async fetch result for the processing mask definitions. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type ProcessingMaskDefinitionFetchResult = AsyncFetchResult<
  ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel[]
>;

export const getProcessingMaskDefinitionsQuery: CreateAsyncThunkQueryProps<
  GetProcessingMaskDefinitionsQueryArgs,
  GetProcessingMaskDefinitionsQueryResult,
  DataState
> = {
  typePrefix: 'signal-enhancement/getProcessingMaskDefinitions',
  config: config.signalEnhancementConfiguration.services.getProcessingMaskDefinitions.requestConfig,
  logger,
  getSliceState: state => state.data,
  getHistory: state => state.queries.getProcessingMaskDefinitions,

  idGenerator: args => {
    const stationGroup = `stationGroup:${args.stationGroup.name}`;
    const processingOperations = `processingOperations:${uniqSortStrings(
      args.processingOperations
    ).join(';')}`;
    const phases = `phases:${uniqSortStrings(args.phaseTypes).join(';')}`;
    const channels = `channels:${uniqSortEntityOrVersionReference(args.channels)
      .map(s => s.name)
      .join(';')}`;
    return `${stationGroup}/${processingOperations}/${phases}/${channels}`;
  },

  shouldSkip: args =>
    args == null ||
    args.stationGroup == null ||
    args.stationGroup.name == null ||
    args.stationGroup.name === '' ||
    args.stationGroup.effectiveAt == null ||
    args.stationGroup.effectiveAt < 0 ||
    args.channels == null ||
    args.channels.length < 1 ||
    args.processingOperations == null ||
    args.processingOperations.length < 1 ||
    args.phaseTypes == null ||
    args.phaseTypes.length < 1,

  transformArgs: (args, history, id, entries) => {
    const { stationGroup, processingOperations } = args;
    // only include entries for the same station group
    const filteredEntries = entries.filter(
      entry =>
        entry.arg.stationGroup.name === stationGroup.name &&
        entry.arg.stationGroup.effectiveAt === stationGroup.effectiveAt &&
        entry.arg.stationGroup.description === stationGroup.description
    );

    const allChannels: FacetedTypes.VersionReference<'name', ChannelTypes.Channel>[] = [];
    const allPhaseTypes: string[] = [];

    processingOperations.forEach(processingOperation => {
      const filteredEntriesByOp = filteredEntries.filter(entry =>
        includes(entry.arg.processingOperations, processingOperation)
      );
      const [channels, phases] = determineMissingPairs<
        GetProcessingMaskDefinitionsQueryArgs,
        FacetedTypes.VersionReference<'name', ChannelTypes.Channel>
      >(args, filteredEntriesByOp, 'channels', 'phaseTypes');

      allChannels.push(...channels);
      allPhaseTypes.push(...phases);
    });

    return {
      stationGroup,
      processingOperations: uniqSortStrings(
        processingOperations
      ) as ChannelSegmentTypes.ProcessingOperation[],
      channels: uniqSortEntityOrVersionReference(allChannels),
      phaseTypes: uniqSortStrings(allPhaseTypes)
    };
  },

  prepareRequestConfig: (args, requestConfig, history, id, entries) => {
    const { stationGroup } = args;
    // only include entries for the same station group
    const filteredEntries = entries.filter(
      entry =>
        entry.arg.stationGroup.name === stationGroup.name &&
        entry.arg.stationGroup.effectiveAt === stationGroup.effectiveAt &&
        entry.arg.stationGroup.description === stationGroup.description
    );

    const chunkArgs = args.processingOperations.flatMap(processingOperation => {
      const channelsByPhases: Record<
        string,
        FacetedTypes.VersionReference<'name', ChannelTypes.Channel>[]
      > = {};

      const filteredEntriesByOp = filteredEntries.filter(entry =>
        includes(entry.arg.processingOperations, processingOperation)
      );

      args.channels.forEach(channel => {
        const phasesRequested = uniqSortStrings(
          filteredEntriesByOp
            .filter(entry => includes(entry.arg.channels, channel))
            .flatMap(entry => entry.arg.phaseTypes)
        );

        const phasesNotRequested = difference(args.phaseTypes, phasesRequested);

        if (phasesNotRequested.length > 0) {
          const phasesStr = phasesNotRequested.join(';');

          if (!channelsByPhases[phasesStr]) {
            channelsByPhases[phasesStr] = [];
          }
          channelsByPhases[phasesStr].push(channel);
        }
      });

      return Object.entries(channelsByPhases).flatMap(([phasesStr, channels]) => ({
        stationGroup,
        processingOperations: [processingOperation],
        channels: uniqSortEntityOrVersionReference(channels),
        phaseTypes: uniqSortStrings(phasesStr.split(';'))
      }));
    });

    return chunkArgs.flatMap(argChunk => {
      const chunkedChannels = chunk(argChunk.channels, MAX_CHANNELS_PER_REQUEST);
      return chunkedChannels.map(chunked => ({
        ...requestConfig,
        data: {
          stationGroup,
          processingOperations: argChunk.processingOperations,
          channels: chunked,
          phaseTypes: argChunk.phaseTypes
        }
      }));
    });
  },

  transformResult: (args, results) => {
    const mergedResults: GetProcessingMaskDefinitionsQueryResult = {
      processingMaskDefinitionByPhaseByChannel: []
    };
    results.forEach(result => {
      if (result) {
        mergedResults.processingMaskDefinitionByPhaseByChannel.push(
          ...result.processingMaskDefinitionByPhaseByChannel
        );
      }
    });
    return mergedResults;
  },

  updateState: (action, state) => {
    if (action.payload) {
      const draft = state.processingMaskDefinitionsByChannels;
      const { processingMaskDefinitionByPhaseByChannel } = action.payload;
      processingMaskDefinitionByPhaseByChannel?.forEach(pmd => {
        const index = draft.findIndex(
          entry =>
            entry.channel.name === pmd.channel.name &&
            entry.channel.effectiveAt === pmd.channel.effectiveAt
        );

        const draftEntry: WritableDraft<ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel> =
          index !== -1 ? draft[index] : { channel: pmd.channel, processingMaskDefinitions: {} };

        updateProcessingMaskDefinitions(pmd, draftEntry);

        // push new entry onto the array
        if (index === -1) {
          draft.push(draftEntry);
        }
      });
    }
  }
};

export const {
  asyncQuery: getProcessingMaskDefinitions,
  addMatchReducers: addGetProcessingMaskDefinitionsMatchReducers
} = createAsyncThunkQuery<
  GetProcessingMaskDefinitionsQueryArgs,
  GetProcessingMaskDefinitionsQueryResult,
  DataState
>(getProcessingMaskDefinitionsQuery);
