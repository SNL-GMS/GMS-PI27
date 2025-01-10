/* eslint-disable @typescript-eslint/no-use-before-define */
import type {
  ChannelTypes,
  CommonTypes,
  FilterTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';
import {
  ChannelSegmentTypes,
  ConfigurationTypes,
  EventTypes,
  SignalDetectionTypes
} from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import type { TimeRange } from '@gms/common-model/lib/common';
import { getFilterName } from '@gms/common-model/lib/filter/filter-util';
import { UNFILTERED_FILTER } from '@gms/common-model/lib/filter/types';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import { QcSegmentType } from '@gms/common-model/lib/qc-segment';
import {
  findAmplitudeFeatureMeasurementValue,
  findArrivalTimeFeatureMeasurement,
  findArrivalTimeFeatureMeasurementValue,
  findPhaseFeatureMeasurementValue,
  getCurrentHypothesis,
  isArrivalTimeMeasurementValue
} from '@gms/common-model/lib/signal-detection/util';
import { parseWaveformChannelType } from '@gms/common-model/lib/station-definitions/channel-definitions/util';
import { isNumber, uniqSortStrings } from '@gms/common-util';
import type {
  AnalystWaveformTypes,
  UiChannelSegment,
  UiChannelSegmentByEventHypothesisId,
  UIChannelSegmentRecord
} from '@gms/ui-state';
import {
  AnalystWaveformUtil,
  AnalystWorkspaceTypes,
  channelSegmentToWeavessChannelSegment
} from '@gms/ui-state';
import type { ReceiverLocation } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import type { WaveformDisplayedSignalDetectionConfigurationEnum } from '@gms/ui-state/lib/app/state/waveform/types';
import { blendColors, UILogger } from '@gms/ui-util';
import { WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import type { ChannelSegment, Mask } from '@gms/weavess-core/lib/types';
import { isDataClaimCheck } from '@gms/weavess-core/lib/types';
import { doTimeRangesOverlap } from '@gms/weavess-core/lib/util';
import type { Draft } from 'immer';
import produce, { original } from 'immer';
import type { WritableDraft } from 'immer/dist/internal';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';

import { SignalDetectionUtils } from '~analyst-ui/common/utils';
import {
  getDistanceUsingDistanceUnits,
  isSdHypothesisAssociatedToEventHypothesis
} from '~analyst-ui/common/utils/event-util';
import {
  filterSignalDetectionsByStationId,
  getEdgeType,
  getSignalDetectionStatusColor,
  isPeakTroughInWarning,
  shouldDisplaySignalDetection
} from '~analyst-ui/common/utils/signal-detection-util';
import { sortStationDefinitionChannels } from '~analyst-ui/common/utils/station-definition-util';
import { systemConfig } from '~analyst-ui/config/system-config';
import { userPreferences } from '~analyst-ui/config/user-preferences';
import { semanticColors } from '~scss-config/color-preferences';

import {
  filterStationOnMode,
  getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams
} from './utils';

const logger = UILogger.create('WeavessStationUtil', process.env.WEAVESS_STATION_UTIL);

let weavessStationsContainsChanges = false;
/**
 * Interface used to bundle all of the parameters need to create the
 * weavess stations for the waveform display.
 */
export interface CreateWeavessStationsParameters {
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  featurePredictions: Record<string, ReceiverLocation>;
  visibleStationSignalDetections: SignalDetectionTypes.SignalDetection[];
  signalDetectionActionTargets: string[];
  sdIdsInConflict: string[];
  selectedSdIds: string[];
  qcSegmentsByChannelName: Record<string, Record<string, QcSegment>>;
  processingMasks: ChannelSegmentTypes.ProcessingMask[];
  maskVisibility: Record<string, boolean>;
  channelHeight: number;
  channelFilters: Record<string, FilterTypes.Filter>;
  filterList: FilterTypes.FilterList;
  uiChannelSegments: UIChannelSegmentRecord;
  startTimeSecs: number;
  endTimeSecs: number;
  zoomInterval: CommonTypes.TimeRange;
  currentOpenEvent?: EventTypes.Event;
  eventBeams: UiChannelSegmentByEventHypothesisId;
  showPredictedPhases: boolean;
  showSignalDetectionUncertainty: boolean;
  distances: EventTypes.LocationDistance[];
  offsets: Record<string, number>;
  phaseToAlignOn?: string;
  stationVisibilityDictionary: AnalystWaveformTypes.StationVisibilityChangesDictionary;
  visibleStations: StationTypes.Station[];
  /** List of fully populated derived and raw channels */
  populatedChannels: ChannelTypes.Channel[];
  processingAnalystConfiguration: ConfigurationTypes.ProcessingAnalystConfiguration;
  uiTheme: ConfigurationTypes.UITheme;
  openIntervalName: string;
  displayedSignalDetectionConfiguration: Record<
    WaveformDisplayedSignalDetectionConfigurationEnum,
    boolean
  >;
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[];
  splitStation: AnalystWaveformTypes.SplitStation;
  signalDetectionAssociations: SignalDetectionTypes.SignalDetectionAssociationStatus[];
  selectedStationsAndChannels: Set<string>;
  viewableInterval: TimeRange;
}

/**
 * Returns the `green` interval markers.
 *
 * @param startTimeSecs start time seconds for the interval start marker
 * @param endTimeSecs end time seconds for the interval end marker
 */
function getIntervalMarkers(startTimeSecs: number, endTimeSecs: number): WeavessTypes.Marker[] {
  return [
    {
      id: 'startTime',
      color: semanticColors.waveformIntervalBoundary,
      lineStyle: WeavessTypes.LineStyle.SOLID,
      timeSecs: startTimeSecs
    },
    {
      id: 'endTime',
      color: semanticColors.waveformIntervalBoundary,
      lineStyle: WeavessTypes.LineStyle.SOLID,
      timeSecs: endTimeSecs
    }
  ];
}

/**
 * If there are Signal Detections populate Weavess Channel Segment from the FK_BEAM
 * else use the default channel Weavess Channel Segment built
 *
 * @param signalDetections signal detections
 * @returns List of UIChannelSegments corresponding to the selected filter
 */
export function getUiChannelSegmentsForStationAndFilter(
  stationName: string,
  params: CreateWeavessStationsParameters
): UiChannelSegment<WaveformTypes.Waveform>[] {
  /** Current filter for this station */
  const currentFilterName = getFilterName(params.channelFilters[stationName]);
  if (
    params.uiChannelSegments[stationName] &&
    params.uiChannelSegments[stationName][currentFilterName]
  ) {
    return params.uiChannelSegments[stationName][currentFilterName].filter(cs =>
      doTimeRangesOverlap(
        {
          startTimeSecs: cs.channelSegmentDescriptor.startTime,
          endTimeSecs: cs.channelSegmentDescriptor.endTime
        },
        params.viewableInterval
      )
    );
  }
  return [];
}

/**
 * Loops through all event beams to obtain those matching a particular station
 * Used to calculate row label data in waveform display
 *
 * @param stationName
 * @param eventBeams all event beams in UI
 * @returns
 */
export function getEventBeamsForStation(
  stationName: string,
  eventBeams: UiChannelSegmentByEventHypothesisId
): UiChannelSegment<WaveformTypes.Waveform>[] {
  const stationEventBeams: UiChannelSegment<WaveformTypes.Waveform>[] = [];
  Object.keys(eventBeams).forEach(hypothesisId => {
    eventBeams[hypothesisId].forEach(uiChannelSegment => {
      if (uiChannelSegment.channelSegmentDescriptor.channel.name.startsWith(stationName)) {
        stationEventBeams.push(uiChannelSegment);
      }
    });
  });

  return stationEventBeams;
}

/**
 * Create the amplitude selection windows for a signal detection
 *
 * @param arrivalTime arrival time (signal detection time epoch secs)
 * @param amplitudeMeasurementValue amplitude of signal detection
 * @param measurementMode
 * @returns a WeavessTypes.SelectionWindow[]
 */
export function generateAmplitudeSelectionWindows(
  sdId: string,
  arrivalTime: number,
  amplitudeMeasurementValue: SignalDetectionTypes.AmplitudeMeasurementValue,
  measurementMode: AnalystWorkspaceTypes.MeasurementMode
): WeavessTypes.SelectionWindow[] {
  const selectionStartOffset: number =
    systemConfig.measurementMode.selection.startTimeOffsetFromSignalDetection;
  const selectionEndOffset: number =
    systemConfig.measurementMode.selection.endTimeOffsetFromSignalDetection;
  const { period } = amplitudeMeasurementValue;
  const troughTime = amplitudeMeasurementValue.measurementTime; // TODO: Check this when actually plumbing in measurement time

  if (troughTime === undefined || period === undefined) return [];
  const peakTime = troughTime + period / 2; // display only period/2
  const isWarning = isPeakTroughInWarning(arrivalTime, period, troughTime, peakTime);
  const isMoveable =
    measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT &&
    systemConfig.measurementMode.peakTroughSelection.isMoveable;

  const selections: WeavessTypes.SelectionWindow[] = [];
  selections.push({
    id: `${systemConfig.measurementMode.peakTroughSelection.id}${sdId}`,
    startMarker: {
      id: 'start',
      color: !isWarning
        ? systemConfig.measurementMode.peakTroughSelection.borderColor
        : systemConfig.measurementMode.peakTroughSelection.warning.borderColor,
      lineStyle: isMoveable
        ? systemConfig.measurementMode.peakTroughSelection.lineStyle
        : systemConfig.measurementMode.peakTroughSelection.nonMoveableLineStyle,
      timeSecs: troughTime,
      minTimeSecsConstraint: arrivalTime + selectionStartOffset
    },
    endMarker: {
      id: 'end',
      color: !isWarning
        ? systemConfig.measurementMode.peakTroughSelection.borderColor
        : systemConfig.measurementMode.peakTroughSelection.warning.borderColor,
      lineStyle: isMoveable
        ? systemConfig.measurementMode.peakTroughSelection.lineStyle
        : systemConfig.measurementMode.peakTroughSelection.nonMoveableLineStyle,
      timeSecs: peakTime,
      maxTimeSecsConstraint: arrivalTime + selectionEndOffset
    },
    isMoveable,
    color: !isWarning
      ? systemConfig.measurementMode.peakTroughSelection.color
      : systemConfig.measurementMode.peakTroughSelection.warning.color
  });
  return selections;
}

/**
 * Internal helper function used by {@link generateSelectionWindows} to
 * create selection windows for a given signal detection.
 *
 * @returns a WeavessTypes.SelectionWindow
 */
function mapSignalDetectionToSelectionWindow(
  sd: SignalDetectionTypes.SignalDetection,
  preferredEventHypothesisByStage: EventTypes.EventHypothesis,
  measurementMode: AnalystWorkspaceTypes.MeasurementMode
): WeavessTypes.SelectionWindow[] {
  const arrivalTimeValue: SignalDetectionTypes.ArrivalTimeMeasurementValue =
    findArrivalTimeFeatureMeasurementValue(
      getCurrentHypothesis(sd.signalDetectionHypotheses).featureMeasurements
    );

  // Check if arrival time is set and is a number and check that a event hypothesis was found
  if (!isNumber(arrivalTimeValue.arrivalTime.value)) return [];

  const arrivalTime: number = arrivalTimeValue.arrivalTime.value;

  const isSdAssociatedToOpenEvent = preferredEventHypothesisByStage
    ? isSdHypothesisAssociatedToEventHypothesis(
        getCurrentHypothesis(sd.signalDetectionHypotheses),
        preferredEventHypothesisByStage
      )
    : false;

  const amplitudeMeasurementValue = findAmplitudeFeatureMeasurementValue(
    getCurrentHypothesis(sd.signalDetectionHypotheses).featureMeasurements,
    SignalDetectionTypes.FeatureMeasurementType.AMPLITUDE_A5_OVER_2
  );

  const selectionStartOffset: number =
    systemConfig.measurementMode.selection.startTimeOffsetFromSignalDetection;
  const selectionEndOffset: number =
    systemConfig.measurementMode.selection.endTimeOffsetFromSignalDetection;

  // measurement.entries is a dictionary where key is the
  // signal detection id and the entry is boolean to show or hide
  // start undefined i.e. not in the map. If in map means SD is either manually
  // added to map to show or be hidden
  let shouldShow;
  if (measurementMode.entries[sd.id] !== undefined) {
    shouldShow = measurementMode.entries[sd.id];
  }

  // display the measurement selection windows if the sd is associated
  // to the open event and its phase is included in one of the measurement mode phases
  // and not excluded in the entries dictionary
  if (
    shouldShow ||
    (measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT &&
      isSdAssociatedToOpenEvent &&
      shouldShow === undefined)
  ) {
    let selections: WeavessTypes.SelectionWindow[] = [
      {
        id: `${systemConfig.measurementMode?.selection?.id}${sd.id}`,
        startMarker: {
          id: 'start',
          color: systemConfig.measurementMode?.selection?.borderColor,
          lineStyle: systemConfig.measurementMode?.selection?.lineStyle,
          timeSecs: arrivalTime + selectionStartOffset
        },
        endMarker: {
          id: 'end',
          color: systemConfig.measurementMode?.selection?.borderColor,
          lineStyle: systemConfig.measurementMode?.selection?.lineStyle,
          timeSecs: arrivalTime + selectionEndOffset
        },
        isMoveable: systemConfig.measurementMode?.selection?.isMoveable,
        color: systemConfig.measurementMode?.selection?.color
      }
    ];

    if (amplitudeMeasurementValue) {
      // Add the amplitude measurement selection windows
      selections = selections.concat(
        generateAmplitudeSelectionWindows(
          sd.id,
          arrivalTime,
          amplitudeMeasurementValue,
          measurementMode
        )
      );
    }
    return selections;
  }
  return [];
}

/**
 * Creates the selection window and markers for weavess for a list of signal detections
 *
 * @param signalDetections signal detections
 * @param currentOpenEvent the current open event
 * @param measurementMode measurement mode
 *
 * @returns a WeavessTypes.SelectionWindow[]
 */
export function generateSelectionWindows(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  currentOpenEvent: EventTypes.Event,
  measurementMode: AnalystWorkspaceTypes.MeasurementMode,
  openIntervalName: string
): WeavessTypes.SelectionWindow[] {
  const preferredEventHypothesisByStage =
    EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
      currentOpenEvent,
      openIntervalName
    );

  // if no event hypothesis return empty
  if (!preferredEventHypothesisByStage) return [];

  return flatMap(
    signalDetections
      .map(sd =>
        mapSignalDetectionToSelectionWindow(sd, preferredEventHypothesisByStage, measurementMode)
      )
      .filter(sw => sw !== undefined && sw.length !== 0)
  );
}

/**
 * if the contents of the draft have changed in the new object for a particular key, then
 * replace the draft version with the version in the new object.
 *
 * @param draft the draft on which we are operating
 * @param key the key to check. Must be a key of the type T
 * @param newObj the new object to compare against.
 */
function maybeMutateDraft<T>(draft: WritableDraft<T>, key: keyof T, newObj: T) {
  const orig = original(draft);
  if (orig && !isEqual(orig[key], newObj[key])) {
    draft[key] = newObj[key] as unknown as Draft<T[keyof T]>;
    weavessStationsContainsChanges = true;
  }
}

/**
 * Build a record of channel names to list of pick markers
 *
 * @returns record
 */
function buildChannelNameToPickMarkerRecord(
  station: WeavessTypes.Station,
  signalDetections: SignalDetectionTypes.SignalDetection[]
): Record<string, WeavessTypes.PickMarker[]> {
  // Build a record of channel names to their signal detections
  const pickMarkerRecord: Record<string, WeavessTypes.PickMarker[]> = {};
  station.defaultChannel.waveform?.signalDetections?.forEach(pickMarker => {
    const signalDetection = signalDetections.find(sd => sd.id === pickMarker.id);
    if (!signalDetection) return; // if no sd is found the pick marker is invalid
    const workingSignalDetectionHypothesis = getCurrentHypothesis(
      signalDetection.signalDetectionHypotheses
    );
    const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(
      workingSignalDetectionHypothesis.featureMeasurements
    );

    const channelName =
      arrivalTimeFeatureMeasurement?.analysisWaveform?.waveform?.id?.channel?.name ||
      arrivalTimeFeatureMeasurement?.measuredChannelSegment?.id?.channel?.name;
    if (channelName) {
      // make sure channel was found to put the pick marker on
      if (!pickMarkerRecord[channelName]) pickMarkerRecord[channelName] = [];
      pickMarkerRecord[channelName].push(pickMarker);
    }
  });
  return pickMarkerRecord;
}

/**
 * Creates a shallowly-immutable update of the @param existingChannel, such that any
 * changed parameters of that channel are replaced with the version from @param newChannel
 *
 * @param existingChannel the channel as it currently exists
 * @param newChannel What a new channel should look like
 * @returns a copy of @param existingChannel that matches @param newChannel, but that
 * preserves referential equality for any parameters that were unchanged.
 *
 * Note: it does this shallowly, so if any deeply nested value within the channel has changed,
 * this will replace the whole tree. For example, if the start time of @param newChannel.defaultRange has
 * changed, then @param existingChannel.defaultRange will be entirely replaced. This does not provide deep
 * immutability. It is a performance optimization, since deep comparison for deep immutability
 * is time consuming, and the performance hit for rerendering the interiors of a channel is
 * lower than the performance hit for many equality checks.
 */
function updateWeavessChannel(
  existingChannel: WeavessTypes.Channel | undefined,
  newChannel: WeavessTypes.Channel | undefined
): WeavessTypes.Channel | undefined {
  // Figure out if either/both are undefined or are equal first
  if (!existingChannel && newChannel) {
    return newChannel;
  }
  if ((!newChannel && existingChannel) || isEqual(newChannel, existingChannel)) {
    return existingChannel;
  }
  if (!existingChannel || !newChannel) return undefined;
  return produce(existingChannel, draft => {
    // Update any simple parameters that have changed
    Object.keys(existingChannel).forEach((k: keyof WeavessTypes.Channel) => {
      maybeMutateDraft<WeavessTypes.Channel>(draft, k, newChannel);
    });
  });
}

/**
 * @param channelSegment a channel segment from which to derive the name
 * @returns a channel label consisting of the second and third elements of the channel name,
 * namely the group or waveform type, and the channel code.
 * @example AS01.SHZ
 * @example beam.SHZ
 */
function getChannelLabelForSplitChannel(channelSegment: WeavessTypes.ChannelSegment): string {
  const channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor = JSON.parse(
    channelSegment.configuredInputName
  );
  const channelLabel = channelSegmentDescriptor?.channel?.name.split('/')[0].split('.');
  channelLabel.shift();
  return channelLabel.join('.');
}

/**
 * Create a split channel from the station's default channel
 *
 * @param id split channel name
 * @param station station which owns the channel
 * @param filterName
 * @param channelSegment
 * @param pickMarkers
 * @param distanceToEvent
 * @returns
 */
export function createSplitChannel(
  id: string,
  station: WeavessTypes.Station,
  filterName: string,
  channelSegment: ChannelSegment,
  splitChannelTime: number | undefined,
  splitChannelPhase: string | undefined,
  distanceToEvent?: EventTypes.LocationDistance,
  pickMarkers: WeavessTypes.PickMarker[] = []
): WeavessTypes.Channel {
  return {
    ...station.defaultChannel,
    name: station.name,
    channelLabel: getChannelLabelForSplitChannel(channelSegment),
    id,
    waveform: station.defaultChannel.waveform
      ? {
          ...station.defaultChannel.waveform,
          channelSegmentsRecord: {
            [filterName]: [channelSegment]
          },
          signalDetections: pickMarkers
        }
      : undefined,
    azimuth: distanceToEvent?.azimuth || 0,
    distance: getDistanceUsingDistanceUnits(
      distanceToEvent?.distance,
      userPreferences.distanceUnits
    ),
    splitChannelTime,
    splitChannelPhase
  };
}

/**
 * Gets a unique id for the split channel
 *
 * @param station the parent station to the channel segment
 * @param channelSegment the channel segment to be rendered in the split channel
 * @param index the index (order) it will be rendered in the dom
 * @returns a unique string id for the split channel
 */
function createSplitChannelId(
  station: WeavessTypes.Station,
  channelSegment: WeavessTypes.ChannelSegment,
  index: number
) {
  const { data } = channelSegment.dataSegments[0];
  let splitId = `${index}`;

  // If available use a stronger key
  if (isDataClaimCheck(data)) {
    // Key cannot be the data.id because if it contains the filterId it could prevent necessary re-renders
    splitId = `${channelSegment.channelName}${data.startTimeSecs}${data.endTimeSecs}${data.domainTimeRange.startTimeSecs}${data.domainTimeRange.endTimeSecs}`;
  }

  return `${station.id}.split.${splitId}`;
}

/**
 * Updates station's default channel to return multiple channels in the case
 * where the station at the given time contains multiple channel segments.
 *
 * @returns Channel list
 */
export function updateSplitChannels(
  existingWeavessStation: WeavessTypes.Station,
  station: WeavessTypes.Station,
  params: CreateWeavessStationsParameters
): WeavessTypes.Channel[] | undefined {
  if (params.splitStation.stationId !== station.id) return undefined;

  const filterName = getFilterName(params.channelFilters[station.name]);
  // Build a record of channel names to their signal detections
  const signalDetections: Record<string, WeavessTypes.PickMarker[]> =
    buildChannelNameToPickMarkerRecord(station, params.visibleStationSignalDetections);

  const distanceToEvent = params.distances
    ? params.distances.find(d => d.id === station.name)
    : undefined;

  const channelSegmentsRecord = station.defaultChannel.waveform?.channelSegmentsRecord;

  // The filtered data might not be in the channel segment record yet
  if (channelSegmentsRecord?.[filterName]?.length) {
    // Find the channel segments that will be split
    const channelSegments = channelSegmentsRecord[filterName].filter(channelSegment => {
      return !!channelSegment.dataSegments.find(dataSegment => {
        if (isDataClaimCheck(dataSegment.data)) {
          const { startTimeSecs, endTimeSecs } = dataSegment.data;
          return (
            station.defaultChannel.splitChannelTime &&
            station.defaultChannel.splitChannelTime >= startTimeSecs &&
            station.defaultChannel.splitChannelTime <= endTimeSecs
          );
        }
        return false;
      });
    });
    // Each channel segment will be split into its own split weavess channel
    return sortBy(channelSegments, channelSegment => {
      if (!isDataClaimCheck(channelSegment.dataSegments[0].data)) {
        return null;
      }
      const { data } = channelSegment.dataSegments[0];
      return data.startTimeSecs;
    }).map((channelSegment, index) => {
      const id = createSplitChannelId(station, channelSegment, index);
      const channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor = JSON.parse(
        channelSegment.configuredInputName
      );
      const filteredSignalDetections =
        signalDetections[channelSegmentDescriptor?.channel?.name] || [];

      return createSplitChannel(
        id,
        station,
        filterName,
        channelSegment,
        station.defaultChannel.splitChannelTime,
        station.defaultChannel.splitChannelPhase,
        distanceToEvent,
        filteredSignalDetections
      );
    });
  }
  // Return the existing split channels in the case where we did not update them
  return existingWeavessStation.splitChannels;
}

/**
 * Updates a Weavess station, treating the station as an immutable object, and thus preserving
 * strict equality for unchanged parameters inside of the station
 *
 * @param existingWeavessStation the existing @interface WeavessTypes.Station to update
 * @param station station
 * @param selectedFilter selected filter
 * @param channelSegmentsRecord channel segment dictionary
 * @param signalDetections signal detections
 * @param eventBeams event beams for given station
 * @param params CreateWeavessStationsParameters the parameters required for
 * @returns a new @interface WeavessTypes.Station with any changed parameters updated.
 */
export function updateWeavessStation(
  existingWeavessStation: WeavessTypes.Station,
  station: StationTypes.Station,
  selectedFilter: FilterTypes.Filter,
  stationUiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  signalDetections: SignalDetectionTypes.SignalDetection[],
  eventBeams: UiChannelSegment<WaveformTypes.Waveform>[],
  params: CreateWeavessStationsParameters
): WeavessTypes.Station {
  return produce(existingWeavessStation, draft => {
    const newStation = createWeavessStation(
      station,
      selectedFilter,
      stationUiChannelSegments,
      signalDetections,
      eventBeams,
      params
    );

    let splitChannels: WeavessTypes.Channel[] | undefined;

    if (params.splitStation.stationId === station.name) {
      splitChannels = updateSplitChannels(existingWeavessStation, newStation, params);
    }

    // Compare non-default channel size since maybeMutateDraft
    // doesn't mutate when channels are hidden/shown
    if (
      newStation.nonDefaultChannels?.length !== existingWeavessStation.nonDefaultChannels?.length
    ) {
      weavessStationsContainsChanges = true;
    }

    // Update any simple parameters that have changed
    Object.keys(existingWeavessStation).forEach((k: keyof WeavessTypes.Station) => {
      if (k === 'nonDefaultChannels' || k === 'defaultChannel') return; // handle separately
      maybeMutateDraft(draft, k, newStation);
    });

    // Must set the splitChannels AFTER maybeMutateDraft so the property isn't overridden by newStation values
    draft.splitChannels = splitChannels;

    const newDefaultChannel = updateWeavessChannel(
      existingWeavessStation.defaultChannel,
      newStation.defaultChannel
    );
    if (newDefaultChannel) {
      draft.defaultChannel = newDefaultChannel;
    }
    draft.nonDefaultChannels = updateWeavessNonDefaultChannels(
      existingWeavessStation,
      newStation,
      station,
      params
    );
  });
}

// Helper function for updateWeavessNonDefaultChannels
function processNonDefaultChannelUpdate(
  channel: ChannelTypes.Channel,
  stationVis: AnalystWaveformTypes.StationVisibilityChanges,
  existingStation: WeavessTypes.Station,
  newStation: WeavessTypes.Station,
  draft: WritableDraft<WeavessTypes.Station>
): [WeavessTypes.Channel | undefined, boolean] {
  let addedHidChannel = false;
  let channelToPush;
  if (AnalystWaveformUtil.isChannelVisible(channel.name, stationVis)) {
    const newChannel = WeavessUtil.findChannelInStation(newStation, channel.name);
    const currentChannel = WeavessUtil.findChannelInStation(existingStation, channel.name);
    const updatedChannel = updateWeavessChannel(currentChannel, newChannel);
    // Replace existing channel with updated channel if it was changed. If that
    // channel was hidden then we will use the new list of channels
    if (updatedChannel && updatedChannel !== currentChannel) {
      channelToPush = updatedChannel;
      const index = draft.nonDefaultChannels?.findIndex(chan => chan.id === newChannel?.id) || -1;
      if (index === -1) {
        // Added a channel previously hid
        addedHidChannel = true;
      } else {
        if (!draft.nonDefaultChannels) draft.nonDefaultChannels = [];
        draft.nonDefaultChannels[index] = updatedChannel;
      }
    } else if (currentChannel) {
      channelToPush = currentChannel;
    }
  } else {
    // Hid a channel
    addedHidChannel = true;
  }

  return [channelToPush, addedHidChannel];
}

/**
 * Updates a Weavess station's non default channels, treating the channels as an immutable object,
 * and thus preserving strict equality for unchanged parameters inside of the non default channels
 *
 * @param draftWeavessStation
 * @param existingStation
 * @param newStation
 * @param station
 * @param params
 * @returns
 */
function updateWeavessNonDefaultChannels(
  existingStation: WeavessTypes.Station,
  newStation: WeavessTypes.Station,
  station: StationTypes.Station,
  params: CreateWeavessStationsParameters
): WeavessTypes.Channel[] | undefined {
  const modStation = produce(existingStation, draft => {
    // remove any nonDefaultChannels that are hidden
    draft.nonDefaultChannels?.forEach((chan, index) => {
      if (!newStation.nonDefaultChannels?.find(c => c.id === chan.id)) {
        draft.nonDefaultChannels?.splice(index, 1);
      }
    });

    // Get the order of the Station Definition raw channels
    // to build the order of the weavess channels
    const sortedRawChannels = sortStationDefinitionChannels(station.allRawChannels);

    // Used to check the channel is visible before adding weavess channel
    const stationVis = params.stationVisibilityDictionary[station.name];

    // Add weavess channel to nonDefaultChannels. Use the order of the sorted raw channels.
    // Determine which WeavessChannel to add depending on if the channel has been updated
    // Review how sorting is being done and could we just sort based
    // on Weavess Channels?
    const channelsWithNewlyVisible: WeavessTypes.Channel[] = [];
    // Flag if any channels are hidden or are newly made visible
    let addedHidChannel = false;
    sortedRawChannels.forEach(channel => {
      const [channelToPush, hidChannel] = processNonDefaultChannelUpdate(
        channel,
        stationVis,
        existingStation,
        newStation,
        draft
      );

      if (hidChannel) addedHidChannel = true;
      if (channelToPush) channelsWithNewlyVisible.push(channelToPush);
    });
    // If we added a hidden channel or any channels are hidden then use the new list
    if (addedHidChannel) {
      draft.nonDefaultChannels = channelsWithNewlyVisible;
    }
  });
  return modStation.nonDefaultChannels;
}

/**
 * Creates a station for weavess with the waveform data map
 *
 * @param station station
 * @param selectedFilter selected filter
 * @param channelSegmentsRecord channel segment dictionary
 * @param signalDetections signal detections
 * @param eventBeams event beams for given station
 * @param params CreateWeavessStationsParameters the parameters required for
 *
 * @returns a WaveformWeavessStation
 */
export function createWeavessStation(
  station: StationTypes.Station,
  selectedFilter: FilterTypes.Filter,
  stationUiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  signalDetections: SignalDetectionTypes.SignalDetection[],
  eventBeams: UiChannelSegment<WaveformTypes.Waveform>[],
  params: CreateWeavessStationsParameters
): WeavessTypes.Station {
  const distanceToEvent = params.distances
    ? params.distances.find(d => d.id === station.name)
    : undefined;

  const stationVisObject = params.stationVisibilityDictionary[station.name];

  const nonDefaultChannels = createWeavessNonDefaultChannels(station, params, signalDetections);
  const newStation = {
    id: station.name,
    name: station.name,
    distance: getDistanceUsingDistanceUnits(
      distanceToEvent?.distance,
      userPreferences.distanceUnits
    ),
    azimuth: distanceToEvent ? distanceToEvent.azimuth : 0,
    distanceUnits: userPreferences.distanceUnits,
    defaultChannel: createWeavessDefaultChannel(
      station,
      selectedFilter,
      stationUiChannelSegments,
      signalDetections,
      eventBeams,
      params
    ),
    nonDefaultChannels,
    areChannelsShowing: AnalystWaveformUtil.isStationExpanded(stationVisObject),
    hasQcMasks: hasMasks(
      station.allRawChannels,
      params.qcSegmentsByChannelName,
      params.processingMasks,
      params.uiTheme.colors,
      params.maskVisibility,
      params.zoomInterval
    )
  };

  // If in split mode and split this station then split it
  if (
    params.splitStation.activeSplitModeType &&
    newStation.name === params.splitStation.stationId
  ) {
    return splitWeavessStation(params, newStation);
  }
  return newStation;
}

/**
 * Builds a filter description which will eventually be displayed on the bottom right of the waveform
 * Allows an opportunity to insert an error in case filtering did not complete successfully.
 *
 * @param channelFilter the filter from which to generate the description
 * @returns WeavessTypes.ChannelDescription | string
 */
function buildFilterDescription(
  channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]>,
  channelFilter: FilterTypes.Filter
): WeavessTypes.ChannelDescription | string {
  const filterName = getFilterName(channelFilter);
  if (Object.keys(channelSegmentsRecord).length === 0) {
    return '';
  }
  if (channelFilter?._uiIsError) {
    return {
      message: getFilterName(channelFilter),
      isError: !!channelFilter._uiIsError,
      tooltipMessage: 'Filtering operation failed'
    } as WeavessTypes.ChannelDescription;
  }
  return filterName;
}

