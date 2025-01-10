import { EventTypes } from '@gms/common-model';
import type { Distance } from '@gms/common-model/lib/common/types';
import type { EventHypothesis } from '@gms/common-model/lib/event';
import {
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  memoizedLocationToEventDistance
} from '@gms/common-model/lib/event';
import { uuid4 } from '@gms/common-util';
import React from 'react';

import {
  selectEvents,
  selectOpenEventId,
  useGetProcessingMonitoringOrganizationConfigurationQuery
} from '../api';
import { associateSignalDetectionsToEvent } from '../api/data/event/associate-sds-to-event';
import { createEventFromSignalDetections } from '../api/data/event/create-event-from-sds';
import { createVirtualEvent } from '../api/data/event/create-virtual-event';
import { deleteEvents } from '../api/data/event/delete-events';
import { duplicateEvents } from '../api/data/event/duplicate-events';
import { rejectEvents } from '../api/data/event/reject-events';
import { unassociateSignalDetectionsToEvent } from '../api/data/event/unassociate-sds-to-event';
import {
  analystActions,
  selectActionTargetEventIds,
  selectOpenIntervalName,
  selectSelectedSignalDetectionsCurrentHypotheses,
  selectUsername
} from '../state';
import {
  useCreateNewEventStatus,
  useDuplicateEventStatus,
  useGetEvents,
  useRejectDeleteEventStatus
} from './event-manager-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { useAllStations } from './station-definition-hooks';
import { useUsername } from './user-session-hooks';
import { useStageId } from './workflow-hooks';

/**
 * Gets the Preferred Event Hypotheses of each of the passed in Events
 *
 * @param eventIds: string[]
 * @returns array of the preferred event hypotheses for the passed in events
 */
export const useGetPreferredEventHypothesesByEventIds = (
  eventIds: string[]
): EventTypes.EventHypothesis[] => {
  const events = useAppSelector(selectEvents);
  const openIntervalName: string = useAppSelector(selectOpenIntervalName);
  return React.useMemo<EventTypes.EventHypothesis[]>(() => {
    const selectedEvents = eventIds?.map(id => events[id]);
    const prefEventHypos: EventTypes.EventHypothesis[] = [];

    selectedEvents?.forEach(ev => {
      const eventHypo = findPreferredEventHypothesisByOpenStageOrDefaultStage(ev, openIntervalName);
      if (eventHypo) prefEventHypos.push(eventHypo);
    });
    return prefEventHypos;
  }, [eventIds, events, openIntervalName]);
};

/**
 * Internal hook used by {@link useAssociateSignalDetections} and
 * {@link useUnassociateSignalDetections} to get the required parameters from
 * redux state.
 *
 * @returns Active user name, open interval, stage ID, available stages,
 * open event ID and selected SD ids
 */
export const useGetCommonOperationParams = () => {
  const username = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const stageId = useStageId();
  const openEventId = useAppSelector(selectOpenEventId);
  return { username, openIntervalName, stageId, openEventId };
};

/**
 * Hook that returns a function that associates signal detections to currently open event.
 *
 * It adds each of the selectedSignalDetectionsHypothesis to the
 * workingEventHypothesis.associatedSignalDetectionHypotheses list
 *
 * Updates the state with the updated event
 *
 * @returns a callback that requires no arguments
 */
export const useAssociateSignalDetections = (): ((signalDetectionIds: string[]) => void) => {
  const dispatch = useAppDispatch();
  const { username, openIntervalName, stageId, openEventId } = useGetCommonOperationParams();

  return React.useCallback(
    (signalDetectionIds: string[]) =>
      dispatch(
        associateSignalDetectionsToEvent({
          username,
          openIntervalName,
          stageId,
          eventId: openEventId,
          signalDetectionIds
        })
      ),
    [dispatch, openEventId, openIntervalName, stageId, username]
  );
};

/**
 * Hook that returns a function that unassociates signal detections to currently open event.
 *
 * It removes each of the selectedSignalDetectionsHypothesis to the
 * workingEventHypothesis.associatedSignalDetectionHypotheses list
 *
 * For each of the location solutions removes location behavior if equal to signal detection hypothesis
 * FeatureMeasurement
 *
 * Updates the state with the updated event
 *
 * @returns a callback with an optional 'rejectAssociations' parameter (default is false)
 */
export const useUnassociateSignalDetections = (): ((
  signalDetectionIds: string[],
  rejectAssociations?: boolean
) => void) => {
  const dispatch = useAppDispatch();
  const { username, openIntervalName, stageId, openEventId } = useGetCommonOperationParams();

  return React.useCallback(
    (signalDetectionIds: string[], rejectAssociations = false) =>
      dispatch(
        unassociateSignalDetectionsToEvent({
          username,
          openIntervalName,
          stageId,
          eventId: openEventId,
          signalDetectionIds,
          rejectAssociations
        })
      ),
    [dispatch, openEventId, openIntervalName, stageId, username]
  );
};

/**
 * Hook which returns a function to create a new event. The returned function accepts
 * a list of Signal Detection IDs which are used as a basis for the new event.
 *
 * @returns function to handle creating a new event
 */
