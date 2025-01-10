import type { EventTypes, WorkflowTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import {
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  findPreferredLocationSolution
} from '@gms/common-model/lib/event/util';
import { epochSecondsNow, uuid4 } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type { WritableDraft } from 'immer/dist/internal';
import cloneDeep from 'lodash/cloneDeep';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';

import { hasWorkingSignalDetectionHypothesis } from '../signal-detection/get-working-signal-detection-hypothesis';
import type { DataState } from '../types';
import type { UiChannelSegmentByEventHypothesisId } from '../waveform';
import {
  getWorkingEventHypothesis,
  hasWorkingEventHypothesis
} from './get-working-event-hypothesis';
import { removeSignalDetectionHypothesisFromEvents } from './remove-associated-sd-hypothesis';
import { updateSignalDetectionHypothesisToEvents } from './update-associated-sd-hypothesis';

const logger = UILogger.create(
  'GMS_EVENT_SIGNAL_DETECTION',
  process.env.GMS_EVENT || process.env.GMS_SIGNAL_DETECTION
);

const createWorkingEventHypothesis = (
  username: string,
  openIntervalName: string,
  stageId: WorkflowTypes.IntervalId,
  event: WritableDraft<EventTypes.Event>,
  eventBeams?: WritableDraft<UiChannelSegmentByEventHypothesisId>
): void => {
  if (!hasWorkingEventHypothesis(event)) {
    const preferredEventHypothesis: WritableDraft<EventTypes.EventHypothesis> | undefined =
      findPreferredEventHypothesisByOpenStageOrDefaultStage(event, openIntervalName);
    if (!preferredEventHypothesis) {
      logger.error(`Could not locate preferredEventHypothesis for event ${event}`);
      return;
    }
    const newPreferredEventHypothesisByStage = cloneDeep(preferredEventHypothesis);

    const preferredLocationSolution: WritableDraft<EventTypes.LocationSolution> | undefined =
      findPreferredLocationSolution(
        newPreferredEventHypothesisByStage.id.hypothesisId,
        event.eventHypotheses ?? []
      );

    if (!preferredLocationSolution) {
      logger.error(`Could not locate preferredLocationSolution for event ${event}`);
      return;
    }

    let newPreferredLocationSolutionId = '';

    const newHypothesis: WritableDraft<EventTypes.EventHypothesis> = {
      ...newPreferredEventHypothesisByStage,
      id: {
        ...newPreferredEventHypothesisByStage.id,
        hypothesisId: uuid4()
      },
      locationSolutions: newPreferredEventHypothesisByStage.locationSolutions.map(
        locationSolution => {
          const newLocationSolution: EventTypes.LocationSolution = {
            ...locationSolution,
            id: uuid4()
          };
          if (locationSolution.id === preferredLocationSolution.id) {
            newPreferredLocationSolutionId = newLocationSolution.id;
          }
          return newLocationSolution;
        }
      ),
      preferredLocationSolution: {
        id: newPreferredLocationSolutionId
      },
      parentEventHypotheses: [
        {
          id: preferredEventHypothesis.id
        }
      ],
      _uiHasUnsavedChanges: epochSecondsNow()
    };

    const newPreferredEventHypothesis: EventTypes.PreferredEventHypothesis = {
      stage: stageId.definitionId,
      preferred: {
        id: newHypothesis.id
      },
      preferredBy: username
    };
    event._uiHasUnsavedChanges = epochSecondsNow();
    event.preferredEventHypothesisByStage.push(newPreferredEventHypothesis);
    event.eventHypotheses.push(newHypothesis);
    if (eventBeams && eventBeams[preferredEventHypothesis.id.hypothesisId]) {
      eventBeams[newHypothesis.id.hypothesisId] = cloneDeep(
        eventBeams[preferredEventHypothesis.id.hypothesisId]
      );
    }
  } else {
    logger.debug(`Attempted to create a new working event hypothesis when one already exists`);
  }
};

const createWorkingSignalDetectionHypothesis = (
  state: WritableDraft<DataState>,
  signalDetectionId: string
): SignalDetectionTypes.SignalDetectionHypothesisId | undefined => {
  if (!hasWorkingSignalDetectionHypothesis(state.signalDetections[signalDetectionId])) {
    const currentSignalDetectionHypothesis: WritableDraft<SignalDetectionTypes.SignalDetectionHypothesis> =
      SignalDetectionTypes.Util.getCurrentHypothesis(
        state.signalDetections[signalDetectionId].signalDetectionHypotheses
      );
    const newSignalDetectionHypothesis = cloneDeep(currentSignalDetectionHypothesis);

    const newHypothesis: WritableDraft<SignalDetectionTypes.SignalDetectionHypothesis> = {
      ...newSignalDetectionHypothesis,
      id: {
        ...newSignalDetectionHypothesis.id,
        id: uuid4()
      },
      parentSignalDetectionHypothesis: { id: currentSignalDetectionHypothesis.id }
    };

    // Update the filterDefinitionsForSignalDetectionHypotheses record for new hypo id
    const filterDefinition =
      state.filterDefinitionsForSignalDetections[currentSignalDetectionHypothesis.id.id];

    if (filterDefinition) {
      state.filterDefinitionsForSignalDetections[newHypothesis.id.id] = filterDefinition;
    }
    state.signalDetections[signalDetectionId].signalDetectionHypotheses.push(newHypothesis);
    state.signalDetections[signalDetectionId]._uiHasUnsavedChanges = epochSecondsNow();
    return newHypothesis.id;
  }
  logger.debug(
    `Attempted to create a new working signal detection hypothesis when one already exists`
  );
  return undefined;
};

const getAssociatedSignalDetectionIds = (
  state: DataState,
  openIntervalName: string,
  eventIds: string[]
): string[] => {
  const associatedSignalDetectionIds: string[] = [];
  eventIds.forEach(id => {
    const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      state.events[id],
      openIntervalName
    );
    if (!currentEventHypothesis) {
      throw new Error('Failed to find current event hypothesis for associated SD IDs');
    }
    associatedSignalDetectionIds.push(
      ...currentEventHypothesis.associatedSignalDetectionHypotheses.map(
        sdh => sdh.id.signalDetectionId
      )
    );
  });
  return associatedSignalDetectionIds;
};

