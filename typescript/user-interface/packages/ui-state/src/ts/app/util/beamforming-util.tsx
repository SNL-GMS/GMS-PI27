import type {
  ChannelTypes,
  CommonTypes,
  FkTypes,
  WaveformTypes,
  WorkflowTypes
} from '@gms/common-model';
import { ArrayUtil, EventTypes, SignalDetectionTypes, StationTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import type {
  BeamDefinition,
  BeamDescription,
  BeamformingTemplate,
  BeamformingTemplatesByStationByPhase,
  BeamParameters
} from '@gms/common-model/lib/beamforming-templates/types';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import { createChannelSegmentString } from '@gms/common-model/lib/channel-segment/util';
import { findPreferredLocationSolution } from '@gms/common-model/lib/event';
import type { EntityReference, VersionReference } from '@gms/common-model/lib/faceted';
import type { Filter, FilterDefinition } from '@gms/common-model/lib/filter';
import { getFilterName } from '@gms/common-model/lib/filter';
import { findPhaseFeatureMeasurementValue } from '@gms/common-model/lib/signal-detection/util';
import type { ProcessingAnalystConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { SECONDS_IN_MINUTES, uniqSortStrings, uuid } from '@gms/common-util';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import { MaskAndBeamError } from '@gms/ui-wasm/lib/gms-interop/beam/mask-and-beam-error';
import type { ClientSideActionTrackerMessage } from '@gms/ui-workers';
import difference from 'lodash/difference';
import includes from 'lodash/includes';
import mean from 'lodash/mean';
import uniqWith from 'lodash/uniqWith';
import React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import type {
  ChannelFilterRecord,
  FilterDefinitionsRecord,
  SignalDetectionsRecord,
  UiChannelSegment
} from '../../types';
import { filter, type FilterDescriptor } from '../../workers/api/ui-filter-processor';
import type { MaskAndBeamWaveformResult } from '../../workers/waveform-worker/types';
import type { AddEventBeamsAndChannelsPayload } from '../api';
import { addEventBeamsAndChannels, addFkBeamsAndChannels, selectFilterDefinitions } from '../api';
import type { PredictFeatures } from '../api/data/event/predict-features-for-event-location';
import { useFetchBeamformingTemplatesQueryFunction } from '../hooks/beamforming-template-hooks';
import { useChannels, useRawChannels } from '../hooks/channel-hooks';
import {
  useGetStationRawUnfilteredUiChannelSegments,
  useSetSelectedWaveformsByChannelSegmentDescriptorIds
} from '../hooks/channel-segment-hooks';
import {
  prepareReceiverCollection,
  usePredictFeaturesForEventLocationFunction
} from '../hooks/predict-features-for-event-location-hooks';
import { useProcessingAnalystConfiguration } from '../hooks/processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from '../hooks/react-redux-hooks';
import { useSignalDetections } from '../hooks/signal-detection-hooks';
import { useFindFilterByUsage } from '../hooks/signal-enhancement-configuration-hooks';
import { useVisibleStations } from '../hooks/station-definition-hooks';
import { useStageId } from '../hooks/workflow-hooks';
import { inputChannelsByPrioritization, InvalidChannelsError } from '../processing';
import { reportBeamformingErrors } from '../processing/beamforming';
import {
  validateArrivalTime,
  validateAzimuth,
  validateBeamformingChannelsMatchStations,
  validateBeamformingTemplate,
  validateEventHypothesis,
  validateFeaturePredictions,
  validateInterval,
  validateIntervalId,
  validateMinimumNumberOfChannels,
  validateSlowness
} from '../processing/beamforming/beamforming-validation';
import {
  BeamformingAlgorithmError,
  BeamformingError,
  BeamformingFilterError,
  BeamformingInvalidChannelsError,
  BeamformingUnknownError,
  BeamformingWithStationChannelsError
} from '../processing/beamforming/errors';
import {
  analystActions,
  selectCurrentPhase,
  selectOpenEvent,
  selectOpenIntervalName,
  selectSelectedWaveforms,
  selectUsername,
  selectWorkflowTimeRange
} from '../state';
import { selectChannelFilters } from '../state/waveform/selectors';
import { designFiltersAndGetUpdatedFilterDefinitions } from './filtering-utils';
import { maskAndBeamWaveforms } from './ui-beam-processor';
import { useCreateProcessingMasks } from './ui-waveform-masking-util';
import { mergeUiChannelSegments } from './util';

export interface CreateEventBeamUserInput {
  phase: string;
  summationMethod: string;
  samplingMethod: string;
  arrivalTimeLead: number;
  beamDuration: number;
  preFilter?: FilterDefinition;
  selectedStations?: StationTypes.Station[];
  selectedChannels?: ChannelTypes.Channel[];
}

export interface AddBeamsAndChannelsResult {
  readonly beamedChannelSegment: UiChannelSegment<WaveformTypes.Waveform>;
  readonly beamedChannel: ChannelTypes.Channel;
  readonly filteredChannelSegment?: UiChannelSegment<WaveformTypes.Waveform>;
  readonly filteredChannel?: ChannelTypes.Channel;
  readonly filterName?: string;
}

/**
 * helper function to filter the event beam returned from maskAndBeamWaveforms
 */
const filterMaskAndBeamWaveformResult = async (
  maskAndBeamWaveformResult: MaskAndBeamWaveformResult,
  beamFilter: Filter,
  processingAnalystConfiguration: ProcessingAnalystConfiguration,
  cachedFilterDefinitions: FilterDefinitionsRecord,
  channelFilter: Filter
): Promise<AddBeamsAndChannelsResult> => {
  const {
    defaultTaper,
    defaultRemoveGroupDelay,
    defaultSampleRateToleranceHz,
    defaultGroupDelaySecs
  } = processingAnalystConfiguration.gmsFilters;
  const { channel, uiChannelSegment } = maskAndBeamWaveformResult;
  const filtersBySampleRate = await designFiltersAndGetUpdatedFilterDefinitions(
    maskAndBeamWaveformResult.channel.name,
    beamFilter,
    [maskAndBeamWaveformResult.uiChannelSegment],
    cachedFilterDefinitions,
    {
      groupDelaySecs: defaultGroupDelaySecs,
      sampleRateToleranceHz: defaultSampleRateToleranceHz,
      taper: defaultSampleRateToleranceHz,
      removeGroupDelay: defaultRemoveGroupDelay
    },
    error => {
      throw new BeamformingFilterError(
        error,
        maskAndBeamWaveformResult,
        beamFilter,
        processingAnalystConfiguration,
        cachedFilterDefinitions,
        channelFilter
      );
    }
  ).catch(error => {
    throw new BeamformingFilterError(
      error,
      maskAndBeamWaveformResult,
      beamFilter,
      processingAnalystConfiguration,
      cachedFilterDefinitions,
      channelFilter
    );
  });

  const filterDescriptor: FilterDescriptor = {
    channel,
    filterSegments: [
      {
        uiChannelSegment,
        filter: beamFilter,
        filtersBySampleRate: filtersBySampleRate[getFilterName(beamFilter)]
      }
    ]
  };

  const filterResult = await filter(filterDescriptor, defaultTaper, defaultRemoveGroupDelay).catch(
    error => {
      throw new BeamformingFilterError(
        `${error.message}`,
        maskAndBeamWaveformResult,
        beamFilter,
        processingAnalystConfiguration,
        cachedFilterDefinitions,
        channelFilter
      );
    }
  );

  if (filterResult[0].status === 'fulfilled') {
    return {
      beamedChannel: channel,
      beamedChannelSegment: uiChannelSegment,
      filteredChannelSegment: filterResult[0].value.uiChannelSegment,
      filteredChannel: filterResult[0].value.channel,
      filterName: channelFilter.namedFilter || channelFilter.filterDefinition?.name || ''
    };
  }
  throw new BeamformingFilterError(
    `${filterResult[0].reason}`,
    maskAndBeamWaveformResult,
    beamFilter,
    processingAnalystConfiguration,
    cachedFilterDefinitions,
    channelFilter
  );
};

/**
 * Helper function to process the promises returned by maskAndBeamWaveforms
 * @param promises
 * @param processingAnalystConfiguration
 * @param cachedFilterDefinitions
 * @param findFilterByUsage
 * @param channelFilters
 * @returns
 */
const handleMaskAndBeamWaveformPromises = async (
  promises: PromiseSettledResult<MaskAndBeamWaveformResult>[],
  processingAnalystConfiguration: ProcessingAnalystConfiguration,
  cachedFilterDefinitions: FilterDefinitionsRecord,
  findFilterByUsage: (
    channelFilter: Filter,
    stationOrChannelName: string,
    uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>
  ) => Filter | undefined,
  channelFilters: ChannelFilterRecord
): Promise<{ results: AddBeamsAndChannelsResult[]; errors: BeamformingError[] }> => {
  const results: AddBeamsAndChannelsResult[] = [];
  const errors: BeamformingError[] = [];
  await Promise.all(
    promises.map(async promise => {
      if (promise.status === 'fulfilled' && promise.value !== undefined) {
        const { channel, uiChannelSegment } = promise.value;
        const channelFilter = channelFilters[channel.station.name];
        const beamFilter = findFilterByUsage(channelFilter, channel.station.name, uiChannelSegment);

        const resultObject: AddBeamsAndChannelsResult = {
          beamedChannelSegment: uiChannelSegment,
          beamedChannel: channel
        };
        if (beamFilter) {
          results.push(
            await filterMaskAndBeamWaveformResult(
              promise.value,
              beamFilter,
              processingAnalystConfiguration,
              cachedFilterDefinitions,
              channelFilter
            ).catch(error => {
              throw new BeamformingWithStationChannelsError(
                `Failed to filter mask and beam waveform. ${error.message}`,
                undefined,
                [channel]
              );
            })
          );

          // if filtering failed push the base results object
          results.push(resultObject);
        } else {
          results.push(resultObject);
        }
      } else if (promise.status === 'rejected') {
        errors.push(promise.reason);
      }
    })
  );

  return { results, errors };
};

/**
 * Creates a beam definition by building the BeamParameters and combining them with the BeamDescription
 *
 * @param eventHypothesisId The open EventHypothesis, populated as an id-only instance.
 * @param beamformingTemplate The template matching this station/phase pair
 * @param channels the channels (expected to already be validated as belonging to the provided station)
 * @param slownessSecPerDeg feature measurement value
 * @param receiverToSourceAzimuthDeg feature measurement value
 * @param signalDetectionHypothesis
 * @returns beamDefinition
 */
export function generateBeamDefinition(
  eventHypothesisId: EventTypes.EventHypothesisId,
  beamformingTemplate: BeamformingTemplate,
  beamDescription: BeamDescription,
  channels: ChannelTypes.Channel[],
  slownessSecPerDeg?: number,
  receiverToSourceAzimuthDeg?: number,
  signalDetectionHypothesis?: SignalDetectionTypes.SignalDetectionHypothesis
): BeamDefinition {
  const orientationAngles: ChannelTypes.OrientationAngles[] = [];
  channels.forEach(channel => {
    if (channel.orientationAngles) orientationAngles.push(channel.orientationAngles);
  });

  // Removes possible undefined values
  const horizontalAngleDeg = mean(
    orientationAngles.map(o => o.horizontalAngleDeg).filter(ArrayUtil.notEmpty)
  );
  const verticalAngleDeg = mean(
    orientationAngles.map(o => o.verticalAngleDeg).filter(ArrayUtil.notEmpty)
  );
  const sampleRateHz = mean(channels.map(c => c.nominalSampleRateHz).filter(ArrayUtil.notEmpty));

  const beamParameters: BeamParameters = {
    eventHypothesis: { id: eventHypothesisId },
    minWaveformsToBeam: beamformingTemplate.minWaveformsToBeam,
    orientationAngles: { horizontalAngleDeg, verticalAngleDeg },
    orientationAngleToleranceDeg: beamformingTemplate.orientationAngleToleranceDeg,
    receiverToSourceAzimuthDeg,
    sampleRateHz,
    sampleRateToleranceHz: beamformingTemplate.sampleRateToleranceHz,
    slownessSecPerDeg,
    signalDetectionHypothesis
  };
  const beamDefinition: BeamDefinition = {
    beamDescription,
    beamParameters
  };
  return beamDefinition;
}

/**
 * Returns the associated stations containing the provided phase
 * {@link SignalDetectionTypes.SignalDetection} for the provided {@link EventTypes.Event}.
 *
 * @param event the {@link EventTypes.Event} to get the associated stations
 * @param openIntervalName the current open interval name
 * @param phase the phase used for looking up the stations
 * @param signalDetections a {@link SignalDetectionsRecord} for looking up the hypothesis
 * @returns the associated stations
 */
const getAssociatedStations = (
  event: EventTypes.Event | undefined,
  openIntervalName: string,
  phase: string,
  signalDetections: SignalDetectionsRecord
): string[] => {
  const currentEventHypothesis = EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openIntervalName
  );

  return (
    currentEventHypothesis?.associatedSignalDetectionHypotheses
      .map(sdHypo => {
        const sd = signalDetections[sdHypo.id.signalDetectionId];
        const hypothesis = sd?.signalDetectionHypotheses.find(sdh => sdh.id.id === sdHypo.id.id);
        if (!hypothesis || hypothesis?.deleted) return undefined;
        const fmPhaseValue = findPhaseFeatureMeasurementValue(hypothesis.featureMeasurements);
        return fmPhaseValue?.value === phase ? hypothesis.station.name : undefined;
      })
      .filter(ArrayUtil.notEmpty) ?? []
  );
};

/**
 * Consolidates the selected {@link StationTypes.Station}s and selected
 * {@link ChannelTypes.Channel}s and ensures uniqueness.
 *
 * @param selectedStations list of the selected station names
 * @param selectedChannels list of the selected channel names
 * @param visibleStations list of all visible stations
 * @returns the {@link StationTypes.Station}s and {@link ChannelTypes.Channel}s
 */
export function consolidateSelectedStationsAndChannels(
  selectedStations: StationTypes.Station[],
  selectedChannels: ChannelTypes.Channel[],
  visibleStations: StationTypes.Station[]
): [StationTypes.Station[], ChannelTypes.Channel[]] {
  const channels = selectedChannels || [];

  const uniqWithStation = (a: StationTypes.Station, b: StationTypes.Station) => a.name === b.name;

  const selectedStationNamesByChannels = selectedChannels.map(channel => channel.station.name);
  const selectedStationsByChannels = uniqWith(
    visibleStations.filter(station => includes(selectedStationNamesByChannels, station.name)),
    uniqWithStation
  );

  let stations: StationTypes.Station[] = [];
  if (selectedStations.length > 0) {
    stations = uniqWith([...selectedStations, ...selectedStationsByChannels], uniqWithStation);
  } else if (selectedChannels.length > 0) {
    stations = selectedStationsByChannels;
  } else {
    stations = visibleStations;
  }

  return [stations, channels];
}

const SKIPPING_SUMMARY = 'Skipping event beam computation';
const NO_VALID_STATIONS = 'No valid stations for event beaming';

/**
 * Maybe get a message (to toast) based on which stations were filtered out (and why stations were filtered out)
 */
function getBeamMessageAfterFilteringOutStation(
  stations: StationTypes.Station[],
  stationNames: string[],
  filteredStationNames: string[],
  filteredStations: StationTypes.Station[],
  filteredAssociatedSignalDetections: boolean,
  filteredNonArrayStations: boolean,
  phase: string
): Message | null {
  if (filteredStations.length === 0) {
    if (filteredAssociatedSignalDetections && filteredNonArrayStations) {
      return {
        summary: NO_VALID_STATIONS,
        details: `All selected stations already have associated signal detections for phase ${phase} or are non-array stations.`,
        intent: 'danger'
      };
    }
    if (filteredAssociatedSignalDetections) {
      return {
        summary: NO_VALID_STATIONS,
        details: `All selected stations already have associated signal detections for phase ${phase}.`,
        intent: 'danger'
      };
    }
    if (filteredNonArrayStations) {
      return {
        summary: NO_VALID_STATIONS,
        details: `All selected stations are non-array stations.`,
        intent: 'danger'
      };
    }
  } else if (filteredStations.length !== stations.length) {
    const removed = uniqSortStrings(difference(stationNames, filteredStationNames)).join(', ');
    let details: string | null = null;
    if (filteredAssociatedSignalDetections && filteredNonArrayStations) {
      details = `These selected stations already have associated signal detections for phase ${phase} or are non-array stations: ${removed}.`;
    } else if (filteredAssociatedSignalDetections) {
      details = `These selected stations already have associated signal detections for phase ${phase}: ${removed}.`;
    } else if (filteredNonArrayStations) {
      details = `These selected stations are non-array stations: ${removed}.`;
    }
    return details ? { summary: SKIPPING_SUMMARY, details } : null;
  }
  return null;
}

/**
 * Filters the provided collection of {@link StationTypes.Station}s and {@link ChannelTypes.Channels}s for creating event beams;
 * returns a collection of {@link StationTypes.Station}s and {@link ChannelTypes.Channels}s
 * such that each {@link StationTypes.Station} and {@link ChannelTypes.Channels} does not currently have a
 * {@link SignalDetectionTypes.PhaseTypeFeatureMeasurement} associated to the phase parameter and is not an array
 * {@link StationTypes.Station}.
 *
 * @param selectedStations list of the selected station names
 * @param selectedChannels list of the selected channel names
 * @param visibleStations list of all visible stations
 * @param signalDetections to find hypothesis
 * @param event the current opened event
 * @param openIntervalName to find current event hypothesis
 * @param phase used to filter out stations
 * @returns the filtered stations, channels, and the reason for filtering
 */
export function filterSelectedStationsAndChannelsForCreateEventBeams(
  selectedStations: StationTypes.Station[],
  selectedChannels: ChannelTypes.Channel[],
  visibleStations: StationTypes.Station[],
  signalDetections: SignalDetectionsRecord,
  event: EventTypes.Event | undefined,
  openIntervalName: string,
  phase: string
): [StationTypes.Station[], ChannelTypes.Channel[], boolean, boolean, Message | null] {
  const [stations, channels] = consolidateSelectedStationsAndChannels(
    selectedStations,
    selectedChannels,
    visibleStations
  );
  const stationsFromAssociatedSds = getAssociatedStations(
    event,
    openIntervalName,
    phase,
    signalDetections
  );

  const stationNames = stations.map(station => station.name);

  let filteredAssociatedSignalDetections = false;
  let filteredNonArrayStations = false;

  const filteredStations = stations
    // filter associated signal detections with the same phase
    .filter(station => {
      if (!includes(stationsFromAssociatedSds, station.name)) {
        return true;
      }
      filteredAssociatedSignalDetections = true;
      return false;
    })
    // filter non-array stations
    .filter(station => {
      if (
        station.type === StationTypes.StationType.HYDROACOUSTIC_ARRAY ||
        station.type === StationTypes.StationType.INFRASOUND_ARRAY ||
        station.type === StationTypes.StationType.SEISMIC_ARRAY
      ) {
        return true;
      }
      filteredNonArrayStations = true;
      return false;
    });

  const filteredStationNames = filteredStations.map(station => station.name);
  const filteredChannels = channels.filter(channel =>
    includes(filteredStationNames, channel.station.name)
  );

  return [
    filteredStations,
    filteredChannels,
    filteredAssociatedSignalDetections,
    filteredNonArrayStations,
    getBeamMessageAfterFilteringOutStation(
      stations,
      stationNames,
      filteredStationNames,
      filteredStations,
      filteredAssociatedSignalDetections,
      filteredNonArrayStations,
      phase
    )
  ];
}

/**
 * Helper function to find the beamforming template
 * split out due to complexity
 *
 * @param beamformingTemplates
 * @param station
 * @param phase
 * @return BeamformingTemplate for the station or undefined if none is found
 */
export function getBeamformingTemplateForStation(
  beamformingTemplates: BeamformingTemplatesByStationByPhase | undefined,
  station: StationTypes.Station | VersionReference<'name'> | EntityReference<'name'>,
  phase: string
): BeamformingTemplate | undefined {
  if (
    beamformingTemplates === undefined ||
    beamformingTemplates[station.name] === undefined ||
    beamformingTemplates[station.name][phase] === undefined
  ) {
    return undefined;
  }
  return beamformingTemplates[station.name][phase];
}

/**
 * Gets values for slownessSecPerDeg and receiverToSourceAzimuthDeg from featurePredictionResponse
 *
 * @param featurePredictionResponse
 * @param stationName name of station
 * @param phase name of phase
 * @returns object containing slownessSecPerDeg, receiverToSourceAzimuthDeg
 */
function getSlownessAndAzimuthFromFeaturePredictionResponse(
  featurePredictionResponse: PredictFeatures,
  stationName: string,
  phase: string
) {
  const predictions = featurePredictionResponse?.receiverLocationsByName[
    stationName
  ]?.featurePredictions?.filter(fp => fp.phase === phase);

  const slownessSecPerDeg: SignalDetectionTypes.NumericMeasurementValue | undefined =
    predictions?.find(
      fp => fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.SLOWNESS
    )?.predictionValue.predictedValue as SignalDetectionTypes.NumericMeasurementValue;

  const receiverToSourceAzimuthDeg: SignalDetectionTypes.NumericMeasurementValue | undefined =
    predictions?.find(
      fp =>
        fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.RECEIVER_TO_SOURCE_AZIMUTH
    )?.predictionValue.predictedValue as SignalDetectionTypes.NumericMeasurementValue;

  return { slownessSecPerDeg, receiverToSourceAzimuthDeg };
}

/** hook that prepares the data for calling, {@link createEventBeams } */
function usePrepareForCreateEventBeams() {
  const stageId = useStageId();
  const currentInterval = useAppSelector(selectWorkflowTimeRange);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const signalDetections = useSignalDetections();
  const visibleStations = useVisibleStations();
  const currentOpenEvent = useAppSelector(selectOpenEvent);

  const predictFeatures = usePredictFeaturesForEventLocationFunction();
  const fetchBeamformingTemplates = useFetchBeamformingTemplatesQueryFunction();

  return React.useCallback(
    async function prepareForCreateEventBeams(
      params: CreateEventBeamUserInput
    ): Promise<
      [
        StationTypes.Station[],
        ChannelTypes.Channel[],
        CommonTypes.TimeRange,
        WorkflowTypes.IntervalId,
        EventTypes.EventHypothesis,
        PredictFeatures,
        BeamformingTemplatesByStationByPhase
      ]
    > {
      const { phase, selectedStations, selectedChannels } = params;

      validateIntervalId(stageId);
      validateInterval(currentInterval);

      const [filteredStations, filteredChannels] =
        filterSelectedStationsAndChannelsForCreateEventBeams(
          selectedStations ?? [],
          selectedChannels ?? [],
          visibleStations,
          signalDetections,
          currentOpenEvent,
          openIntervalName,
          phase
        );

      const currentEventHypothesis =
        EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
          currentOpenEvent,
          openIntervalName
        );

      validateEventHypothesis(currentOpenEvent, currentEventHypothesis);

      const preferredLocationSolution = findPreferredLocationSolution(
        currentEventHypothesis.id.hypothesisId,
        currentOpenEvent?.eventHypotheses || []
      );

      const featurePredictionResponse = await predictFeatures({
        receivers: prepareReceiverCollection(undefined, filteredStations),
        sourceLocation: preferredLocationSolution?.location,
        phases: [phase]
      }).catch(() => {
        /* the validateFeaturePredictions will throw an error for missing feature predictions */
        return undefined;
      });

      validateFeaturePredictions(
        currentOpenEvent,
        currentEventHypothesis,
        featurePredictionResponse
      );

      const beamformingTemplates = await fetchBeamformingTemplates({
        beamType: BeamType.EVENT,
        stations: filteredStations,
        phases: [phase]
      }).catch(() => {
        /* the validateBeamformingTemplate will throw an error for any missing template */
        return undefined;
      });

      validateBeamformingChannelsMatchStations(filteredChannels, filteredStations);

      return [
        filteredStations,
        filteredChannels,
        currentInterval,
        stageId,
        currentEventHypothesis,
        featurePredictionResponse,
        beamformingTemplates ?? {}
      ];
    },
    [
      currentInterval,
      currentOpenEvent,
      fetchBeamformingTemplates,
      openIntervalName,
      predictFeatures,
      signalDetections,
      stageId,
      visibleStations
    ]
  );
}

