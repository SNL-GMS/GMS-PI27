import type { WaveformTypes, WorkflowTypes } from '@gms/common-model';
import { ChannelSegmentTypes, SignalDetectionTypes } from '@gms/common-model';
import type {
  ArrivalTimeFeatureMeasurement,
  SignalDetectionIdString
} from '@gms/common-model/lib/signal-detection';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';
import { epochSecondsNow } from '@gms/common-util';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { UiChannelSegment } from '../../../../types';
import type { ArrivalTime } from '../../../state';
import { associateSignalDetectionToEventReducer } from '../event/associate-sds-to-event';
import {
  createWorkingHypothesisAndRemoveAssociations,
  createWorkingHypothesisAndUpdateAssociations
} from '../event/create-working-hypothesis';
import { markAssociatedEventsWithUnsavedChanges } from '../event/mark-associated-events-with-unsaved-changes';
import type { DataState } from '../types';
import { mutateUiChannelSegmentsRecord } from '../waveform/mutate-channel-segment-record';
import { getWorkingSignalDetectionHypothesis } from './get-working-signal-detection-hypothesis';

const updateArrivalTimeSignalDetectionAction = 'data/updateArrivalTimeSignalDetection' as const;
const updatePhaseSignalDetectionAction = 'data/updatePhaseSignalDetection' as const;
const deleteSignalDetectionAction = 'data/deleteSignalDetection' as const;
const createSignalDetectionAction = 'data/createSignalDetection' as const;
const createSignalDetectionAndAssociateAction = 'data/createSignalDetectionAndAssociate' as const;

/**
 * The create signal detection action.
 */
export const createSignalDetection = createAction<
  {
    readonly signalDetection: SignalDetectionTypes.SignalDetection;
    /** The updated channel segments caused by creating the signal detection */
    readonly updatedUiChannelSegments: {
      name: string;
      channelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
    }[];
  },
  typeof createSignalDetectionAction
>(createSignalDetectionAction);

/**
 * Returns true if the action is of type {@link createSignalDetection}.
 */
export const isCreateSignalDetectionAction = (
  action: AnyAction
): action is ReturnType<typeof createSignalDetection> =>
  action.type === createSignalDetectionAction;

/**
 * The create signal detection and associate action.
 */
export const createSignalDetectionAndAssociate = createAction<
  {
    readonly signalDetection: SignalDetectionTypes.SignalDetection;
    readonly username: string;
    readonly openIntervalName: string;
    readonly stageId?: WorkflowTypes.IntervalId;
    readonly eventId: string;
    /** The updated channel segments caused by creating the signal detection */
    readonly updatedUiChannelSegments: {
      name: string;
      channelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
    }[];
  },
  typeof createSignalDetectionAndAssociateAction
>(createSignalDetectionAndAssociateAction);

/**
 * Returns true if the action is of type {@link createSignalDetectionAndAssociate}.
 */
export const isCreateSignalDetectionAndAssociateAction = (
  action: AnyAction
): action is ReturnType<typeof createSignalDetectionAndAssociate> =>
  action.type === createSignalDetectionAndAssociateAction;

/**
 * Update the Arrival Time Feature Measurement
 * in the current (working) Signal Detection Hypothesis
 */
export const updateArrivalTimeSignalDetection = createAction<
  {
    readonly username: string;
    readonly stageId: IntervalId;
    readonly openIntervalName: string;
    /** ID of the SignalDetection to be updated */
    readonly signalDetectionId: SignalDetectionTypes.SignalDetectionIdString;
    readonly arrivalTime: ArrivalTime;
    /** UiChannelSegment's ChannelSegmentDescriptor corresponding to the provided signalDetectionId */
    readonly channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined;
    /** Signal Detection's arrival time analysis waveform updated with new channel segment descriptor */
    readonly analysisWaveform: SignalDetectionTypes.WaveformAndFilterDefinition | undefined;
    /** The updated channel segments caused by adjusting the signal detection arrival time */
    readonly updatedUiChannelSegments: {
      name: string;
      channelSegments: UiChannelSegment<WaveformTypes.Waveform>[];
    }[];
  },
  typeof updateArrivalTimeSignalDetectionAction