/**
 * Creates a default channel waveform for weavess
 *
 * @param station a processing station
 * @param selectedFilter the currently selected filter
 * @param stationUiChannelSegments list of UI channel segments corresponding to the selected filter
 * @param signalDetections signal detections
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.Channel
 */
export function createWeavessDefaultChannel(
  station: StationTypes.Station,
  /** These params will be used in creating default channel when we have Signal Detections */
  selectedFilter: FilterTypes.Filter,
  stationUiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  signalDetections: SignalDetectionTypes.SignalDetection[],
  eventBeams: UiChannelSegment<WaveformTypes.Waveform>[],
  params: CreateWeavessStationsParameters
): WeavessTypes.Channel {
  // Build a default channel segment to use if no Signal Detections are found
  // The segment type is FK_BEAM since that is all that is drawn on the default channels
  const stationOffset = params.offsets[station.name];

  const waveform = createWeavessDefaultChannelWaveform(
    station,
    signalDetections,
    selectedFilter,
    stationUiChannelSegments,
    params
  );
  const description = buildFilterDescription(
    waveform.channelSegmentsRecord,
    params.channelFilters[station.name]
  );

  let channelLabel: string | undefined;
  let channelLabelTooltip: string | undefined;
  try {
    const res = getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
      signalDetections,
      eventBeams
    );
    channelLabel = res.channelLabel;
    channelLabelTooltip = res.tooltip;
  } catch (error) {
    logger.warn(`Error generating station label for ${station.name} msg: ${error}`);
  }
  return {
    id: station.name,
    name: station.name,
    channelLabelTooltip,
    channelLabel,
    description,
    height: params.channelHeight,
    timeOffsetSeconds: stationOffset || 0,
    baseStationTime: params.offsets.baseStationTime ?? null,
    waveform,
    splitChannelPhase:
      params.splitStation.stationId === station.name ? params.splitStation.phase : undefined,
    splitChannelTime:
      params.splitStation.stationId === station.name ? params.splitStation.timeSecs : undefined,
    isSelected: params.selectedStationsAndChannels.has(station.name)
  };
}

