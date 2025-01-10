import type { FacetedTypes, FkTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import {
  ArrayUtil,
  ChannelSegmentTypes,
  ChannelTypes,
  CommonTypes,
  convertToVersionReference,
  EventTypes,
  FilterTypes,
  FilterUtil,
  SignalDetectionTypes
} from '@gms/common-model';
import { epochSecondsNow, uuid } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import produce from 'immer';
import type { WritableDraft } from 'immer/dist/internal';
import includes from 'lodash/includes';
import React from 'react';
import { batch } from 'react-redux';

import type { ChannelFilterRecord, UiChannelSegment, UIChannelSegmentRecord } from '../../types';
import type {
  DeleteSignalDetectionArgs,
  EventStatus,
  UpdateEventStatusMutationFunc,
  UpdateSignalDetectionArrivalTimeArgs,
  UpdateSignalDetectionsRecord
} from '../api';
import {
  addBeamedChannels,
  createSignalDetection,
  createSignalDetectionAndAssociate,
  deleteSignalDetection,
  selectOpenEventId,
  selectSignalDetections,
  selectUiChannelSegments,
  updateArrivalTimeSignalDetection,
  updatePhaseSignalDetection,
  useGetProcessingMonitoringOrganizationConfigurationQuery,
  useUpdateEventStatusMutation
} from '../api';
import { acceptFk } from '../api/data/signal-detection/accept-fk-reducer';
import { revertFk } from '../api/data/signal-detection/revert-fk-reducer';
import type { ArrivalTime } from '../state';
import { selectOpenIntervalName, selectUsername } from '../state';
import { analystActions, selectSelectedSdIds, selectSelectedWaveforms } from '../state/analyst';
import { selectChannelFilters } from '../state/waveform/selectors';
import { createTemporary } from '../util/channel-factory';
import { getMeasuredChannel } from '../util/channel-factory-util';
import { getChannelRecordKey } from '../util/channel-segment-util';
import { buildAnalysisWaveform, determineAllDeletableSignalDetections } from '../util/util';
import { useAllChannelsRecord } from './channel-hooks';
import {
  useFetchUiChannelSegmentsForChannelTimeRange,
  useGetVisibleChannelSegmentsByStationAndTime
} from './channel-segment-hooks';
import { useGetCommonOperationParams } from './event-hooks';
import { useEventStatusQuery, useGetEvents } from './event-manager-hooks';
import {
  usePhaseLists,
  useProcessingAnalystConfiguration
} from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useSignalDetections } from './signal-detection-hooks';
import { useAllStations } from './station-definition-hooks';
import { useViewableInterval } from './waveform-hooks';
import { useStageId } from './workflow-hooks';

const logger = UILogger.create(
  'GMS_LOG_SIGNAL_DETECTION_HOOKS',
  process.env.GMS_LOG_CHANNEL_SEGMENT_HOOKS
);

const buildArrivalTimeFeatureMeasurement = (
  channelVersionReference: FacetedTypes.VersionReference<'name', ChannelTypes.Channel> | undefined,
  measuredChannel: ChannelTypes.Channel,
  channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined,
  arrivalTime: number,
  defaultSDTimeUncertainty: number
): SignalDetectionTypes.FeatureMeasurement => {
  const featureMeasurementType = SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME;
  const measuredChannelSegment = channelSegmentDescriptor
    ? {
        id: channelSegmentDescriptor
      }
    : undefined;

  const analysisWaveform = buildAnalysisWaveform(
    measuredChannel,
    channelVersionReference,
    channelSegmentDescriptor,
    featureMeasurementType
  );
  return {
    featureMeasurementType,
    measurementValue: {
      arrivalTime: {
        value: arrivalTime,
        standardDeviation: defaultSDTimeUncertainty,
        units: CommonTypes.Units.SECONDS
      },
      travelTime: undefined
    },
    snr: undefined,
    channel: {
      name: measuredChannel.name,
      effectiveAt: measuredChannel.effectiveAt
    },
    measuredChannelSegment,
    analysisWaveform
  };
};

const buildPhaseFeatureMeasurement = (
  channelVersionReference: FacetedTypes.VersionReference<'name', ChannelTypes.Channel> | undefined,
  measuredChannel: ChannelTypes.Channel,
  channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined,
  arrivalTime: number,
  phase: string
): SignalDetectionTypes.FeatureMeasurement => {
  const featureMeasurementType = SignalDetectionTypes.FeatureMeasurementType.PHASE;
  const measuredChannelSegment = channelSegmentDescriptor
    ? {
        id: channelSegmentDescriptor
      }
    : undefined;

  const analysisWaveform = buildAnalysisWaveform(
    measuredChannel,
    channelVersionReference,
    channelSegmentDescriptor,
    featureMeasurementType
  );

  return {
    featureMeasurementType,
    measurementValue: {
      value: phase,
      confidence: undefined,
      referenceTime: arrivalTime
    },
    snr: undefined,
    channel: {
      name: measuredChannel.name,
      effectiveAt: measuredChannel.effectiveAt
    },
    measuredChannelSegment,
    analysisWaveform
  };
};

/**
 * Internal helper function for {@link useBuildSignalDetection}
 */
