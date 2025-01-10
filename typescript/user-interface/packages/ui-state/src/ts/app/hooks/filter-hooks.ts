import type { ChannelTypes, FilterTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import {
  getCombinedFilterId,
  getFilterName,
  isFilterError
} from '@gms/common-model/lib/filter/filter-util';
import type { Filter } from '@gms/common-model/lib/filter/types';
import { FilterError } from '@gms/common-model/lib/filter/types';
import { OrderedPriorityQueue, Timer } from '@gms/common-util';
import { UILogger, usePrevious } from '@gms/ui-util';
import { UNFILTERED } from '@gms/weavess-core/lib/types';
import produce from 'immer';
import cloneDeep from 'lodash/cloneDeep';
import React, { useMemo, useRef } from 'react';
import { batch } from 'react-redux';

import type {
  ChannelFilterRecord,
  FilterDefinitionsRecord,
  ProcessedItemsCacheRecord,
  UiChannelSegment,
  UIChannelSegmentRecord
} from '../../types';
import type { FilterDescriptor, FilterResult } from '../../workers/api/ui-filter-processor';
import { filter } from '../../workers/api/ui-filter-processor';
import {
  addFilteredChannels,
  addFilteredChannelSegments,
  selectFilterDefinitions,
  useGetFilterListsDefinitionQuery
} from '../api';
import {
  analystActions,
  AnalystWorkspaceOperations,
  selectHotkeyCycle,
  selectSelectedFilter,
  selectSelectedFilterIndex,
  selectSelectedFilterList,
  selectWorkflowIntervalUniqueId,
  selectWorkflowTimeRange,
  waveformActions,
  waveformSlice
} from '../state';
import type { HotkeyCycleList } from '../state/analyst/types';
import { selectSelectedStationsAndChannelIds } from '../state/common/selectors';
import { selectChannelFilters } from '../state/waveform/selectors';
import { designFiltersAndGetUpdatedFilterDefinitions } from '../util/filtering-utils';
import { useUnfilteredChannelsRecord } from './channel-hooks';
import { useVisibleChannelSegments } from './channel-segment-hooks';
import { useProcessingAnalystConfiguration } from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useFindFilterByUsage } from './signal-enhancement-configuration-hooks';
import { useAllStations, useVisibleStations } from './station-definition-hooks';
import { useViewportVisibleStations } from './waveform-hooks';

const logger = UILogger.create('GMS_LOG_FILTER_HOOKS', process.env.GMS_LOG_FILTER_HOOKS);

/**
 * @returns a setter function that dispatches an update to the redux store, updating the filter list.
 */
export const useSetFilterList = (): ((fl: FilterTypes.FilterList | string) => void) => {
  const dispatch = useAppDispatch();
  const filterQuery = useGetFilterListsDefinitionQuery();
  const filterLists = filterQuery.data?.filterLists;
  const stations = useAllStations();
  return React.useCallback(
    (fl: FilterTypes.FilterList | string) => {
      batch(() => {
        let filterList;
        if (typeof fl === 'string' && filterLists !== undefined) {
          filterList = filterLists.find(f => f.name === fl);
          if (!filterList) {
            throw new Error(`Filter list ${fl} not found`);
          }
        } else {
          filterList = fl;
        }
        dispatch(analystActions.setSelectedFilterList(filterList.name));
        dispatch(analystActions.setSelectedFilterIndex(filterList.defaultFilterIndex));
        dispatch(AnalystWorkspaceOperations.setDefaultFilterForStations(stations));
      });
    },
    [dispatch, filterLists, stations]
  );
};

/**
 * @returns the name of the preferred filter list for the currently open activity (interval)
 */
export const usePreferredFilterListForActivity = (): string => {
  const filterListQuery = useGetFilterListsDefinitionQuery();
  const openActivityNames = useAppSelector(state => state.app.workflow.openActivityNames);
  const preferredFilterList = filterListQuery.data?.preferredFilterListByActivity?.find(
    pf => pf.workflowDefinitionId.name === openActivityNames[0]
  );
  return preferredFilterList?.name || '';
};

/**
 * @returns the selected filter list, derived from the selected filter name and the filter lists from the signal-enhancement query
 * If no filter list is selected, will update the redux store to select the default filter list, and return that.
 */