/**
 * Determine if a raw channel should receive an EVENT BEAM label or if it should be
 * dimmed by weavess.
 *
 * @returns undefined + false if no event beams are selected
 */
const createWeavessRawChannelBeamInputArgs = (
  params: CreateWeavessStationsParameters,
  rawChannelToProcess: ChannelTypes.Channel
) => {
  // multi-selection logic; only applies header and auto-dimming if a single event beam is selected
  if (
    params.selectedWaveforms.length !== 1 ||
    parseWaveformChannelType(params.selectedWaveforms[0].channel.name) !== 'Event beam'
  ) {
    return { labelHeader: undefined, isDimmed: false };
  }
  const preferredEventHypothesisByStage =
    EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
      params.currentOpenEvent,
      params.openIntervalName
    );

  // early return if no preferred event hypothesis
  if (
    preferredEventHypothesisByStage === undefined ||
    params.eventBeams[preferredEventHypothesisByStage.id.hypothesisId] === undefined
  ) {
    return { labelHeader: undefined, isAutoDimmed: false };
  }

  const selectedBeamedChannel = params.populatedChannels.find(
    populatedChannel =>
      populatedChannel.name === params.selectedWaveforms[0].channel.name &&
      parseWaveformChannelType(params.selectedWaveforms[0].channel.name) === 'Event beam'
  );

  // early return if selectedBeamedChannel is falsy or channel to process is not member of same station as selected beamed channel
  if (
    !selectedBeamedChannel ||
    !rawChannelToProcess.name.startsWith(selectedBeamedChannel.station?.name)
  ) {
    return { labelHeader: undefined, isAutoDimmed: false };
  }

  const isConfiguredInput = selectedBeamedChannel?.configuredInputs.some(configuredInputChannel =>
    configuredInputChannel.name.startsWith(rawChannelToProcess.name)
  );

  const isMissingInput = params.eventBeams[preferredEventHypothesisByStage.id.hypothesisId].some(
    beam =>
      beam.channelSegment.missingInputChannels.some(missingInput => {
        if (
          missingInput.channel.name.startsWith(rawChannelToProcess.name) &&
          !!missingInput.timeRanges
        ) {
          // check that missing input spans full time range of selected beam
          return missingInput.timeRanges.some(
            timeRange =>
              timeRange.startTime <= params.selectedWaveforms[0].startTime &&
              timeRange.endTime >= params.selectedWaveforms[0].endTime
          );
        }
        return false;
      })
  );

  const isEventBeamInputChannel = isConfiguredInput && !isMissingInput;

  return {
    labelHeader: isEventBeamInputChannel ? 'BEAM INPUT' : undefined,
    isAutoDimmed: !isEventBeamInputChannel
  };
};

