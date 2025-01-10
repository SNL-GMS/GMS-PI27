import type {
  CommonTypes,
  ConfigurationTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';
import { ChannelTypes, EventTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  findArrivalTimeFeatureMeasurement,
  getCurrentHypothesis,
  isArrivalTimeMeasurementValue,
  isPhaseMeasurementValue
} from '@gms/common-model/lib/signal-detection/util';
import type { UiChannelSegment } from '@gms/ui-state';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import type { ReceiverLocation } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import { HotkeyListener } from '@gms/ui-util';
import type { WeavessTypes } from '@gms/weavess-core';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';
import memoizeOne from 'memoize-one';
import React from 'react';

import { isSignalDetectionOpenAssociated } from '~analyst-ui/common/utils/event-util';

import type { WaveformDisplayProps } from './types';

/**
 * Function to add offset to the viewable interval
 *
 * @returns TimeRange
 */
export const memoizedViewableIntervalWithOffset = memoizeOne(
  (
    viewableInterval: WeavessTypes.TimeRange,
    minimumOffset: number,
    maximumOffset: number,
    baseStationTime: number | undefined
  ): WeavessTypes.TimeRange => {
    let startTimeSecs = viewableInterval.startTimeSecs + minimumOffset;
    let endTimeSecs = viewableInterval.endTimeSecs + maximumOffset;
    if (baseStationTime) {
      const startTimeDiff = baseStationTime - startTimeSecs;
      const endTimeDiff = endTimeSecs - baseStationTime;
      if (startTimeDiff < endTimeDiff) {
        startTimeSecs -= endTimeDiff - startTimeDiff;
      } else {
        endTimeSecs += startTimeDiff - endTimeDiff;
      }
    }

    return {
      startTimeSecs,
      endTimeSecs
    };
  },
  isEqual
);

/**
 * Sort feature predictions with Phase feature measurements
 *
 * @param featurePredictions to sort
 * @returns sorted Feature Predictions
 */
export const sortFeaturePredictions = (
  featurePredictions: EventTypes.FeaturePrediction[]
): EventTypes.FeaturePrediction[] => {
  return featurePredictions.sort((a, b) => {
    if (
      isPhaseMeasurementValue(a.predictionValue.predictedValue) &&
      isPhaseMeasurementValue(b.predictionValue.predictedValue)
    ) {
      const aValue = a.predictionValue.predictedValue.value.toString();
      const bValue = b.predictionValue.predictedValue.value.toString();
      return aValue.localeCompare(bValue);
    }
    return 0;
  });
};

/**
 * Get the alignment time based on station with earliest arrival.
 *
 * @param featurePredictions feature predictions
 * @param baseStationName station name
 * @param phaseToAlignBy phase to align by
 * @returns alignment time or undefined
 */
export const getAlignmentTime = (
  featurePredictions: Record<string, ReceiverLocation>,
  baseStationName: string,
  phaseToAlignBy: string
): number | undefined => {
  if (featurePredictions) {
    const baseFeaturePrediction = featurePredictions[baseStationName]?.featurePredictions?.find(
      fp =>
        fp.phase === phaseToAlignBy &&
        fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
    );
    if (
      baseFeaturePrediction &&
      isArrivalTimeMeasurementValue(baseFeaturePrediction.predictionValue.predictedValue)
    ) {
      return baseFeaturePrediction.predictionValue.predictedValue.arrivalTime.value;
    }
  }
  return undefined;
};

/**
 * Calculate offsets based on station with earliest arrival.
 * Helper function for {@link calculateOffsetsObservedPhase}.
 * Determines if a given signal detection is OpenAssociated and of a specified phase.
 */
const filterByOpenAssociatedAndPhase = (
  sd: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string,
  phaseToOffset: string,
  openIntervalName: string
): boolean => {
  if (isSignalDetectionOpenAssociated(sd, events, currentOpenEventId, openIntervalName)) {
    // Filter for matching phase last because this operation is somewhat heavy.
    const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
        .featureMeasurements
    );
    return fmPhase.value === phaseToOffset;
  }
  return false;
};

