/* eslint-disable @typescript-eslint/no-use-before-define */
import type {
  ChannelTypes,
  ConfigurationTypes,
  FacetedTypes,
  FilterTypes,
  LegacyEventTypes,
  WaveformTypes
} from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import type { FilterDefinition } from '@gms/common-model/lib/filter';
import { getFilterName } from '@gms/common-model/lib/filter/filter-util';
import {
  findArrivalTimeFeatureMeasurement,
  findArrivalTimeFeatureMeasurementUsingSignalDetection,
  findPhaseFeatureMeasurementValue,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import { toOSDTime } from '@gms/common-util';
import type {
  DisplayedSignalDetectionConfigurationEnum,
  FilterAssociation,
  FilterDefinitionAssociationsObject,
  UiChannelSegment,
  WaveformIdentifier
} from '@gms/ui-state';
import { AnalystWorkspaceTypes, exportChannelSegmentsWithFilterAssociations } from '@gms/ui-state';
import type { WaveformDisplayedSignalDetectionConfigurationEnum } from '@gms/ui-state/lib/app/state/waveform/types';
import { WeavessTypes } from '@gms/weavess-core';
import forEach from 'lodash/forEach';
import isEqual from 'lodash/isEqual';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';

import { EventFilterOptions } from '~analyst-ui/components/events/types';
import { messageConfig } from '~analyst-ui/config/message-config';
import { systemConfig } from '~analyst-ui/config/system-config';

import {
  AMPLITUDE_VALUES,
  FREQUENCY_VALUES,
  NOMINAL_CALIBRATION_PERIOD
} from './amplitude-scale-constants';

/**
 * Calculates a new amplitude measurement value given the [min,max] peak/trough
 *
 * @param peakAmplitude the peak amplitude
 * @param troughAmplitude the trough amplitude
 * @param peakTime the peak time
 * @param troughTime the trough time
 */
export function calculateAmplitudeMeasurementValue(
  peakAmplitude: number,
  troughAmplitude: number,
  peakTime: number,
  troughTime: number
): SignalDetectionTypes.AmplitudeMeasurementValue {
  const amplitude = (peakAmplitude - troughAmplitude) / 2;
  const period = Math.abs(peakTime - troughTime) * 2;
  return {
    amplitude,
    period,
    measurementTime: Math.min(troughTime, peakTime), // TODO: double check that this is correct
    measurementWindowStart: 0, // TODO: placeholder until we have a real value plumbed in
    measurementWindowDuration: 0, // TODO: placeholder until we have a real value plumbed in
    clipped: false, // TODO: placeholder until we have a real value plumbed in
    units: CommonTypes.Units.UNITLESS
  };
}

/**
 * Returns true if the period, trough, or peak times are in warning.
 *
 * @para signalDetectionArrivalTime the arrival time of the signal detection
 * @param period The period value to check
 * @param troughTime The trough time (seconds)
 * @param peakTime The peak time (seconds)
 */
export function isPeakTroughInWarning(
  signalDetectionArrivalTime: number,
  period: number,
  troughTime: number,
  peakTime: number
): boolean {
  const { min } = systemConfig.measurementMode.peakTroughSelection.warning;
  const { max } = systemConfig.measurementMode.peakTroughSelection.warning;
  const { startTimeOffsetFromSignalDetection } = systemConfig.measurementMode.selection;
  const { endTimeOffsetFromSignalDetection } = systemConfig.measurementMode.selection;
  const selectionStart = signalDetectionArrivalTime + +startTimeOffsetFromSignalDetection;
  const selectionEnd = signalDetectionArrivalTime + +endTimeOffsetFromSignalDetection;

  // check that the period is within the correct limits
  // check that peak trough start/end are within the selection area
  return (
    period < min ||
    period > max ||
    peakTime < troughTime ||
    troughTime < selectionStart ||
    troughTime > selectionEnd ||
    peakTime < selectionStart ||
    peakTime > selectionEnd
  );
}

/**
 * Helper function used by {@link findMinMaxAmplitudeForPeakTrough} to find
 * minimum and maximum values in a given array.
 */
const findMinMax = (values: { index: number; value: number }[]) => {
  const startValue = values.slice(0)[0];
  const nextDiffValue = values.find(v => v.value !== startValue.value);
  const isFindingMax = nextDiffValue && nextDiffValue.value > startValue.value;
  const result = { min: startValue, max: startValue };

  forEach(values, nextValue => {
    if (isFindingMax && nextValue.value >= result.max.value) {
      result.max = nextValue;
    } else if (!isFindingMax && nextValue.value <= result.min.value) {
      result.min = nextValue;
    }
  });
  return result;
};

/** Reducer for the minimum value. Used by {@link findMinMaxAmplitudeForPeakTrough}. */
const minReducer = (
  previous: { value: number; index: number },
  current: { value: number; index: number },
  startIndex: number
) => {
  if (current.value < previous.value) {
    return current;
  }
  if (
    current.value === previous.value &&
    Math.abs(startIndex - current.index) > Math.abs(startIndex - previous.index)
  ) {
    return current;
  }
  return previous;
};

/** Reducer for the maximum value. Used by {@link findMinMaxAmplitudeForPeakTrough}. */
const maxReducer = (
  previous: { value: number; index: number },
  current: { value: number; index: number },
  startIndex: number
) => {
  if (current.value > previous.value) {
    return current;
  }
  if (
    current.value === previous.value &&
    Math.abs(startIndex - current.index) > Math.abs(startIndex - previous.index)
  ) {
    return current;
  }
  return previous;
};

/**
 * Finds the [min,max] for the amplitude for peak trough.
 *
 * @param startIndex the starting index into the array
 * @param data the array of values of data
 */
export function findMinMaxAmplitudeForPeakTrough(
  startIndex: number,
  data: number[] | Float32Array
): {
  min: { index: number; value: number };
  max: { index: number; value: number };
} {
  if (
    startIndex !== undefined &&
    data !== undefined &&
    startIndex >= 0 &&
    startIndex < data.length &&
    data.length > 0
  ) {
    const numericalData = Array.from(data);
    const valuesAndIndex = numericalData.map((value: number, index: number) => ({ index, value }));
    const left = valuesAndIndex.slice(0, startIndex + 1).reverse();
    const right = valuesAndIndex.slice(startIndex, data.length);

    const leftMinMax = findMinMax(left);
    const rightMinMax = findMinMax(right);
    const minMax = [leftMinMax.min, leftMinMax.max, rightMinMax.min, rightMinMax.max];

    const min = minMax.reduce((prev, curr) => minReducer(prev, curr, startIndex));

    const max = minMax.reduce((prev, curr) => maxReducer(prev, curr, startIndex));
    // handle the case for a flat line; ensure the furthest indexes
    return min.value !== max.value
      ? { min, max }
      : {
          min: {
            value: min.value,
            index: Math.min(...minMax.map(v => v.index))
          },
          max: {
            value: max.value,
            index: Math.max(...minMax.map(v => v.index))
          }
        };
  }
  return { min: { index: 0, value: 0 }, max: { index: 0, value: 0 } };
}

/**
 * Scales the amplitude measurement value.
 *
 * @param amplitudeMeasurementValue the amplitude measurement value to scale
 */
export function scaleAmplitudeMeasurementValue(
  amplitudeMeasurementValue: SignalDetectionTypes.AmplitudeMeasurementValue
): SignalDetectionTypes.AmplitudeMeasurementValue {
  if (amplitudeMeasurementValue === null && amplitudeMeasurementValue === undefined) {
    throw new Error(`amplitude measurement value must be defined`);
  }
  return {
    ...amplitudeMeasurementValue,
    amplitude: scaleAmplitudeForPeakTrough(
      amplitudeMeasurementValue.amplitude,
      amplitudeMeasurementValue.period ?? 0
    )
  };
}

/**
 * Scales the amplitude value using the provided period,
 * nominal calibration period, and the frequency and amplitude values.
 *
 * @param amplitude the amplitude value to scale
 * @param period the period value
 * @param nominalCalibrationPeriod the nominal calibration period
 * @param frequencyValues the frequency values
 * @param amplitudeValues the amplitude values
 */
export function scaleAmplitudeForPeakTrough(
  amplitude: number,
  period: number,
  nominalCalibrationPeriod: number = NOMINAL_CALIBRATION_PERIOD,
  frequencyValues: number[] = FREQUENCY_VALUES,
  amplitudeValues: number[] = AMPLITUDE_VALUES
): number {
  if (
    frequencyValues === null ||
    frequencyValues === undefined ||
    frequencyValues.length === 0 ||
    amplitudeValues === null ||
    amplitudeValues === undefined ||
    amplitudeValues.length === 0
  ) {
    throw new Error(`frequency scale values and amplitude scale values must be defined`);
  }

  if (frequencyValues.length !== amplitudeValues.length) {
    throw new Error(
      `frequency scale values and amplitude scale values do not have the same length: ` +
        `[${frequencyValues.length} !== ${amplitudeValues.length}]`
    );
  }

  // calculate the period
  const periodValues = frequencyValues.map(freq => 1 / freq);

  const findClosestCorrespondingValue = (
    value: number,
    values: number[]
  ): { index: number; value: number } =>
    values
      .map((val: number, index: number) => ({ index, value: val }))
      .reduce(
        (previous: { index: number; value: number }, current: { index: number; value: number }) =>
          Math.abs(current.value - value) < Math.abs(previous.value - value) ? current : previous
      );

  const calculatedPeriod = findClosestCorrespondingValue(period, periodValues);
  const calculatedAmplitude = amplitudeValues[calculatedPeriod.index];

  const calibrationPeriod = findClosestCorrespondingValue(nominalCalibrationPeriod, periodValues);
  const calibrationAmplitude = amplitudeValues[calibrationPeriod.index];
  const normalizedAmplitude = calculatedAmplitude / calibrationAmplitude;
  return amplitude / normalizedAmplitude;
}

/**
 * Returns the waveform value and index (into the values) for a given time in seconds
 *
 * @param waveform the waveform
 * @param timeSecs the time in seconds
 */
export function getWaveformValueForTime(
  dataSegment: WeavessTypes.DataSegment,
  timeSecs: number
): { index: number; value: number } | undefined {
  const data = dataSegment?.data;
  if (data && WeavessTypes.isDataBySampleRate(data)) {
    const index =
      timeSecs <= data.startTimeSecs
        ? 0
        : Math.round((timeSecs - data.startTimeSecs) * data.sampleRate);
    return { index, value: data?.values[index] ?? 0 };
  }
  return undefined;
}

/**
 * Sorts the provided signal detections by arrival time and the
 * specified sort type.
 *
 * @param signalDetections the list of signal detections to sort
 * @param waveformSortType the sort type
 * @param distances the distance to source for each station
 */
export function sortAndOrderSignalDetections(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  waveformSortType: AnalystWorkspaceTypes.WaveformSortType,
  distances: LegacyEventTypes.LocationToStationDistance[]
): SignalDetectionTypes.SignalDetection[] {
  // sort the sds by the arrival time
  const sortByArrivalTime: SignalDetectionTypes.SignalDetection[] =
    sortBy<SignalDetectionTypes.SignalDetection>(
      signalDetections,
      sd =>
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
          SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
            .featureMeasurements
        ).arrivalTime?.value
    );

  // sort by the selected sort type
  return sortBy<SignalDetectionTypes.SignalDetection>(
    sortByArrivalTime,
    [
      sd =>
        waveformSortType === AnalystWorkspaceTypes.WaveformSortType.distance
          ? distances.find(d => d.stationId === sd.station.name)?.distance ?? 0
          : sd.station.name
    ],
    waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationNameZA ? ['desc'] : ['asc']
  );
}