const getAssociatedEventIds = (
  state: DataState,
  openIntervalName: string,
  signalDetectionIds: string[]
): string[] => {
  const associatedEventIds: string[] = [];
  Object.keys(state.events).forEach(id => {
    const currentEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      state.events[id],
      openIntervalName
    );
    if (!currentEventHypothesis) {
      throw new Error('Failed to find current event hypothesis for associated SD IDs');
    }
    const associated = currentEventHypothesis.associatedSignalDetectionHypotheses.map(
      a => a.id.signalDetectionId
    );
    if (intersection(associated, signalDetectionIds).length > 0) {
      associatedEventIds.push(id);
    }
  });
  return associatedEventIds;
};

/**
 * Creates any necessary working event and signal detection hypotheses for the provided input.
 *
 * !For each provided event id; if necessary create a working event hypothesis.
 *
 * @param state the current redux state of the slice
 * @param args the args or payload needed for creating a working hypothesis
 *   username: string;
 *   openIntervalName: string;
 *   stageId: WorkflowTypes.IntervalId;
 *   eventIds: string[];
 *   signalDetectionIds: string[];
 */
const createWorkingHypothesis = (
  state: WritableDraft<DataState>,
  args: {
    username: string;
    openIntervalName: string;
    stageId: WorkflowTypes.IntervalId;
    eventIds: string[];
    signalDetectionIds: string[];
  }
): void => {
  const { username, openIntervalName, stageId, signalDetectionIds, eventIds } = args;

  const associatedSignalDetectionIds = getAssociatedSignalDetectionIds(
    state,
    openIntervalName,
    eventIds
  );

  const associatedEventsIds = getAssociatedEventIds(state, openIntervalName, [
    ...signalDetectionIds,
    ...associatedSignalDetectionIds
  ]);

  const eventIdsToUpdate: string[] = uniq([...eventIds, ...associatedEventsIds]);

  // create working event hypothesis for each event and associated events to the provided signal detections
  eventIdsToUpdate.forEach(id => {
    createWorkingEventHypothesis(
      username,
      openIntervalName,
      stageId,
      state.events[id],
      state.eventBeams
    );
    // ! always update the saved changes flag; necessary for tracking changes for undo/redo due to the ids changing
    state.events[id]._uiHasUnsavedChanges = epochSecondsNow();
    getWorkingEventHypothesis(openIntervalName, state.events[id])._uiHasUnsavedChanges =
      epochSecondsNow();
  });
};