/**
 * Helper function for {@link calculateOffsetsObservedPhase}.
 * Calculates an {@link Offset} using the arrivalTimeFeatureMeasurement derived from
 * a given Signal Detection and baseStationTime.
 */
const calcOffsetFromSignalDetection = (
  sd: SignalDetectionTypes.SignalDetection,
  baseStationTime: number | undefined
): number | undefined => {
  const arrivalTimeFeatureMeasurement =
    SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
        .featureMeasurements
    );
  return arrivalTimeFeatureMeasurement && baseStationTime
    ? baseStationTime - arrivalTimeFeatureMeasurement.arrivalTime.value
    : undefined;
};

/**
 * Helper function for {@link calculateOffsetsObservedPhase} and {@link calculateOffsetsPredictedPhase}.
 * Calculates an {@link Offset} from a Predicted Feature entry using a given phase and baseStationTime.
 *
 * @param entry
 * @param baseStationTime
 * @param phaseToOffset
 * @returns
 */
const calcOffsetFromFeaturePrediction = (
  response: ReceiverLocation,
  baseStationTime: number | undefined,
  phaseToOffset: string
): number | undefined => {
  const featurePrediction = response.featurePredictions.find(
    fp =>
      fp.phase === phaseToOffset &&
      fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
  );
  if (
    baseStationTime &&
    featurePrediction &&
    isArrivalTimeMeasurementValue(featurePrediction.predictionValue.predictedValue)
  ) {
    return baseStationTime - featurePrediction.predictionValue.predictedValue.arrivalTime.value;
  }
  return undefined;
};

/**
 * Calculate offsets alignment on Predicted phase based on station with earliest arrival.
 */
export const calculateOffsetsPredictedPhase = (
  featurePredictions: Record<string, ReceiverLocation>,
  baseStationName: string,
  phaseToOffset: string,
  stations: StationTypes.Station[]
): Record<string, number> => {
  const offsets: Record<string, number> = {};
  if (featurePredictions) {
    const baseFeaturePrediction = featurePredictions[baseStationName]?.featurePredictions.find(
      fp =>
        fp.phase === phaseToOffset &&
        fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
    );
    if (
      baseFeaturePrediction &&
      isArrivalTimeMeasurementValue(baseFeaturePrediction.predictionValue.predictedValue)
    ) {
      offsets.baseStationTime =
        baseFeaturePrediction.predictionValue.predictedValue.arrivalTime.value;
      Object.entries(featurePredictions).forEach(entry => {
        if (stations.find(s => s.name === entry[0])) {
          offsets[entry[0]] = calcOffsetFromFeaturePrediction(
            entry[1],
            offsets.baseStationTime,
            phaseToOffset
          );
        }
      });
    }
  }
  return offsets;
};

/**
 * Calculate offsets for alignment on Observed phase based on station with earliest arrival.
 * Falls back to Predicted phase if an observed phase is not associated to a channel's open event.
 */
