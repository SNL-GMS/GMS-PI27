import type { ChannelSegmentTypes, CommonTypes } from '@gms/common-model';
import { EventTypes } from '@gms/common-model';
import type { EventHypothesis } from '@gms/common-model/lib/event';
import {
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  findPreferredLocationSolution
} from '@gms/common-model/lib/event';
import { isArrivalTimeFeatureMeasurement } from '@gms/common-model/lib/signal-detection/util';
import { uniqSortStrings } from '@gms/common-util/lib/common-util/string-util';
import type { AppDispatch, EventStatus, UpdateEventStatusMutationFunc } from '@gms/ui-state';
import {
  analystActions,
  AnalystWorkspaceTypes,
  fksActions,
  prepareReceiverCollection,
  useAllStations,
  useAppDispatch,
  useAppSelector,
  useGetEvents,
  usePredictFeaturesForEventLocationFunction,
  useProcessingAnalystConfiguration,
  useRawChannels,
  useSelectedWaveforms,
  useUpdateEventStatusMutation,
  waveformActions
} from '@gms/ui-state';
import type {
  PredictFeatures,
  PredictFeaturesForEventLocationArgs
} from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import type { WaveformSortType } from '@gms/ui-state/lib/app/state/analyst/types';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import { setZoomIntervalToMax } from '@gms/ui-state/lib/app/state/waveform/operations';
import React from 'react';
import { batch } from 'react-redux';
import { toast } from 'react-toastify';

import { useCalculateOffsets } from '../waveform/waveform-hooks';
import type { EventRow } from './types';
import { EventFilterOptions } from './types';

/**
 * Dispatches the openEventId to the open event or null along will call mutation
 * to update the event status
 *
 * @param eventStatus the event status to update for the event
 * @param updateEventStatusMutation mutation for the update
 */
export const setEventStatus =
  (
    eventStatus: EventTypes.EventStatus,
    userName: string,
    stageName: string,
    configuredPhase: string,
    selectedWaveforms: ChannelSegmentTypes.ChannelSegmentDescriptor[],
    dispatch: AppDispatch,
    updateEventMutation: UpdateEventStatusMutationFunc,
    predictFeaturesForEventId: (id: string) => Promise<PredictFeatures | undefined>,
    calculateOffsets: (
      eventId: string,
      phaseToAlignOn: string,
      alignWaveformsOn: string,
      selectedSortType: WaveformSortType,
      featurePredictions: PredictFeatures
    ) => Record<string, number>,
    zasZoomInterval: number
  ) =>
  async (id: string): Promise<void> => {
    const eventStatusRequestData: EventStatus = {
      stageId: {
        name: stageName
      },
      eventId: id,
      eventStatusInfo: {
        eventStatus,
        activeAnalystIds: [userName]
      }
    };
    switch (eventStatus) {
      case EventTypes.EventStatus.NOT_COMPLETE:
      // these cases are the same so fall through
      case EventTypes.EventStatus.COMPLETE:
        dispatch(analystActions.setOpenEventId(''));
        dispatch(
          analystActions.setSelectedSortType(AnalystWorkspaceTypes.WaveformSortType.stationNameAZ)
        );
        dispatch(analystActions.setAlignWaveformsOn(AlignWaveformsOn.TIME));
        dispatch(setZoomIntervalToMax());
        dispatch(fksActions.setSdIdsToShowFk([]));
        break;
      default:
        batch(() => {
          dispatch(analystActions.setOpenEventId(id));
          dispatch(
            analystActions.setSelectedWaveforms(
              selectedWaveforms.filter(waveform => !waveform.channel.name.includes('beam,event'))
            )
          );
          dispatch(fksActions.setSdIdsToShowFk([]));
          dispatch(
            analystActions.setSelectedSortType(AnalystWorkspaceTypes.WaveformSortType.distance)
          );
        });
        await predictFeaturesForEventId(id).then((featurePredictions: PredictFeatures) => {
          const offsets = calculateOffsets(
            id,
            configuredPhase,
            AlignWaveformsOn.PREDICTED_PHASE,
            AnalystWorkspaceTypes.WaveformSortType.distance,
            featurePredictions
          );

          batch(() => {
            dispatch(analystActions.setAlignWaveformsOn(AlignWaveformsOn.PREDICTED_PHASE));
            dispatch(analystActions.setPhaseToAlignOn(configuredPhase));
            dispatch(waveformActions.setBaseStationTime(offsets.baseStationTime));
            dispatch(
              waveformActions.setZoomInterval({
                startTimeSecs: offsets.baseStationTime - zasZoomInterval / 2,
                endTimeSecs: offsets.baseStationTime + zasZoomInterval / 2
              })
            );
          });
        });
    }

    // update Redux to show predicted phases in waveform display by default
    dispatch(waveformActions.setShouldShowPredictedPhases(true));

    await updateEventMutation(eventStatusRequestData);
  };

/**
 * helper function that requests feature predictions for an event id
 * @returns
 */
