import type { ChannelTypes, SignalDetectionTypes, StationTypes } from '@gms/common-model';
import type { ValidationDefinition } from '@gms/ui-core-components';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import { createNonPayloadAction, createPayloadAction } from '@gms/ui-state';

type StationName = string;
type ChannelName = string;
export type DefaultRotatedChannelsRecord = Record<StationName, [ChannelName, ChannelName]>;

export interface RotationErrorMessages {
  latInvalidMessage: Message;
  lonInvalidMessage: Message;
  leadInvalidMessage: Message;
  durationInvalidMessage: Message;
  channelInvalidMessage: Message;
  azimuthInvalidMessage: Message;
  signalDetectionInvalidMessage: Message;
  infoMessage: Message;
  stationInvalidMessage: Message;
}

export interface RotationErrorAction {
  type: keyof RotationErrorMessages;
  payload: Message;
}

export type RotationMessageAction = RotationErrorAction | { type: 'clearMessages' };

export type InputMode = 'signal-detection-mode' | 'station-phase-mode' | null;
export type RotationInterpolationMethod = string;
export type SteeringMode = 'reference-location' | 'azimuth' | 'measured-azimuth';
export type LeadDurationMode = 'default-station-phase' | 'custom-lead-duration';

export interface StationPhaseConfig {
  channelSampleRateTolerance: number;
  channelOrientationTolerance: number;
  locationToleranceKm: number;
}
export interface RotationDialogState {
  // easily identify a rotation dialog state object
  isRotationDialogState: true;

  /**
   * Azimuth state. Values should be strings to allow decimals, per Blueprint documentation
   * These should be validated and converted into numbers before use.
   */
  azimuth: string;

  /**
   * The mode for choosing rotation inputs—signal detection mode or station/phase mode
   */
  inputMode: InputMode;

  /**
   * The selected interpolation method
   */
  interpolation: RotationInterpolationMethod;

  /**
   * Latitude state. Values should be strings to allow decimals, per Blueprint documentation
   * These should be validated and converted into numbers before use.
   */
  latitude: string;

  /**
   * The mode for choosing the lead and duration for the rotated waveforms, either configured by
   * station/phase, or using custom values.
   */
  leadDurationMode: LeadDurationMode;

  /**
   * The amount of time before the reference time at which to start generating rotated waveforms.
   * Values should be strings to allow decimals, per Blueprint documentation.
   * These should be validated and converted into numbers before use.
   */
  leadSecs: string;

  /**
   * The duration of the rotated waveforms.
   * Values should be strings to allow decimals, per Blueprint documentation.
   * These should be validated and converted into numbers before use.
   */
  durationSecs: string;

  /**
   * Longitude state. Values should be strings to allow decimals, per Blueprint documentation.
   * These should be validated and converted into numbers before use.
   */
  longitude: string;

  /**
   * The rotation phase based on the user's selected phase. Default is taken from rotation configuration
   * for the currently open activity
   */
  rotationPhase: string | undefined;

  /**
   * Steering mode. This controls how we get an azimuth for each signal detection.
   */
  steeringMode: SteeringMode;

  /**
   * The Channels to use for rotation.
   * The user may override these
   */
  targetChannels: ChannelTypes.Channel[];

  /**
   * The signal detections to use for rotation.
   * Station, default channels, phase, and azimuth will be used from these signal detections
   * for each rotated waveform.
   * Only used in signal-detection-mode
   */
  targetSignalDetections: SignalDetectionTypes.SignalDetection[];

  /**
   * The stations to use for rotation.
   * The user may override these
   */
  targetStations: StationTypes.Station[];

  /**
   * The Channels that may be chosen in the channel selector in the rotation dialog.
   */
  validChannels: ChannelTypes.Channel[];

  /**
   * The set of signal detections that may be chosen in the selector.
   * Only used in signal-detection-mode
   */
  validSignalDetections: SignalDetectionTypes.SignalDetection[];

  /**
   * The stations that may be chosen in the station selector in the rotation dialog.
   */
  validStations: StationTypes.Station[];

  /**
   * True if the rotation templates for rotation targets have been fetched
   */
  hasRotationTemplates: boolean;
}

/**
 * The actions that may be dispatched to change the rotation dialog state
 */