/**
 * Removes deleted Signal Detections from list
 *
 * @param signalDetections to filter
 * @returns signal detections that are not deleted
 */
export function filterDeletedSignalDetections(
  signalDetections: SignalDetectionTypes.SignalDetection[]
): SignalDetectionTypes.SignalDetection[] {
  // Filter out deleted SDs
  return signalDetections.filter(sd => {
    const sdh = SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses);
    return sdh && !sdh.deleted;
  });
}

/**
 * Filter the signal detections for a given station.
 *
 * @param stationId the station is
 * @param signalDetectionsByStation the signal detections to filter
 */
export function filterSignalDetectionsByStationId(
  stationId: string,
  signalDetectionsByStation: SignalDetectionTypes.SignalDetection[]
): SignalDetectionTypes.SignalDetection[] {
  return signalDetectionsByStation.filter(sd => {
    // filter out the sds for the other stations
    if (sd.station.name !== stationId) {
      return false;
    }
    return true; // return all other sds
  });
}

/**
 * Function to filter signal detections in SD list and waveform displays
 *
 * @param signalDetectionStatus Association or lifecycle status
 * @param edgeType Before or after interval
 * @param displayedSignalDetectionConfiguration Redux object holding configuration
 */
export function shouldDisplaySignalDetection(
  signalDetectionStatus: SignalDetectionTypes.SignalDetectionStatus | undefined,
  edgeType: EventFilterOptions | string,
  conflict: boolean,
  displayedSignalDetectionConfiguration:
    | Record<DisplayedSignalDetectionConfigurationEnum, boolean>
    | Record<WaveformDisplayedSignalDetectionConfigurationEnum, boolean>
): boolean {
  const {
    signalDetectionUnassociated,
    signalDetectionAssociatedToOpenEvent,
    signalDetectionAssociatedToCompletedEvent,
    signalDetectionAssociatedToOtherEvent,
    signalDetectionConflicts,
    signalDetectionDeleted,
    signalDetectionBeforeInterval,
    signalDetectionAfterInterval
  } = displayedSignalDetectionConfiguration;

  if (!signalDetectionAfterInterval && edgeType === EventFilterOptions.AFTER) {
    return false;
  }
  if (!signalDetectionBeforeInterval && edgeType === EventFilterOptions.BEFORE) {
    return false;
  }
  if (!signalDetectionConflicts && conflict) {
    return false;
  }

  switch (signalDetectionStatus) {
    case SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED:
      return signalDetectionAssociatedToCompletedEvent;
    case SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED:
      return signalDetectionAssociatedToOpenEvent;
    case SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED:
      return signalDetectionAssociatedToOtherEvent;
    case SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED:
      return signalDetectionUnassociated;
    case SignalDetectionTypes.SignalDetectionStatus.DELETED:
      return signalDetectionDeleted;
    default:
      return true;
  }
}