>(updateArrivalTimeSignalDetectionAction);

/**
 * Returns true if the action is of type {@link updateArrivalTimeSignalDetection}.
 */
export const isUpdateArrivalTimeSignalDetectionAction = (
  action: AnyAction
): action is ReturnType<typeof updateArrivalTimeSignalDetection> =>
  action.type === updateArrivalTimeSignalDetectionAction;

/**
 * Record of SignalDetectionId to a collection of the new {@link ChannelSegmentTypes.ChannelSegmentDescriptor}
 * and {@link SignalDetectionTypes.WaveformAndFilterDefinition} that are to be applied to the
 * feature measurement update.
 */
export type UpdateSignalDetectionsRecord = Record<
  SignalDetectionIdString,
  {
    channelSegmentDescriptor: ChannelSegmentTypes.ChannelSegmentDescriptor | undefined;
    analysisWaveform: SignalDetectionTypes.WaveformAndFilterDefinition | undefined;
  }
>;

/**
 * Update the Phase Feature Measurement
 * in the current (working) Signal Detection Hypothesis
 */
export const updatePhaseSignalDetection = createAction<
  {
    readonly username: string;
    readonly stageId: IntervalId;
    readonly openIntervalName: string;
    /**
     * Record of new ChannelSegmentDescriptor and Analysis Waveform for each
     * SignalDetection that is to be updated
     */
    readonly updateSignalDetectionsRecord: UpdateSignalDetectionsRecord;
    readonly phase: string;
  },
  typeof updatePhaseSignalDetectionAction
>(updatePhaseSignalDetectionAction);

/**
 * Returns true if the action is of type {@link updatePhaseSignalDetection}.
 */
export const isUpdatePhaseSignalDetectionAction = (
  action: AnyAction
): action is ReturnType<typeof updatePhaseSignalDetection> =>
  action.type === updatePhaseSignalDetectionAction;

/**
 * Delete the Signal Detection
 * in the current (working) Signal Detection Hypothesis
 */
export const deleteSignalDetection = createAction<
  {
    readonly username: string;
    readonly stageId: IntervalId;
    readonly openIntervalName: string;
    readonly signalDetectionIds: string[];
  },
  typeof deleteSignalDetectionAction
>(deleteSignalDetectionAction);

/**
 * Returns true if the action is of type {@link deleteSignalDetection}.
 */
export const isDeleteSignalDetectionAction = (
  action: AnyAction
): action is ReturnType<typeof deleteSignalDetection> =>
  action.type === deleteSignalDetectionAction;

