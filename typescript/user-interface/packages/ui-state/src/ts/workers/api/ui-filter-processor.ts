import type { ChannelTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, FilterTypes, FilterUtil } from '@gms/common-model';
import { getCombinedFilterId } from '@gms/common-model/lib/filter/filter-util';
import type {
  Filter,
  FilterDefinition,
  LinearFilterDescription
} from '@gms/common-model/lib/filter/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import produce from 'immer';
import flatMap from 'lodash/flatMap';

import { createFiltered } from '../../app/util/channel-factory';
import type { SampleRate, UiChannelSegment } from '../../types';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

export interface FilterSegment {
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>;
  // Full reference to the filter is kept so that in the case of a namedFilter we can know
  // the named filter name for error handling
  filter: Filter;
  filtersBySampleRate: Record<SampleRate, FilterDefinition>;
}
export interface FilterDescriptor {
  channel: ChannelTypes.Channel;
  filterSegments: FilterSegment[];
}

export interface ChannelDescriptor {
  // passing in the fully populated channel here because channel on the
  // uiChannelSegment.channelSegmentDescriptor could just be a version reference channel
  channel: ChannelTypes.Channel;
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
}

export interface ApplyFilterParams {
  channelDescriptor: ChannelDescriptor[];
  filterDefinition: FilterTypes.FilterDefinition;
  taper: number;
  removeGroupDelay: boolean;
}

export interface FilterResult {
  channel: Channel;
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>;
}

/**
 * The Worker API for the Filter Processor design feature
 *
 * @param filterDefinition the requested filter definition
 *
 * @returns A designed filterDefinition
 */
export const design = async (
  filterDefinition: FilterTypes.FilterDefinition,
  taper: number,
  removeGroupDelay: boolean
): Promise<FilterTypes.FilterDefinition> =>
  waveformWorkerRpc.rpc(WorkerOperations.DESIGN_FILTER, {
    filterDefinition,
    taper,
    removeGroupDelay
  });

/**
 * An operation to design filter definitions
 *
 * @param filterDefinitions the filter definitions
 * @param sampleRates the different sample rates which we should design each filter definition for
 * @param groupDelaySec the group delay seconds config setting
 * @param sampleRateToleranceHz the sample rate tolerance in hertz config setting
 * @param taper the taper config setting
 * @param removeGroupDelay the remove group delay config setting
 */
export const designFilterDefinitions = async (
  filterDefinitions: FilterTypes.FilterDefinition[],
  sampleRates: number[],
  groupDelaySec: number,
  sampleRateToleranceHz: number,
  taper: number,
  removeGroupDelay: boolean
): Promise<PromiseSettledResult<FilterTypes.FilterDefinition>[]> => {
  return Promise.allSettled(
    // design each filter definition for each provided sample rate
    flatMap(
      sampleRates?.map(sampleRateHz =>
        filterDefinitions.map(async fd => {
          try {
            const filterDefinition = produce(fd, draft => {
              draft.filterDescription.parameters = {
                sampleRateHz,
                groupDelaySec,
                sampleRateToleranceHz
              };
              // TODO: This function currently only supports Linear and Cascade FilterDefinitions
              if (FilterUtil.isCascadeFilterDefinition(draft)) {
                draft.filterDescription.filterDescriptions =
                  draft.filterDescription.filterDescriptions.map<LinearFilterDescription>(desc => {
                    if (!FilterUtil.isLinearFilterDescription(desc)) {
                      throw new Error(
                        'PhaseMatchFilterDescription & AutoRegressiveFilterDescription types are not yet supported'
                      );
                    }
                    return {
                      ...desc,
                      parameters: {
                        sampleRateHz,
                        sampleRateToleranceHz,
                        groupDelaySec
                      }
                    };
                  });
              }
            });
            return await design(filterDefinition, taper, removeGroupDelay);
          } catch (error) {
            // eslint-disable-next-line prefer-promise-reject-errors
            return Promise.reject({ sampleRateHz, filterDefinition: fd });
          }
        })
      )
    )
  );
};

/**
 * The Worker API for the Filter Processor filter feature.
 * Creates a new derived channel and filters the data using the provided Filter Definition.
 *
 * @param channelDescriptor an array of objs that contain a fully populated channel
 * and the corresponding UI channel segment
 * @param filterDefinition a record of Filter Definitions by hz
 * @param taper number of samples for cosine taper
 * @param removeGroupDelay optional boolean to determine if group delay should be applied
 * @returns An array of channel descriptors with
 *   * the created derived channel
 *   * the created ui channel segment with new data claims check ids
 */
export const filter = async (
  filterDescriptor: FilterDescriptor,
  taper: number,
  removeGroupDelay: boolean
): Promise<PromiseSettledResult<FilterResult>[]> => {
  return Promise.allSettled(
    filterDescriptor.filterSegments.map(async filterSegment => {
      try {
        const filterDefinition = Object.values(filterSegment.filtersBySampleRate)?.[0];
        const filteredChannel = await createFiltered(filterDescriptor.channel, filterDefinition);

        const filteredChannelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> =
          await waveformWorkerRpc.rpc(WorkerOperations.FILTER_CHANNEL_SEGMENT, {
            channelSegment: {
              ...filterSegment.uiChannelSegment.channelSegment,
              id: {
                ...filterSegment.uiChannelSegment.channelSegment.id,
                channel: {
                  ...filterSegment.uiChannelSegment.channelSegment.id.channel,
                  name: filteredChannel.name
                }
              },
              _uiConfiguredInput: filterSegment.uiChannelSegment.channelSegment.id
            },
            filterDefinitions: filterSegment.filtersBySampleRate,
            taper,
            removeGroupDelay,
            domainTimeRange: filterSegment.uiChannelSegment.domainTimeRange
          });

        return {
          channel: filteredChannel,
          uiChannelSegment: {
            channelSegment: {
              ...filteredChannelSegment,
              channelName: filteredChannel.name
            },
            channelSegmentDescriptor: {
              ...filterSegment.uiChannelSegment.channelSegmentDescriptor,
              // ! store as a version reference channel
              channel: {
                name: filteredChannel.name,
                effectiveAt: filteredChannel.effectiveAt
              }
            },
            domainTimeRange: filterSegment.uiChannelSegment.domainTimeRange
          }
        };
      } catch (error) {
        return Promise.reject(
          new FilterTypes.FilterError(
            error.message,
            Array.from(
              new Set(
                Object.values(filterSegment.filtersBySampleRate).map(f =>
                  getCombinedFilterId(filterSegment.filter, f)
                )
              )
            ),
            filterDescriptor.channel.name,
            filterDescriptor.filterSegments.map(fs =>
              ChannelSegmentTypes.Util.createChannelSegmentString(
                fs.uiChannelSegment.channelSegmentDescriptor
              )
            )
          )
        );
      }
    })
  );
};