/**
 * Create Channel Segment string (key used in ChannelSegmentMap) for current hypothesis
 *
 * @param signalDetection
 * @returns Channel Segment string
 */
export function getChannelSegmentStringForCurrentHypothesis(
  signalDetection: SignalDetectionTypes.SignalDetection
): string | undefined {
  const sdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection.signalDetectionHypotheses
  );
  if (!sdHypothesis) {
    return undefined;
  }
  const arrivalFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypothesis.featureMeasurements
  );
  return arrivalFM.analysisWaveform
    ? ChannelSegmentTypes.Util.createChannelSegmentString(arrivalFM.analysisWaveform.waveform.id)
    : undefined;
}
/**
 * Retrieve the full channel name from the signal detection
 *
 * @param signalDetection
 * @returns string channel name
 */
export function getSignalDetectionChannelName(
  signalDetection: SignalDetectionTypes.SignalDetection
): string | undefined {
  const sdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection.signalDetectionHypotheses
  );
  if (!sdHypothesis) {
    return undefined;
  }
  const arrivalFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypothesis.featureMeasurements
  );
  return arrivalFM.channel.name;
}

/**
 * Retrieve the analysis waveform channel name from the signal detection
 *
 * @param signalDetection
 * @returns string analysis waveform channel name
 */