export const useSelectedFilterList = (): FilterTypes.FilterList | undefined => {
  const filterListQuery = useGetFilterListsDefinitionQuery();
  const result = useAppSelector(selectSelectedFilterList);
  const dispatch = useAppDispatch();
  const preferred = usePreferredFilterListForActivity();
  React.useEffect(() => {
    // select the preferred filter list if none was already selected
    if (!result) {
      dispatch(analystActions.setSelectedFilterList(preferred));
    }
  }, [dispatch, preferred, result]);
  if (!result && filterListQuery.data) {
    return filterListQuery.data.filterLists.find(fl => fl.name === preferred);
  }
  return result;
};

/**
 * Returns the default filter for the selected filter list
 * or Unfiltered if default filter is not found
 *
 * @returns the default filter
 */
export function useDefaultFilter() {
  const filterList = useSelectedFilterList();

  return useMemo(() => {
    const defaultFilter = filterList?.filters[filterList?.defaultFilterIndex];
    const unfiltered = filterList?.filters.find(f => f.unfiltered);
    return defaultFilter || unfiltered;
  }, [filterList]);
}

/**
 * Returns the default filter name for the selected filter list
 * or Unfiltered if default filter is not found
 *
 * @returns the default filter name
 */
export function useDefaultFilterName() {
  const defaultFilter = useDefaultFilter();

  return useMemo(() => getFilterName(defaultFilter), [defaultFilter]);
}

/**
 * Provides a callback that puts additional bounds around the filter function
 * to revert to unfiltered (or the default filtered) data in case of an error with the
 * ui-filter-processor.
 *
 * @param channelName the current raw channel name
 * @param channelDescriptors an array of objs that contain a fully populated channel
 * and the corresponding UI channel segment
 * @param filterName the name of the filter to apply
 * @param filterDefinitions a record of Filter Definitions by hz
 * @param taper number of samples for cosine taper
 * @param removeGroupDelay optional boolean to determine if group delay should be applied
 */
function useFilterWithErrorHandling(handleFilterError: (error: FilterError) => void) {
  const dispatch = useAppDispatch();

  return React.useCallback(
    async (
      channelName: string,
      filterName: string,
      filterDescriptors: FilterDescriptor[],
      taper: number,
      removeGroupDelay: boolean
    ) => {
      if (!filterDescriptors?.length) return;

      await Promise.all(
        filterDescriptors.map(async filterDescriptor => {
          Timer.start(`Filtered ${filterDescriptor.channel.name}`);

          // Will filter and store the data
          const results = await filter(filterDescriptor, taper, removeGroupDelay);

          // Handle rejected on a case by case basis
          const rejected = results.filter(
            (r): r is PromiseRejectedResult => r.status === 'rejected'
          );
          if (rejected.length > 0) {
            rejected.forEach(r => {
              if (isFilterError(r.reason)) {
                handleFilterError(
                  new FilterError(
                    r.reason.message,
                    r.reason.filterNames,
                    channelName,
                    r.reason.channelSegmentDescriptorIds
                  )
                );
              } else {
                throw new Error(r.reason);
              }
            });
          }
          Timer.end(`Filtered ${filterDescriptor.channel.name}`);

          // Handle fulfilled all together
          const fulfilled: PromiseFulfilledResult<FilterResult>[] = results.filter(
            (r): r is PromiseFulfilledResult<FilterResult> => r.status === 'fulfilled'
          );
          return fulfilled.map(f => f.value);
        })
      )
        .then(filterResults => {
          if (filterResults) {
            // Split channels and channelSegments from filter results
            const channels: ChannelTypes.Channel[] = [];
            const channelSegments: UiChannelSegment<WaveformTypes.Waveform>[] = [];

            filterResults
              .flatMap(filterResult => filterResult)
              .forEach(results => {
                channels.push(results.channel);
                channelSegments.push(results.uiChannelSegment);
              });

            dispatch(addFilteredChannels(channels));
            dispatch(
              // Will force the data into a filter name slot (in case of named filter)
              addFilteredChannelSegments([
                {
                  name: channelName,
                  filterName,
                  channelSegments
                }
              ])
            );
          }
        })
        .catch(error => {
          // if something else goes wrong that we can't handle on an individual basis, then fail the whole channel
          handleFilterError(new FilterError(error.message, filterName, channelName));
        });
    },
    [dispatch, handleFilterError]
  );
}