const usePredictFeaturesForEventId = () => {
  const predictFeatures = usePredictFeaturesForEventLocationFunction();
  const events = useGetEvents();
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const stations = useAllStations();
  const rawChannels = useRawChannels();
  const openIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);

  return React.useMemo(
    () => async (id: string) => {
      const event = events?.data?.find(e => e.id === id);
      if (event === undefined) return undefined;
      const preferredHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
        event,
        openIntervalName
      );
      if (preferredHypothesis === undefined) return undefined;

      const preferredLocationSolution = findPreferredLocationSolution(
        preferredHypothesis.id.hypothesisId,
        event.eventHypotheses
      );

      if (preferredLocationSolution === undefined) return undefined;

      const receivers = prepareReceiverCollection(rawChannels, stations);

      const phases = uniqSortStrings(
        processingAnalystConfiguration?.phaseLists.flatMap(phaseList => phaseList.favorites)
      );

      const args: PredictFeaturesForEventLocationArgs = {
        phases,
        receivers,
        sourceLocation: preferredLocationSolution.location
      };
      return predictFeatures(args);
    },
    [
      events?.data,
      openIntervalName,
      predictFeatures,
      processingAnalystConfiguration?.phaseLists,
      rawChannels,
      stations
    ]
  );
};

/**
 * Hook used as a helper for updating event status. Gets the username from the store
 *
 * @param eventStatus to update
 * @returns higher order function to perform the redux dispatch and mutation
 */
export const useSetEvent = (
  eventStatus: EventTypes.EventStatus
): ((id: string) => Promise<void>) => {
  const dispatch = useAppDispatch();
  const [updateEventStatusMutation] = useUpdateEventStatusMutation();
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const userName = useAppSelector(state => state.app.userSession.authenticationStatus.userName);
  const stageName = useAppSelector(state => state.app.workflow.openIntervalName);
  const [selectedWaveforms] = useSelectedWaveforms();

  const predictFeaturesForEventId = usePredictFeaturesForEventId();
  const calculateOffsets = useCalculateOffsets();

  return React.useMemo(
    () =>
      setEventStatus(
        eventStatus,
        userName,
        stageName,
        processingAnalystConfiguration?.zasDefaultAlignmentPhase,
        selectedWaveforms,
        dispatch,
        updateEventStatusMutation,
        predictFeaturesForEventId,
        calculateOffsets,
        processingAnalystConfiguration?.zasZoomInterval
      ),
    [
      eventStatus,
      userName,
      stageName,
      processingAnalystConfiguration?.zasDefaultAlignmentPhase,
      processingAnalystConfiguration?.zasZoomInterval,
      selectedWaveforms,
      dispatch,
      updateEventStatusMutation,
      predictFeaturesForEventId,
      calculateOffsets
    ]
  );
};

/**
 * Opens an event and updates the redux state with the open event id
 * Hits a endpoint to update the event status with in progress and username
 */
export const useSetOpenEvent = (): ((id: string) => Promise<void>) => {
  return useSetEvent(EventTypes.EventStatus.IN_PROGRESS);
};

/**
 * Closes an event and updates the redux state to have no open event id
 * Hits a endpoint to update the event status with no complete and removes username
 */
export const useSetCloseEvent = (): ((id: string) => Promise<void>) => {
  return useSetEvent(EventTypes.EventStatus.NOT_COMPLETE);
};

/**
 * helper function to determine if an action is allowed based on the hypothesis, action type, and action target status
 * @param eventActionType action type being taken
 * @param eventHypotheses hypothesis being checked
 * @param eventIsActionTarget boolean flag for it the event is the action target
 * @returns
 */
const determineIfUnqualifiedAction = (
  eventActionType: AnalystWorkspaceTypes.EventActionTypes,
  eventHypotheses: EventHypothesis,
  eventIsActionTarget: boolean
) => {
  if (!eventIsActionTarget) return false;
  switch (eventActionType) {
    case 'delete':
    case 'reject':
    case 'duplicate':
      return eventHypotheses.deleted || eventHypotheses.rejected;
    case 'open':
    case 'close':
    case 'details':
    default:
      return false;
  }
};

/**
 * Builds a single {@link EventRow} given a {@link EventTypes.Event} object
 *
 * @param eventDataForRow Object containing like data related to the event.
 * @param openIntervalName Current interval opened by the analyst.
 * @param timeRange The open interval time range (used to determine if this is an edge event and should be displayed or not)
 * @param eventActionType The type of action to (potentially) be performed on this event (reject, delete, etc)
 * @returns an event row if possible, null if data validation fails
 */