export function getSignalDetectionAnalysisWaveformChannelName(
  signalDetection: SignalDetectionTypes.SignalDetection
): string | undefined {
  const sdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection.signalDetectionHypotheses
  );
  if (!sdHypothesis) {
    return undefined;
  }
  const arrivalFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypothesis.featureMeasurements
  );
  return arrivalFM.analysisWaveform?.waveform?.id?.channel?.name;
}

/**
 * Given a signal detection's association status to an event and the present UI theme
 * Returns appropriate color for signal detection pick marker and details popover
 *
 * @param status
 * @param uiTheme
 * @returns
 */
export const getSignalDetectionStatusColor = (
  status: SignalDetectionTypes.SignalDetectionStatus | undefined,
  uiTheme: ConfigurationTypes.UITheme
): string => {
  if (status === SignalDetectionTypes.SignalDetectionStatus.DELETED) {
    return uiTheme.colors.deletedSdColor;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED) {
    return uiTheme.colors.openEventSDColor;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED) {
    return uiTheme.colors.completeEventSDColor;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED) {
    return uiTheme.colors.otherEventSDColor;
  }
  return uiTheme.colors.unassociatedSDColor;
};

/**
 * Given a signal detection's association status to an event
 * Returns formatted string to display on signal detection details popover and SD table
 *
 * @param status
 * @returns
 */
export const getSignalDetectionStatusString = (
  status: SignalDetectionTypes.SignalDetectionStatus
): string => {
  if (status === SignalDetectionTypes.SignalDetectionStatus.DELETED) {
    return messageConfig.tooltipMessages.signalDetection.deleted;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED) {
    return messageConfig.tooltipMessages.signalDetection.associatedOpen;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED) {
    return messageConfig.tooltipMessages.signalDetection.associatedComplete;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED) {
    return messageConfig.tooltipMessages.signalDetection.associatedOther;
  }
  if (status === SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED) {
    return messageConfig.tooltipMessages.signalDetection.unassociated;
  }
  return messageConfig.invalidCellText;
};

/**
 * Given open/complete/other status and interval edge type, generates a string for popover swatch tooltip
 *
 * @returns string
 */