export const calculateOffsetsObservedPhase = (
  signalDetections: SignalDetectionTypes.SignalDetection[],
  featurePredictions: Record<string, ReceiverLocation>,
  baseStationName: string,
  events: EventTypes.Event[],
  currentOpenEventId: string,
  phaseToOffset: string,
  stations: StationTypes.Station[],
  openIntervalName: string
): Record<string, number> => {
  const fmOffsets: Record<string, number> = {};
  const fpOffsets: Record<string, number> = {};
  /** Signal Detections that are openAssociated and match {@link phaseToOffset} */
  const openAssociatedPhaseSDs = signalDetections.filter(sd =>
    filterByOpenAssociatedAndPhase(sd, events, currentOpenEventId, phaseToOffset, openIntervalName)
  );

  const baseStationSD = openAssociatedPhaseSDs.find(sd => sd.station.name === baseStationName);
  // If the base station does not have any Observed phases, default to the Predicted phase
  if (!baseStationSD) {
    const baseFP = featurePredictions[baseStationName].featurePredictions.find(
      fp =>
        fp.phase === phaseToOffset &&
        fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
    );
    if (baseFP && isArrivalTimeMeasurementValue(baseFP.predictionValue.predictedValue)) {
      fmOffsets.baseStationTime = baseFP.predictionValue.predictedValue.arrivalTime.value;
    }
  } else {
    fmOffsets.baseStationTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(baseStationSD.signalDetectionHypotheses)
        .featureMeasurements
    ).arrivalTime.value;
  }

  openAssociatedPhaseSDs.forEach(sd => {
    fmOffsets[sd.station.name] = calcOffsetFromSignalDetection(sd, fmOffsets.baseStationTime);
  });

  const fmEntries = Object.entries(fmOffsets);
  // Remaining phases not associated to the open event should fall back to "predicted" phases
  Object.entries(featurePredictions)
    .filter(entry => !fmEntries.find(fmEntry => fmEntry[0] === entry[0]))
    .forEach(entry => {
      if (stations.find(s => s.name === entry[0])) {
        fpOffsets[entry[0]] = calcOffsetFromFeaturePrediction(
          entry[1],
          fmOffsets.baseStationTime,
          phaseToOffset
        );
      }
    });

  return { ...fmOffsets, ...fpOffsets };
};

/**
 * TODO: Remove if/when we convert the UI TimeRange to use the same property keys.
 * Converts a UI time range to the Weavess format.
 *
 * @param timeRange a time range in the common model format
 * @returns a timeRange in the weavess format
 */
export const convertToWeavessTimeRange = (
  timeRange: CommonTypes.TimeRange
): WeavessTypes.TimeRange => ({
  startTimeSecs: timeRange.startTimeSecs,
  endTimeSecs: timeRange.endTimeSecs
});

/**
 * Gets the parent station for a provided channel.
 *
 * @param channel the channel or channel name for which to find the parent station
 * @param stations the list of all stations to search
 * @returns the station object from that list (by reference)
 */
export const getStationContainingChannel = (
  channel: ChannelTypes.Channel | string,
  stations: StationTypes.Station[]
): StationTypes.Station =>
  stations.find(s => {
    const channelName = typeof channel === 'string' ? channel : channel.name;
    return !!s.allRawChannels.find(c => c.name === channelName);
  });

function getChannelElementString(channelName: string) {
  let elementString = channelName;
  if (channelName.includes('/')) {
    const splitString = channelName.split('/');
    elementString = splitString.shift();
  }
  return elementString;
}

/**
 * returns the station name based on a channel name
 *
 * @param channelName
 * @returns
 */
export function getStationNameFromChannelName(channelName: string) {
  return channelName.split('.')?.[0];
}

/**
 * @throws errors if the channel name or station name is invalid for building a row label
 */
const validateChannelName = (channelName: string | undefined, stationName: string) => {
  if (!channelName) {
    throw new Error('Cannot get channel name. No channel name provided.');
  }
  const elementString = getChannelElementString(channelName);

  if (!elementString || elementString.length === 0 || !elementString.includes('.')) {
    throw new Error('Cannot get channel name. Channel name format invalid.');
  }
  const elements = elementString.split('.');
  if (elements.length !== 3) {
    throw new Error(
      'Cannot get channel name. Channel name format invalid. Channel name must have a three-part STATION.GROUP.CODE format'
    );
  }
  if (stationName !== getStationNameFromChannelName(channelName)) {
    throw new Error('Invalid signal detection. Station has channel from a different station.');
  }
};

/**
 * Gets the channel orientation code from a channel name string
 */
function getChannelOrientation(channelName: string) {
  const elements = getChannelElementString(channelName).split('.');
  return elements[2];
}

/**
 * Parses a channel name string, and returns a group label
 * * `beam` if a beam
 * * Raw channel group name (eg, AS01), if a channel group
 * * `temp` if a temp channel
 */
