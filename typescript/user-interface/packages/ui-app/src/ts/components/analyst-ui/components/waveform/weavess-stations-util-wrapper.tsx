import {
  AnalystWaveformUtil,
  selectEventBeams,
  selectMeasurementMode,
  selectOpenEvent,
  selectOpenIntervalName,
  selectPhaseToAlignOn,
  selectSelectedSdIds,
  selectSelectedSortType,
  selectSelectedStationsAndChannelIds,
  selectSignalDetectionAssociationConflictCount,
  selectValidActionTargetSignalDetectionIds,
  selectWorkflowTimeRange,
  useAppSelector,
  useChannelHeight,
  useChannels,
  useEventStatusQuery,
  useGetEvents,
  useGetSignalDetections,
  usePredictFeaturesForEventLocation,
  useProcessingAnalystConfiguration,
  useSelectedFilterList,
  useSelectedWaveforms,
  useShouldShowPredictedPhases,
  useShouldShowTimeUncertainty,
  useSplitStation,
  useUiChannelSegmentsWithEventBeams,
  useUiTheme,
  useViewableInterval,
  useZoomInterval
} from '@gms/ui-state';
import {
  selectChannelFilters,
  selectStationsVisibility,
  selectWaveformDisplayedSignalDetectionConfiguration
} from '@gms/ui-state/lib/app/state/waveform/selectors';
import type { WeavessTypes } from '@gms/weavess-core';
import flatten from 'lodash/flatten';
import React from 'react';

import {
  getDistanceToStationsForPreferredLocationSolutionId,
  getSignalDetectionStatuses
} from '~analyst-ui/common/utils/event-util';
import { filterSignalDetectionsByStationId } from '~analyst-ui/common/utils/signal-detection-util';

import {
  useMaskVisibility,
  useProcessingMasksForWaveformDisplay,
  useQcMasksForWaveformDisplay,
  useWaveformOffsets,
  useWaveformStations
} from './waveform-hooks';
import type { CreateWeavessStationsParameters } from './weavess-stations-util';
import * as WaveformUtil from './weavess-stations-util';