const buildSignalDetectionHypothesis = (
  signalDetectionId: string,
  station: StationTypes.Station,
  channelVersionReference: FacetedTypes.VersionReference<'name', ChannelTypes.Channel> | undefined,
  measuredChannel: ChannelTypes.Channel,
  channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined,
  arrivalTime: number,
  phase: string,
  monitoringOrganization: string,
  defaultSDTimeUncertainty: number
): SignalDetectionTypes.SignalDetectionHypothesis => {
  const arrivalTimeFeatureMeasurement = buildArrivalTimeFeatureMeasurement(
    channelVersionReference,
    measuredChannel,
    channelSegmentDescriptor,
    arrivalTime,
    defaultSDTimeUncertainty
  );
  const phaseFeatureMeasurement = buildPhaseFeatureMeasurement(
    channelVersionReference,
    measuredChannel,
    channelSegmentDescriptor,
    arrivalTime,
    phase
  );

  const stationVersionRef = convertToVersionReference(station, 'name');

  return {
    id: {
      id: uuid.asString(),
      signalDetectionId
    },
    monitoringOrganization,
    deleted: false,
    station: stationVersionRef,
    featureMeasurements: [arrivalTimeFeatureMeasurement, phaseFeatureMeasurement],
    parentSignalDetectionHypothesis: null
  };
};

/**
 * Helper function that, given an arrivalTime, will return a TimeRange adjusted
 * for raw waveform trimming
 */
const useGetRawSignalDetectionTimeRange = () => {
  const processingConfiguration = useProcessingAnalystConfiguration();

  return React.useCallback(
    (arrivalTime: number): CommonTypes.TimeRange => {
      return {
        startTimeSecs: arrivalTime - processingConfiguration.waveform.trimWaveformLead,
        endTimeSecs:
          arrivalTime +
          processingConfiguration.waveform.trimWaveformDuration -
          processingConfiguration.waveform.trimWaveformLead
      };
    },
    [
      processingConfiguration.waveform.trimWaveformDuration,
      processingConfiguration.waveform.trimWaveformLead
    ]
  );
};

/**
 * Hook that returns a callback that builds the signal detection
 */
const useBuildSignalDetection = () => {
  const processingMonitoringOrganizationConfigurationQuery =
    useGetProcessingMonitoringOrganizationConfigurationQuery();
  const processingConfiguration = useProcessingAnalystConfiguration();
  return React.useCallback(
    (
      station: StationTypes.Station,
      channelVersionReference:
        | FacetedTypes.VersionReference<'name', ChannelTypes.Channel>
        | undefined,
      measuredChannel: ChannelTypes.Channel,
      channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined,
      arrivalTime: number,
      phase: string
    ): SignalDetectionTypes.SignalDetection => {
      // Get defaults
      const { monitoringOrganization = '' } =
        processingMonitoringOrganizationConfigurationQuery.data || {};
      if (!monitoringOrganization) {
        throw new Error('Failed to obtain monitoring organization from configuration');
      }
      const { defaultSDTimeUncertainty } = processingConfiguration;
      const signalDetectionId = uuid.asString();
      const signalDetectionHypothesis = buildSignalDetectionHypothesis(
        signalDetectionId,
        station,
        channelVersionReference,
        measuredChannel,
        channelSegmentDescriptor,
        arrivalTime,
        phase,
        monitoringOrganization,
        defaultSDTimeUncertainty
      );
      return {
        id: signalDetectionId,
        monitoringOrganization,
        station: {
          name: station.name
        },
        signalDetectionHypotheses: [signalDetectionHypothesis],
        _uiHasUnsavedChanges: epochSecondsNow()
      };
    },
    [processingConfiguration, processingMonitoringOrganizationConfigurationQuery.data]
  );
};

const getCreateSignalDetectionUiChannelSegment = (
  getVisibleChannelSegmentsByStationAndTime: (
    stationId: string,
    timeSecs: number
  ) => UiChannelSegment<WaveformTypes.Waveform>[],
  key: string,
  timeSecs: number,
  stationName: string,
  channelName: string
): UiChannelSegment<WaveformTypes.Waveform> | undefined => {
  let uiChannelSegments: UiChannelSegment<WaveformTypes.Waveform>[] =
    getVisibleChannelSegmentsByStationAndTime(key, timeSecs);

  // In the case we don't find the raw channel segment it might not be loaded, load the 5m beam if available
  if (ChannelTypes.Util.isRawChannelName(key) && uiChannelSegments.length === 0) {
    uiChannelSegments = getVisibleChannelSegmentsByStationAndTime(stationName, timeSecs);
  }

  if (uiChannelSegments.length === 0) {
    return undefined;
  }

  return uiChannelSegments.length > 1
    ? uiChannelSegments.find(cs => cs.channelSegmentDescriptor.channel.name === channelName)
    : uiChannelSegments[0];
};

/**
 * Helper function for adjusting an existing uiChannelSegment's start and end times
 *
 * @returns uiChannelSegment with updated startTime and endTime properties
 */