/** returns a {@link ClientSideActionTrackerMessage} that is used to track the progress of a beaming operation */
function getBeamformingTrackRequest(
  id: string,
  stations: StationTypes.Station[],
  phase: string,
  message: 'REQUEST_INITIATED' | 'REQUEST_COMPLETED',
  errors?: BeamformingError[]
): ClientSideActionTrackerMessage[] {
  const plural = stations.length === 1 ? '' : 's';
  const stationPhaseName = stations.map(station => `${station.name}-${phase}`);
  return [
    {
      id: `event-beam-${id}`,
      message,
      clientAction:
        stations.length > 3
          ? `Event beam ${stationPhaseName.length} stations`
          : `Event beam station${plural}: ${stationPhaseName.join(', ')}`,
      error:
        errors && errors.length > 0 ? errors.map(error => error.message).join('; ') : undefined,
      actionType: 'CLIENT_SIDE_ACTION'
    }
  ];
}

/**
 * Generates an event beam based on current configurations. Hook wrapper for
 * createEventBeams to allow access to state. Calls maskAndBeamWaveforms to generate the event beams.
 *
 * @returns a callback function that creates event beams:
 */
export function useCreateEventBeams(): (
  params: CreateEventBeamUserInput
) => Promise<[AddEventBeamsAndChannelsPayload, BeamformingError[]]> {
  const createProcessingMasks = useCreateProcessingMasks();
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const expandedTimeBuffer =
    processingAnalystConfiguration.beamforming.expandedTimeBuffer || SECONDS_IN_MINUTES;
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const rawChannels = useRawChannels();
  const username = useAppSelector(selectUsername);
  const getStationRawUnfilteredUiChannelSegments = useGetStationRawUnfilteredUiChannelSegments();

  const dispatch = useDispatch();

  /** filterDefs grab filters by sample rate using filter name. */
  const cachedFilterDefinitions: FilterDefinitionsRecord = useAppSelector(selectFilterDefinitions);

  /** call to get filter */
  const findFilterByUsage = useFindFilterByUsage();

  /** get filter for station name to pass into findFilterByUsage */
  const channelFilters = useAppSelector(selectChannelFilters);

  const prepareForCreateEventBeams = usePrepareForCreateEventBeams();

  return React.useCallback(
    async function createEventBeams(
      params: CreateEventBeamUserInput
    ): Promise<[AddEventBeamsAndChannelsPayload, BeamformingError[]]> {
      const { phase, summationMethod, samplingMethod } = params;
      const { arrivalTimeLead, beamDuration, preFilter } = params;
      const results: AddBeamsAndChannelsResult[] = [];
      const errors: BeamformingError[] = [];

      const [
        filteredStations,
        filteredChannels,
        currentInterval,
        stageId,
        currentEventHypothesis,
        featurePredictionResponse,
        beamformingTemplates
      ] = await prepareForCreateEventBeams(params);

      const id = uuid.asString();
      dispatch(
        analystActions.trackPendingRequests(
          getBeamformingTrackRequest(id, filteredStations, phase, 'REQUEST_INITIATED')
        )
      );

      await Promise.allSettled(
        filteredStations.map(async station => {
          const beamformingTemplate = getBeamformingTemplateForStation(
            beamformingTemplates,
            station,
            phase
          );

          validateBeamformingTemplate(station, beamformingTemplate);

          let channels: ChannelTypes.Channel[] = [];
          if (filteredStations?.length === 1 && filteredChannels && filteredChannels.length > 0) {
            channels = filteredChannels;
          } else {
            channels = rawChannels.filter(
              rawChannel =>
                beamformingTemplate.inputChannels.findIndex(
                  inputChannel => inputChannel.name === rawChannel.name
                ) !== -1
            );
            channels = inputChannelsByPrioritization(
              channels,
              processingAnalystConfiguration.beamAndFkInputChannelPrioritization,
              beamformingTemplate.minWaveformsToBeam
            );
          }

          validateMinimumNumberOfChannels(station, channels, beamformingTemplate);

          const { featurePredictions } =
            featurePredictionResponse.receiverLocationsByName[station.name];

          const arrivalTime = featurePredictions.find(
            featurePrediction =>
              featurePrediction.phase === phase &&
              featurePrediction.predictionType ===
                SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
          )?.predictionValue?.predictedValue;

          validateArrivalTime(
            arrivalTime,
            station,
            currentOpenEvent,
            currentEventHypothesis,
            phase
          );

          const beamStartTime: number = arrivalTime.arrivalTime.value - arrivalTimeLead;
          const beamEndTime: number = beamStartTime + beamDuration;
          const beamDescription: BeamDescription = {
            ...beamformingTemplate.beamDescription,
            beamSummation: summationMethod,
            samplingType: samplingMethod,
            preFilterDefinition: preFilter,
            phase,
            beamType: BeamType.EVENT
          };

          const predictions = getSlownessAndAzimuthFromFeaturePredictionResponse(
            featurePredictionResponse,
            station.name,
            phase
          );

          validateAzimuth(
            predictions.receiverToSourceAzimuthDeg,
            station,
            currentOpenEvent,
            currentEventHypothesis,
            phase
          );

          validateSlowness(
            predictions.slownessSecPerDeg,
            station,
            currentOpenEvent,
            currentEventHypothesis,
            phase
          );

          const beamDefinition = generateBeamDefinition(
            currentEventHypothesis?.id,
            beamformingTemplate,
            beamDescription,
            channels,
            predictions.slownessSecPerDeg.measuredValue.value,
            predictions.receiverToSourceAzimuthDeg.measuredValue.value
          );

          const stationUiChannelSegments = await getStationRawUnfilteredUiChannelSegments(
            station
          ).catch(error => {
            throw new BeamformingWithStationChannelsError(
              `Failed to retrieve raw unfiltered UiChannelSegments. ${error.message}`,
              station,
              channels
            );
          });
          const channelSegments = Object.values(stationUiChannelSegments)
            .map(uiCSList => (uiCSList.length > 0 ? mergeUiChannelSegments(uiCSList) : undefined))
            .filter(notEmpty);

          return maskAndBeamWaveforms({
            beamDefinition,
            beamStartTime,
            beamEndTime,
            station,
            channels,
            channelSegments,
            createProcessingMasks,
            expandedTimeBuffer,
            currentInterval
          }).catch(error => {
            if (error instanceof MaskAndBeamError) {
              throw new BeamformingAlgorithmError(error, error.props.station);
            }
            if (error instanceof InvalidChannelsError) {
              throw new BeamformingInvalidChannelsError(error);
            }
            if (error instanceof BeamformingError) {
              throw error;
            }
            throw new BeamformingWithStationChannelsError(
              `Failed to mask and beam waveforms. ${error.message}`,
              station,
              channels
            );
          });
        })
      )
        .then(async promises => {
          const promiseResult = await handleMaskAndBeamWaveformPromises(
            promises,
            processingAnalystConfiguration,
            cachedFilterDefinitions,
            findFilterByUsage,
            channelFilters
          ).catch(error => {
            if (error instanceof MaskAndBeamError) {
              throw new BeamformingAlgorithmError(error, error.props.station);
            }
            if (error instanceof InvalidChannelsError) {
              throw new BeamformingInvalidChannelsError(error);
            }
            if (error instanceof BeamformingError) {
              throw error;
            }
            throw new BeamformingUnknownError(
              new Error(`Failed to mask and beam waveforms. ${error.message}`, error)
            );
          });

          results.push(...promiseResult.results);
          errors.push(...promiseResult.errors);
        })
        .finally(() => {
          dispatch(
            analystActions.trackCompletedRequests(
              getBeamformingTrackRequest(id, filteredStations, phase, 'REQUEST_COMPLETED', errors)
            )
          );
        });

      return [
        {
          username,
          openIntervalName,
          stageId,
          eventId: currentEventHypothesis.id.eventId,
          eventHypothesisId: currentEventHypothesis.id.hypothesisId,
          results,
          phase
        },
        errors
      ];
    },
    [
      prepareForCreateEventBeams,
      username,
      openIntervalName,
      dispatch,
      currentOpenEvent,
      getStationRawUnfilteredUiChannelSegments,
      createProcessingMasks,
      expandedTimeBuffer,
      rawChannels,
      processingAnalystConfiguration,
      cachedFilterDefinitions,
      findFilterByUsage,
      channelFilters
    ]
  );
}