/**
 * Creates a non default channel for weavess
 *
 * @param station a processing station
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.Channel[]
 */
export function createWeavessNonDefaultChannels(
  station: StationTypes.Station,
  params: CreateWeavessStationsParameters,
  stationsSignalDetections: SignalDetectionTypes.SignalDetection[]
): WeavessTypes.Channel[] {
  // sds are only displayed on the default channel;
  // hide all non-default channels in measurement mode

  // Check the station is showing the channels and the channel is visible before creating weavess channel
  const { offsets } = params;
  const stationVis = params.stationVisibilityDictionary[station.name];

  // if in measurement mode or if the channels are not showing then return an empty array
  if (
    AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT === params.measurementMode.mode ||
    !stationVis.isStationExpanded
  ) {
    return [];
  }

  // Sort the channels based on the channel grouping and orientation
  const rawChannelsToProcess = sortStationDefinitionChannels(station.allRawChannels);

  // Build the visible child channels to return
  return rawChannelsToProcess
    .map(channel => {
      if (!AnalystWaveformUtil.isChannelVisible(channel.name, stationVis)) {
        return undefined;
      }
      const rawChannelSignalDetections = stationsSignalDetections.filter(
        sd =>
          SignalDetectionUtils.getSignalDetectionAnalysisWaveformChannelName(sd) === channel.name
      );
      const channelOffset = offsets[station.name];

      const { labelHeader, isAutoDimmed } = createWeavessRawChannelBeamInputArgs(params, channel);

      const nonDefaultChannel = createWeavessNonDefaultChannel(
        channel,
        params,
        channelOffset,
        rawChannelSignalDetections,
        labelHeader,
        isAutoDimmed || false
      );
      nonDefaultChannel.name = channel.name;
      return nonDefaultChannel;
    })
    .filter(notEmpty);
}