export const useCreateNewEvent = () => {
  const dispatch = useAppDispatch();
  const username: string = useUsername();
  const workflowDefinitionId = useStageId()?.definitionId;
  const processingMonitoringOrganizationConfigurationQuery =
    useGetProcessingMonitoringOrganizationConfigurationQuery();
  const stations = useAllStations();
  const selectedSDHypos = useAppSelector(selectSelectedSignalDetectionsCurrentHypotheses);

  const createNewEventStatus = useCreateNewEventStatus();

  return React.useCallback(
    async (signalDetectionIds: string[]) => {
      // prevent event creation if all selected sd's are deleted
      if (selectedSDHypos.length > 0 && selectedSDHypos.filter(sd => !sd.deleted).length === 0)
        throw new Error('Cannot create event. All selected signal detections are deleted.');

      // newEventId is created/passed here so it's accessible by undo/redo/history middleware
      const newEventId = uuid4();
      dispatch(
        createEventFromSignalDetections({
          newEventId,
          signalDetectionIds,
          monitoringOrganization:
            processingMonitoringOrganizationConfigurationQuery.data?.monitoringOrganization ?? '',
          workflowDefinitionId,
          username,
          stations
        })
      );

      await createNewEventStatus(newEventId);
    },
    [
      createNewEventStatus,
      dispatch,
      processingMonitoringOrganizationConfigurationQuery.data?.monitoringOrganization,
      selectedSDHypos,
      stations,
      username,
      workflowDefinitionId
    ]
  );
};

/**
 * Hook which returns a function to create a new "virtual" event. The returned function
 * takes a date, latitude, longitude, and depth as the basis for the new event's location.
 *
 * @returns function to handle creating a new virtual event.
 */
export const useCreateVirtualEvent = () => {
  const dispatch = useAppDispatch();
  const username: string = useUsername();
  const workflowDefinitionId = useStageId()?.definitionId;
  const processingMonitoringOrganizationConfigurationQuery =
    useGetProcessingMonitoringOrganizationConfigurationQuery();

  const createNewEventStatus = useCreateNewEventStatus();

  return React.useCallback(
    async (eventDate: Date, latitudeDegrees: number, longitudeDegrees: number, depthKm: number) => {
      // newEventId is created/passed here so it's accessible by undo/redo/history middleware
      const newEventId = uuid4();
      dispatch(
        createVirtualEvent({
          newEventId,
          eventDate,
          latitudeDegrees,
          longitudeDegrees,
          depthKm,
          monitoringOrganization:
            processingMonitoringOrganizationConfigurationQuery.data?.monitoringOrganization ?? '',
          workflowDefinitionId,
          username
        })
      );
      // TODO: EventStatuses should not be published until after the event changes are saved
      await createNewEventStatus(newEventId);
    },
    [
      createNewEventStatus,
      dispatch,
      processingMonitoringOrganizationConfigurationQuery.data?.monitoringOrganization,
      username,
      workflowDefinitionId
    ]
  );
};

/**
 * Hook to duplicate currently selected events
 *
 * Updates the redux state with the updated event(s).
 *
 * @returns a callback requiring an array of event id's
 */
export const useDuplicateEvents = (): ((eventIds: string[]) => void) => {
  const dispatch = useAppDispatch();
  const workflowDefinitionId = useStageId()?.definitionId;
  const username: string = useUsername();
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const duplicateEventStatus = useDuplicateEventStatus();

  return React.useCallback(
    (eventIds: string[]) => {
      dispatch(
        duplicateEvents({
          eventIds,
          // newEventIds are created/passed here so they're accessible by undo/redo/history middleware
          newEventIds: eventIds.map(() => uuid4()),
          workflowDefinitionId,
          username,
          openIntervalName
        })
      );
      // TODO: EventStatuses should not be published until after the event changes are saved
      duplicateEventStatus(eventIds);
    },
    [dispatch, duplicateEventStatus, workflowDefinitionId, username, openIntervalName]
  );
};

/**
 * Hook to delete currently selected events
 *
 * dispatches the deleteEvents action to a reducer which:
 *  - loops through the eventId's received from callback and performs the following for each event id:
 *  - gets the event with eventId from state
 *    - creates a new newDeletedEventHypothesis with these attributes:
 *      - sets id.eventId = original preferredEventHypothesisByStage.id.eventId
 *      - sets id.hypothesisId to a new uuid
 *      - sets parentEventHypotheses array to a single id-only instance of the original preferredEventHypothesisByStage
 *      - sets deleted to true
 *      - sets rejected to false
 *      - sets associatedSignalDetectionHypotheses to an empty array
 *      - sets locationSolutions to an array with a single item with these attributes:
 *        - sets id to a new uuid
 *        - sets networkMagnitudeSolutions to an empty array
 *        - sets featurePredictions to an empty array
 *        - sets locationBehaviors to an empty array
 *        - sets location to the preferredLocationSolution.location of the original preferredEventHypothesisByStage
 *        - sets locationRestraint to the preferredLocationSolution.locationRestraint of the original preferredEventHypothesisByStage
 *      - sets preferredLocationSolution to an id-only instance of the new locationSolution (detailed above)
 *    - adds newDeletedEventHypothesis to the event's eventHypotheses array
 *    - set's event.overallPreferred to an id-only instance of the newDeletedEventHypothesis
 *    - adds an id-only instance of newDeletedEventHypothesis to event.finalEventHypothesisHistory
 *    - sets event._uiHasUnsavedChanges to epochSecondsNow
 *
 * @returns a callback requiring an array of eventId's
 */