const adjustUiChannelSegmentStartEndTime = (
  uiChannelSegment: UiChannelSegment<WaveformTypes.Waveform>,
  newStartTime: number,
  newEndTime: number
): UiChannelSegment<WaveformTypes.Waveform> => {
  const channelSegmentDescriptor = {
    channel: uiChannelSegment.channelSegmentDescriptor.channel,
    creationTime: uiChannelSegment.channelSegmentDescriptor.creationTime ?? 0,
    startTime: newStartTime,
    endTime: newEndTime
  };

  return produce(uiChannelSegment, draft => {
    draft.channelSegmentDescriptor = channelSegmentDescriptor;
    // Undefined since this should be the raw channel segment
    draft.channelSegment._uiConfiguredInput = undefined;
    draft.channelSegment.id = channelSegmentDescriptor;
    draft.channelSegment._uiFilterId = FilterTypes.UNFILTERED;
    const inRangeTimeseries: WritableDraft<WaveformTypes.Waveform>[] = [];
    draft.channelSegment.timeseries.forEach(ts => {
      // Check if timeseries falls outside channelSegmentDescriptor
      // time range left or right
      if (
        // If timeseries is not entirely to left
        !(
          ts.startTime < channelSegmentDescriptor.startTime &&
          ts.endTime < channelSegmentDescriptor.startTime
        ) &&
        // and timeseries is not entirely to right
        !(
          ts.startTime > channelSegmentDescriptor.endTime &&
          ts.endTime > channelSegmentDescriptor.endTime
        )
      ) {
        // eslint-disable-next-line no-param-reassign
        ts.startTime = channelSegmentDescriptor.startTime;
        // eslint-disable-next-line no-param-reassign
        ts.endTime = channelSegmentDescriptor.endTime;
        inRangeTimeseries.push(ts);
      }
    });
    draft.channelSegment.timeseries = inRangeTimeseries;
  });
};

/**
 * Build raw UI channel segment for signal detection creation and dispatch to redux
 * @param channelName used to lookup unfiltered ChannelSegment
 * @param arrivalTime used in setting channel segment time range
 * @param processingConfiguration for trimming lead and duration config values
 * @returns the unfiltered UiChannelSegment created from the raw channel or undefined
 * if channel name does not exist in the channelSegments state
 */
const useCreateRawUiChannelSegment = () => {
  const fetchUnfilteredChannelSegments = useFetchUiChannelSegmentsForChannelTimeRange();
  const uiChannelSegmentsRecord: UIChannelSegmentRecord = useAppSelector(selectUiChannelSegments);
  const stations = useAllStations();
  const getRawSignalDetectionTimeRange = useGetRawSignalDetectionTimeRange();
  return React.useCallback(
    async (stationName: string, channelName: string, arrivalTime: number) => {
      let rawUnfilteredUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> | undefined;
      if (
        uiChannelSegmentsRecord[channelName] &&
        uiChannelSegmentsRecord[channelName][FilterTypes.UNFILTERED]
      ) {
        [rawUnfilteredUiChannelSegment] =
          uiChannelSegmentsRecord[channelName][FilterTypes.UNFILTERED];
      } else {
        // If not found in existing redux record, fetch it
        // fully populated channel
        const fullStation: StationTypes.Station = ArrayUtil.findOrThrow(
          stations,
          s => s.name === stationName
        );
        const stationUnfilteredRawChannelSegments = await fetchUnfilteredChannelSegments(
          fullStation.allRawChannels
        );
        rawUnfilteredUiChannelSegment = stationUnfilteredRawChannelSegments?.find(uiCS => {
          const chanSegDesc =
            uiCS.channelSegment._uiConfiguredInput ?? uiCS.channelSegmentDescriptor;
          return chanSegDesc.channel.name === channelName;
        });
      }

      if (!rawUnfilteredUiChannelSegment) {
        logger.error(`Failed to create raw channel segment, unable to create Signal Detection`);
        return undefined;
      }

      const adjustedTimeRange = getRawSignalDetectionTimeRange(arrivalTime);

      return adjustUiChannelSegmentStartEndTime(
        rawUnfilteredUiChannelSegment,
        adjustedTimeRange.startTimeSecs,
        adjustedTimeRange.endTimeSecs
      );
    },
    [
      fetchUnfilteredChannelSegments,
      getRawSignalDetectionTimeRange,
      stations,
      uiChannelSegmentsRecord
    ]
  );
};

/**
 * Hook that returns a callback that builds the analyst and measured channels
 * used to in creating a new signal detection
 */
const useBuildAnalysisAndMeasuredChannels = () => {
  const channelsRecord = useAllChannelsRecord();

  return React.useCallback(
    async (
      isTemporary: boolean,
      station: StationTypes.Station,
      channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined
    ): Promise<{
      tempChannelCreated: boolean;
      measuredChannel: ChannelTypes.Channel | undefined;
    }> => {
      let tempChannelCreated = false;
      let measuredChannel: ChannelTypes.Channel | undefined;

      if (!isTemporary && channelSegmentDescriptor?.channel) {
        measuredChannel = getMeasuredChannel(channelsRecord, channelSegmentDescriptor);
      } else {
        measuredChannel = Object.values(channelsRecord).find(
          chan => chan.station.name === station.name && ChannelTypes.Util.isTemporaryChannel(chan)
        );
        if (isTemporary || !measuredChannel) {
          tempChannelCreated = true;
          measuredChannel = await createTemporary(station);
        }
      }
      return { tempChannelCreated, measuredChannel };
    },
    [channelsRecord]
  );
};

/**
 * Hook that returns a callback that allows you to create a new signal detection
 *
 * @returns a callback that will create a new signal detection
 */