/**
 * Creates a non default channel for weavess
 *
 * @param nonDefaultChannel a processing channel
 * @param params CreateWeavessStationsParameters the parameters required for
 * @param stationOffset offset in seconds
 *
 * @returns a WeavessTypes.Channel
 */
export function createWeavessNonDefaultChannel(
  nonDefaultChannel: ChannelTypes.Channel,
  params: CreateWeavessStationsParameters,
  channelOffset: number,
  rawChannelSignalDetections: SignalDetectionTypes.SignalDetection[],
  labelHeader: string | undefined,
  isAutoDimmed: boolean
): WeavessTypes.Channel {
  const nonDefaultChannelSegments = getChannelSegments(
    nonDefaultChannel.name,
    params.channelFilters,
    params.uiChannelSegments,
    params.uiTheme
  );

  const channelDistance = params.distances?.find(
    distance => distance.id === nonDefaultChannel.name
  );

  const waveform = createWeavessNonDefaultChannelWaveform(
    nonDefaultChannelSegments,
    nonDefaultChannel,
    params,
    rawChannelSignalDetections,
    isAutoDimmed
  );

  const description = buildFilterDescription(
    waveform.channelSegmentsRecord,
    params.channelFilters[nonDefaultChannel.name]
  );

  return {
    id: nonDefaultChannel.name,
    name: nonDefaultChannel.name,
    description,
    timeOffsetSeconds: channelOffset || 0,
    baseStationTime: params.offsets.baseStationTime ?? null,
    height: params.channelHeight,
    waveform,
    distance: getDistanceUsingDistanceUnits(
      channelDistance?.distance,
      userPreferences.distanceUnits
    ),
    azimuth: channelDistance?.azimuth,
    distanceUnits: userPreferences.distanceUnits,
    labelHeader,
    isSelected: params.selectedStationsAndChannels.has(nonDefaultChannel.name)
  };
}