export const useWeavessStationUtilWrapper = (): WeavessTypes.Station[] => {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const stationQuery = useWaveformStations();
  const [selectedWaveforms] = useSelectedWaveforms();

  const [uiTheme] = useUiTheme();
  const measurementMode = useAppSelector(selectMeasurementMode);
  const eventResults = useGetEvents();
  const eventStatusQuery = useEventStatusQuery();
  const displayedSignalDetectionConfiguration = useAppSelector(
    selectWaveformDisplayedSignalDetectionConfiguration
  );
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const phaseToAlignOn = useAppSelector(selectPhaseToAlignOn);

  const phaseToAlignOnArray = React.useMemo(() => [phaseToAlignOn], [phaseToAlignOn]);
  const featurePredictionQuery = usePredictFeaturesForEventLocation(phaseToAlignOnArray);

  const featurePredictions = featurePredictionQuery?.data?.receiverLocationsByName;
  const stationsVisibility = useAppSelector(selectStationsVisibility);
  const signalDetectionResults = useGetSignalDetections();
  const processingMasks = useProcessingMasksForWaveformDisplay();
  const maskVisibility = useMaskVisibility();
  const sdIdsInConflict = useAppSelector(selectSignalDetectionAssociationConflictCount);
  const uiChannelSegments = useUiChannelSegmentsWithEventBeams();
  const filterList = useSelectedFilterList();
  const offsets = useWaveformOffsets();
  const populatedChannels = useChannels();
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const currentTimeInterval = useAppSelector(selectWorkflowTimeRange);
  const [viewableInterval] = useViewableInterval();
  const [zoomInterval] = useZoomInterval();
  const channelFilters = useAppSelector(selectChannelFilters);
  const signalDetectionActionTargets = useAppSelector(selectValidActionTargetSignalDetectionIds);
  const qcSegments = useQcMasksForWaveformDisplay();
  const [shouldShowTimeUncertainty] = useShouldShowTimeUncertainty();
  const [shouldShowPredictedPhases] = useShouldShowPredictedPhases();
  const [channelHeight] = useChannelHeight();
  const [splitStation] = useSplitStation();
  const selectedSortType = useAppSelector(selectSelectedSortType);
  const eventBeams = useAppSelector(selectEventBeams);
  const distances = React.useMemo(() => {
    return getDistanceToStationsForPreferredLocationSolutionId(
      currentOpenEvent,
      stationQuery.data,
      openIntervalName,
      populatedChannels
    );
  }, [currentOpenEvent, openIntervalName, populatedChannels, stationQuery.data]);

  const visibleStations = React.useMemo(() => {
    return AnalystWaveformUtil.getVisibleStations(
      stationsVisibility,
      stationQuery?.data ? stationQuery?.data : []
    );
  }, [stationQuery?.data, stationsVisibility]);

  const visibleStationSignalDetections = React.useMemo(() => {
    // Build a list of SDs for visible stations
    return flatten(
      visibleStations.map(station =>
        filterSignalDetectionsByStationId(station.name, signalDetectionResults.data)
      )
    );
  }, [signalDetectionResults.data, visibleStations]);

  const signalDetectionAssociations = React.useMemo(() => {
    return getSignalDetectionStatuses(
      visibleStationSignalDetections,
      eventResults?.data,
      currentOpenEvent?.id,
      eventStatusQuery.data,
      openIntervalName
    );
  }, [
    currentOpenEvent?.id,
    eventResults?.data,
    eventStatusQuery.data,
    openIntervalName,
    visibleStationSignalDetections
  ]);

  const selectedStationsAndChannels = useAppSelector(selectSelectedStationsAndChannelIds);

  const weavessStationsParams: CreateWeavessStationsParameters = React.useMemo(
    () => ({
      measurementMode,
      featurePredictions,
      visibleStationSignalDetections,
      signalDetectionActionTargets,
      sdIdsInConflict,
      selectedSdIds,
      qcSegmentsByChannelName: qcSegments.data,
      processingMasks,
      maskVisibility,
      channelHeight,
      channelFilters,
      filterList,
      uiChannelSegments,
      startTimeSecs: currentTimeInterval.startTimeSecs,
      endTimeSecs: currentTimeInterval.endTimeSecs,
      zoomInterval,
      currentOpenEvent,
      eventBeams,
      showPredictedPhases: shouldShowPredictedPhases,
      showSignalDetectionUncertainty: shouldShowTimeUncertainty,
      distances,
      offsets,
      phaseToAlignOn,
      stationVisibilityDictionary: stationsVisibility,
      visibleStations,
      populatedChannels,
      processingAnalystConfiguration,
      uiTheme,
      openIntervalName,
      displayedSignalDetectionConfiguration,
      selectedWaveforms,
      splitStation,
      signalDetectionAssociations,
      selectedStationsAndChannels: new Set(selectedStationsAndChannels),
      viewableInterval
    }),
    [
      channelFilters,
      channelHeight,
      currentOpenEvent,
      currentTimeInterval.endTimeSecs,
      currentTimeInterval.startTimeSecs,
      displayedSignalDetectionConfiguration,
      distances,
      eventBeams,
      featurePredictions,
      filterList,
      maskVisibility,
      measurementMode,
      offsets,
      openIntervalName,
      phaseToAlignOn,
      populatedChannels,
      processingAnalystConfiguration,
      processingMasks,
      qcSegments.data,
      sdIdsInConflict,
      selectedSdIds,
      selectedWaveforms,
      shouldShowPredictedPhases,
      shouldShowTimeUncertainty,
      signalDetectionActionTargets,
      signalDetectionAssociations,
      splitStation,
      stationsVisibility,
      uiChannelSegments,
      uiTheme,
      visibleStationSignalDetections,
      visibleStations,
      zoomInterval,
      selectedStationsAndChannels,
      viewableInterval
    ]
  );

  const weavessStationsRef = React.useRef<WeavessTypes.Station[]>([]);
  const weavessStationResults = React.useMemo(() => {
    const result = WaveformUtil.createWeavessStations(
      weavessStationsParams,
      selectedSortType,
      weavessStationsRef.current
    );

    if (result.stationsNeedsUpdating) {
      weavessStationsRef.current = result.weavessStations;
    }
    return weavessStationsRef.current;
  }, [selectedSortType, weavessStationsParams]);

  return weavessStationResults;
};