/**
 * Generates an event beam based on current configurations. Hook wrapper for
 * createPreconfiguredEventBeams to allow access to state. Calls
 * maskAndBeamWaveforms to generate the event beams.
 *
 * @returns a callback function that creates the preconfigured event beams for provided stations and phases:
 * (selectedStations: StationTypes.Station[], selectedChannels?: ChannelTypes.Channel[]) => void
 */
export function useCreatePreconfiguredEventBeams(): (
  selectedStations: StationTypes.Station[],
  selectedChannels?: ChannelTypes.Channel[]
) => Promise<void> {
  const createEventBeams = useCreateEventBeams();
  const phase = useAppSelector(selectCurrentPhase);
  const fetchBeamformingTemplates = useFetchBeamformingTemplatesQueryFunction();
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);
  const setSelectedWaveforms = useSetSelectedWaveformsByChannelSegmentDescriptorIds();

  const dispatch = useDispatch();

  return React.useCallback(
    async function createPreconfiguredEventBeams(
      selectedStations: StationTypes.Station[],
      selectedChannels?: ChannelTypes.Channel[]
    ) {
      const beamformingTemplates = await fetchBeamformingTemplates({
        beamType: BeamType.EVENT,
        stations: selectedStations,
        phases: [phase]
      });

      if (selectedStations.length > 1 && selectedChannels?.length && selectedChannels?.length > 0) {
        const msg =
          'Cannot create preconfigured event beam. Channel selection requires a single station to be selected.';
        toast.error(msg, { toastId: msg });
        return;
      }

      await Promise.all(
        selectedStations.map(async station => {
          const beamformingTemplate = getBeamformingTemplateForStation(
            beamformingTemplates,
            station,
            phase
          );

          validateBeamformingTemplate(station, beamformingTemplate);

          return createEventBeams({
            phase,
            summationMethod: beamformingTemplate.beamDescription.beamSummation,
            samplingMethod: beamformingTemplate.beamDescription.samplingType,
            arrivalTimeLead: beamformingTemplate.leadDuration ?? 0,
            beamDuration: beamformingTemplate.beamDuration ?? 0,
            // TODO: enable preFilter after implementation of Wasm.BaseFilterDefinition
            preFilter: undefined,
            selectedStations: [station],
            selectedChannels: selectedStations.length === 1 ? selectedChannels : []
          });
        })
      ).then(results => {
        const payloads: Record<string, AddEventBeamsAndChannelsPayload> = {};
        const errors: Record<string, BeamformingError[]> = {};
        results.forEach(([payload, error]) => {
          payloads[payload.eventId] = {
            ...payload,
            results: [...(payloads[payload.eventId]?.results ?? []), ...payload.results]
          };
          errors[payload.eventId] = [...(errors[payload.eventId] ?? []), ...error];
        });

        Object.keys(payloads).forEach(key => {
          dispatch(addEventBeamsAndChannels(payloads[key]));
          reportBeamformingErrors(errors[key]);
          // update selected waveforms in case a selected beam was deleted
          if (!!selectedWaveforms && !!results) {
            setSelectedWaveforms(
              Object.values(selectedWaveforms).flatMap(csd => createChannelSegmentString(csd))
            );
          }
        });
      });
    },
    [
      fetchBeamformingTemplates,
      phase,
      createEventBeams,
      dispatch,
      selectedWaveforms,
      setSelectedWaveforms
    ]
  );
}