/**
 * Updates the list of UiChannelSegments with the isSelected flag
 * set to try if channel segment descriptor is stored in state
 *
 * @param selectedFilter
 * @param signalDetections
 * @param uiChannelSegments list of UI channel segments corresponding to the selected filter
 * @param uiTheme
 * @param selectedWaveform
 * @returns Record<string, WeavessTypes.ChannelSegment[]>
 */
export function updateSelectedChannelSegments(
  selectedFilter: FilterTypes.Filter,
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  uiTheme: ConfigurationTypes.UITheme,
  selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[]
): Record<string, WeavessTypes.ChannelSegment[]> {
  // Bail early if we don't have uiChannel segments (we may be waiting on a filter operation)
  if (!uiChannelSegments || uiChannelSegments.length === 0) return {};

  const filterName = getFilterName(selectedFilter);

  // Create a record of uiChannelSegment.channelSegments and update their colors
  return {
    [filterName]: uiChannelSegments.map<WeavessTypes.ChannelSegment>(uiCs => {
      const selected = !selectedWaveforms?.length
        ? false
        : ChannelSegmentTypes.Util.isSelectedWaveform(
            uiCs.channelSegment?._uiConfiguredInput ?? uiCs.channelSegmentDescriptor,
            selectedWaveforms
          );
      // Convert to weavess channel segment and mark as selected
      return channelSegmentToWeavessChannelSegment(
        uiCs,
        {
          waveformColor: selected ? uiTheme.colors.waveformSelected : uiTheme.colors.waveformRaw,
          labelTextColor: uiTheme.colors.waveformFilterLabel
        },
        selected
      );
    })
  };
}

/**
 * Creates a default channel waveform for weavess
 *
 * @param station a processing station
 * @param signalDetections signal detections
 * @param selectedFilter current selected filter
 * @param stationUiChannelSegments list of UI channel segments corresponding to the selected filter
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.ChannelWaveformContent
 */
export function createWeavessDefaultChannelWaveform(
  station: StationTypes.Station,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  selectedFilter: FilterTypes.Filter,
  stationUiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[],
  params: CreateWeavessStationsParameters
): WeavessTypes.ChannelWaveformContent {
  const channelSegments = updateSelectedChannelSegments(
    selectedFilter,
    stationUiChannelSegments,
    params.uiTheme,
    params.selectedWaveforms
  );
  return {
    channelSegmentId: getFilterName(selectedFilter),
    channelSegmentsRecord: channelSegments,
    predictedPhases: buildPredictedPhasePickMarkers(station.name, params),
    signalDetections: buildSignalDetectionPickMarkers(signalDetections, params),
    masks: undefined,
    markers: {
      verticalMarkers: getIntervalMarkers(params.startTimeSecs, params.endTimeSecs),
      selectionWindows: params.currentOpenEvent // cannot create selection windows without an open event
        ? generateSelectionWindows(
            signalDetections,
            params.currentOpenEvent,
            params.measurementMode,
            params.openIntervalName
          )
        : []
    }
  };
}

/**
 * Builds the Weavess Signal Detections used in a WeavessChannel
 *
 * @param signalDetections
 * @returns list of Weavess Pick Markers
 */
function buildSignalDetectionPickMarkers(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  params: CreateWeavessStationsParameters
): WeavessTypes.PickMarker[] {
  return signalDetections
    ? signalDetections.map(detection => {
        // Maybe even the pick marker routine?
        const sdAssociation = params.signalDetectionAssociations.find(
          status => status.signalDetectionId === detection.id
        );
        const color = getSignalDetectionStatusColor(
          sdAssociation?.associationStatus,
          params.uiTheme
        );
        const arrivalTimeFeatureMeasurementValue = findArrivalTimeFeatureMeasurementValue(
          getCurrentHypothesis(detection.signalDetectionHypotheses).featureMeasurements
        );
        const fmPhase = findPhaseFeatureMeasurementValue(
          getCurrentHypothesis(detection.signalDetectionHypotheses).featureMeasurements
        );
        const sdUncertainty = arrivalTimeFeatureMeasurementValue.arrivalTime?.standardDeviation;
        const timeSecs = arrivalTimeFeatureMeasurementValue?.arrivalTime?.value
          ? arrivalTimeFeatureMeasurementValue.arrivalTime.value
          : 0; // it's okay for 0 case since value is epoch seconds
        const isConflicted = !!includes(params.sdIdsInConflict, detection.id);
        const shouldDisplaySd = shouldDisplaySignalDetection(
          sdAssociation?.associationStatus,
          getEdgeType(
            { startTimeSecs: params.startTimeSecs, endTimeSecs: params.endTimeSecs },
            timeSecs
          ),
          isConflicted,
          params.displayedSignalDetectionConfiguration
        );
        return {
          timeSecs,
          uncertaintySecs: sdUncertainty || 0,
          showUncertaintyBars: sdUncertainty && params.showSignalDetectionUncertainty,
          label: fmPhase.value,
          id: detection.id,
          color,
          isConflicted,
          isDisabled: !shouldDisplaySd,
          isSelected: params.selectedSdIds?.find(id => id === detection.id) !== undefined,
          isActionTarget:
            params.signalDetectionActionTargets?.find(id => id === detection.id) !== undefined,
          isDraggable: !getCurrentHypothesis(detection.signalDetectionHypotheses).deleted
        } as WeavessTypes.PickMarker;
      })
    : [];
}

/**
 * Function to check if a phase marker should be displayed depending on its status as a priority phase
 * or a selected default/non-priority phase
 *
 * @param fpPhase
 * @param phaseToAlignOn
 * @param config
 * @returns
 */
export function isDisplayedPhase(
  fpPhase: string,
  phaseToAlignOn: string | undefined,
  config: ConfigurationTypes.ProcessingAnalystConfiguration
): boolean {
  const favoritePhases = uniqSortStrings(
    config.phaseLists.flatMap(phaseList => phaseList.favorites)
  );

  return fpPhase === phaseToAlignOn || favoritePhases.includes(fpPhase);
}

/**
 * Builds the Weavess Predicted Phases used in a WeavessChannel
 *
 * @param station
 * @returns list of Weavess Pick Markers
 */
export function buildPredictedPhasePickMarkers(
  receiverName: string,
  params: CreateWeavessStationsParameters
): WeavessTypes.PickMarker[] {
  if (params.showPredictedPhases && params.featurePredictions) {
    return params.featurePredictions[receiverName]?.featurePredictions
      .filter(
        fp =>
          isArrivalTimeMeasurementValue(fp.predictionValue.predictedValue) &&
          isDisplayedPhase(
            fp.phase,
            params.phaseToAlignOn,
            params.processingAnalystConfiguration
          ) &&
          !fp.extrapolated
      )
      .map((fp, index) => {
        const { predictedValue } = fp.predictionValue;
        if (isArrivalTimeMeasurementValue(predictedValue)) {
          return {
            timeSecs: predictedValue.arrivalTime.value,
            uncertaintySecs: predictedValue.arrivalTime.standardDeviation,
            showUncertaintyBars: false,
            label: fp.phase,
            id: `${index}`,
            color: params.uiTheme.colors.predictionSDColor,
            filter: `opacity(${params.uiTheme.display.predictionSDOpacity})`,
            isConflicted: false,
            isSelected: false,
            isActionTarget: false,
            isDraggable: false
          };
        }
        return undefined;
      }) as WeavessTypes.PickMarker[];
  }
  return [];
}