function getChannelGroupLabel(channelName: string) {
  const waveformChannelType = ChannelTypes.Util.parseWaveformChannelType(channelName);
  if (
    waveformChannelType === 'Detection beam' ||
    waveformChannelType === 'Event beam' ||
    waveformChannelType === 'Fk beam'
  ) {
    return 'beam';
  }
  if (waveformChannelType === 'Raw channel') {
    return channelName.split('.')[1]; // channel group
  }
  if (waveformChannelType === 'N/A') {
    return 'temp';
  }
  throw new Error(`Cannot parse channel group label. Invalid channel name: ${channelName}`);
}

/**
 * Interface for managing the relevant row label data to build the row labels
 */
interface RowLabelData {
  stationName: string;
  groupLabel: string;
  channelOrientation: string;
  waveformType:
    | 'N/A'
    | 'Raw channel'
    | 'Fk beam'
    | 'Event beam'
    | 'Detection beam'
    | 'Mixed beam'
    | 'Mixed'
    | undefined;
  tooltip?:
    | 'Multiple raw channels'
    | 'Multiple beam types'
    | 'Multiple beam and channel types'
    | 'Multiple channel types'
    | 'Multiple waveform types'
    | 'Multiple waveform and channel types';
}

/**
 * From a waveform type string, return true if a beam. False if not.
 */
function isBeam(waveformType: RowLabelData['waveformType']): boolean {
  return (
    waveformType === 'Fk beam' ||
    waveformType === 'Event beam' ||
    waveformType === 'Detection beam' ||
    waveformType === 'Mixed beam'
  );
}

/**
 * Gets the waveform type from two different row label objects
 */
function getWaveformType(rowLabelData: RowLabelData, reducedRow: RowLabelData) {
  if (rowLabelData.waveformType === reducedRow.waveformType) {
    return rowLabelData.waveformType;
  }
  if (isBeam(rowLabelData.waveformType) && isBeam(reducedRow.waveformType)) {
    return 'Mixed beam';
  }

  return 'Mixed';
}

/**
 * Gets the group label (after the station, before the channel code) from two input
 * row label objects
 */
function getGroupLabel(rowLabelData: RowLabelData, reducedRow: RowLabelData) {
  const waveformType =
    rowLabelData.waveformType === reducedRow.waveformType ? rowLabelData.waveformType : 'Mixed';

  if (isBeam(waveformType)) {
    if (rowLabelData.waveformType !== reducedRow.waveformType) {
      return '*';
    }
    return 'beam';
  }
  if (waveformType === 'Mixed') {
    return '*';
  }
  if (rowLabelData.groupLabel === reducedRow.groupLabel) {
    return rowLabelData.groupLabel;
  }
  if (waveformType === 'Raw channel') {
    return 'raw';
  }
  throw new Error('Cannot get row group label.');
}

/**
 * Gets a tooltip from two input label data objects
 */
function getTooltipLabel(rowLabelData: RowLabelData, reducedRow: RowLabelData) {
  if (
    reducedRow.waveformType === 'Raw channel' &&
    rowLabelData.waveformType === 'Raw channel' &&
    (reducedRow.groupLabel !== rowLabelData.groupLabel ||
      reducedRow.channelOrientation !== rowLabelData.channelOrientation)
  ) {
    return 'Multiple raw channels';
  }
  if (
    isBeam(reducedRow.waveformType) &&
    isBeam(rowLabelData.waveformType) &&
    reducedRow.waveformType !== rowLabelData.waveformType
  ) {
    if (reducedRow.channelOrientation === rowLabelData.channelOrientation) {
      return 'Multiple beam types';
    }
    return 'Multiple beam and channel types';
  }
  if (reducedRow.waveformType !== rowLabelData.waveformType) {
    if (reducedRow.channelOrientation === rowLabelData.channelOrientation) {
      return 'Multiple waveform types';
    }
    return 'Multiple waveform and channel types';
  }
  if (reducedRow.channelOrientation !== rowLabelData.channelOrientation) {
    return 'Multiple channel types';
  }
  return undefined;
}

/**
 * Creates a single row label object from two input objects
 */