export const useCreateSignalDetection = () => {
  const dispatch = useAppDispatch();
  const stations = useAllStations();
  const selectedSdIds = useAppSelector(selectSelectedSdIds);
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);
  const getVisibleChannelSegmentsByStationAndTime = useGetVisibleChannelSegmentsByStationAndTime();
  const { username, openIntervalName, stageId, openEventId } = useGetCommonOperationParams();
  const createRawUiChannelSegment = useCreateRawUiChannelSegment();
  const buildAnalysisAndMeasuredChannels = useBuildAnalysisAndMeasuredChannels();
  const buildSignalDetection = useBuildSignalDetection();
  const getRawSignalDetectionTimeRange = useGetRawSignalDetectionTimeRange();

  return React.useCallback(
    async (
      stationId: string,
      channelName: string,
      arrivalTime: number,
      phase: string,
      isTemporary = false
    ) => {
      // Get just the station name (could be a station or channel)
      const stationName = stationId.split('.')[0];
      // Get fully populated station
      const station: StationTypes.Station = ArrayUtil.findOrThrow(
        stations,
        s => s.name === stationName
      );

      // Channel record key could be the station name or channel name in the case of raw
      const channelRecordKey = getChannelRecordKey(stationId, station.name, channelName);
      const sourceUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> | undefined =
        getCreateSignalDetectionUiChannelSegment(
          getVisibleChannelSegmentsByStationAndTime,
          channelRecordKey,
          arrivalTime,
          station.name,
          channelName
        );

      let sourceChannelSegmentDescriptor = sourceUiChannelSegment?.channelSegmentDescriptor;

      // Find the source channel name if this source is filtered use the _uiConfiguredInput
      // else use the channel segment  descriptor. The source channel name is used
      // to build the analysis waveform and help to determine if it was created from a raw channel
      const sourceChannel =
        sourceUiChannelSegment?.channelSegment?._uiConfiguredInput?.channel ??
        sourceUiChannelSegment?.channelSegmentDescriptor.channel;

      let rawUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> | undefined;
      // Create and save new raw channel UiChannelSegment
      if (
        !isTemporary &&
        arrivalTime &&
        sourceChannel &&
        sourceChannelSegmentDescriptor &&
        (ChannelTypes.Util.isRawChannelName(channelRecordKey) ||
          ChannelTypes.Util.isRawChannelName(sourceChannel.name))
      ) {
        rawUiChannelSegment = await createRawUiChannelSegment(
          stationName,
          ChannelTypes.Util.isRawChannelName(channelRecordKey)
            ? channelRecordKey
            : sourceChannel?.name,
          arrivalTime
        );

        const timeRange = getRawSignalDetectionTimeRange(arrivalTime);

        sourceChannelSegmentDescriptor = {
          ...sourceChannelSegmentDescriptor,
          startTime: timeRange.startTimeSecs,
          endTime: timeRange.endTimeSecs,
          creationTime:
            rawUiChannelSegment?.channelSegmentDescriptor.creationTime ??
            sourceChannelSegmentDescriptor.creationTime
        };
      }
      const { tempChannelCreated, measuredChannel } = await buildAnalysisAndMeasuredChannels(
        isTemporary,
        station,
        sourceChannelSegmentDescriptor
      );

      if (measuredChannel === undefined) {
        logger.error(
          `Failed to retrieve the fully populated 'measuredChannel', unable to create Signal Detection`,
          {
            station,
            channelSegmentDescriptor: sourceUiChannelSegment?.channelSegmentDescriptor
          }
        );
        return;
      }
      const signalDetection = buildSignalDetection(
        station,
        {
          name: sourceChannel ? sourceChannel.name : '',
          effectiveAt: sourceChannel ? sourceChannel.effectiveAt : -1
        },
        measuredChannel,
        sourceChannelSegmentDescriptor,
        arrivalTime,
        phase
      );

      if (tempChannelCreated) {
        // Add the temp channel to redux
        dispatch(addBeamedChannels([measuredChannel]));
      }

      const updatedUiChannelSegments = rawUiChannelSegment
        ? [{ name: stationName, channelSegments: [rawUiChannelSegment] }]
        : [];

      if (openEventId) {
        dispatch(
          createSignalDetectionAndAssociate({
            signalDetection,
            eventId: openEventId,
            openIntervalName,
            username,
            stageId,
            updatedUiChannelSegments
          })
        );
      } else {
        dispatch(
          createSignalDetection({
            signalDetection,
            updatedUiChannelSegments
          })
        );
      }

      // Selection
      dispatch(analystActions.setSelectedSdIds([...selectedSdIds, signalDetection.id]));

      const analysisWaveform: SignalDetectionTypes.WaveformAndFilterDefinition | undefined =
        SignalDetectionTypes.Util.findArrivalTimeAnalysisWaveform(signalDetection);
      if (sourceUiChannelSegment && analysisWaveform?.waveform?.id) {
        dispatch(
          analystActions.setSelectedWaveforms([...selectedWaveforms, analysisWaveform.waveform.id])
        );
      }
    },
    [
      buildAnalysisAndMeasuredChannels,
      buildSignalDetection,
      createRawUiChannelSegment,
      dispatch,
      getRawSignalDetectionTimeRange,
      getVisibleChannelSegmentsByStationAndTime,
      openEventId,
      openIntervalName,
      selectedSdIds,
      selectedWaveforms,
      stageId,
      stations,
      username
    ]
  );
};

const useIsPhaseConfigured = (): ((phase: string) => boolean) => {
  const phaseLists = usePhaseLists();
  const configuredPhases = React.useMemo(
    () => phaseLists.flatMap(list => list.categorizedPhases).flatMap(phases => phases.phases),
    [phaseLists]
  );
  return React.useCallback(
    phase => {
      return configuredPhases.includes(phase);
    },
    [configuredPhases]
  );
};