/**
 * Creates any necessary working event and signal detection hypotheses for the provided input.
 * Then call the provided callback
 *
 * !For each provided signal detection id, if necessary create a working signal detection hypothesis
 * !For each provided signal detection id, call the callback
 *
 * @param state the current redux state of the slice
 * @param args the args or payload needed for creating a working hypothesis
 *   username: string;
 *   openIntervalName: string;
 *   stageId: WorkflowTypes.IntervalId;
 *   eventIds: string[];
 *   signalDetectionIds: string[];
 */
export const createWorkingHypothesisWithCallback = (
  state: WritableDraft<DataState>,
  args: {
    username: string;
    openIntervalName: string;
    stageId: WorkflowTypes.IntervalId;
    eventIds: string[];
    signalDetectionIds: string[];
  },
  callback: (
    openIntervalName: string,
    existingSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
    events: WritableDraft<EventTypes.Event>[],
    newSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesisFaceted
  ) => void
) => {
  const { openIntervalName } = args;
  createWorkingHypothesis(state, args);
  // create working hypothesis for each signal detection; and update its associated event(s)
  args.signalDetectionIds.forEach(id => {
    const currentSignalDetectionHypothesis: WritableDraft<SignalDetectionTypes.SignalDetectionHypothesis> =
      SignalDetectionTypes.Util.getCurrentHypothesis(
        state.signalDetections[id].signalDetectionHypotheses
      );
    const newHypothesisId = createWorkingSignalDetectionHypothesis(state, id);

    if (newHypothesisId) {
      callback(openIntervalName, currentSignalDetectionHypothesis, Object.values(state.events), {
        id: newHypothesisId
      });
    }
    // ! always update the saved changes flag; necessary for tracking changes for undo/redo due to the ids changing
    state.signalDetections[id]._uiHasUnsavedChanges = epochSecondsNow();
  });
};

/**
 * Creates any necessary working event and signal detection hypotheses for the provided input.
 * Then update the event's SD associations
 *
 * !For each provided signal detection id, if necessary create a working signal detection hypothesis.
 * !For each provided signal detection id, if necessary update each event's association signal detection.
 *
 * @param state the current redux state of the slice
 * @param args the args or payload needed for creating a working hypothesis
 *   username: string;
 *   openIntervalName: string;
 *   stageId: WorkflowTypes.IntervalId;
 *   eventIds: string[];
 *   signalDetectionIds: string[];
 */
export const createWorkingHypothesisAndUpdateAssociations = (
  state: WritableDraft<DataState>,
  args: {
    username: string;
    openIntervalName: string;
    stageId: WorkflowTypes.IntervalId;
    eventIds: string[];
    signalDetectionIds: string[];
  }
) => {
  createWorkingHypothesisWithCallback(
    state,
    args,
    (
      openIntervalName: string,
      existingSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
      events: WritableDraft<EventTypes.Event>[],
      newSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesisFaceted
    ) => {
      if (newSDHypothesis.id) {
        updateSignalDetectionHypothesisToEvents(
          openIntervalName,
          existingSDHypothesis,
          events,
          newSDHypothesis
        );
      }
    }
  );
};

/**
 * Creates any necessary working event and signal detection hypotheses for the provided input.
 * Then remove the event's SD associations
 *
 * !For each provided signal detection id, if necessary create a working signal detection hypothesis.
 * !For each provided signal detection id, if necessary remove each event's association to each signal detection.
 *
 * @param state the current redux state of the slice
 * @param args the args or payload needed for creating a working hypothesis
 *   username: string;
 *   openIntervalName: string;
 *   stageId: WorkflowTypes.IntervalId;
 *   eventIds: string[];
 *   signalDetectionIds: string[];
 */
export const createWorkingHypothesisAndRemoveAssociations = (
  state: WritableDraft<DataState>,
  args: {
    username: string;
    openIntervalName: string;
    stageId: WorkflowTypes.IntervalId;
    eventIds: string[];
    signalDetectionIds: string[];
  }
) => {
  createWorkingHypothesisWithCallback(
    state,
    args,
    (
      openIntervalName: string,
      existingSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
      events: WritableDraft<EventTypes.Event>[]
    ) => {
      removeSignalDetectionHypothesisFromEvents(openIntervalName, existingSDHypothesis, events);
    }
  );
};