const reduceRowLabel = (reducedRow: RowLabelData, rowLabelData) => {
  if (!reducedRow) {
    return rowLabelData;
  }
  if (reducedRow.stationName !== rowLabelData.stationName) {
    throw new Error('Cannot build a row label out of channels from multiple stations.');
  }
  return {
    stationName: rowLabelData.stationName,
    waveformType: getWaveformType(rowLabelData, reducedRow),
    channelOrientation:
      rowLabelData.channelOrientation === reducedRow.channelOrientation
        ? rowLabelData.channelOrientation
        : '*',
    groupLabel: getGroupLabel(rowLabelData, reducedRow),
    tooltip: getTooltipLabel(rowLabelData, reducedRow)
  };
};

/**
 * Computes row label data from a list of SDs from a station.
 *
 * @param signalDetections for one station
 */
export const getRowLabelDataFromSignalDetections = (
  signalDetections: SignalDetectionTypes.SignalDetection[]
): RowLabelData[] => {
  if (!signalDetections || signalDetections.length === 0) {
    return [];
  }
  return signalDetections.map<RowLabelData>(sd => {
    const sdh = getCurrentHypothesis(sd.signalDetectionHypotheses);
    const sdfm =
      sdh?.featureMeasurements?.length > 0
        ? findArrivalTimeFeatureMeasurement(sdh.featureMeasurements)
        : undefined;
    validateChannelName(sdfm?.channel.name, sdh.station.name);
    return {
      stationName: sdh.station.name,
      channelOrientation: getChannelOrientation(sdfm?.channel.name ?? ''),
      waveformType: ChannelTypes.Util.parseWaveformChannelType(sdfm?.channel.name ?? ''),
      groupLabel: getChannelGroupLabel(sdfm?.channel.name ?? '')
    };
  });
};

/**
 * Computes row label data from a list of event beams from a station
 *
 * @param eventBeams for one station
 */
export const getRowLabelDataFromEventBeams = (
  eventBeams: UiChannelSegment<WaveformTypes.Waveform>[]
): RowLabelData[] => {
  if (!eventBeams || eventBeams.length === 0) {
    return [];
  }
  const channelName = eventBeams[0].channelSegmentDescriptor.channel.name.substring(
    0,
    eventBeams[0].channelSegmentDescriptor.channel.name.indexOf('.')
  );
  return eventBeams.map<RowLabelData>(eventBeam => {
    validateChannelName(eventBeam.channelSegmentDescriptor.channel.name, channelName);
    return {
      stationName: channelName,
      channelOrientation: getChannelOrientation(
        eventBeam.channelSegmentDescriptor.channel.name ?? ''
      ),
      waveformType: ChannelTypes.Util.parseWaveformChannelType(
        eventBeam.channelSegmentDescriptor.channel.name ?? ''
      ),
      groupLabel: getChannelGroupLabel(eventBeam.channelSegmentDescriptor.channel.name ?? '')
    };
  });
};

/**
 * Computes the channel label name from a list of SDs and event beams from a station.
 * first: 'station name' or throws exception if mixed
 * second: 'beam', 'temp', the channel group, 'raw' or '*' if mixed
 * third: 'channel orientation code' i.e. 'SHZ' or '*' if mixed
 * if list is empty then returns empty string
 * @param signalDetections for one station
 * @param eventBeams for one station
 * @returns station string
 */
export const getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams = (
  signalDetections: SignalDetectionTypes.SignalDetection[],
  eventBeams: UiChannelSegment<WaveformTypes.Waveform>[]
): { channelLabel: string; tooltip: string | undefined } => {
  const rowLabel = [
    ...getRowLabelDataFromSignalDetections(signalDetections),
    ...getRowLabelDataFromEventBeams(eventBeams)
  ].reduce<RowLabelData>(reduceRowLabel, undefined);
  const channelLabel = rowLabel ? `${rowLabel.groupLabel}.${rowLabel.channelOrientation}` : '';
  return {
    channelLabel: channelLabel === '*.*' ? '*' : channelLabel,
    tooltip: rowLabel?.tooltip
  };
};

