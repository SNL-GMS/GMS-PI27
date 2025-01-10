import type { FacetedTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, ChannelTypes } from '@gms/common-model';
import type { Filter, FilterDefinition } from '@gms/common-model/lib/filter';
import { getFilterName, UNFILTERED } from '@gms/common-model/lib/filter';
import {
  findPhaseFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import uniq from 'lodash/uniq';
import { useCallback, useEffect, useMemo } from 'react';

import type { UiChannelSegment } from '../../types';
import {
  selectDefaultFilterDefinitionsMap,
  selectFilterDefinitionsForSignalDetections,
  selectUiChannelSegments
} from '../api';
import type {
  FilterDefinitionByUsage,
  GetFilterDefinitionByUsageQueryArgs
} from '../api/data/signal-enhancement';
import { getFilterDefinitionsByUsageMap } from '../api/data/signal-enhancement';
import { UIStateError } from '../error-handling/ui-state-error';
import { selectSelectedSdIds } from '../state';
import { useAllChannelsRecord } from './channel-hooks';
import { useChannelSegmentsToSignalDetectionHypothesis } from './channel-segment-hooks';
import { useStationLocationToOpenEventDistance } from './event-hooks';
import { usePhaseLists } from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useSignalDetectionHypotheses, useSignalDetections } from './signal-detection-hooks';

/**
 * Goes through all the uiChannelSegments and returns as a list of their version reference objects.
 *
 * @returns a list of unfiltered channel version references
 */
export const useUnfilteredUiChannelVersionReferences =
  (): FacetedTypes.VersionReference<'name'>[] => {
    const uiChannelSegmentsRecord = useAppSelector(selectUiChannelSegments);

    return useMemo(() => {
      return Object.values(uiChannelSegmentsRecord).flatMap(filterRecord => {
        if (filterRecord[UNFILTERED] == null) return [];
        return filterRecord[UNFILTERED].map(
          channelSegment => channelSegment.channelSegmentDescriptor.channel
        );
      });
    }, [uiChannelSegmentsRecord]);
  };

/**
 * A hook that can be used to retrieve and store default filter definitions by usage for channel
 * segments.
 */
export const useGetDefaultFilterDefinitionByUsageForChannelSegmentsMap = () => {
  const dispatch = useAppDispatch();
  const signalDetectionHypotheses = useSignalDetectionHypotheses();
  const channels = useUnfilteredUiChannelVersionReferences();
  const phaseLists = usePhaseLists();

  // Get the signal detection phases in this interval
  const signalDetectionPhases = useMemo(() => {
    return signalDetectionHypotheses.reduce<string[]>((result, signalDetectionHypothesis) => {
      const phaseFeatureMeasurement = findPhaseFeatureMeasurement(
        signalDetectionHypothesis.featureMeasurements
      );

      const phase = phaseFeatureMeasurement?.measurementValue.value;

      if (phase && !result.includes(phase)) {
        return [...result, phase];
      }

      return result;
    }, []);
  }, [signalDetectionHypotheses]);

  // Get the configured phases from the favorites list
  const configuredPhases = useMemo(() => {
    return uniq(phaseLists.flatMap(list => list.favorites));
  }, [phaseLists]);

  // Combine all phases
  const phases = useMemo(() => {
    return uniq([...configuredPhases, ...signalDetectionPhases]);
  }, [configuredPhases, signalDetectionPhases]);

  useEffect(() => {
    const args: GetFilterDefinitionByUsageQueryArgs = {
      phases,
      channels
    };
    dispatch(getFilterDefinitionsByUsageMap(args)).catch(error => {
      throw new UIStateError(error);
    });
  }, [phases, channels, dispatch]);
};

/**
 * Will get the appropriate global default filter definition for the given named filter name and distance.
 *
 * @param defaultFilterDefinitionsMap a map of defaults provided by selectDefaultFilterDefinitionsMap
 * @param filterName the filter name to look up
 * @param distanceDeg the distance (in degrees)
 * @returns the global default filter definition
 */
const getGlobalDefaultFilterDefinition = (
  defaultFilterDefinitionsMap: FilterDefinitionByUsage,
  filterName: string,
  distanceDeg: number
): FilterDefinition | undefined => {
  const globalDefaultFilterId = defaultFilterDefinitionsMap?.globalDefaults?.[filterName]?.find(
    filterIdWithinRange =>
      filterIdWithinRange.distanceRange &&
      filterIdWithinRange.distanceRange.minDistanceDeg <= distanceDeg &&
      filterIdWithinRange.distanceRange.maxDistanceDeg >= distanceDeg
  )?.filterDefinitionId;

  if (globalDefaultFilterId) {
    return defaultFilterDefinitionsMap.filterDefinitionsById?.[globalDefaultFilterId];
  }
  return undefined;
};

/**
 * Search the filterDefinitionsForSignalDetections record to find the correct filter for our application.
 *
 * @returns a callback that returns the filter for the related signal detection
 */