/**
 * Update the event status to 'Not Complete' for all events (not currently opened)
 * that have an associated SD
 *
 * @param selectedSdIds
 * @param openIntervalName
 * @param openEventId
 * @param events
 * @param eventStatusRecord
 * @param updateEventStatusMutation
 */
function updateEventStatus(
  selectedSdIds: string[],
  openIntervalName: string,
  openEventId: string,
  events: EventTypes.Event[],
  eventStatusRecord: Record<string, EventStatus>,
  updateEventStatusMutation: UpdateEventStatusMutationFunc
) {
  // Find events that have an association to the deleted SD(s)
  const eventsToUpdate = events
    .map(evt => {
      let foundOne = false;
      const preferredHyp = EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
        evt,
        openIntervalName
      );
      preferredHyp?.associatedSignalDetectionHypotheses.forEach(sdHypo => {
        if (selectedSdIds.find(sdId => sdId === sdHypo.id.signalDetectionId)) {
          foundOne = true;
        }
      });
      if (foundOne) {
        return evt;
      }
      return undefined;
    })
    .filter(ArrayUtil.notEmpty);

  // Get the event status and update it
  eventsToUpdate?.forEach(async evt => {
    if (evt && evt.id) {
      const evtStatus = eventStatusRecord[evt.id];
      if (!evtStatus) {
        logger.warn(`Cannot update EventStatus until current EventStatus is ready`);
        return;
      }
      // If the deleted/ rejected Event's eventStatus is IN_PROGRESS (event is open), do not change eventStatus
      if (
        evt.id === openEventId &&
        evtStatus.eventStatusInfo.eventStatus === EventTypes.EventStatus.IN_PROGRESS
      )
        return;
      // Otherwise set eventStatus to NOT_COMPLETE, leave everything else unchanged
      const updatedEventStatus = {
        ...evtStatus,
        eventStatusInfo: {
          ...evtStatus.eventStatusInfo,
          eventStatus: EventTypes.EventStatus.NOT_COMPLETE
        }
      };
      await updateEventStatusMutation(updatedEventStatus);
    }
  });
}

/** hook that provides a util function for adjusting the arrival time to ensure that it is within the viewable interval */
export const useAdjustArrivalTimeToBeWithinViewableInterval = () => {
  const [viewableInterval] = useViewableInterval();
  return React.useCallback(
    (arrivalTime: ArrivalTime): ArrivalTime => {
      return produce(arrivalTime, draft => {
        if (viewableInterval.startTimeSecs && draft.value < viewableInterval.startTimeSecs) {
          draft.value = viewableInterval.startTimeSecs;
        } else if (viewableInterval.endTimeSecs && draft.value > viewableInterval.endTimeSecs) {
          draft.value = viewableInterval.endTimeSecs;
        }
      });
    },
    [viewableInterval?.endTimeSecs, viewableInterval?.startTimeSecs]
  );
};

/**
 * Hook to get the current uiChannelSegment associated with a signal detection with a fully populated channel.
 * Will return undefined if the SD is not associated to a channel segment
 */
const useGetSignalDetectionUiChannelSegment = (): ((
  signalDetectionId: string
) => UiChannelSegment<WaveformTypes.Waveform> | undefined) => {
  const channelsRecord = useAllChannelsRecord();
  const uiChannelSegmentsRecord: UIChannelSegmentRecord = useAppSelector(selectUiChannelSegments);

  const channelFilters: ChannelFilterRecord = useAppSelector(selectChannelFilters);
  const signalDetections = useSignalDetections();

  return React.useCallback(
    (signalDetectionId: string) => {
      const signalDetection = signalDetections[signalDetectionId];
      const arrivalTimeFm =
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementUsingSignalDetection(
          signalDetection
        );
      if (!arrivalTimeFm.analysisWaveform?.waveform) return undefined;

      /* In the case of raw channels, the raw channel segment may not be loaded. The architecture team decided
      to allow us to use the 5m beam to update the analysisWaveform and measuredChannelSegment instead of the raw.
      The start and end times will be incorrect but given the uniqueness of the raw channel name, the server will
      still be able to associate the signal detection to the the correct raw.
      */

      const sourceChannelName = arrivalTimeFm.measuredChannelSegment?.id?.channel?.name;
      if (sourceChannelName) {
        const filter = channelFilters[sourceChannelName];
        const filterName = FilterUtil.getFilterName(filter);

        if (
          filter &&
          uiChannelSegmentsRecord[sourceChannelName] &&
          uiChannelSegmentsRecord[sourceChannelName][filterName]
        ) {
          return uiChannelSegmentsRecord[sourceChannelName][filterName][0];
        }
      }

      const stationId = signalDetection.station.name;
      const filter = channelFilters[stationId];
      const filterName = FilterUtil.getFilterName(filter);

      const stationChannelSegmentRecord = uiChannelSegmentsRecord[stationId];
      if (!stationChannelSegmentRecord[filterName]) {
        throw new Error(`UI Channel Segment Record is not Available for ${filterName}`);
      }
      const filteredChannelSegment = stationChannelSegmentRecord
        ? stationChannelSegmentRecord[filterName].find(uiChannelSegment => {
            if (filterName !== FilterTypes.UNFILTERED) {
              return channelsRecord[
                uiChannelSegment.channelSegmentDescriptor.channel.name
              ].configuredInputs.find(configuredInput => {
                return (
                  configuredInput.name ===
                    arrivalTimeFm?.analysisWaveform?.waveform.id.channel.name &&
                  configuredInput.effectiveAt ===
                    arrivalTimeFm.analysisWaveform.waveform.id.channel.effectiveAt
                );
              });
            }
            const analysisChannelDescriptorString = arrivalTimeFm.analysisWaveform?.waveform?.id
              ? ChannelSegmentTypes.Util.createChannelSegmentString(
                  arrivalTimeFm.analysisWaveform?.waveform?.id
                )
              : undefined;
            return (
              ChannelSegmentTypes.Util.createChannelSegmentString(
                uiChannelSegment.channelSegmentDescriptor
              ) === analysisChannelDescriptorString
            );
          })
        : undefined;

      if (!filteredChannelSegment) return undefined;
      const measuredChannel =
        channelsRecord[filteredChannelSegment.channelSegmentDescriptor.channel.name];

      return !measuredChannel
        ? undefined
        : {
            ...filteredChannelSegment,
            channelSegmentDescriptor: {
              ...filteredChannelSegment?.channelSegmentDescriptor,
              channel: measuredChannel
            }
          };
    },
    [channelFilters, channelsRecord, signalDetections, uiChannelSegmentsRecord]
  );
};