/**
 * Given a channel, returns the station name
 *
 * @param derivedChannelName
 */
export const getStationNameFromChannel = (channel: ChannelTypes.Channel): string => {
  if (channel.name) {
    let elementString = channel.name;
    if (channel.name.includes('/')) {
      const splitString = channel.name.split('/');
      elementString = splitString.shift() ?? '';
    }
    const elements = elementString.split('.');
    return elements[0];
  }
  return '';
};

/**
 *
 * Pulls all Weavess-related hotkeys from the analyst config's keyboard shortcuts
 * and formats them them to a {@link WeavessTypes.HotKeysConfiguration} object
 *
 * @param keyboardShortcuts
 * @returns
 */
export const buildWeavessHotkeys = (
  keyboardShortcuts: ConfigurationTypes.KeyboardShortcutConfigurations | undefined
) => {
  // Make weavess-ready
  const weavessHotkeys: WeavessTypes.HotKeysConfiguration = {};
  // Hotkey configurations
  const {
    resetSelectedWaveformAmplitudeScaling,
    resetAllWaveformAmplitudeScaling,
    zoomOutFully,
    zoomOutOneStep,
    zoomInOneStep,
    pageDown,
    pageUp,
    panLeft,
    panRight,
    editSignalDetectionUncertainty,
    toggleCurrentPhaseMenu,
    toggleCommandPalette,
    toggleAlignment,
    hideMeasureWindow,
    closeCreateSignalDetectionOverlay
  } = keyboardShortcuts?.hotkeys ?? { hotkeys: undefined };

  // DragEvent configurations
  const { scaleWaveformAmplitude, drawMeasureWindow, createQcSegments } =
    keyboardShortcuts?.dragEvents ?? { hotkeys: undefined };

  const {
    viewQcSegmentDetails,
    createSignalDetectionWithCurrentPhase,
    createSignalDetectionWithDefaultPhase,
    createSignalDetectionWithChosenPhase,
    createSignalDetectionNotAssociatedWithWaveformCurrentPhase,
    createSignalDetectionNotAssociatedWithWaveformDefaultPhase,
    createSignalDetectionNotAssociatedWithWaveformChosenPhase
  } = keyboardShortcuts?.clickEvents ?? { hotkeys: undefined };

  /**
   * All {@link ConfigurationTypes.HotkeyConfiguration} assembled
   * into a keyed object so it can be cleanly iterated upon.
   */
  const allHotkeyConfigurations = {
    resetSelectedWaveformAmplitudeScaling,
    resetAllWaveformAmplitudeScaling,
    viewQcSegmentDetails,
    zoomOutFully,
    zoomOutOneStep,
    zoomInOneStep,
    pageDown,
    pageUp,
    panLeft,
    panRight,
    editSignalDetectionUncertainty,
    scaleWaveformAmplitude,
    drawMeasureWindow,
    createQcSegments,
    createSignalDetectionWithCurrentPhase,
    createSignalDetectionWithDefaultPhase,
    createSignalDetectionWithChosenPhase,
    createSignalDetectionNotAssociatedWithWaveformCurrentPhase,
    createSignalDetectionNotAssociatedWithWaveformDefaultPhase,
    createSignalDetectionNotAssociatedWithWaveformChosenPhase,
    toggleCurrentPhaseMenu,
    toggleCommandPalette,
    toggleAlignment,
    hideMeasureWindow,
    closeCreateSignalDetectionOverlay
  };

  Object.keys(allHotkeyConfigurations).forEach(
    (configName: keyof typeof allHotkeyConfigurations) => {
      const hotkeyConfiguration = allHotkeyConfigurations[configName];
      weavessHotkeys[configName] =
        hotkeyConfiguration !== undefined
          ? {
              combos: [...hotkeyConfiguration.combos],
              description: hotkeyConfiguration.description,
              category: 'Waveform Display'
            }
          : undefined;
    }
  );
  return weavessHotkeys;
};

