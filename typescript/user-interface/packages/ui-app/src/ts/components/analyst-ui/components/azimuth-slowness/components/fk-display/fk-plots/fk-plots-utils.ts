import type { FkTypes, WaveformTypes } from '@gms/common-model';
import { CommonTypes, FilterTypes, SignalDetectionTypes } from '@gms/common-model';
import type { ChannelFilterRecord } from '@gms/ui-state';
import {
  channelSegmentToWeavessChannelSegment,
  fksActions,
  selectFkChannelFilters,
  selectUiChannelSegments,
  useAppDispatch,
  useAppSelector,
  useIsFkBeamAccepted,
  useSelectedFilterList,
  useUiTheme,
  useViewableInterval
} from '@gms/ui-state';
import { WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import React from 'react';
import { toast } from 'react-toastify';

import { gmsColors } from '~scss-config/color-preferences';

/**
 * Builds data for Weavess data segment
 *
 * @param waveform
 * @returns data DataBySampleRate
 */
export function buildDataBySampleRate(
  waveform: WaveformTypes.Waveform
): WeavessTypes.DataBySampleRate {
  const interval: WeavessTypes.TimeRange = {
    startTimeSecs: waveform.startTime,
    endTimeSecs: waveform.endTime
  };
  const dataBySampleRate: WeavessTypes.DataBySampleRate = {
    startTimeSecs: waveform.startTime,
    endTimeSecs: waveform.endTime,
    sampleRate: waveform.sampleRateHz,
    values: new Float32Array(waveform.samples)
  };
  dataBySampleRate.values = WeavessUtil.convertToPositionBuffer(dataBySampleRate, interval);
  return dataBySampleRate;
}

/**
 * Checks for any undefined waveforms inside of fstat data
 *
 * @param fstatData as FkTypes.FstatData
 * @returns boolean if defined or not
 */
export function fStatDataContainsUndefined(fstatData: FkTypes.FstatData): boolean {
  return !fstatData || !fstatData.azimuthWf || !fstatData.fstatWf || !fstatData.slownessWf;
}

/**
 * Determines if the FK Plot 'compute' should be disabled based on a provided configuration
 * differing from another given FK's configuration
 *
 * @param lead
 * @param duration
 * @param fk contains configuration to compare the lead/duration against
 * @returns true if parameters are equivalent, or if one parameter is undefined
 */
export function computeDisabled(lead: number, duration: number, fk: FkTypes.FkSpectra): boolean {
  if (!fk) return true;
  return (
    lead === fk.configuration.fkSpectraParameters.fkSpectrumWindow.lead &&
    duration === fk.configuration.fkSpectraParameters.fkSpectrumWindow.duration
  );
}

/**
 * Creates step markers for fk and traces
 *
 * @param displayedFk fk current being displayed
 * @param arrivalTime of signal detection
 * @param lead spectrum lead in seconds
 * @returns vertical markers used in weavess
 */
const createStepMarkers = (
  arrivalTime: number,
  lead: number,
  stepSizeDuration: number,
  fkInterval: WeavessTypes.TimeRange
) => {
  // Calculating the offset starting point of the first marker
  const adjustedLead = lead % stepSizeDuration;
  const startOffset = (arrivalTime - adjustedLead - fkInterval.startTimeSecs) % stepSizeDuration;
  // Setting the position in epoch time
  let startEpochMarker = fkInterval.startTimeSecs + startOffset;
  const verticalMarkers: WeavessTypes.Marker[] = [];
  // First step marker of the interval
  verticalMarkers.push({
    id: '0',
    color: gmsColors.gmsSoft,
    lineStyle: WeavessTypes.LineStyle.DASHED,
    timeSecs: fkInterval.startTimeSecs
  });
  while (startEpochMarker < fkInterval.endTimeSecs) {
    verticalMarkers.push({
      id: verticalMarkers.length.toString(),
      color: gmsColors.gmsSoft,
      lineStyle: WeavessTypes.LineStyle.DASHED,
      timeSecs: startEpochMarker
    });
    startEpochMarker += stepSizeDuration;
    // Reached last marker
    if (startEpochMarker >= fkInterval.endTimeSecs) {
      verticalMarkers.push({
        id: verticalMarkers.length.toString(),
        color: gmsColors.gmsSoft,
        lineStyle: WeavessTypes.LineStyle.DASHED,
        timeSecs: fkInterval.endTimeSecs
      });
    }
  }
  return verticalMarkers;
};

/**
 * Figures out the index of the spectrum to display closest to the time
 *
 * @param timeSecs
 * @param stepMarkers to search thru
 * @returns spectrum index
 */
export const findSpectrumIndex = (timeSecs: number, stepMarkers: WeavessTypes.Marker[]): number => {
  if (stepMarkers.length === 0) return 0;
  // There are two extra markers as compared to spectrums (starting and ending markers)
  const extraMarkers = 2;

  // Find the marker to the right of the time, if not found (-1) then use last marker index
  let markerIndex = stepMarkers.findIndex(marker => marker.timeSecs > timeSecs);

  if (markerIndex === -1) {
    markerIndex = stepMarkers.length - 1;
  }

  // Now figure out if closer to the right or left markers
  // distance between markers is spectrumStepDuration except first
  // box which could be less
  const stepSize = stepMarkers[markerIndex].timeSecs - stepMarkers[markerIndex - 1].timeSecs;
  const delta = stepMarkers[markerIndex].timeSecs - timeSecs;

  // Closer to left marker
  if (delta > stepSize / 2) {
    markerIndex -= 1;
  }

  // Last spectrum index is: (marker index - extra markers)
  // then adjusted for 0 based indexing
  if (markerIndex >= stepMarkers.length - extraMarkers) {
    markerIndex = stepMarkers.length - extraMarkers - 1;
  }
  return markerIndex;
};

/**
 * Build the beam and trace selection window and step markers
 *
 * @param displayedFk: FkTypes.FkSpectra
 * @param selectionWindow: WeavessTypes.TimeRange
 * @param arrivalTime: number
 * @param spectrumLead: number
 * @returns Markers object with selection window and step markers
 */
export function buildBeamAndTraceMarkers(
  stepSizeDuration: number,
  selectionWindow: WeavessTypes.TimeRange,
  arrivalTime: number,
  spectrumLead: number,
  fkInterval: WeavessTypes.TimeRange
): WeavessTypes.Markers {
  return {
    verticalMarkers: createStepMarkers(arrivalTime, spectrumLead, stepSizeDuration, fkInterval),
    selectionWindows: [
      {
        id: 'fk-displayed',
        startMarker: {
          id: `fk-start`,
          color: gmsColors.gmsProminent,
          lineStyle: WeavessTypes.LineStyle.DASHED,
          timeSecs: selectionWindow.startTimeSecs,
          minTimeSecsConstraint: fkInterval.startTimeSecs
        },
        endMarker: {
          id: `fk-end`,
          color: gmsColors.gmsProminent,
          lineStyle: WeavessTypes.LineStyle.DASHED,
          timeSecs: selectionWindow.endTimeSecs,
          maxTimeSecsConstraint: fkInterval.endTimeSecs
        },
        isMoveable: true,
        color: 'rgba(200,200,200,0.2)',
        minimumSelectionWindowDuration: {
          durationInSeconds: 1,
          onDurationReached: () => {
            toast.info('Minimum FK spectrum window duration limit reached', {
              toastId: 'toast-fk-minimum-duration-reached'
            });
          }
        }
      }
    ]
  };
}

/**
 * @returns Function that can be used to a retrieve beam channel segment associated
 * to the signal detection arrival time
 */
export function useGetBeamChannelSegmentRecord(
  signalDetection: SignalDetectionTypes.SignalDetection
) {
  const isFkBeamAccepted = useIsFkBeamAccepted();
  const [uiTheme] = useUiTheme();
  const [viewableInterval] = useViewableInterval();
  CommonTypes.Util.validateTimeRange(viewableInterval);
  const channelSegmentData = useAppSelector(selectUiChannelSegments);

  return React.useCallback(
    (selectedFilterName: string): Record<string, WeavessTypes.ChannelSegment[]> => {
      // Get the ChannelSegment map for the channel name from the Waveform Cache
      // The key to the map is the waveform filter name
      if (!signalDetection || !channelSegmentData) {
        return {};
      }
      const beamChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
      if (!isFkBeamAccepted(signalDetection) && channelSegmentData[signalDetection.id]) {
        if (!channelSegmentData[signalDetection.id][selectedFilterName]) {
          return {};
        }
        beamChannelSegmentsRecord[selectedFilterName] = channelSegmentData[signalDetection.id][
          selectedFilterName
        ].map(filteredFkBeam => {
          return channelSegmentToWeavessChannelSegment(filteredFkBeam, {
            waveformColor: uiTheme.colors.waveformRaw,
            labelTextColor: uiTheme.colors.waveformFilterLabel
          });
        });
        return beamChannelSegmentsRecord;
      }

      const arrivalFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
        SignalDetectionTypes.Util.getCurrentHypothesis(signalDetection.signalDetectionHypotheses)
          ?.featureMeasurements
      );
      if (!arrivalFM.analysisWaveform) return {};

      // TODO: Review is there a better way to find the related channel segment
      // Strip off the unique id off the end of the derived channel name
      // match on 'channel name/beam type/az,slow values/'
      // example: 'ILAR.beam.SHZ/beam,fk,coherent/steer,az_221.100deg,slow_3.385s_per_deg/'
      if (
        channelSegmentData[signalDetection.station.name] &&
        channelSegmentData[signalDetection.station.name][selectedFilterName]
      ) {
        const chanSplits = arrivalFM.analysisWaveform.waveform.id.channel.name.split('/');
        const channelNameToMatch = `${chanSplits[0]}/${chanSplits[1]}/${chanSplits[2]}/`;
        const beamedCs = channelSegmentData[signalDetection.station.name][selectedFilterName]?.find(
          uiCs => uiCs.channelSegmentDescriptor.channel.name.includes(channelNameToMatch)
        );
        if (beamedCs) {
          beamChannelSegmentsRecord[selectedFilterName] = [
            channelSegmentToWeavessChannelSegment(beamedCs, {
              waveformColor: uiTheme.colors.waveformRaw,
              labelTextColor: uiTheme.colors.waveformFilterLabel
            })
          ];
        }
      }
      return beamChannelSegmentsRecord;
    },
    [
      channelSegmentData,
      isFkBeamAccepted,
      signalDetection,
      uiTheme.colors.waveformFilterLabel,
      uiTheme.colors.waveformRaw
    ]
  );
}