export const getSwatchTooltipText = (
  status: SignalDetectionTypes.SignalDetectionStatus,
  signalDetection: SignalDetectionTypes.SignalDetection,
  intervalTimeRange: CommonTypes.TimeRange
): string => {
  let statusString;
  let edgeSDTypeString;

  switch (status) {
    case SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED:
      statusString = 'Completed event';
      break;
    case SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED:
      statusString = 'Open event';
      break;
    case SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED:
      statusString = 'Other event';
      break;
    case SignalDetectionTypes.SignalDetectionStatus.DELETED:
      statusString = 'Deleted';
      break;
    case SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED:
      statusString = 'Unassociated to event';
      break;
    default:
      statusString = 'Unknown status';
  }
  const currentHypo = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection?.signalDetectionHypotheses
  );
  const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(
    currentHypo?.featureMeasurements
  );

  const arrivalTimeSecs = arrivalTimeFeatureMeasurement.measurementValue.arrivalTime.value;

  if (arrivalTimeSecs < intervalTimeRange.startTimeSecs) {
    edgeSDTypeString = 'before interval';
  } else if (arrivalTimeSecs > intervalTimeRange.endTimeSecs) {
    edgeSDTypeString = 'after interval';
  } else {
    edgeSDTypeString = 'within interval';
  }
  return `${statusString}, ${edgeSDTypeString}`;
};

/**
 * Compares a given filterName against the record of all filterDefinitions. If a match is found, the
 * filter is then checked for a matching sampleRateHz. Then, we make sure the filterDefinition found
 * is associated with the provided channel segment ID.
 *
 * @returns FilterAssociation if a match is found, otherwise undefined.
 */
const maybeGetFilterAssociation = (
  filterDefinitionsBySampleRate: Record<number, FilterDefinition> | undefined,
  channelSegmentId: string,
  sampleRateHz: number,
  startTimeSecs: number
): FilterAssociation | undefined => {
  const targetFilterDefinition = filterDefinitionsBySampleRate?.[sampleRateHz];

  // if the name of the filter definition is not in the name of the channel segment ID, this is not a match
  if (!targetFilterDefinition || !channelSegmentId.includes(targetFilterDefinition.name)) {
    return undefined;
  }

  const waveformIdentifier: WaveformIdentifier = {
    channelSegmentId,
    startTime: startTimeSecs
  };

  return {
    waveformIdentifiers: [waveformIdentifier],
    definition: targetFilterDefinition
  };
};

/**
 * Given a record of <filterName, UIChannelSegment[]>, iterates through each
 * filterName and compares against the existing filterDefinitions.
 * Updates the array of {@link FilterAssociations} in the {@link FilterDefinitionAssociationsObject}
 */
const buildFilterAssociationsArray = (
  /** Referentially-stable export object, will be updated by this function. */
  filterDefinitionAssociationsObject: FilterDefinitionAssociationsObject,
  /** Record of UIChannelSegments mapped to the name of the filter used. */
  // filterChannelSegmentRecord: Record<string, UiChannelSegment[]>,
  /** Input collection of channel segments used to build the filterAssociation */
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
): void => {
  uiChannelSegments.forEach(uiCS => {
    uiCS.channelSegment.timeseries.forEach(timeseries => {
      if (timeseries.sampleRateHz !== undefined) {
        // Get Filter Association
        const possibleAssociation = maybeGetFilterAssociation(
          uiCS.channelSegment._uiFiltersBySampleRate,
          uiCS.channelSegmentDescriptor.channel.name,
          timeseries.sampleRateHz,
          timeseries.startTime
        );

        if (possibleAssociation?.definition) {
          // Search for a FilterAssociation that contains our FilterDefinition
          const filterAssociationToUpdate =
            filterDefinitionAssociationsObject.filterAssociations.find(association =>
              isEqual(association.definition, possibleAssociation.definition)
            );

          // If there isn't a FilterAssociation object for this FilterDefinition, add it
          if (!filterAssociationToUpdate) {
            filterDefinitionAssociationsObject.filterAssociations.push(possibleAssociation);
            return;
          }

          // If a FilterAssociation for this FilterDefinition exists, we also check to see if the waveform identifier we want to add also already exists
          if (
            !filterAssociationToUpdate.waveformIdentifiers.find(existingWaveformIdentifier =>
              isEqual(existingWaveformIdentifier, possibleAssociation.waveformIdentifiers[0])
            )
          ) {
            // If it doesn't already exist, push the waveform identifier into the array
            filterAssociationToUpdate.waveformIdentifiers.push(
              possibleAssociation.waveformIdentifiers[0]
            );
          }
        }
      }
    });
  });
};

/**
 * Converts waveform data to COI model and triggers a file download of that data.
 * If stations are selected, this will only export those selections. If nothing is
 * selected everything will be exported.
 *
 * @param selectedStationIds A list of currently selected channel segment id's
 * @param channelSegmentsRecord A record of stations and their channel segments
 */