/**
 * Determines if a default channel should display mask indicator label
 * depending on presence of QC segments in non-default channels
 * within waveform display zoom interval
 *
 * @param channels
 * @param qcSegmentsByChannelName
 * @param qcMaskColors
 * @param maskVisibility
 * @param zoomInterval
 * @param nonDefaultChannels list of channels used to determine dimmed/not dimmed mask coloration based on beam selection
 * @returns boolean
 */
export function hasMasks(
  channels: ChannelTypes.Channel[],
  qcSegmentsByChannelName: Record<string, Record<string, QcSegment>>,
  processingMasks: ChannelSegmentTypes.ProcessingMask[],
  colorTheme: ConfigurationTypes.ColorTheme,
  maskVisibility: Record<string, boolean>,
  zoomInterval: CommonTypes.TimeRange
): boolean {
  const masks = flatMap(
    channels.map(channel =>
      buildMasks(channel.name, qcSegmentsByChannelName, processingMasks, colorTheme, maskVisibility)
    )
  );
  return (
    masks &&
    masks.length > 0 &&
    masks.some(
      mask =>
        (mask.startTimeSecs >= zoomInterval.startTimeSecs && // start time within interval OR
          mask.startTimeSecs <= zoomInterval.endTimeSecs) ||
        (mask.endTimeSecs >= zoomInterval.startTimeSecs && // end time within interval OR
          mask.endTimeSecs <= zoomInterval.endTimeSecs) ||
        (mask.startTimeSecs <= zoomInterval.startTimeSecs && // mask spans entire interval
          mask.endTimeSecs >= zoomInterval.endTimeSecs)
    )
  );
}

/**
 * Helper function to factor dimming into obtaining mask color when beams are selected
 */
export function calculateMaskColor(
  qcMaskType: ConfigurationTypes.QCMaskTypes,
  colorTheme: ConfigurationTypes.ColorTheme,
  isAutoDimmed = false
): string {
  let initColor: string;
  switch (qcMaskType) {
    case ConfigurationTypes.QCMaskTypes.PROCESSING_MASKS:
      initColor = colorTheme.qcMaskColors.processingMask;
      break;
    case ConfigurationTypes.QCMaskTypes.REJECTED:
      initColor = colorTheme.qcMaskColors.rejected;
      break;
    default:
      initColor = colorTheme.qcMaskColors[qcMaskType];
  }

  return isAutoDimmed
    ? blendColors(initColor, colorTheme.gmsBackground, colorTheme.waveformDimPercent)
    : initColor;
}

/**
 * Builds weavess masks from QcSegments
 *
 * @param channelName The name of the channel to build masks for
 * @param qcSegmentsByChannelName The QcSegments object
 * @param processingMask The processing mask to build a mask for
 * @param qcMaskColors The color object from processing config
 * @param maskVisibility Mask visibility Map
 * @param nonDefaultChannels list of channels used to determine dimmed/not dimmed mask coloration based on beam selection
 * @returns WeavessTypes.Mask[]
 */
export function buildMasks(
  channelName: string,
  qcSegmentsByChannelName: Record<string, Record<string, QcSegment>>,
  processingMasks: ChannelSegmentTypes.ProcessingMask[],
  colorTheme: ConfigurationTypes.ColorTheme,
  maskVisibility: Record<string, boolean>,
  isAutoDimmed = false
): Mask[] {
  let masks: Mask[] = [];
  if (qcSegmentsByChannelName[channelName]) {
    masks = Object.values(qcSegmentsByChannelName[channelName])
      .filter(qcSegment => {
        const qcSegmentVersion = qcSegment.versionHistory[qcSegment.versionHistory.length - 1];

        return maskVisibility[
          qcSegmentVersion.rejected || qcSegmentVersion.category === undefined // undefined is only the case on rejected
            ? ConfigurationTypes.QCMaskTypes.REJECTED
            : ConfigurationTypes.QCMaskTypes[qcSegmentVersion.category]
        ];
      })
      .filter(
        qcSegment =>
          qcSegment.versionHistory[qcSegment.versionHistory.length - 1].type !== QcSegmentType.GAP
      )
      .map(qcSegment => {
        const qcSegmentVersion = qcSegment.versionHistory[qcSegment.versionHistory.length - 1];
        const isRejected = qcSegmentVersion.rejected || qcSegmentVersion.category === undefined;
        return {
          id: qcSegment.id,
          startTimeSecs: qcSegmentVersion.startTime,
          endTimeSecs: qcSegmentVersion.endTime,
          color: calculateMaskColor(
            isRejected
              ? ConfigurationTypes.QCMaskTypes.REJECTED
              : ConfigurationTypes.QCMaskTypes[qcSegmentVersion.category],
            colorTheme,
            isAutoDimmed
          ),
          isProcessingMask: false
        };
      });

    if (
      processingMasks != null &&
      processingMasks.length > 0 &&
      maskVisibility[ConfigurationTypes.QCMaskTypes.PROCESSING_MASKS] &&
      colorTheme.qcMaskColors.processingMask
    ) {
      processingMasks.forEach(pMask => {
        if (pMask.appliedToRawChannel.name === channelName) {
          const processingMaskEntry: Mask = {
            id: pMask.id,
            startTimeSecs: pMask.startTime,
            endTimeSecs: pMask.endTime,
            color: calculateMaskColor(
              ConfigurationTypes.QCMaskTypes.PROCESSING_MASKS,
              colorTheme,
              isAutoDimmed
            ),
            isProcessingMask: true
          };
          masks.push(processingMaskEntry);
        }
      });
    }
  }

  return masks;
}

/**
 * Creates a non default channel waveform for weavess
 *
 * @param nonDefaultChannel non default channel
 * @param channel processing channel
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.ChannelWaveformContent
 */
export function createWeavessNonDefaultChannelWaveform(
  nonDefaultChannel: {
    channelSegmentId: string;
    channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]>;
  },
  channel: ChannelTypes.Channel,
  params: CreateWeavessStationsParameters,
  rawChannelSignalDetections: SignalDetectionTypes.SignalDetection[],
  isAutoDimmed = false
): WeavessTypes.ChannelWaveformContent {
  const masks = buildMasks(
    channel.name,
    params.qcSegmentsByChannelName,
    params.processingMasks,
    params.uiTheme.colors,
    params.maskVisibility,
    isAutoDimmed
  );

  return {
    channelSegmentId: nonDefaultChannel.channelSegmentId,
    channelSegmentsRecord: nonDefaultChannel.channelSegmentsRecord,
    signalDetections: buildSignalDetectionPickMarkers(rawChannelSignalDetections, params),
    // if the mask category matches the enabled masks then return the mask else skip it
    masks,
    predictedPhases: buildPredictedPhasePickMarkers(channel.name, params),
    markers: {
      verticalMarkers: getIntervalMarkers(params.startTimeSecs, params.endTimeSecs)
    },
    isAutoDimmed: isAutoDimmed || false
  };
}

/**
 * Creates the weavess stations for the waveform display.
 *
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.WeavessStation[]
 */