/**
 * Hook that pulls all Weavess-related hotkeys from the analyst config's keyboard shortcuts
 * and formats them them to a {@link WeavessTypes.HotKeysConfiguration} object
 *
 * @param keyboardShortcuts Keyboard shortcuts from the analyst config
 * @returns Weavess hotkey configuration object
 */
export function useWeavessHotkeys(
  keyboardShortcuts: ConfigurationTypes.KeyboardShortcutConfigurations | undefined
) {
  return React.useMemo(() => {
    return buildWeavessHotkeys(keyboardShortcuts);
  }, [keyboardShortcuts]);
}

/**
 * Helper function to check if any of the SD hotkeys are satisfied
 *
 */
export function isAnyCreateSDHotkeySatisfied(
  e: React.MouseEvent<HTMLDivElement>,
  initialConfiguration: Partial<WeavessTypes.Configuration>
) {
  return (
    HotkeyListener.isHotKeyCommandSatisfied(
      e.nativeEvent,
      initialConfiguration?.hotKeys?.createSignalDetectionWithCurrentPhase?.combos ?? []
    ) ||
    HotkeyListener.isHotKeyCommandSatisfied(
      e.nativeEvent,
      initialConfiguration?.hotKeys?.createSignalDetectionWithDefaultPhase?.combos ?? []
    ) ||
    HotkeyListener.isHotKeyCommandSatisfied(
      e.nativeEvent,
      initialConfiguration?.hotKeys?.createSignalDetectionNotAssociatedWithWaveformCurrentPhase
        ?.combos ?? []
    ) ||
    HotkeyListener.isHotKeyCommandSatisfied(
      e.nativeEvent,
      initialConfiguration?.hotKeys?.createSignalDetectionNotAssociatedWithWaveformDefaultPhase
        ?.combos ?? []
    ) ||
    HotkeyListener.isHotKeyCommandSatisfied(
      e.nativeEvent,
      initialConfiguration?.hotKeys?.createSignalDetectionWithChosenPhase?.combos ?? []
    ) ||
    HotkeyListener.isHotKeyCommandSatisfied(
      e.nativeEvent,
      initialConfiguration?.hotKeys?.createSignalDetectionNotAssociatedWithWaveformChosenPhase
        ?.combos ?? []
    )
  );
}

/**
 * Sets focus to the waveform display
 */
export function setFocusToWaveformDisplay(): void {
  const waveformDisplay = document.getElementsByClassName('waveform-display-container');
  const waveformDisplayElement = waveformDisplay[0] as HTMLElement;
  waveformDisplayElement?.focus();
}

/**
 * sort waveform list based on sort type
 *
 * @param stations StationDefinition list
 * @param waveformSortType Alphabetical or by distance to selected event
 * @distance distance to stations list
 *
 * @returns sortedWeavessStations
 */
export function sortProcessingStations(
  stations: StationTypes.Station[],
  waveformSortType: AnalystWorkspaceTypes.WaveformSortType,
  distances: EventTypes.LocationDistance[]
): StationTypes.Station[] {
  // apply sort based on sort type
  let sortedStations: StationTypes.Station[] = [];

  // Sort by distance if in global scan
  if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.distance) {
    sortedStations = sortBy<StationTypes.Station>(
      stations,
      station => distances.find(source => source.id === station.name)?.distance.degrees
    );
    // For station name sort, order a-z by station config name
  } else if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationNameAZ) {
    sortedStations = orderBy<StationTypes.Station>(stations, [station => station.name], ['asc']);
  } else if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationNameZA) {
    sortedStations = orderBy<StationTypes.Station>(stations, [station => station.name], ['desc']);
  }
  return sortedStations;
}

/**
 * Filter the stations based on the mode setting.
 *
 * @param mode the mode of the waveform display
 * @param station the station
 * @param signalDetectionsByStation the signal detections for all stations
 */