/**
 * Provides a callback that can be used to build a list of filter descriptors from a given
 * channelFilter and uiChannelSegments.
 *
 * @param channelFilter the filter to apply to the channel segments
 * @param uiChannelSegments the uiChannelSegments to operate on
 * @returns an array of {@link FilterDescriptor}
 */
function useBuildFilterDescriptors(handleFilterError: (error: FilterError) => void) {
  const channelsRecord: Record<string, ChannelTypes.Channel> = useUnfilteredChannelsRecord();
  const cachedFilterDefinitions: FilterDefinitionsRecord = useAppSelector(selectFilterDefinitions);
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const findFilterByUsage = useFindFilterByUsage();

  return React.useCallback(
    async (
      stationOrChannelName: string,
      channelFilter: FilterTypes.Filter,
      uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
    ): Promise<FilterDescriptor[]> => {
      const {
        defaultGroupDelaySecs,
        defaultSampleRateToleranceHz,
        defaultTaper,
        defaultRemoveGroupDelay
      } = processingAnalystConfiguration.gmsFilters;

      // Organize the channels by name
      const channelsByName: Record<string, ChannelTypes.Channel> = uiChannelSegments.reduce(
        (accumulatedChannelsByName, uiChannelSegment) => {
          const channel = channelsRecord[uiChannelSegment?.channelSegmentDescriptor?.channel?.name];
          if (!channel) return accumulatedChannelsByName;
          return {
            ...accumulatedChannelsByName,
            [uiChannelSegment?.channelSegmentDescriptor?.channel?.name]: channel
          };
        },
        {}
      );

      // Bail early if it's unfiltered
      if (channelFilter.unfiltered) return [];

      const filterDescriptorPromises = Object.entries(channelsByName).map(
        async ([name, channel]) => {
          const filterSegmentsToProcess = uiChannelSegments
            ?.filter(
              ({ channelSegmentDescriptor }) => channelSegmentDescriptor?.channel?.name === name
            )
            ?.map(uiChannelSegment => ({
              uiChannelSegment,
              filtersBySampleRate: {}
            }));

          const designedFilterPromises = filterSegmentsToProcess.map(async filterSegment => {
            const currentFilter = findFilterByUsage(
              channelFilter,
              stationOrChannelName,
              filterSegment.uiChannelSegment
            );

            if (!currentFilter || !currentFilter.filterDefinition) return undefined;

            const filterDefinitionRecord = await designFiltersAndGetUpdatedFilterDefinitions(
              stationOrChannelName,
              currentFilter,
              uiChannelSegments,
              cachedFilterDefinitions,
              {
                groupDelaySecs: defaultGroupDelaySecs,
                sampleRateToleranceHz: defaultSampleRateToleranceHz,
                taper: defaultTaper,
                removeGroupDelay: defaultRemoveGroupDelay
              },
              handleFilterError
            );

            if (filterDefinitionRecord[currentFilter.filterDefinition.name]) {
              return {
                ...filterSegment,
                filter: currentFilter,
                filtersBySampleRate: filterDefinitionRecord[currentFilter.filterDefinition.name]
              };
            }
            return undefined;
          });

          const filterSegments = await Promise.all(designedFilterPromises);

          return {
            channel,
            filterSegments: filterSegments.filter(notEmpty)
          };
        }
      );

      // filter out undefined for type safety
      return (await Promise.all(filterDescriptorPromises)).filter(
        element => element !== undefined
      ) as FilterDescriptor[];
    },
    [
      cachedFilterDefinitions,
      channelsRecord,
      findFilterByUsage,
      handleFilterError,
      processingAnalystConfiguration
    ]
  );
}

/**
 * Given an array of channel names, the useDesignAndFilter hook designs necessary filters
 * and applies filters to those channel names. Do not use this directly, use {@link useFilterQueue}
 * to filter instead.
 *
 * @param channelNamesToFilter An array of channel names
 * @param queue the queue that will control the priority of the filter actions
 * @param handleFilterError a function to handle filter errors
 */