export const rotationDialogActions = {
  setAzimuth: createPayloadAction<string>()('setAzimuth'),
  setDuration: createPayloadAction<string>()('setDuration'),
  setInputMode: createPayloadAction<InputMode>()('setInputMode'),
  setInterpolation: createPayloadAction<string>()('setInterpolation'),
  setLatitude: createPayloadAction<string>()('setLatitude'),
  setLongitude: createPayloadAction<string>()('setLongitude'),
  setLead: createPayloadAction<string>()('setLead'),
  setLeadDurationMode: createPayloadAction<LeadDurationMode>()('setLeadDurationMode'),
  setSteeringMode: createPayloadAction<SteeringMode>()('setSteeringMode'),
  setPhase: createPayloadAction<string>()('setPhase'),
  setTargetSignalDetections: createPayloadAction<SignalDetectionTypes.SignalDetection[]>()(
    'setTargetSignalDetections'
  ),
  setTargetStations: createPayloadAction<StationTypes.Station[]>()('setTargetStations'),
  setTargetChannels: createPayloadAction<string[]>()('setTargetChannels')
} as const;

// Extract a list of action type stings to use in type guards
const rotationDialogActionTypeStrings = Object.values(rotationDialogActions).map(
  actionBuilder => actionBuilder({} as never).type
);

export type RotationDialogActionType = keyof RotationDialogState;

/**
 * Type guard which determines if an object is a {@link RotationAction}
 *
 * @param action any object which may or may not be a {@link RotationAction}
 * @returns true if the action is a {@link RotationAction}
 */
export function isRotationAction(action: {
  type: string;
  payload: unknown;
}): action is RotationAction {
  return rotationDialogActionTypeStrings.includes((action as any).type);
}

/**
 * The types of the actions created by each of the {@link rotationDialogActions}
 */
export type RotationAction = ReturnType<
  (typeof rotationDialogActions)[keyof typeof rotationDialogActions]
>;

const createMessagePayloadAction = createPayloadAction<Message>();
const createMessageNonPayloadAction = createNonPayloadAction();

/**
 * Action generators for rotation error message actions which may be used\
 * to dispatch error messages.
 *
 * @example ```
 * dispatchErrorMessage(
 *  rotationErrorActions.setAzimuthInvalidMessage(
 *    {summary: "Invalid azimuth", intent: 'danger'}
 * ));
 * ```
 */
export const rotationErrorActions = {
  setAzimuthInvalidMessage: createMessagePayloadAction('azimuthInvalidMessage'),
  setChannelInvalidMessage: createMessagePayloadAction('channelInvalidMessage'),
  setDurationInvalidMessage: createMessagePayloadAction('durationInvalidMessage'),
  setLatInvalidMessage: createMessagePayloadAction('latInvalidMessage'),
  setLeadInvalidMessage: createMessagePayloadAction('leadInvalidMessage'),
  setLonInvalidMessage: createMessagePayloadAction('lonInvalidMessage'),
  setSignalDetectionInvalidMessage: createMessagePayloadAction('signalDetectionInvalidMessage'),
  setInfoMessage: createMessagePayloadAction('infoMessage'),
  clearMessages: createMessageNonPayloadAction('clearMessages')
};

// Extract a list of error action type stings to use in type guards
export const rotationErrorActionTypeStrings = Object.values(rotationErrorActions).map(
  // cast to never because we do not care about the payload, we just want to get the type strings
  actionBuilder => actionBuilder({} as never).type
);

export type RotationErrorTypes = keyof RotationErrorMessages;

export interface RotationDialogMessage extends Message {
  errorType: RotationErrorTypes;
}

export type RotationValidationDefinition = ValidationDefinition<
  RotationDialogState,
  RotationDialogMessage | ((state: RotationDialogState) => RotationDialogMessage)
>;

/**
 * Type guard which determines if an object is a {@link RotationErrorAction}
 *
 * @param action any object which may or may not be a {@link RotationErrorAction}
 * @returns true if the action is a {@link RotationErrorAction}
 */
export function isRotationErrorAction(action: {
  type: string;
  payload?: unknown;
}): action is RotationErrorAction {
  return rotationErrorActionTypeStrings.includes((action as any).type);
}