export const exportChannelSegmentsBySelectedStations = async (
  channelId: string,
  selectedStationIds: string[],
  /** Collection of all stations/channels on the screen with an applied filter */
  channelFilters: Record<string, FilterTypes.Filter>,
  /**
   * Contains all UI channel segments, where the top-level key is a channel/station name
   * and the sub-key is the name of the filter used for each {@link UiChannelSegment}s array
   */
  channelSegmentsRecord:
    | Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>
    | undefined
) => {
  // Determine which channels are being used for the export.
  const channelsToExport: string[] =
    channelId !== '' && !selectedStationIds.includes(channelId) ? [channelId] : selectedStationIds;

  // Referentially-stable export object, to be loaded by the next two function calls.
  const dataToExport: FilterDefinitionAssociationsObject = {
    filterAssociations: [],
    channelSegments: []
  } as FilterDefinitionAssociationsObject;

  channelsToExport.forEach(channelOrStationName => {
    if (
      !channelSegmentsRecord ||
      !Object.keys(channelSegmentsRecord).includes(channelOrStationName)
    )
      return;
    // Active filter for channelOrStationName
    const activeFilter: FilterTypes.Filter = channelFilters[channelOrStationName];
    const filteredUIChannelSegments =
      channelSegmentsRecord[channelOrStationName][getFilterName(activeFilter)];

    buildFilterAssociationsArray(dataToExport, filteredUIChannelSegments);
  });

  dataToExport.channelSegments = getUIChannelSegmentsBySelectedStations(
    channelId,
    selectedStationIds,
    channelSegmentsRecord,
    channelFilters
  );

  await downloadChannelSegments(dataToExport);
};

/**
 * Filters and flattens a channel segment record using the selectedStationIds.
 *
 * @param selectedStationIds A list of currently selected channel segment id's
 * @param channelSegmentsRecord A record of stations and their channel segments
 */
export const getUIChannelSegmentsBySelectedStations = (
  channelId: string,
  selectedStationIds: string[],
  channelSegmentsRecord:
    | Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>
    | undefined,
  /** Collection of all stations/channels on the screen with an applied filter */
  channelFilters: Record<string, FilterTypes.Filter>
): UiChannelSegment<WaveformTypes.Waveform>[] => {
  if (!channelSegmentsRecord) return [];

  // if what the user clicked on is not in my selection, then just use the clicked channel
  if (channelId !== '' && !selectedStationIds.includes(channelId)) {
    const activeFilter: FilterTypes.Filter = channelFilters[channelId];
    return channelSegmentsRecord[channelId][getFilterName(activeFilter)];
  }

  return getFlatListOfAllChannelSegments(channelSegmentsRecord, selectedStationIds, channelFilters);
};

export const getFlatListOfAllChannelSegments = (
  channelSegmentsRecord: Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>,
  selectedStationIds: string[],
  /** Collection of all stations/channels on the screen with an applied filter */
  channelFilters: Record<string, FilterTypes.Filter>
): UiChannelSegment<WaveformTypes.Waveform>[] => {
  return Object.entries(channelSegmentsRecord).reduce((final, [id, station]) => {
    // Skip filtering if no stations are selected or include this station if it is selected
    if (selectedStationIds.length === 0 || selectedStationIds.indexOf(id) >= 0) {
      const activeFilter: FilterTypes.Filter = channelFilters[id];
      return [...final, ...station[getFilterName(activeFilter)]];
    }

    return final;
  }, []);
};

/**
 * Returns channel segments that are plausibly associated to the provided signal detection by matching start times
 *
 * @param signalDetection
 * @param uiChannelSegments
 * @returns
 */
export const getChannelSegmentsAssociatedToSignalDetection = (
  signalDetection: SignalDetectionTypes.SignalDetection,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
) => {
  return uiChannelSegments.filter(uiChannelSegment => {
    const arrivalTimeFm = findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetection);

    return (
      arrivalTimeFm.analysisWaveform?.waveform.id.startTime ===
      uiChannelSegment.channelSegmentDescriptor.startTime
    );
  });
};

/**
 * Searches the channelSegments to find the ones matching the currentHypotheses for the provided SignalDetections.
 * Returns the filtered version of the channel segments based on the filter corresponding to the station associated
 * to each SignalDetection.
 *
 * @param selectedSds the list of SignalDetections for which to find ChannelSegments
 * @param uiChannelSegments the record mapping station/raw channel names to a record mapping filter names to a ChannelSegment array
 * @param channelFilters the record mapping station/raw channel names to filters for those stations/channels
 * @returns an array filtered of channel segments associated to the provided signal detections
 */