function useDesignAndFilter(
  toFilter: ProcessedItemsCacheRecord,
  channelFilters: ChannelFilterRecord,
  queue: OrderedPriorityQueue,
  handleFilterError: (error: FilterError) => void
) {
  const uiChannelSegmentsRecord: UIChannelSegmentRecord = useVisibleChannelSegments();
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();

  const filterWithErrorHandling = useFilterWithErrorHandling(handleFilterError);
  const buildFilterDescriptors = useBuildFilterDescriptors(handleFilterError);

  const [viewportVisibleStations] = useViewportVisibleStations();

  if (!Object.keys(toFilter).length || !processingAnalystConfiguration.gmsFilters) return;

  const { defaultTaper, defaultRemoveGroupDelay } = processingAnalystConfiguration.gmsFilters;

  // Build list of promises
  Object.entries(toFilter).forEach(([filterNameId, cache]) => {
    Object.entries(cache).forEach(([channelName, uiChannelSegmentIdSet]) => {
      // This should only be the filter name so do not fallback to unfiltered here
      const filterName =
        channelFilters[channelName].namedFilter ||
        channelFilters[channelName]?.filterDefinition?.name ||
        '';

      const options = {
        priority: viewportVisibleStations.indexOf(channelName),
        tag: filterName
      };

      queue
        .add(async () => {
          try {
            // Get unfiltered uiChannelSegments by channelName
            const uiChannelSegments = uiChannelSegmentsRecord[channelName][UNFILTERED].filter(
              ({ channelSegmentDescriptor }) =>
                uiChannelSegmentIdSet?.has(
                  ChannelSegmentTypes.Util.createChannelSegmentString(channelSegmentDescriptor)
                )
            );

            const filterDescriptors: FilterDescriptor[] = await buildFilterDescriptors(
              channelName,
              channelFilters[channelName],
              uiChannelSegments
            );

            return filterWithErrorHandling(
              channelName,
              filterName,
              filterDescriptors,
              defaultTaper,
              defaultRemoveGroupDelay
            );
          } catch (error) {
            // Invalidate the whole channel, because we don't know what happened. Designing the filters should handle errors per ChannelSegment
            handleFilterError(new FilterError(error.message, filterNameId, channelName));
            return Promise.reject(error);
          }
        }, options)
        .catch(logger.error);
    });
  });
}

/**
 * Will add an id to the filter queue delta
 *
 * @param delta the processed items cache record
 * @param filterName the filter name associated with the id
 * @param channelName the channel name associated with the id
 * @param id the channel segment string {@link createChannelSegmentString}
 *
 * @returns the updated processed items cache record
 */
function mutateFilterQueueDelta(
  delta: ProcessedItemsCacheRecord,
  filterName: string,
  channelName: string,
  id: string
): ProcessedItemsCacheRecord {
  return produce(delta, draft => {
    if (!draft[filterName]) draft[filterName] = {};
    if (!draft[filterName][channelName]) draft[filterName][channelName] = new Set();

    draft[filterName][channelName].add(id);
  });
}

/**
 * This will return a function that checks against the given filter and uiChannelSegment, and update the delta if needed.
 *
 * @params handleFilterError a function to handle filter errors
 */
const useUpdateFilterQueueDelta = (handleFilterError: (error: FilterError) => void) => {
  const channelsByName: Record<string, ChannelTypes.Channel> = useUnfilteredChannelsRecord();
  const findFilterByUsage = useFindFilterByUsage();

  return React.useCallback(
    (
      delta: ProcessedItemsCacheRecord,
      processedItemsCache: ProcessedItemsCacheRecord,
      uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>,
      stationOrChannelName: string,
      channelFilter: Filter
    ) => {
      let currentFilter: Filter | undefined;
      try {
        const id = ChannelSegmentTypes.Util.createChannelSegmentString(
          uiChannelSegment?.channelSegmentDescriptor
        );

        currentFilter = findFilterByUsage(channelFilter, stationOrChannelName, uiChannelSegment);

        if (!currentFilter?.filterDefinition) return delta;

        // Combined filter name is required in the case that two named filters have the same filter definition.
        // Without it the filter may not be processed.
        // Channel filter and currentFilter are used since the current filter will not include a namedFilter name
        const filterNameId = getCombinedFilterId(channelFilter, currentFilter.filterDefinition);

        if (!channelsByName[uiChannelSegment?.channelSegmentDescriptor?.channel?.name]) {
          throw new Error(`No channel found for channel segment ${id}`);
        }

        if (processedItemsCache?.[filterNameId]?.[stationOrChannelName]?.has(id)) return delta;

        // Key processed delta items by the filter definition name, not the channelFilters filter name
        // this insures that if the filter CHANGES between runs we will build new data.
        return mutateFilterQueueDelta(delta, filterNameId, stationOrChannelName, id);
      } catch (error) {
        handleFilterError(
          new FilterError(
            error.message,
            currentFilter?.filterDefinition
              ? getCombinedFilterId(channelFilter, currentFilter?.filterDefinition)
              : '',
            stationOrChannelName,
            ChannelSegmentTypes.Util.createChannelSegmentString(
              uiChannelSegment?.channelSegmentDescriptor
            )
          )
        );
        return delta;
      }
    },
    [channelsByName, findFilterByUsage, handleFilterError]
  );
};