/**
 * Hook to delete signal detections
 *
 * Updates the state with the updated signal detection
 *
 * @returns a callback that requires DeleteSignalDetectionArgs
 */
export const useDeleteSignalDetection = () => {
  const dispatch = useAppDispatch();
  const username = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const stageId = useStageId();
  const eventStatusQuery = useEventStatusQuery();
  const eventQuery = useGetEvents();
  const openEventId = useAppSelector(selectOpenEventId);
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  const signalDetections = useAppSelector(selectSignalDetections);

  return React.useCallback(
    (args: DeleteSignalDetectionArgs) => {
      // Validate args
      if (!stageId) {
        logger.warn(`No stage ID`);
        return;
      }

      const { signalDetectionIds } = args;

      const selectedSignalDetectionsCurrentHypotheses = Object.values(signalDetections)
        .filter(sd => includes(signalDetectionIds, sd.id))
        .map(sd => SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses));

      const deletableSignalDetectionsIds = determineAllDeletableSignalDetections(
        selectedSignalDetectionsCurrentHypotheses
      );

      if (!signalDetectionIds || signalDetectionIds.length === 0) return;

      if (!eventStatusQuery.data) {
        logger.warn(`Cannot delete sd until event status is ready`);
        return;
      }

      // Update the event statuses before deleting the SD where SD hypo id
      // might change if first change to SD
      updateEventStatus(
        deletableSignalDetectionsIds,
        openIntervalName,
        openEventId,
        eventQuery.data || [],
        eventStatusQuery.data,
        updateEventStatusMutation
      );

      dispatch(
        deleteSignalDetection({
          username,
          stageId,
          openIntervalName,
          signalDetectionIds: deletableSignalDetectionsIds
        })
      );
    },
    [
      dispatch,
      eventQuery.data,
      eventStatusQuery.data,
      openEventId,
      openIntervalName,
      signalDetections,
      stageId,
      updateEventStatusMutation,
      username
    ]
  );
};

/**
 * Hook to update a signal detection arrival time
 *
 * If necessary, it will create a new working signal detection hypothesis.
 * If necessary, it will create a new working event hypothesis for any associated signal detections.
 *
 * Updates the state with the updated signal detection
 *
 * @returns a callback that requires UpdateSignalDetectionArrivalTimeArgs
 */