export const getFilteredChannelSegmentsFromSignalDetections = (
  selectedSds: SignalDetectionTypes.SignalDetection[],
  channelsToFilteredUIChannelSegments:
    | Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>
    | undefined,
  channelFilters: Record<string, FilterTypes.Filter>
): UiChannelSegment<WaveformTypes.Waveform>[] => {
  if (!channelsToFilteredUIChannelSegments) return [];

  // TODO: figure out how to find channel segments for signal detections associated to raw channels.
  return selectedSds.flatMap(sd => {
    const { station } = sd;
    const filterChannelSegmentRecord = channelsToFilteredUIChannelSegments[station.name];
    if (!filterChannelSegmentRecord) {
      return [];
    }
    // Get the filter used for each channel
    const filter = channelFilters[station.name];
    const stationChannelSegments = filterChannelSegmentRecord[getFilterName(filter)];
    const associatedSignalDetections = getChannelSegmentsAssociatedToSignalDetection(
      sd,
      stationChannelSegments
    );
    if (associatedSignalDetections.length === 0) {
      const allFilteredChanSegs = Object.keys(channelsToFilteredUIChannelSegments).flatMap(
        chanName =>
          channelsToFilteredUIChannelSegments[chanName][getFilterName(channelFilters[chanName])]
      );
      return getChannelSegmentsAssociatedToSignalDetection(sd, allFilteredChanSegs);
    }
    return associatedSignalDetections;
  });
};

/**
 * Awaiting implementation
 *
 * @param uiChannelSegments A list of UIChannelSegment's
 */
export const exportChannelSegmentsBySelectedSignalDetections = async (
  selectedSds: SignalDetectionTypes.SignalDetection[],
  /**
   * Contains all UI channel segments, where the top-level key is a channel/station name
   * and the sub-key is the name of the filter used for each {@link UiChannelSegment}s array
   */
  channelSegmentsRecord:
    | Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>
    | undefined,
  channelFilters: Record<string, FilterTypes.Filter>
) => {
  // Referentially-stable export object, to be loaded by the next two function calls.
  const dataToExport: FilterDefinitionAssociationsObject = {
    filterAssociations: [],
    channelSegments: []
  } as FilterDefinitionAssociationsObject;

  const channelSegmentsToExport = getFilteredChannelSegmentsFromSignalDetections(
    selectedSds,
    channelSegmentsRecord,
    channelFilters
  );

  selectedSds.forEach(sd => {
    const { station } = sd;
    if (!channelSegmentsRecord || !Object.keys(channelSegmentsRecord).includes(station.name))
      return;
    buildFilterAssociationsArray(dataToExport, channelSegmentsToExport);
  });

  dataToExport.channelSegments = channelSegmentsToExport;

  await downloadChannelSegments(dataToExport);
};

/**
 * @deprecated use {@link getFilteredChannelSegmentsFromSignalDetections}
 * Filters and flattens a channel segment record using the selectedStationIds.
 *
 * @param selectedStationIds A list of currently selected channel segment id's
 * @param channelSegmentsRecord A record of stations and their channel segments
 */
export const getUIChannelSegmentsBySignalDetection = (
  channelId: string,
  selectedStationIds: string[],
  channelSegmentsRecord:
    | Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>
    | undefined,
  /** Collection of all stations/channels on the screen with an applied filter */
  channelFilters: Record<string, FilterTypes.Filter>
): UiChannelSegment<WaveformTypes.Waveform>[] => {
  if (!channelSegmentsRecord) return [];

  // if what the user clicked on is not in my selection, then just use the clicked channel
  if (!selectedStationIds.includes(channelId)) {
    const activeFilter: FilterTypes.Filter = channelFilters[channelId];
    return channelSegmentsRecord[channelId][getFilterName(activeFilter)];
  }

  return getFlatListOfAllChannelSegments(channelSegmentsRecord, selectedStationIds, channelFilters);
};

/**
 * Gets the base name of a derived or raw channel.
 *
 * @example for the input channel name of
 * ARCES.beam.BHZ/beam,fk,coherent/steer,az_11.725deg,slow_6.566s_per_deg/fd508b348e8bab56606e3833711f3ff8382042fa84b49938cc261714a1f47a14
 * this returns ARCES.beam.BHZ
 */
const getBaseChannelName = (
  channel: ChannelTypes.Channel | FacetedTypes.VersionReference<'name'>
): string => channel.name.split('/')[0];

/**
 * Sort channel descriptors alphabetically by base channel name, and if the names match, then by startTime
 */
const sortChannelDescriptorsByNameAndStartTime = (
  descriptors: ChannelSegmentTypes.ChannelSegmentDescriptor[]
): ChannelSegmentTypes.ChannelSegmentDescriptor[] => {
  return orderBy(
    orderBy(descriptors, iteratee => iteratee.startTime),
    iteratee => getBaseChannelName(iteratee.channel)
  );
};

/**
 * Get the channelDescriptor with the latest end time
 */
const getLastChannelSegmentDescriptor = (
  descriptors: ChannelSegmentTypes.ChannelSegmentDescriptor[]
) =>
  descriptors.reduce((lastDescriptor, csDS) => {
    return (lastDescriptor?.endTime ?? 0) > csDS.endTime ? lastDescriptor : csDS;
  });