/**
 * Creates an error handler function for handling errors that occur while filtering.
 *
 * @param processedItems the ref cache that tracks the processed items
 * @returns a referentially stable callback error handler
 */
const useHandleFilterError = (
  processedItems: React.MutableRefObject<ProcessedItemsCacheRecord>,
  channelFilters: ChannelFilterRecord,
  isFkChannelFilters: boolean = false
) => {
  const dispatch = useAppDispatch();

  return React.useCallback(
    (error: FilterError) => {
      const { channelName, filterNames, channelSegmentDescriptorIds } = error;
      logger.error(error?.message);
      const currentFilter = channelFilters[channelName];
      filterNames.forEach(filterNameId => {
        if (processedItems.current[filterNameId]?.[channelName] != null) {
          // Mutating the mutable ref cache should be safe
          // eslint-disable-next-line no-param-reassign
          if (!processedItems.current[filterNameId]) processedItems.current[filterNameId] = {};
          if (!processedItems.current[filterNameId][channelName])
            // Mutating the mutable ref cache should be safe
            // eslint-disable-next-line no-param-reassign
            processedItems.current[filterNameId][channelName] = new Set();
          if (channelSegmentDescriptorIds) {
            channelSegmentDescriptorIds.forEach(channelSegmentDescriptorId => {
              processedItems.current[filterNameId][channelName]?.delete(channelSegmentDescriptorId);
            });
          } else {
            processedItems.current[filterNameId][channelName]?.clear();
          }
        }
      });
      if (!currentFilter?._uiIsError) {
        if (!isFkChannelFilters) {
          dispatch(
            waveformSlice.actions.setFilterForChannel({
              channelOrSdName: channelName,
              filter: {
                ...cloneDeep(currentFilter),
                _uiIsError: true
              }
            })
          );
        }
      }
    },
    [channelFilters, dispatch, isFkChannelFilters, processedItems]
  );
};

/**
 * Hook that returns setter for requesting filtered channel
 *
 * @param filterToApply
 * @param channelName
 * @returns setter for request
 */
export const useSetFilterForChannel = (): ((
  filterToApply: FilterTypes.Filter,
  channelName: string
) => void) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (filterToApply: FilterTypes.Filter, channelName: string) => {
      if (!filterToApply?._uiIsError) {
        dispatch(
          waveformSlice.actions.setFilterForChannel({
            channelOrSdName: channelName,
            filter: {
              ...cloneDeep(filterToApply),
              _uiIsError: true
            }
          })
        );
      }
    },
    [dispatch]
  );
};

const useShouldClearQueue = () => {
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const workflowId = useAppSelector(selectWorkflowIntervalUniqueId);
  const oldTimeRange = usePrevious(timeRange, undefined);
  const previousWorkflowId = usePrevious(workflowId);

  return (
    oldTimeRange?.startTimeSecs !== timeRange?.startTimeSecs || previousWorkflowId !== workflowId
  );
};

/**
 * useFilterQueue watches for changes in channelFilters, uiChannelSegmentsRecord, channels and
 * creates a queue of channel names to filter. Then it calls useDesignAndFilter design and apply
 * filters to those channels.
 */