/**
 * Update Arrival Time feature measurement in the Signal Detection Hypothesis.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const updateArrivalTimeSignalDetectionReducer: CaseReducer<
  DataState,
  ReturnType<typeof updateArrivalTimeSignalDetection>
> = (state, action) => {
  const {
    username,
    stageId,
    openIntervalName,
    signalDetectionId,
    arrivalTime,
    channelSegmentDescriptor,
    analysisWaveform,
    updatedUiChannelSegments
  } = action.payload;
  // create any necessary working hypothesis
  createWorkingHypothesisAndUpdateAssociations(state, {
    username,
    openIntervalName,
    stageId,
    eventIds: [],
    signalDetectionIds: [signalDetectionId]
  });

  const signalDetection = state.signalDetections[signalDetectionId];
  const signalDetectionHypothesis = getWorkingSignalDetectionHypothesis(signalDetection);
  // Update each feature measurement in the SD
  const fmIndex = signalDetectionHypothesis.featureMeasurements.findIndex(
    fm => fm.featureMeasurementType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
  );
  if (fmIndex < 0) {
    throw new Error(
      `Failed to find Arrival Time feature measurement will not update arrival time.`
    );
  }
  const arrivalTimeFm: SignalDetectionTypes.ArrivalTimeFeatureMeasurement =
    signalDetectionHypothesis.featureMeasurements[
      fmIndex
    ] as SignalDetectionTypes.ArrivalTimeFeatureMeasurement;

  // Clean up old UiChannelSegment
  /** Current arrivalTime, not yet updated */
  const existingArrivalTimeAnalysisWaveform =
    SignalDetectionTypes.Util.findArrivalTimeAnalysisWaveform(signalDetection);

  // If there will be a new analysisWaveform and there was an old analysisWaveform then remove
  // the old analysisWaveform
  if (analysisWaveform && existingArrivalTimeAnalysisWaveform) {
    const stationName = signalDetection.station.name;
    const uiChannelSegmentsByFilter = state.uiChannelSegments[stationName];
    const analystDescriptorString = ChannelSegmentTypes.Util.createChannelSegmentString(
      existingArrivalTimeAnalysisWaveform.waveform.id
    );

    Object.keys(uiChannelSegmentsByFilter).forEach(filterType => {
      uiChannelSegmentsByFilter[filterType] = uiChannelSegmentsByFilter[filterType].filter(uiCS => {
        const id = uiCS.channelSegment._uiConfiguredInput ?? uiCS.channelSegmentDescriptor;
        const idString = ChannelSegmentTypes.Util.createChannelSegmentString(id);
        const shouldKeep = idString !== analystDescriptorString;
        return shouldKeep;
      });
    });
  }

  const updatedArrivalTimeFM: ArrivalTimeFeatureMeasurement = {
    ...arrivalTimeFm,
    channel: channelSegmentDescriptor?.channel || arrivalTimeFm.channel,
    measuredChannelSegment: channelSegmentDescriptor
      ? {
          id: channelSegmentDescriptor
        }
      : undefined,
    analysisWaveform: analysisWaveform || arrivalTimeFm.analysisWaveform,
    measurementValue: {
      ...arrivalTimeFm.measurementValue,
      arrivalTime: {
        ...arrivalTimeFm.measurementValue.arrivalTime,
        standardDeviation: arrivalTime.uncertainty,
        value: arrivalTime.value
      }
    }
  };

  signalDetectionHypothesis.featureMeasurements[fmIndex] = updatedArrivalTimeFM;

  state.signalDetections[signalDetectionId]._uiHasUnsavedChanges = epochSecondsNow();

  // update the related channel segments
  updatedUiChannelSegments.forEach(entry => {
    mutateUiChannelSegmentsRecord(state.uiChannelSegments, entry.name, entry.channelSegments);
  });

  markAssociatedEventsWithUnsavedChanges(
    openIntervalName,
    signalDetectionHypothesis,
    Object.values(state.events)
  );
};