/**
 * Generates an FK beam based on current configurations. Hook wrapper for
 * createFkBeams to allow access to state. Calls
 * maskAndBeamWaveforms to generate the FK beams.
 *
 * @returns a callback function that creates FK beams:
 */
export function useCreateFkBeam(): (
  signalDetection: SignalDetectionTypes.SignalDetection,
  measuredValues: FkTypes.AzimuthSlownessValues,
  station: StationTypes.Station,
  fkInputChannels: EntityReference<'name', ChannelTypes.Channel>[],
  uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
) => Promise<void> {
  const dispatch = useAppDispatch();

  const currentInterval = useAppSelector(selectWorkflowTimeRange);
  const currentPhase = useAppSelector(selectCurrentPhase);
  const fetchBeamformingTemplates = useFetchBeamformingTemplatesQueryFunction();
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const createProcessingMasks = useCreateProcessingMasks();
  const populatedChannels = useChannels();

  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const expandedTimeBuffer =
    processingAnalystConfiguration.beamforming.expandedTimeBuffer || SECONDS_IN_MINUTES;

  /** filterDefs grab filters by sample rate using filter name. */
  const cachedFilterDefinitions: FilterDefinitionsRecord = useAppSelector(selectFilterDefinitions);

  /** call to get filter */
  const findFilterByUsage = useFindFilterByUsage();

  /** get filter for station name to pass into findFilterByUsage */
  const channelFilters = useAppSelector(selectChannelFilters);

  return React.useCallback(
    async function createFKBeam(
      signalDetection: SignalDetectionTypes.SignalDetection,
      measuredValues: FkTypes.AzimuthSlownessValues,
      station: StationTypes.Station,
      fkInputChannels: EntityReference<'name', ChannelTypes.Channel>[],
      uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[]
    ) {
      const phase = SignalDetectionTypes.Util.findSignalDetectionPhase(signalDetection);

      const channels: ChannelTypes.Channel[] = [];
      fkInputChannels.forEach(entityRefChannel => {
        const channel = populatedChannels.find(
          fullChannel => fullChannel.name === entityRefChannel.name
        );
        if (channel) {
          channels.push(channel);
        }
      });

      const beamformingTemplates = await fetchBeamformingTemplates({
        beamType: BeamType.FK,
        stations: [signalDetection.station],
        phases: [phase]
      });

      const beamformingTemplate = getBeamformingTemplateForStation(
        beamformingTemplates,
        signalDetection.station,
        currentPhase
      );

      validateBeamformingTemplate(signalDetection.station, beamformingTemplate);

      validateInterval(currentInterval);

      const currentEventHypothesis =
        EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
          currentOpenEvent,
          openIntervalName
        );

      validateEventHypothesis(currentOpenEvent, currentEventHypothesis);

      const currentSdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetection.signalDetectionHypotheses
      );

      const arrivalTime = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );

      const beamStartTime: number =
        arrivalTime.measurementValue.arrivalTime.value - (beamformingTemplate.leadDuration ?? 0);
      const beamEndTime: number = beamStartTime + (beamformingTemplate.beamDuration ?? 0);

      const beamDefinition = generateBeamDefinition(
        currentEventHypothesis?.id,
        beamformingTemplate,
        beamformingTemplate.beamDescription,
        channels,
        measuredValues.slowness,
        measuredValues.azimuth,
        currentSdHypothesis
      );

      Promise.allSettled([
        maskAndBeamWaveforms({
          beamDefinition,
          beamStartTime,
          beamEndTime,
          station,
          channels,
          channelSegments: uiChannelSegments,
          createProcessingMasks,
          expandedTimeBuffer,
          currentInterval
        })
      ])
        .then(async promises => {
          const promiseResult = await handleMaskAndBeamWaveformPromises(
            promises,
            processingAnalystConfiguration,
            cachedFilterDefinitions,
            findFilterByUsage,
            channelFilters
          );

          const { results, errors } = promiseResult;

          if (errors.length > 0) {
            reportBeamformingErrors(errors);
          }

          dispatch(
            addFkBeamsAndChannels({
              signalDetectionId: signalDetection.id,
              results
            })
          );
        })
        .catch(e => {
          toast.error(e.message, {
            toastId: e.message
          });
        });
    },
    [
      fetchBeamformingTemplates,
      currentPhase,
      currentInterval,
      currentOpenEvent,
      openIntervalName,
      createProcessingMasks,
      expandedTimeBuffer,
      populatedChannels,
      processingAnalystConfiguration,
      cachedFilterDefinitions,
      findFilterByUsage,
      channelFilters,
      dispatch
    ]
  );
}