export function useFilterQueue(
  channelFilters: ChannelFilterRecord = {},
  isFkChannelFilters: boolean = false
) {
  // TODO: Because we use ref, if two instances are open we could process dupe filter data
  // * Suggestion: Base operation on a unique key, to insure only one instance runs at a given time
  const processedItems = useRef<ProcessedItemsCacheRecord>({});
  const queue = useRef(new OrderedPriorityQueue({ concurrency: 4 }));

  if (useShouldClearQueue()) {
    logger.info('Filter queue is watching new interval');
    processedItems.current = {};
    // Clear out any hanging tasks from the queue
    queue.current.clear();
  }

  const uiChannelSegmentsRecord: UIChannelSegmentRecord = useVisibleChannelSegments();

  const handleFilterError = useHandleFilterError(
    processedItems,
    channelFilters,
    isFkChannelFilters
  );
  const updateFilterQueueDelta = useUpdateFilterQueueDelta(handleFilterError);

  const currentFilterName = useMemo(() => {
    const currentFilter: FilterTypes.Filter | undefined = Object.values(channelFilters)[0];
    return currentFilter?.namedFilter || currentFilter?.filterDefinition?.name || '';
  }, [channelFilters]);

  const delta: ProcessedItemsCacheRecord = useMemo(() => {
    let draft: ProcessedItemsCacheRecord = {};

    Object.entries(channelFilters).forEach(([stationOrChannelName, channelFilter]) => {
      if (
        !uiChannelSegmentsRecord?.[stationOrChannelName]?.[UNFILTERED] ||
        channelFilter.unfiltered
      )
        return;

      uiChannelSegmentsRecord[stationOrChannelName][UNFILTERED].forEach(uiChannelSegment => {
        draft = updateFilterQueueDelta(
          draft,
          processedItems.current,
          uiChannelSegment,
          stationOrChannelName,
          channelFilter
        );
      });
    });

    return draft;
  }, [channelFilters, uiChannelSegmentsRecord, updateFilterQueueDelta]);

  // Merge the delta back into the cache
  Object.entries(delta).forEach(([filterName, cache]) => {
    Object.entries(cache).forEach(([stationOrChannelName, set]) => {
      if (!processedItems.current[filterName]) processedItems.current[filterName] = {};
      if (!processedItems.current[filterName][stationOrChannelName])
        processedItems.current[filterName][stationOrChannelName] = new Set();
      processedItems.current[filterName][stationOrChannelName] = new Set([
        ...processedItems.current[filterName][stationOrChannelName],
        ...set
      ]);
    });
  });

  // Prioritize the current filter
  queue.current.prioritize(currentFilterName);

  // Get full list of channel names to filter
  useDesignAndFilter(delta, channelFilters, queue.current, handleFilterError);
}

/**
 * A helper hook that returns a callback function that updates the channel filters in redux
 * based on the users' selection. If nothing is selected, it behaves as though every station
 * is selected. If stations are selected, it updates the filters for those default channels,
 * using the station name as the channel name key.
 */
export function useUpdateChannelFilters() {
  const dispatch = useAppDispatch();
  const selectedStationsAndChannels = useAppSelector(selectSelectedStationsAndChannelIds);
  const visibleStations = useVisibleStations();
  const channelFilters = useAppSelector(selectChannelFilters);

  return React.useCallback(
    (selected: FilterTypes.Filter) => {
      let updatedChannelFilters: ChannelFilterRecord = {};
      if (selectedStationsAndChannels.length === 0) {
        // select all stations (but not raw channels)
        if (visibleStations) {
          visibleStations.forEach(s => {
            updatedChannelFilters[s.name] = selected;
          });
        }
      } else {
        // modify selected channels and signal detections
        updatedChannelFilters = produce(channelFilters, draft => {
          selectedStationsAndChannels.forEach(s => {
            draft[s] = selected;
          });
        });
      }

      dispatch(waveformActions.setChannelFilters(updatedChannelFilters));
    },
    [channelFilters, dispatch, selectedStationsAndChannels, visibleStations]
  );
}

/**
 * @example
 * const { selectedFilter, setSelectedFilter } = useSelectedFilter();
 *
 * @returns an object containing the selected filer, and a setter function. The setter
 * function takes either a string (the filter name) or a filter, or null to unset the selection.
 *
 * All elements returned should be referentially stable, so they may be checked for
 * shallow equality in dependency arrays and memoization functions.
 */