/**
 * Build a file name string for the UIChannelSegments provided.
 * The file name will be of the format:
 * waveform-<earliest start time as ISO 8601 Time String>-to-<latest end time as ISO 8601 Time String>-<Base Channel Name>.json
 *
 * @example
 * waveform-2022-12-16T23_56_01.225Z-to-2022-12-17T00_05_50.825Z-ARCES.beam.BHZ.json
 *
 * @param uiChannelSegments the list of UiChannelSegments from which to derive the name
 * @returns a string identifying the file containing these segments
 */
export const getExportedChannelSegmentsFileName = (
  filterDefinitionAssociationsObject: FilterDefinitionAssociationsObject
) => {
  const sortedChannelDescriptors = sortChannelDescriptorsByNameAndStartTime(
    filterDefinitionAssociationsObject.channelSegments.map(uiCS => uiCS.channelSegmentDescriptor)
  );
  const lastChannelDescriptor = getLastChannelSegmentDescriptor(sortedChannelDescriptors);

  const channelName = sortedChannelDescriptors.length
    ? getBaseChannelName(sortedChannelDescriptors[0].channel)
    : 'empty';
  const startDate = sortedChannelDescriptors.length
    ? toOSDTime(sortedChannelDescriptors[0].startTime)
    : toOSDTime(Date.now());
  const endDate = lastChannelDescriptor
    ? toOSDTime(lastChannelDescriptor.endTime)
    : toOSDTime(Date.now());
  const channelNameList = sortedChannelDescriptors?.map(cd => getBaseChannelName(cd.channel));
  const channelNameListClean = channelNameList.map(cn => cn.split('.')[0]);
  const channelNameSetNoDuplicates = new Set(channelNameListClean);
  return channelNameSetNoDuplicates?.size > 1
    ? `waveform-${startDate}-to-${endDate}-${channelName}_multi.json`
    : `waveform-${startDate}-to-${endDate}-${channelName}.json`;
};

/**
 * Converts waveform data to COI model and triggers a file download of that data.
 *
 * @param filterDefinitionAssociationsObject A list of {@link UiChannelSegment}s and {@link FilterAssociation}s.
 */
export const downloadChannelSegments = async (
  filterDefinitionAssociationsObject: FilterDefinitionAssociationsObject
) => {
  // Convert selected channel segments if their are any, otherwise convert all
  const blob = await exportChannelSegmentsWithFilterAssociations(
    filterDefinitionAssociationsObject
  );
  const configURL = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = configURL;
  a.setAttribute(
    'download',
    getExportedChannelSegmentsFileName(filterDefinitionAssociationsObject)
  );
  a.click();
  a.remove();
};

/**
 * Given a timeRange, determines if the provided arrivalTime falls within that range
 * Returns corresponding {@link edgeType}
 *
 * @param timeRange Must be fully-defined
 * @param arrivalTime
 */
export function getEdgeType(
  timeRange: NonNullable<CommonTypes.TimeRange>,
  arrivalTime: number
): string | EventFilterOptions {
  if (arrivalTime < timeRange.startTimeSecs) return EventFilterOptions.BEFORE;
  if (arrivalTime > timeRange.endTimeSecs) return EventFilterOptions.AFTER;
  return EventFilterOptions.INTERVAL;
}

/**
 * Creates a display-string for a signal detection in the form `<STATION>-<PHASE>`
 *
 * @param signalDetection The signal detection from which to generate a label
 * @returns a string in the form `<STATION> <PHASE>`
 */
export function getSignalDetectionLabel(signalDetection: SignalDetectionTypes.SignalDetection) {
  return `${signalDetection.station.name}-${
    findPhaseFeatureMeasurementValue(
      getCurrentHypothesis(signalDetection.signalDetectionHypotheses).featureMeasurements
    ).value
  }`;
}

/**
 * @param signalDetection A signal detection to check
 * @param selectedSignalDetections the array of selected signal detections
 * @returns true if the signal detection is in the list of selected detections
 */
export function isSignalDetectionSelected(
  signalDetection: SignalDetectionTypes.SignalDetection,
  selectedSignalDetections: SignalDetectionTypes.SignalDetection[]
) {
  return selectedSignalDetections.includes(signalDetection);
}

/**
 * Given a Signal Detection Hypothesis, returns true if the hypothesis contains at least one Feature Measurement associated to the provided channel
 * @param sdHypothesis Hypothesis to check
 * @param channelName Channel name to search for
 * @returns boolean
 */
export function sdHypothesisHasFeatureMeasurementAssociatedToChannel(
  sdHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  channelName: string
): boolean {
  return !!sdHypothesis.featureMeasurements.find(fm => fm.channel.name === channelName);
}