export const buildEventRow = (
  eventDataForRow: {
    event: EventTypes.Event;
    eventStatus: EventStatus | undefined;
    eventIsOpen: boolean;
    eventInConflict: boolean;
    eventIsActionTarget: boolean;
  },
  openIntervalName: string,
  timeRange: CommonTypes.TimeRange,
  eventActionType: AnalystWorkspaceTypes.EventActionTypes
): EventRow | null => {
  const { event, eventStatus, eventIsOpen, eventInConflict, eventIsActionTarget } = eventDataForRow;
  const magnitude: Record<string, number> = {};

  // If no preferredEventHypo for the open stage, returns the most recent hypo
  let eventHypothesis = EventTypes.findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openIntervalName
  );

  if (eventHypothesis?.preferredLocationSolution === undefined) {
    eventHypothesis = EventTypes.findEventHypothesisParent(event, eventHypothesis);
  }

  if (eventHypothesis === undefined) {
    toast.error(`No event hypothesis found for event id ${event.id}`, {
      toastId: `toast-no-event-hypothesis-found`
    });
    return null;
  }

  const locationSolution = EventTypes.findPreferredLocationSolution(
    eventHypothesis.id.hypothesisId,
    event.eventHypotheses
  );

  if (locationSolution === undefined) {
    toast.error(
      `No location solution found for event id ${event.id} and hypothesis ${eventHypothesis.id}`,
      {
        toastId: `toast-no-event-location-solution-found`
      }
    );
    return null;
  }

  locationSolution.networkMagnitudeSolutions.forEach(netMag => {
    magnitude[netMag.type] = netMag.magnitude.value;
  });

  const ellipsisCoverage = locationSolution.locationUncertainty?.ellipses.find(
    value => value.scalingFactorType === EventTypes.ScalingFactorType.COVERAGE
  );

  const ellipsisConfidence = locationSolution.locationUncertainty?.ellipses.find(
    value => value.scalingFactorType === EventTypes.ScalingFactorType.CONFIDENCE
  );

  const filtersForEvent: EventFilterOptions[] = [];
  if (locationSolution.location.time && locationSolution.location.time < timeRange.startTimeSecs) {
    filtersForEvent.push(EventFilterOptions.BEFORE);
  } else if (locationSolution.location.time > timeRange.endTimeSecs) {
    filtersForEvent.push(EventFilterOptions.AFTER);
  } else {
    filtersForEvent.push(EventFilterOptions.INTERVAL);
  }

  if (eventHypothesis.deleted) {
    filtersForEvent.push(EventFilterOptions.DELETED);
  } else if (eventHypothesis.rejected) {
    filtersForEvent.push(EventFilterOptions.REJECTED);
  }

  const numDefiningArrivalTimeFeatureMeasurement = locationSolution.locationBehaviors.filter(
    behavior => isArrivalTimeFeatureMeasurement(behavior.measurement) && behavior.defining
  ).length;
  const numAssociatedArrivalTimeFeatureMeasurement =
    eventHypothesis.associatedSignalDetectionHypotheses.length;

  return {
    id: event.id,
    eventFilterOptions: filtersForEvent,
    time: {
      value: locationSolution.location.time,
      uncertainty: ellipsisCoverage?.timeUncertainty || null
    },
    activeAnalysts: eventStatus?.eventStatusInfo?.activeAnalystIds ?? [],
    conflict: eventInConflict,
    depthKm: {
      value: locationSolution.location.depthKm,
      uncertainty: ellipsisCoverage?.depthUncertaintyKm || null
    },
    latitudeDegrees: locationSolution.location?.latitudeDegrees,
    longitudeDegrees: locationSolution.location?.longitudeDegrees,
    magnitudeMb: magnitude[EventTypes.MagnitudeType.MB],
    magnitudeMs: magnitude[EventTypes.MagnitudeType.MS],
    magnitudeMl: magnitude[EventTypes.MagnitudeType.ML],
    numberAssociated: numAssociatedArrivalTimeFeatureMeasurement,
    numberDefining: numDefiningArrivalTimeFeatureMeasurement || 0,
    observationsStandardDeviation: locationSolution.locationUncertainty?.stdDevOneObservation,
    confidenceSemiMajorAxis: ellipsisConfidence?.semiMajorAxisLengthKm,
    confidenceSemiMinorAxis: ellipsisConfidence?.semiMinorAxisLengthKm,
    confidenceSemiMajorTrend: ellipsisConfidence?.semiMajorAxisTrendDeg,
    coverageSemiMajorAxis: ellipsisCoverage?.semiMajorAxisLengthKm,
    coverageSemiMinorAxis: ellipsisCoverage?.semiMinorAxisLengthKm,
    coverageSemiMajorTrend: ellipsisCoverage?.semiMajorAxisTrendDeg,
    preferred: EventTypes.isPreferredEventHypothesisByStage(
      event,
      openIntervalName,
      eventHypothesis
    ),
    region: 'TBD',
    status: eventStatus?.eventStatusInfo.eventStatus || null,
    isOpen: eventIsOpen,
    rejected: eventHypothesis.rejected,
    deleted: eventHypothesis.deleted,
    unsavedChanges: event._uiHasUnsavedChanges !== undefined,
    isActionTarget: eventIsActionTarget,
    isUnqualifiedActionTarget: determineIfUnqualifiedAction(
      eventActionType,
      eventHypothesis,
      eventIsActionTarget
    )
  };
};

/**
 * Sets focus to events display
 */
export function setFocusToEventsDisplay(): void {
  const eventsPanel = document.getElementsByClassName('events-panel');
  const eventsPanelElement = eventsPanel[0]?.parentElement;
  eventsPanelElement?.focus();
}