export const useSelectedFilter = (): {
  selectedFilter: FilterTypes.Filter | undefined;
  setSelectedFilter: (selectedFilter: FilterTypes.Filter | null) => void;
} => {
  // initiate the subscription to the query data. selectSelectedFilterList will get the data that this stores.
  useGetFilterListsDefinitionQuery();
  const dispatch = useAppDispatch();
  const selectedFilterList = useAppSelector(selectSelectedFilterList);
  const selectedFilter = useAppSelector(selectSelectedFilter);
  const updateChannelFilters = useUpdateChannelFilters();
  return {
    selectedFilter,
    setSelectedFilter: React.useCallback(
      (selected: FilterTypes.Filter | null) => {
        if (!selected || !selectedFilterList?.filters) return;
        const indexOfFilter = selectedFilterList.filters.findIndex(fl => fl === selected);
        updateChannelFilters(selected);
        dispatch(analystActions.setSelectedFilterIndex(indexOfFilter));
      },
      [dispatch, selectedFilterList?.filters, updateChannelFilters]
    )
  };
};

/**
 * @returns an object containing the HotkeyCycleList (which maps indices to whether a filter
 * is in the hotkey cycle), and a setter to set whether a filter at a given index is within that list.
 */
export const useHotkeyCycle = (): {
  hotkeyCycle: HotkeyCycleList;
  setIsFilterWithinHotkeyCycle: (index: number, isWithinCycle: boolean) => void;
} => {
  const hotkeyCycle = useAppSelector(selectHotkeyCycle);
  const dispatch = useAppDispatch();
  return {
    hotkeyCycle,
    setIsFilterWithinHotkeyCycle: (index, isWithinCycle) =>
      dispatch(analystActions.setIsFilterWithinHotkeyCycle({ index, isWithinCycle }))
  };
};

/**
 * @returns two functions, one to select the next filter, and one to select the previous filter.
 */
export const useFilterCycle = (): {
  selectNextFilter: () => void;
  selectPreviousFilter: () => void;
  selectUnfiltered: () => void;
} => {
  const selectedFilterIndex = useAppSelector(selectSelectedFilterIndex);
  const { hotkeyCycle } = useHotkeyCycle();
  const dispatch = useAppDispatch();
  const filterList = useSelectedFilterList();
  const updateChannelFilters = useUpdateChannelFilters();
  const selectNextFilter = React.useCallback(() => {
    if (selectedFilterIndex == null || !hotkeyCycle?.length) {
      return;
    }
    let i = selectedFilterIndex + 1 < hotkeyCycle.length ? selectedFilterIndex + 1 : 0;
    while (!hotkeyCycle[i] && i !== selectedFilterIndex) {
      i += 1;
      if (i >= hotkeyCycle.length) {
        i = 0;
      }
    }
    if (filterList) updateChannelFilters(filterList.filters[i]);
    dispatch(analystActions.setSelectedFilterIndex(i));
  }, [dispatch, filterList, hotkeyCycle, selectedFilterIndex, updateChannelFilters]);
  const selectPreviousFilter = React.useCallback(() => {
    if (selectedFilterIndex == null || !hotkeyCycle?.length) {
      return;
    }
    let i = selectedFilterIndex - 1 >= 0 ? selectedFilterIndex - 1 : hotkeyCycle.length - 1;
    while (!hotkeyCycle[i] && i !== selectedFilterIndex) {
      i -= 1;
      if (i < 0) {
        i = hotkeyCycle.length - 1;
      }
    }
    if (filterList) updateChannelFilters(filterList.filters[i]);
    dispatch(analystActions.setSelectedFilterIndex(i));
  }, [dispatch, filterList, hotkeyCycle, selectedFilterIndex, updateChannelFilters]);
  const selectUnfiltered = React.useCallback(() => {
    if (filterList?.filters == null) {
      return;
    }
    const unfilteredIndex = filterList?.filters.findIndex(f => f.unfiltered);
    updateChannelFilters(filterList?.filters[unfilteredIndex]);
    dispatch(analystActions.setSelectedFilterIndex(unfilteredIndex));
  }, [dispatch, filterList?.filters, updateChannelFilters]);
  return {
    selectNextFilter,
    selectPreviousFilter,
    selectUnfiltered
  };
};

export const useChannelFilters = () => {
  const channelFilters = useAppSelector(selectChannelFilters);
  return useMemo(() => channelFilters, [channelFilters]);
};