const useFindFilterForSignalDetectionHypothesis = () => {
  const selectedSignalDetectionIds = useAppSelector(selectSelectedSdIds);
  const filterDefinitionsForSignalDetections = useAppSelector(
    selectFilterDefinitionsForSignalDetections
  );
  const channelSegmentsToSignalDetectionHypothesis =
    useChannelSegmentsToSignalDetectionHypothesis();
  const signalDetectionHypotheses = useSignalDetectionHypotheses();

  return useCallback(
    (
      channelFilter: Filter,
      stationOrChannelName: string,
      uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>
    ): Filter | undefined => {
      const filterName = getFilterName(channelFilter);
      let signalDetectionHypothesisId: string | undefined;

      // If only one signal detection is selected return that filter for all raw channels
      if (
        selectedSignalDetectionIds?.length === 1 &&
        // This is to confirm that this channels weavess row is an expanded raw channel row
        ChannelTypes.Util.isRawChannelName(stationOrChannelName) &&
        ChannelTypes.Util.isRawChannel(uiChannelSegment.channelSegmentDescriptor.channel)
      ) {
        signalDetectionHypothesisId = signalDetectionHypotheses?.find(
          signalDetectionHypothesis =>
            signalDetectionHypothesis.id.signalDetectionId === selectedSignalDetectionIds[0]
        )?.id?.id;
      } else {
        signalDetectionHypothesisId =
          channelSegmentsToSignalDetectionHypothesis[
            ChannelSegmentTypes.Util.createChannelSegmentString(
              uiChannelSegment.channelSegmentDescriptor
            )
          ];
      }

      if (!signalDetectionHypothesisId) return undefined;

      const filterDefinition =
        filterDefinitionsForSignalDetections?.[signalDetectionHypothesisId]?.[filterName];

      if (filterDefinition) {
        return {
          ...channelFilter,
          filterDefinition
        };
      }

      return undefined;
    },
    [
      channelSegmentsToSignalDetectionHypothesis,
      filterDefinitionsForSignalDetections,
      selectedSignalDetectionIds,
      signalDetectionHypotheses
    ]
  );
};

/**
 * Search the filter definitions by usage for the correct filter for our application.
 * Returns a callback.
 *
 * @returns a callback that returns the default filter for the given combination of inputs
 */
export const useFindFilterByUsage = () => {
  const signalDetections = useSignalDetections();
  const channels = useAllChannelsRecord();
  const defaultFilterDefinitionsMap = useAppSelector(selectDefaultFilterDefinitionsMap);
  const stationLocationToOpenEventDistance = useStationLocationToOpenEventDistance();
  const findFilterForSignalDetectionHypothesis = useFindFilterForSignalDetectionHypothesis();

  const signalDetectionPhasesByChannel = useMemo((): Record<string, string[]> => {
    return Object.values(signalDetections).reduce((result, signalDetection) => {
      const currentHypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
      const phaseFeatureMeasurement = findPhaseFeatureMeasurement(
        currentHypothesis.featureMeasurements
      );

      if (phaseFeatureMeasurement) {
        const phases = result?.[phaseFeatureMeasurement.channel.name] || [];

        return {
          ...result,
          [phaseFeatureMeasurement.channel.name]: [
            ...phases,
            phaseFeatureMeasurement.measurementValue.value
          ]
        };
      }

      return result;
    }, {});
  }, [signalDetections]);

  return useCallback(
    (
      channelFilter: Filter,
      stationOrChannelName: string,
      uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>
    ): Filter | undefined => {
      // If the channelFilter is unfiltered there is obviously no filter definition to return
      if (!channelFilter || channelFilter.unfiltered) return undefined;
      // If the channel filter is not a named filter the channel filter can be returned
      if (!channelFilter.namedFilter) return channelFilter;

      const filterForSignalDetectionHypothesis = findFilterForSignalDetectionHypothesis(
        channelFilter,
        stationOrChannelName,
        uiChannelSegment
      );

      if (filterForSignalDetectionHypothesis) return filterForSignalDetectionHypothesis;

      const channelName = uiChannelSegment.channelSegmentDescriptor.channel.name;
      const stationName = channels?.[channelName]?.station?.name;
      const { namedFilter } = channelFilter;
      const phase = signalDetectionPhasesByChannel?.[channelName]?.[0] || 'UNSET';

      let distanceDeg = 0;

      // If we have a viable fully populated channel we will have the station name
      if (stationName) {
        distanceDeg = stationLocationToOpenEventDistance(stationName).degrees;
      }

      // Get the global default filter definition
      const globalDefaultFilterDefinition = getGlobalDefaultFilterDefinition(
        defaultFilterDefinitionsMap,
        namedFilter,
        distanceDeg
      );

      // This should only happen in the case of a system misconfiguration
      if (!globalDefaultFilterDefinition)
        throw new Error('No global default filter could be found');

      // Try to find the default filter definition id by usage
      const filterId = defaultFilterDefinitionsMap?.filterDefinitionIdsByUsage?.[channelName]?.[
        phase
      ]?.[namedFilter]?.find(
        filterIdWithinRange =>
          filterIdWithinRange.distanceRange &&
          filterIdWithinRange.distanceRange.minDistanceDeg <= distanceDeg &&
          filterIdWithinRange.distanceRange.maxDistanceDeg >= distanceDeg
      )?.filterDefinitionId;

      let filterDefinition = globalDefaultFilterDefinition;

      // Try to find the best definition by usage
      if (filterId && defaultFilterDefinitionsMap?.filterDefinitionsById?.[filterId]) {
        filterDefinition = defaultFilterDefinitionsMap?.filterDefinitionsById?.[filterId];
      }

      // Return a novel filter with the definition by usage or the global default definition
      return {
        withinHotKeyCycle: channelFilter.withinHotKeyCycle,
        filterDefinition,
        _uiIsError: channelFilter._uiIsError
      };
    },
    [
      channels,
      defaultFilterDefinitionsMap,
      findFilterForSignalDetectionHypothesis,
      signalDetectionPhasesByChannel,
      stationLocationToOpenEventDistance
    ]
  );
};