export function createWeavessStations(
  params: CreateWeavessStationsParameters,
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType,
  existingWeavessStations: WeavessTypes.Station[]
): { stationsNeedsUpdating: boolean; weavessStations: WeavessTypes.Station[] } {
  // Reset flag to no changes
  weavessStationsContainsChanges = false;
  // build the station list and sort it
  const weavessStations = sortWaveformList(
    params.visibleStations
      // filter the stations based on the mode setting
      .filter(stationToFilterOnMode =>
        filterStationOnMode(
          params.measurementMode.mode,
          stationToFilterOnMode,
          params.currentOpenEvent,
          params.visibleStationSignalDetections,
          params.openIntervalName
        )
      )
      .map(station => {
        const selectedFilter: FilterTypes.Filter =
          params.channelFilters[station.name] ?? UNFILTERED_FILTER;
        const signalDetectionsForStation = filterSignalDetectionsByStationId(
          station.name,
          params.visibleStationSignalDetections
        );
        const stationUiChannelSegments = getUiChannelSegmentsForStationAndFilter(
          station.name,
          params
        );
        const stationEventBeams = getEventBeamsForStation(station.name, params.eventBeams);

        const existingStation = existingWeavessStations.find(s => s.id === station.name);
        return existingStation
          ? updateWeavessStation(
              existingStation,
              station,
              selectedFilter,
              stationUiChannelSegments,
              signalDetectionsForStation,
              stationEventBeams,
              params
            )
          : createWeavessStation(
              station,
              selectedFilter,
              stationUiChannelSegments,
              signalDetectionsForStation,
              stationEventBeams,
              params
            );
      })
      .filter(notEmpty),
    selectedSortType
  );

  // Compare weavess stations sizes since maybeMutateDraft
  // doesn't pick up on stations added or hidden
  // or if the order has changed from the sort type changed
  if (
    !weavessStationsContainsChanges &&
    (existingWeavessStations.length !== weavessStations.length ||
      !weavessStations?.every((newStation, index) => {
        return newStation?.name === existingWeavessStations[index]?.name;
      }))
  ) {
    weavessStationsContainsChanges = true;
  }

  // Return the weavess station list sorted by station name
  return {
    stationsNeedsUpdating: weavessStationsContainsChanges,
    weavessStations
  };
}

/**
 * Initial split of station's default channel to return multiple channels in the case
 * where the station at the given time contains multiple channel segments
 *
 * @returns WeavessTypes.Station with split channels
 */
function splitWeavessDefaultChannel(
  station: WeavessTypes.Station,
  channelSegments: WeavessTypes.ChannelSegment[],
  signalDetections: Record<string, WeavessTypes.PickMarker[]>,
  distanceToEvent: EventTypes.LocationDistance | undefined,
  filterName: string,
  timeSecs: number,
  phase: string
): WeavessTypes.Station {
  return produce(station, draft => {
    draft.defaultChannel.splitChannelTime = timeSecs;
    draft.defaultChannel.splitChannelPhase = phase;
    draft.splitChannels = sortBy(channelSegments, channelSegment => {
      if (!isDataClaimCheck(channelSegment.dataSegments[0].data)) {
        return null;
      }
      const { data } = channelSegment.dataSegments[0];
      return data.startTimeSecs;
    }).map((channelSegment, index) => {
      const id = createSplitChannelId(draft, channelSegment, index);
      const channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor = JSON.parse(
        channelSegment.configuredInputName
      );
      const filteredSignalDetections =
        signalDetections[channelSegmentDescriptor?.channel?.name] || [];

      return createSplitChannel(
        id,
        draft,
        filterName,
        channelSegment,
        timeSecs,
        phase,
        distanceToEvent,
        filteredSignalDetections
      );
    });
  });
}

/**
 * Splits weavess station in the case where the station at the given time contains multiple channel segments.
 *
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 * @param stations the current array of weavess stations
 * @returns a split WeavessTypes.WeavessStation
 */
export function splitWeavessStation(
  params: CreateWeavessStationsParameters,
  station: WeavessTypes.Station
): WeavessTypes.Station {
  let stationID = params.splitStation.stationId;
  if (!stationID) {
    logger.error('Attempted to split station with no station id');
    stationID = '';
  }
  const filterName = getFilterName(params.channelFilters[stationID]);

  if (!station?.defaultChannel?.waveform?.channelSegmentsRecord?.[filterName]) return station;

  const channelSegments = station.defaultChannel.waveform.channelSegmentsRecord[filterName].filter(
    channelSegment => {
      return !!channelSegment.dataSegments.find(dataSegment => {
        if (isDataClaimCheck(dataSegment.data)) {
          const { startTimeSecs, endTimeSecs } = dataSegment.data;
          const splitStationTimeSecs = params.splitStation.timeSecs ?? 0;
          return splitStationTimeSecs >= startTimeSecs && splitStationTimeSecs <= endTimeSecs;
        }
        return false;
      });
    }
  );

  // Build a record of channel names to their signal detections
  const signalDetectionRecord: Record<string, WeavessTypes.PickMarker[]> =
    buildChannelNameToPickMarkerRecord(station, params.visibleStationSignalDetections);

  const distanceToEvent = params.distances
    ? params.distances.find(d => d.id === station.name)
    : undefined;

  if (channelSegments.length > 1 && params.splitStation.timeSecs && params.splitStation.phase) {
    return splitWeavessDefaultChannel(
      station,
      channelSegments,
      signalDetectionRecord,
      distanceToEvent,
      filterName,
      params.splitStation.timeSecs,
      params.splitStation.phase
    );
  }
  return station;
}

/**
 * Determine if we need to split the weavess stations for creating new signal detection
 *
 * @param stationId the station id to be split
 * @param timeSecs the time at which to attempt the split
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 * @param existingWeavessStations the current array of weavess stations
 * @returns true if we need to split
 */
export function determineSplitWeavessStations(
  stationId: string,
  timeSecs: number,
  channelFilters: Record<string, FilterTypes.Filter>,
  existingWeavessStations: WeavessTypes.Station[]
): boolean {
  const stationIndex = existingWeavessStations.findIndex(station => station.name === stationId);
  if (stationIndex < 0) return false;

  const station = existingWeavessStations[stationIndex];
  const filterName = getFilterName(channelFilters[stationId]);

  if (!station?.defaultChannel?.waveform?.channelSegmentsRecord?.[filterName]) return false;

  // find the channelSegments for timeSecs
  const channelSegments = station.defaultChannel.waveform.channelSegmentsRecord[filterName].filter(
    channelSegment => {
      return !!channelSegment.dataSegments.find(dataSegment => {
        if (isDataClaimCheck(dataSegment.data)) {
          const { startTimeSecs, endTimeSecs } = dataSegment.data;
          return timeSecs >= startTimeSecs && timeSecs <= endTimeSecs;
        }
        return false;
      });
    }
  );
  return channelSegments.length > 1;
}

/**
 * Gets the raw channel's channelSegments for the currently applied filter
 *
 * @param channelName Id of the channel
 * @param channelFilters Mapping of ids to filters
 * @param uiChannelSegments Raw or filtered channel segments for child channel
 *
 * @returns an object containing a channelSegmentId, list of channel segments, and the type of segment
 */
export function getChannelSegments(
  channelName: string,
  channelFilters: Record<string, FilterTypes.Filter>,
  uiChannelSegments: Record<string, Record<string, UiChannelSegment<WaveformTypes.Waveform>[]>>,
  uiTheme: ConfigurationTypes.UITheme
): {
  channelSegmentId: string;
  channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]>;
} {
  // Get the ChannelSegment map for the channel name from the Waveform Cache
  // The key to the map is the waveform filter name
  const channelSegments = (uiChannelSegments && uiChannelSegments[channelName]) ?? {};
  const channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
  Object.keys(channelSegments).forEach(filterId => {
    channelSegmentsRecord[filterId] = channelSegments[filterId].map(uiCs =>
      channelSegmentToWeavessChannelSegment(uiCs, {
        waveformColor: uiTheme.colors.waveformRaw,
        labelTextColor: uiTheme.colors.waveformFilterLabel
      })
    );
  });
  return { channelSegmentId: getFilterName(channelFilters[channelName]), channelSegmentsRecord };
}

/**
 * sort WeavessStations based on SortType
 *
 * @param stations WeavessStations
 * @param waveformSortType Alphabetical or by distance to selected event
 *
 * @returns sortedWeavessStations
 */
export function sortWaveformList(
  stations: WeavessTypes.Station[],
  waveformSortType: AnalystWorkspaceTypes.WaveformSortType
): WeavessTypes.Station[] {
  // apply sort based on sort type
  let sortedStations: WeavessTypes.Station[] = [];
  // Sort by distance if in global scan
  if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.distance) {
    sortedStations = sortBy<WeavessTypes.Station>(stations, [station => station.distance]);
  } else if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationNameAZ) {
    sortedStations = orderBy<WeavessTypes.Station>(stations, [station => station.name], ['asc']);
  } else if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationNameZA) {
    sortedStations = orderBy<WeavessTypes.Station>(stations, [station => station.name], ['desc']);
  }
  return sortedStations;
}