export const useUpdateSignalDetectionArrivalTime = () => {
  const dispatch = useAppDispatch();
  const adjustArrivalTimeToBeWithinViewableInterval =
    useAdjustArrivalTimeToBeWithinViewableInterval();
  const getSignalDetectionUiChannelSegment = useGetSignalDetectionUiChannelSegment();

  const username = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const stageId = useStageId();
  const stations = useAllStations();
  const eventStatusQuery = useEventStatusQuery();
  const eventQuery = useGetEvents();
  const openEventId = useAppSelector(selectOpenEventId);
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  const signalDetections = useSignalDetections();
  const createRawUiChannelSegment = useCreateRawUiChannelSegment();
  const processingConfiguration = useProcessingAnalystConfiguration();
  const buildAnalysisAndMeasuredChannels = useBuildAnalysisAndMeasuredChannels();
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);

  return React.useCallback(
    async (args: UpdateSignalDetectionArrivalTimeArgs) => {
      // Validate args
      if (!stageId) {
        logger.warn(`No stage ID`);
        return;
      }

      const { arrivalTime, signalDetectionId } = args;
      const newArrivalTime = adjustArrivalTimeToBeWithinViewableInterval(arrivalTime);

      if (!eventStatusQuery.data) {
        logger.warn(`Cannot update arrival time until event status is ready`);
        return;
      }
      const signalDetection = signalDetections[signalDetectionId];

      if (!signalDetection) {
        logger.warn(`Cannot locate signalDetection ${signalDetectionId}`);
        return;
      }

      // Update the event statuses before rejecting the SD where SD hypo id
      // might change if first change to SD
      updateEventStatus(
        [signalDetectionId],
        openIntervalName,
        openEventId,
        eventQuery.data || [],
        eventStatusQuery.data,
        updateEventStatusMutation
      );

      // Has the possibility of being filtered
      const sourceUiChannelSegment = getSignalDetectionUiChannelSegment(signalDetectionId);
      // Find the source channel name if this source is filtered use the _uiConfiguredInput
      // else use the channel segment  descriptor. The source channel name is used
      // to build the analysis waveform and to determine if it was created from a raw channel
      const sourceChannel =
        sourceUiChannelSegment?.channelSegment?._uiConfiguredInput?.channel ??
        sourceUiChannelSegment?.channelSegmentDescriptor.channel;

      const existingArrivalTimeFm =
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementUsingSignalDetection(
          signalDetection
        );
      let analysisWaveform: SignalDetectionTypes.WaveformAndFilterDefinition | undefined;

      let newRawUiChannelSegment: UiChannelSegment<WaveformTypes.Waveform> | undefined;
      // If outside threshold, make a new uiChannelSegment
      if (
        sourceUiChannelSegment &&
        sourceChannel &&
        ChannelTypes.Util.isRawChannelName(sourceChannel.name) &&
        Math.abs(existingArrivalTimeFm.measurementValue.arrivalTime.value - newArrivalTime.value) >=
          processingConfiguration.waveform.trimWaveformRetimeThreshold
      ) {
        // Should always reference the unfiltered channel
        newRawUiChannelSegment = await createRawUiChannelSegment(
          signalDetection.station.name,
          sourceChannel.name,
          newArrivalTime.value
        );

        // Build analysis waveform and measured channel segment
        if (newRawUiChannelSegment) {
          // Get fully populated station
          const station: StationTypes.Station = ArrayUtil.findOrThrow(
            stations,
            s => s.name === signalDetection.station.name
          );
          const { measuredChannel } = await buildAnalysisAndMeasuredChannels(
            false,
            station,
            sourceUiChannelSegment.channelSegmentDescriptor
          );
          analysisWaveform = buildAnalysisWaveform(
            measuredChannel,
            { name: sourceChannel.name, effectiveAt: sourceChannel.effectiveAt },
            newRawUiChannelSegment.channelSegmentDescriptor,
            SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
          );
        }
      }

      batch(() => {
        new Promise(() => {
          // perform the necessary data updates
          dispatch(
            updateArrivalTimeSignalDetection({
              username,
              stageId,
              openIntervalName,
              signalDetectionId,
              arrivalTime: newArrivalTime,
              channelSegmentDescriptor: sourceUiChannelSegment?.channelSegmentDescriptor,
              analysisWaveform,
              updatedUiChannelSegments: newRawUiChannelSegment
                ? [
                    {
                      name: signalDetection.station.name,
                      channelSegments: [newRawUiChannelSegment]
                    }
                  ]
                : []
            })
          );

          if (analysisWaveform?.waveform?.id) {
            dispatch(
              analystActions.setSelectedWaveforms([
                ...selectedWaveforms,
                analysisWaveform?.waveform.id
              ])
            );
          }
        }).catch(error => {
          logger.error(`Failed to update signal detections`, error, args);
        });
      });
    },
    [
      stageId,
      eventStatusQuery.data,
      openIntervalName,
      openEventId,
      eventQuery.data,
      updateEventStatusMutation,
      signalDetections,
      getSignalDetectionUiChannelSegment,
      processingConfiguration.waveform.trimWaveformRetimeThreshold,
      createRawUiChannelSegment,
      stations,
      buildAnalysisAndMeasuredChannels,
      adjustArrivalTimeToBeWithinViewableInterval,
      dispatch,
      username,
      selectedWaveforms
    ]
  );
};

/**
 * Hook to update a signal detection (re-phase)
 *
 * If necessary, it will create a new working signal detection hypothesis.
 * If necessary, it will create a new working event hypothesis for any associated signal detections.
 *
 * Updates the state with the updated signal detection
 *
 * @returns a callback function that updates the phases for a a given list of signal detection IDs
 */