export const useDeleteEvents = (): ((eventIds: string[]) => void) => {
  const dispatch = useAppDispatch();
  const { username, openIntervalName, stageId } = useGetCommonOperationParams();
  const deleteEventStatus = useRejectDeleteEventStatus();

  return React.useCallback(
    (eventIds: string[]) => {
      dispatch(
        deleteEvents({
          eventIds,
          stageId,
          username,
          openIntervalName
        })
      );
      // TODO: EventStatuses should not be published until after the event changes are saved
      deleteEventStatus(eventIds);
    },
    [dispatch, stageId, username, openIntervalName, deleteEventStatus]
  );
};

/**
 * Hook that returns a function to reject event(s).
 *
 * Updates the redux state with the reject event(s).
 *
 * @returns a callback function to reject event(s) which accepts a list of
 * eventIds and a record of {@link EventStatus} objects.
 */
export const useRejectEvents = () => {
  const dispatch = useAppDispatch();
  const { username, openIntervalName, stageId } = useGetCommonOperationParams();
  const rejectEventStatus = useRejectDeleteEventStatus();

  return React.useCallback(
    (eventIds: string[]) => {
      dispatch(
        rejectEvents({
          eventIds,
          stageId,
          username,
          openIntervalName
        })
      );
      // TODO: EventStatuses should not be published until after the event changes are saved
      rejectEventStatus(eventIds);
    },
    [dispatch, stageId, username, openIntervalName, rejectEventStatus]
  );
};

/**
 * Hook that returns a function to set selected event id's.
 *
 * Updates the redux state with the selected event id(s).
 *
 * @returns a callback function to set event(s) which accepts a list of
 * eventIds
 */
export const useSetSelectedEventIds = () => {
  const dispatch = useAppDispatch();

  return React.useCallback(
    (eventIds: string[]) => {
      dispatch(analystActions.setSelectedEventIds(eventIds));
    },
    [dispatch]
  );
};

/**
 * Hook to filter the selected Event Ids and distinguish:
 * which are Qualified Action Targets
 * and which are Unqualified Action Targets
 *
 * @returns a callback which returns an array of qualified event action target ids and an array of unqualified event action target ids
 */
export const useGetQualifiedAndUnqualifiedEventActionTargetIdsFromSelected = () => {
  const actionTargetEventIds = useAppSelector(selectActionTargetEventIds);
  const preferredEventHypotheses: EventHypothesis[] =
    useGetPreferredEventHypothesesByEventIds(actionTargetEventIds);

  return React.useCallback((): {
    qualified: string[];
    unqualified: string[];
  } => {
    const unqualifiedActionTargetEventIds: string[] = [];
    preferredEventHypotheses?.forEach(eventHypo => {
      if (eventHypo.deleted || eventHypo.rejected) {
        unqualifiedActionTargetEventIds.push(eventHypo.id.eventId);
      }
    });
    return {
      qualified: actionTargetEventIds?.filter(id => !unqualifiedActionTargetEventIds.includes(id)),
      unqualified: unqualifiedActionTargetEventIds
    };
  }, [preferredEventHypotheses, actionTargetEventIds]);
};

/**
 * Returns a callback that gives a distance for a given station, if an event is open
 *
 * @returns callback that returns a distance for a given station
 */
export const useStationLocationToOpenEventDistance = () => {
  const stations = useAllStations();

  const openIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);
  const currentOpenEventId = useAppSelector(state => state.app.analyst?.openEventId);
  const eventResults = useGetEvents();
  const currentOpenEvent = eventResults.data?.find(event => event.id === currentOpenEventId);

  return React.useCallback(
    (stationName: string): Distance => {
      const defaultDistance = {
        degrees: 0,
        km: 0
      };

      const station = stations.find(s => s.name === stationName);

      if (!currentOpenEvent || !station) return defaultDistance;

      const preferredEventHypothesisByStage = findPreferredEventHypothesisByOpenStageOrDefaultStage(
        currentOpenEvent,
        openIntervalName
      );

      if (!preferredEventHypothesisByStage) return defaultDistance;

      const locationSolution = EventTypes.findPreferredLocationSolution(
        preferredEventHypothesisByStage.id.hypothesisId,
        currentOpenEvent.eventHypotheses
      );

      if (!locationSolution?.location) return defaultDistance;

      return memoizedLocationToEventDistance(station.location, locationSolution.location);
    },
    [currentOpenEvent, openIntervalName, stations]
  );
};