export function filterStationOnMode(
  mode: AnalystWorkspaceTypes.WaveformDisplayMode,
  station: StationTypes.Station,
  currentOpenEvent: EventTypes.Event | undefined,
  signalDetectionsByStation: SignalDetectionTypes.SignalDetection[],
  openIntervalName: string
): boolean {
  const preferredEventHypothesisByStage: EventTypes.EventHypothesis | undefined =
    EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
      currentOpenEvent,
      openIntervalName
    );
  if (AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT === mode) {
    if (currentOpenEvent) {
      const associatedSignalDetectionHypothesisIds =
        preferredEventHypothesisByStage?.associatedSignalDetectionHypotheses.map(
          hypothesis => hypothesis.id.id
        );
      const signalDetections = signalDetectionsByStation
        ? signalDetectionsByStation.filter(sd => {
            // filter out the sds for the other stations
            if (sd.station.name !== station.name) {
              return false;
            }
            return includes(
              associatedSignalDetectionHypothesisIds,
              getCurrentHypothesis(sd.signalDetectionHypotheses).id.id
            );
          })
        : [];
      // display the station only if sds were returned
      return signalDetections.length > 0;
    }
  }
  return true; // show all stations (DEFAULT)
}

/**
 * Return sorted, filtered stations given sort type and current open event
 *
 * @param props current {@link WaveformDisplayProps}
 * @param sortByDistance override sort mode and sort by distance
 * @returns a {@link StationTypes.Station} array
 */
export function getSortedFilteredDefaultStations(
  props: WaveformDisplayProps,
  sortByDistance = false
): StationTypes.Station[] {
  const { events } = props;
  const currentOpenEvent = events?.find(event => event.id === props.currentOpenEventId);
  const signalDetectionsByStation = props.signalDetections;
  const theStations = props.stationsQuery?.data;
  const filteredStations = theStations
    ? // filter the stations based on the mode setting
      theStations.filter(stationToFilterOnMode =>
        filterStationOnMode(
          props.measurementMode.mode,
          stationToFilterOnMode,
          currentOpenEvent,
          signalDetectionsByStation,
          props.currentStageName
        )
      )
    : [];

  if (sortByDistance) {
    return sortProcessingStations(
      filteredStations,
      AnalystWorkspaceTypes.WaveformSortType.distance,
      props.distances
    );
  }
  return currentOpenEvent
    ? sortProcessingStations(filteredStations, props.selectedSortType, props.distances)
    : filteredStations;
}

/**
 * Calculate the zoom interval for the current open event,
 * 30 seconds before and after the alignment time at the closest station
 *
 * @param props current {@link WaveformDisplayProps}
 * @param sortByDistance override sort mode and sort by distance
 * @returns the zoom interval as a {@link CommonTypes.TimeRange} or undefined
 */
export function calculateZoomIntervalForCurrentOpenEvent(
  props: WaveformDisplayProps,
  phaseToAlignBy,
  sortByDistance = false
): CommonTypes.TimeRange | undefined {
  const { zasZoomInterval } = props.processingAnalystConfiguration;
  let timeIntervalBuffer = 30;
  if (zasZoomInterval !== undefined && !Number.isNaN(zasZoomInterval)) {
    timeIntervalBuffer = zasZoomInterval / 2;
  }
  const sortedFilteredDefaultStations = getSortedFilteredDefaultStations(props, sortByDistance);
  const sortedVisibleStations = props.getVisibleStationsFromStationList(
    sortedFilteredDefaultStations
  );
  if (
    props.featurePredictionQuery.data &&
    props.featurePredictionQuery.data.receiverLocationsByName &&
    sortedVisibleStations !== undefined &&
    sortedVisibleStations.length > 0
  ) {
    const alignmentTime = getAlignmentTime(
      props.featurePredictionQuery.data.receiverLocationsByName,
      sortedVisibleStations[0].name,
      phaseToAlignBy
    );
    if (alignmentTime) {
      return {
        startTimeSecs: alignmentTime - timeIntervalBuffer,
        endTimeSecs: alignmentTime + timeIntervalBuffer
      };
    }
  }
  return undefined;
}
