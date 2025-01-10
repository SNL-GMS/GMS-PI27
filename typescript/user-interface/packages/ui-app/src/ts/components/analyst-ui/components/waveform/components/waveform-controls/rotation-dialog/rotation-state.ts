import type { ChannelTypes, StationTypes } from '@gms/common-model';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import {
  selectOpenEvent,
  useAppSelector,
  useRawChannels,
  useViewableInterval
} from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import produce from 'immer';
import React from 'react';

import { getValidChannels, useGetRotationTemplatesForDialog } from './rotation-dialog-hooks';
import { canChannelBeRotated, getShouldStationBeShownInSelector } from './rotation-dialog-util';
import {
  useGetStationPhaseConfig,
  useRotationDialogMessages,
  validateRotationSettingsOnChange
} from './rotation-error-handling';
import type {
  RotationAction,
  RotationDialogState,
  RotationErrorAction,
  RotationErrorMessages
} from './types';
import { isRotationAction, isRotationErrorAction } from './types';

const logger = UILogger.create(
  'GMS_LOG_UI_ROTATION_DIALOG_STATE',
  process.env.GMS_LOG_UI_ROTATION_DIALOG_STATE
);

/**
 * Takes the internal state and returns the version of the state to display.
 * For example, we still want to track the azimuth value the user provided, but we don't always
 * want to display it (if we are in a mode in which it is not used).
 *
 * @param rotationDialogState the internal state from which to derive the displayed values
 */
export function getDisplayedRotationValues(
  rotationDialogState: RotationDialogState
): RotationDialogState {
  return produce(rotationDialogState, draft => {
    draft.targetStations =
      draft.inputMode === 'signal-detection-mode'
        ? draft.targetSignalDetections.map(sd =>
            draft.validStations.find(validStation => sd.station.name === validStation.name)
          )
        : draft.targetStations;
    draft.targetChannels = draft.inputMode === 'signal-detection-mode' ? [] : draft.targetChannels;
    draft.azimuth = draft.steeringMode === 'azimuth' ? draft.azimuth : '';
    draft.latitude = draft.steeringMode === 'reference-location' ? draft.latitude : '';
    draft.longitude = draft.steeringMode === 'reference-location' ? draft.longitude : '';
  });
}

/**
 * @returns a touple containing  the rotation dialog state, and a dispatch function that
 * may dispatch {@link rotationDialogActions} and {@link RotationErrorAction}
 *
 * @example ```ts
 * const [state, dispatch] useRotationDialogState();
 * dispatch(rotationDialogActions.setAzimuth('1.234'));
 * console.log(state.azimuth); // 1.234
 * ```
 */