/**
 * Updates and selects filter for the FK beam, will also consider default selections.
 *
 * @param displayedSignalDetectionId
 * @param fkConfiguration the FK spectra template for this FK
 * @returns an object that contains the currently selected filter, the full channel filter object and a setter
 */
export function useFkChannelFilters(
  displayedSignalDetection: SignalDetectionTypes.SignalDetection,
  fkConfiguration: FkTypes.FkSpectraTemplate
): {
  selectedFkFilter: FilterTypes.Filter;
  fkChannelFilters: ChannelFilterRecord;
  setFkChannelFilter: (filter: FilterTypes.Filter) => void;
} {
  const isFkBeamAccepted = useIsFkBeamAccepted();
  const stationNameOrSdId = !isFkBeamAccepted(displayedSignalDetection)
    ? displayedSignalDetection.id
    : fkConfiguration.station.name;
  const dispatch = useAppDispatch();
  const fkChannelFilters = useAppSelector(selectFkChannelFilters);
  const selectedFilterList = useSelectedFilterList();

  const getInitialSelectedFilter = React.useMemo(() => {
    const fkFilter = selectedFilterList?.filters.find(
      filter => filter.namedFilter === FilterTypes.FilterDefinitionUsage.FK
    );
    if (fkFilter) {
      return fkFilter;
    }
    return selectedFilterList?.filters[selectedFilterList?.defaultFilterIndex];
  }, [selectedFilterList?.defaultFilterIndex, selectedFilterList?.filters]);

  const setFkChannelFilter = React.useCallback(
    (filter: FilterTypes.Filter) => {
      dispatch(
        fksActions.setFkFilterForSignalDetectionAndChannel({
          displayedSignalDetectionId: displayedSignalDetection.id,
          channelOrSdName: stationNameOrSdId,
          filter
        })
      );
    },
    [stationNameOrSdId, dispatch, displayedSignalDetection.id]
  );

  const selectedFkFilter = React.useMemo(
    () =>
      fkChannelFilters[displayedSignalDetection.id]?.[stationNameOrSdId] ||
      getInitialSelectedFilter,
    [stationNameOrSdId, displayedSignalDetection.id, fkChannelFilters, getInitialSelectedFilter]
  );

  const fkChannelFiltersWithDefault = React.useMemo(
    () =>
      !fkChannelFilters[displayedSignalDetection.id] ||
      (!Object.keys(fkChannelFilters[displayedSignalDetection.id]).length &&
        getInitialSelectedFilter?.namedFilter === FilterTypes.FilterDefinitionUsage.FK)
        ? ({ [stationNameOrSdId]: getInitialSelectedFilter } as ChannelFilterRecord)
        : fkChannelFilters[displayedSignalDetection.id],
    [stationNameOrSdId, displayedSignalDetection.id, fkChannelFilters, getInitialSelectedFilter]
  );

  return { selectedFkFilter, fkChannelFilters: fkChannelFiltersWithDefault, setFkChannelFilter };
}