/**
 * Update phase feature measurement in the Signal Detection Hypothesis.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const updatePhaseSignalDetectionReducer: CaseReducer<
  DataState,
  ReturnType<typeof updatePhaseSignalDetection>
> = (state, action) => {
  const { username, stageId, openIntervalName, updateSignalDetectionsRecord, phase } =
    action.payload;

  Object.entries(updateSignalDetectionsRecord).forEach(([signalDetectionId, newProperties]) => {
    const { channelSegmentDescriptor, analysisWaveform } = newProperties;
    // create any necessary working hypothesis
    createWorkingHypothesisAndUpdateAssociations(state, {
      username,
      openIntervalName,
      stageId,
      eventIds: [],
      signalDetectionIds: [signalDetectionId]
    });

    const signalDetection = state.signalDetections[signalDetectionId];
    const signalDetectionHypothesis = getWorkingSignalDetectionHypothesis(signalDetection);

    // Update each feature measurement in the SD
    const phaseFmIndex = signalDetectionHypothesis.featureMeasurements.findIndex(
      fm => fm.featureMeasurementType === SignalDetectionTypes.FeatureMeasurementType.PHASE
    );
    if (phaseFmIndex < 0) {
      throw new Error(`Failed to find Phase feature measurement will not update phase.`);
    }
    const arrivalTimeFmIndex = signalDetectionHypothesis.featureMeasurements.findIndex(
      fm => fm.featureMeasurementType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
    );
    if (arrivalTimeFmIndex < 0) {
      throw new Error(`Failed to find Arrival Time feature measurement; will not update phase.`);
    }

    const phaseFM: SignalDetectionTypes.PhaseTypeFeatureMeasurement = signalDetectionHypothesis
      .featureMeasurements[phaseFmIndex] as SignalDetectionTypes.PhaseTypeFeatureMeasurement;
    const arrivalTimeFM: SignalDetectionTypes.ArrivalTimeFeatureMeasurement =
      signalDetectionHypothesis.featureMeasurements[
        arrivalTimeFmIndex
      ] as SignalDetectionTypes.ArrivalTimeFeatureMeasurement;

    const updatedPhaseFM: SignalDetectionTypes.PhaseTypeFeatureMeasurement = {
      ...phaseFM,
      channel: channelSegmentDescriptor?.channel || phaseFM.channel,
      measuredChannelSegment: channelSegmentDescriptor
        ? {
            id: channelSegmentDescriptor
          }
        : undefined,
      analysisWaveform: analysisWaveform || phaseFM.analysisWaveform,
      measurementValue: {
        ...phaseFM.measurementValue,
        value: phase,
        referenceTime: arrivalTimeFM.measurementValue.arrivalTime.value
      }
    };
    signalDetectionHypothesis.featureMeasurements[phaseFmIndex] = updatedPhaseFM;

    state.signalDetections[signalDetectionId]._uiHasUnsavedChanges = epochSecondsNow();

    markAssociatedEventsWithUnsavedChanges(
      openIntervalName,
      signalDetectionHypothesis,
      Object.values(state.events)
    );
  });
};

/**
 * Update deleted flag in Signal Detection Hypothesis.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const deleteSignalDetectionReducer: CaseReducer<
  DataState,
  ReturnType<typeof deleteSignalDetection>
> = (state, action) => {
  const { username, stageId, openIntervalName, signalDetectionIds } = action.payload;

  // create any necessary working hypothesis
  createWorkingHypothesisAndRemoveAssociations(state, {
    username,
    openIntervalName,
    stageId,
    eventIds: [],
    signalDetectionIds
  });

  signalDetectionIds.forEach(signalDetectionId => {
    const signalDetection = state.signalDetections[signalDetectionId];
    const signalDetectionHypothesis = getWorkingSignalDetectionHypothesis(signalDetection);

    if (!signalDetection) {
      throw new Error(
        `Failed to find Signal Detection ${signalDetectionId} in state cannot delete signal detection`
      );
    }

    if (!signalDetectionHypothesis.deleted) {
      signalDetectionHypothesis.deleted = true;

      state.signalDetections[signalDetectionId]._uiHasUnsavedChanges = epochSecondsNow();

      markAssociatedEventsWithUnsavedChanges(
        openIntervalName,
        signalDetectionHypothesis,
        Object.values(state.events)
      );
    }
  });
};

/**
 * Create a new signal detection with no association.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const createSignalDetectionReducer: CaseReducer<
  DataState,
  ReturnType<typeof createSignalDetection>
> = (state, action) => {
  const { signalDetection, updatedUiChannelSegments } = action.payload;

  state.signalDetections[signalDetection.id] = signalDetection;

  // update the related channel segments
  updatedUiChannelSegments.forEach(entry => {
    mutateUiChannelSegmentsRecord(state.uiChannelSegments, entry.name, entry.channelSegments);
  });
};

/**
 *
 * Create a new signal detection and associate to the provided event.
 *
 * @param state the current redux state of the slice
 * @param action the action being invoked
 */
export const createSignalDetectionAndAssociateReducer: CaseReducer<
  DataState,
  ReturnType<typeof createSignalDetectionAndAssociate>
> = (state, action) => {
  // create the new signal detection
  createSignalDetectionReducer(state, {
    type: 'data/createSignalDetection',
    payload: {
      signalDetection: action.payload.signalDetection,
      updatedUiChannelSegments: action.payload.updatedUiChannelSegments
    }
  });

  // associate the new signal detection to the event
  associateSignalDetectionToEventReducer(state, {
    type: 'data/associateSignalDetectionsToEvent',
    payload: {
      signalDetectionIds: [action.payload.signalDetection.id],
      username: action.payload.username,
      openIntervalName: action.payload.openIntervalName,
      stageId: action.payload.stageId,
      eventId: action.payload.eventId
    }
  });
};