export const useUpdateSignalDetectionPhase = () => {
  const dispatch = useAppDispatch();
  const signalDetectionsRecord = useSignalDetections();
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  const getSignalDetectionUiChannelSegment = useGetSignalDetectionUiChannelSegment();
  const isPhaseConfigured = useIsPhaseConfigured();
  const stations = useAllStations();

  const eventQuery = useGetEvents();
  const eventStatusQuery = useEventStatusQuery();
  const openEventId = useAppSelector(selectOpenEventId);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const username = useAppSelector(selectUsername);
  const stageId = useStageId();
  const buildAnalysisAndMeasuredChannels = useBuildAnalysisAndMeasuredChannels();

  return React.useCallback(
    async (signalDetectionIds: string[], phase: string) => {
      if (!stageId) {
        logger.warn(`Unable to update Signal Detection Phase, stage ID is not defined`);
        return;
      }

      const sdsToUpdate = signalDetectionIds.filter(sdId => {
        const sd = signalDetectionsRecord[sdId];
        const phaseFMV = SignalDetectionTypes.Util.findSignalDetectionPhase(sd);
        const sdHyp = SignalDetectionTypes.Util.getCurrentHypothesis(sd?.signalDetectionHypotheses);
        return phaseFMV !== phase && !sdHyp.deleted;
      });

      // Do nothing if no SDs
      if (sdsToUpdate.length === 0) return;

      if (!eventStatusQuery.data) {
        logger.warn(`Cannot reject event until event status is ready`);
        return;
      }

      // Update event statuses before altering SDs, in case the hypothesis ID changes
      updateEventStatus(
        signalDetectionIds,
        openIntervalName,
        openEventId,
        eventQuery.data || [],
        eventStatusQuery.data,
        updateEventStatusMutation
      );

      // Get UiChannelSegments for each SignalDetection
      const updateSignalDetectionsRecord: UpdateSignalDetectionsRecord = {};
      const sdUpdatePromises = signalDetectionIds.map(async signalDetectionId => {
        const signalDetection = signalDetectionsRecord[signalDetectionId];
        const sourceUiChannelSegment = getSignalDetectionUiChannelSegment(signalDetectionId);
        // Find the source channel name if this source is filtered use the _uiConfiguredInput
        // else use the channel segment  descriptor. The source channel name is used
        // to build the analysis waveform
        const sourceChannel =
          sourceUiChannelSegment?.channelSegment?._uiConfiguredInput?.channel ??
          sourceUiChannelSegment?.channelSegmentDescriptor.channel;

        let analysisWaveform: SignalDetectionTypes.WaveformAndFilterDefinition | undefined;
        let channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined;
        if (sourceUiChannelSegment) {
          // Get fully populated station
          const station: StationTypes.Station = ArrayUtil.findOrThrow(
            stations,
            s => s.name === signalDetection.station.name
          );
          const { measuredChannel } = await buildAnalysisAndMeasuredChannels(
            false,
            station,
            sourceUiChannelSegment.channelSegmentDescriptor
          );
          if (measuredChannel) {
            analysisWaveform = buildAnalysisWaveform(
              measuredChannel,
              sourceChannel
                ? { name: sourceChannel.name, effectiveAt: sourceChannel.effectiveAt }
                : undefined,
              sourceUiChannelSegment.channelSegmentDescriptor,
              SignalDetectionTypes.FeatureMeasurementType.PHASE
            );
            channelSegmentDescriptor = sourceUiChannelSegment.channelSegmentDescriptor;
          }
        }
        // Add entry to the update record
        updateSignalDetectionsRecord[signalDetectionId] = {
          channelSegmentDescriptor,
          analysisWaveform
        };
      });

      await Promise.all(sdUpdatePromises);

      batch(() => {
        new Promise(() => {
          if (isPhaseConfigured(phase)) {
            dispatch(
              updatePhaseSignalDetection({
                username,
                stageId,
                openIntervalName,
                updateSignalDetectionsRecord,
                phase
              })
            );
          }
        }).catch(error => {
          logger.error(`Failed to update signal detection(s) phase`, error, {
            signalDetectionIds,
            phase
          });
        });
      });
    },
    [
      buildAnalysisAndMeasuredChannels,
      dispatch,
      eventQuery.data,
      eventStatusQuery.data,
      getSignalDetectionUiChannelSegment,
      isPhaseConfigured,
      openEventId,
      openIntervalName,
      signalDetectionsRecord,
      stageId,
      stations,
      updateEventStatusMutation,
      username
    ]
  );
};

/**
 * Returns a function that updates a list of signal detections by accepting their corresponding FKs.
 *
 * If necessary, it will create a new working signal detection hypothesis and/or event hypothesis.
 *
 * @returns Callback for updating Signal Detection FK Spectra(s).
 */
export const useUpdateSignalDetectionAcceptFk = () => {
  const dispatch = useAppDispatch();
  const username = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const stageId = useStageId();
  const eventStatusQuery = useEventStatusQuery();
  const eventQuery = useGetEvents();
  const openEventId = useAppSelector(selectOpenEventId);
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();

  return React.useCallback(
    (sdIdsAndMeasuredValues: FkTypes.FkMeasuredValues[]) => {
      // Validate args
      if (!stageId) {
        logger.warn(`No stage ID`);
        return;
      }

      if (!eventStatusQuery.data) {
        logger.warn(`Cannot reject event until event status is ready`);
        return;
      }

      const sdIds: string[] = sdIdsAndMeasuredValues.map(sd => sd.signalDetectionId);

      // Update event statuses before altering SDs, in case the hypothesis ID changes
      updateEventStatus(
        sdIds,
        openIntervalName,
        openEventId,
        eventQuery.data ?? [],
        eventStatusQuery.data,
        updateEventStatusMutation
      );

      batch(() => {
        new Promise(() => {
          // stageId can technically be undefined but if it is you updated SDs without opening an interval which should be impossible
          dispatch(
            acceptFk({
              username,
              stageId,
              openIntervalName,
              sdIdsAndMeasuredValues
            })
          );
        }).catch(error => {
          logger.error(`Failed to accept FK for signal detection`, error, {
            sdIds
          });
        });
      });
    },
    [
      dispatch,
      eventQuery.data,
      eventStatusQuery.data,
      openEventId,
      openIntervalName,
      stageId,
      updateEventStatusMutation,
      username
    ]
  );
};

/* Returns a function that reverts a signal detection's accepted FK.
 *
 * @returns Callback for reverting Signal Detection FK to previous accepted state.
 */
export const useRevertSignalDetectionAcceptFk = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    (signalDetectionId: string) => {
      dispatch(
        revertFk({
          signalDetectionId
        })
      );
    },
    [dispatch]
  );
};