export function useRotationDialogState(
  initialState: RotationDialogState
): [
  RotationDialogState & { displayedMessage: Message; errorMessages: RotationErrorMessages },
  (action: RotationAction | RotationErrorAction) => void
] {
  const allRawChannels = useRawChannels();
  const [viewableInterval] = useViewableInterval();
  const openEvent = useAppSelector(selectOpenEvent);
  const getRotationTemplates = useGetRotationTemplatesForDialog();
  const [hasRotationTemplates, setHasRotationTemplates] = React.useState(
    initialState.hasRotationTemplates
  );

  const reduceRotationDialogState = React.useCallback(
    (state: RotationDialogState, action: RotationAction) => {
      const setTargetStations = (
        draft: RotationDialogState,
        targetStations: StationTypes.Station[]
      ) => {
        draft.targetStations = targetStations;
        draft.validChannels = draft.targetStations.reduce(
          (newChannels: ChannelTypes.Channel[], station: StationTypes.Station) => {
            return [
              ...newChannels,
              ...getValidChannels(
                station?.allRawChannels.filter(canChannelBeRotated) ?? draft.targetChannels,
                allRawChannels
              )
            ];
          },
          []
        );
      };

      return produce(state, draft => {
        switch (action.type) {
          case 'setAzimuth':
            draft.azimuth = action.payload;
            break;
          case 'setDuration':
            draft.durationSecs = action.payload;
            break;
          case 'setInterpolation':
            draft.interpolation = action.payload;
            break;
          case 'setInputMode':
            draft.inputMode = action.payload;
            if (action.payload !== 'signal-detection-mode') {
              draft.steeringMode = 'reference-location';
            } else {
              draft.steeringMode = 'measured-azimuth';
            }
            break;
          case 'setLatitude':
            draft.latitude = action.payload;
            break;
          case 'setLead':
            draft.leadSecs = action.payload;
            break;
          case 'setLongitude':
            draft.longitude = action.payload;
            break;
          case 'setLeadDurationMode':
            draft.leadDurationMode = action.payload;
            break;
          case 'setPhase':
            draft.rotationPhase = action.payload;
            break;
          case 'setSteeringMode':
            draft.steeringMode = action.payload;
            break;
          case 'setTargetSignalDetections':
            draft.targetSignalDetections = action.payload;
            // update stations based on signal detection association
            setTargetStations(
              draft,
              draft.validStations.filter(getShouldStationBeShownInSelector(action.payload))
            );
            break;
          case 'setTargetStations':
            setTargetStations(draft, action.payload);
            break;
          case 'setTargetChannels':
            draft.targetChannels = allRawChannels?.filter(
              channel => action.payload?.includes(channel.name)
            );
            break;
          default:
            throw new Error(
              `Invalid action type for rotation reducer: ${(action as { type: string })?.type}`
            );
        }
      });
    },
    [allRawChannels]
  );

  const [internalState, dispatchRotationAction] = React.useReducer(
    reduceRotationDialogState,
    initialState
  );

  const displayedState = React.useMemo(() => {
    return getDisplayedRotationValues(internalState);
  }, [internalState]);

  const getNextDisplayedState = React.useCallback(
    (prevState: RotationDialogState, action: RotationAction) => {
      return getDisplayedRotationValues(reduceRotationDialogState(prevState, action));
    },
    [reduceRotationDialogState]
  );
  const [{ displayedMessage, errorMessages }, dispatchErrorMessage] =
    useRotationDialogMessages(displayedState);
  const getStationPhaseConfig = useGetStationPhaseConfig();
  return React.useMemo(() => {
    // merge two dispatches
    const mergedDispatch = async (action: RotationAction | RotationErrorAction) => {
      // fetch rotation templates
      await new Promise<void>(resolve => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        setTimeout(() => resolve(), 200);
      });
      if (
        action.type === 'setTargetStations' ||
        action.type === 'setTargetSignalDetections' ||
        action.type === 'setTargetChannels' ||
        action.type === 'setInputMode' ||
        action.type === 'setPhase'
      ) {
        setHasRotationTemplates(false);
        getRotationTemplates(
          displayedState.inputMode,
          displayedState.targetStations,
          displayedState.targetSignalDetections,
          displayedState.rotationPhase,
          logger
        )
          .then(() => {
            setHasRotationTemplates(true);
          })
          .catch(logger.error);
      }

      if (isRotationAction(action)) {
        const validator = validateRotationSettingsOnChange(
          viewableInterval,
          openEvent,
          getStationPhaseConfig
        );
        const nextDisplayedState = getNextDisplayedState(internalState, action);
        const messages = validator(nextDisplayedState);
        dispatchErrorMessage({ type: 'clearMessages' });
        messages?.forEach(message => {
          dispatchErrorMessage({ type: message.errorType, payload: message });
        });
        dispatchRotationAction(action);
      } else if (isRotationErrorAction(action)) {
        dispatchErrorMessage(action);
      } else {
        throw new Error(`Invalid action: ${JSON.stringify(action)}`);
      }
    };

    return [
      { ...displayedState, displayedMessage, errorMessages, hasRotationTemplates },
      mergedDispatch
    ];
  }, [
    displayedState,
    displayedMessage,
    errorMessages,
    hasRotationTemplates,
    getRotationTemplates,
    viewableInterval,
    openEvent,
    getStationPhaseConfig,
    getNextDisplayedState,
    internalState,
    dispatchErrorMessage
  ]);
}
