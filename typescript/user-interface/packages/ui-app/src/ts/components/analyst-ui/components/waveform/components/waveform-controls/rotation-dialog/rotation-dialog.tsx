import { Button, ButtonGroup, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import { DialogTitle, FormContent, FormMessage } from '@gms/ui-core-components';
import { selectOpenEvent, useAppSelector } from '@gms/ui-state';
import React from 'react';

import { FormattedText } from '~analyst-ui/common/help-text/title-tooltip';
import { HotkeyReminder } from '~common-ui/components/keyboard-shortcuts/hotkey-reminder';

import { RotationAlignmentGroup } from './rotation-alignment-group';
import {
  loggerMiddleware,
  useHandleSubmit,
  useRotationConfig,
  useRotationStateSetters
} from './rotation-dialog-hooks';
import { RotationInputModeSelector } from './rotation-input-mode-selector';
import { RotationInputsGroup } from './rotation-inputs-group';
import { RotationLeadDurationGroup } from './rotation-lead-duration-group';
import { RotationLeadDurationSelector } from './rotation-lead-duration-selector';
import { useRotationDialogState } from './rotation-state';
import { RotationSteeringGroup } from './rotation-steering-group';
import { RotationSteeringSelector } from './rotation-steering-selector';
import type { RotationDialogState } from './types';

/**
 * The type of the props for the {@link RotationDialog} component
 */
export interface RotationDialogProps {
  initialRotationState: RotationDialogState;
  rotationHotkeyConfig: ConfigurationTypes.HotkeyConfiguration;
  onCancel: () => void;
  onCloseCallback: () => void;
}

/**
 * The rotation controls dialog that pops up to allow the user to customize rotation settings and inputs
 */
export function RotationDialog({
  initialRotationState,
  rotationHotkeyConfig,
  onCancel,
  onCloseCallback
}: RotationDialogProps) {
  const [dialogState, rotationDialogDispatch] = loggerMiddleware(
    useRotationDialogState(initialRotationState)
  );
  const {
    setAzimuth,
    setAzimuthInvalidMessage,
    setDuration,
    setDurationInvalidMessage,
    setInputMode,
    setInterpolation,
    setLatInvalidMessage,
    setLatitude,
    setLead,
    setLeadDurationMode,
    setLeadInvalidMessage,
    setLongitude,
    setLonInvalidMessage,
    setPhase,
    setSteeringMode,
    setTargetChannels,
    setTargetSignalDetections,
    setTargetStations
  } = useRotationStateSetters(rotationDialogDispatch);

  const rotationConfig = useRotationConfig();
  const openEvent = useAppSelector(selectOpenEvent);
  const channelSelectorIntent = dialogState.errorMessages.channelInvalidMessage?.intent ?? 'none';

  return (
    <Dialog
      isOpen
      className="rotation-dialog-container"
      enforceFocus={false}
      onClose={onCloseCallback}
      shouldReturnFocusOnClose
      title={
        <DialogTitle
          titleText="Rotate Waveforms"
          tooltipContent={<FormattedText textToFormat={rotationConfig.rotationDescription} />}
        />
      }
      isCloseButtonShown
      canEscapeKeyClose
    >
      <DialogBody className="rotation-dialog">
        <FormContent className="rotation-settings">
          <RotationInputsGroup
            inputMode={dialogState.inputMode}
            setInputMode={setInputMode}
            setSteeringMode={setSteeringMode}
          >
            <RotationInputModeSelector
              inputMode={dialogState.inputMode}
              selectChannels={setTargetChannels}
              selectSignalDetections={setTargetSignalDetections}
              selectStations={setTargetStations}
              targetChannels={dialogState.targetChannels}
              targetSignalDetections={dialogState.targetSignalDetections}
              targetStations={dialogState.targetStations}
              validSignalDetections={dialogState.validSignalDetections}
              validChannels={dialogState.validChannels}
              validStations={dialogState.validStations}
              channelSelectorIntent={channelSelectorIntent}
              rotationPhase={dialogState.rotationPhase}
              setRotationPhase={setPhase}
            />
          </RotationInputsGroup>

          <RotationSteeringGroup
            isMeasuredAzimuthEnabled={dialogState.inputMode !== 'signal-detection-mode'}
            steeringMode={dialogState.steeringMode}
            setSteeringMode={setSteeringMode}
          >
            <RotationSteeringSelector
              azimuth={dialogState.azimuth}
              latitude={dialogState.latitude}
              longitude={dialogState.longitude}
              azimuthSelectorIntent={dialogState.errorMessages.azimuthInvalidMessage?.intent}
              setAzimuth={setAzimuth}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
              setAzimuthInvalidMessage={setAzimuthInvalidMessage}
              setLatInvalidMessage={setLatInvalidMessage}
              setLonInvalidMessage={setLonInvalidMessage}
              steeringMode={dialogState.steeringMode}
            />
          </RotationSteeringGroup>

          <RotationLeadDurationGroup
            inputMode={dialogState.inputMode}
            openEvent={openEvent}
            leadDurationMode={dialogState.leadDurationMode}
            setLeadDurationMode={setLeadDurationMode}
          >
            <RotationLeadDurationSelector
              rotationDurationSecs={dialogState.durationSecs}
              rotationLeadSecs={dialogState.leadSecs}
              setRotationDurationSecs={setDuration}
              setRotationLeadSecs={setLead}
              leadDurationMode={dialogState.leadDurationMode}
              setLeadInvalidMessage={setLeadInvalidMessage}
              setDurationInvalidMessage={setDurationInvalidMessage}
            />
          </RotationLeadDurationGroup>

          <RotationAlignmentGroup
            interpolation={dialogState.interpolation}
            openEvent={openEvent}
            interpolationMethods={rotationConfig.interpolationMethods}
            defaultRotationInterpolation={rotationConfig.defaultRotationInterpolation}
            setInterpolation={setInterpolation}
          />
        </FormContent>
      </DialogBody>
      <DialogFooter
        minimal
        actions={
          <>
            <HotkeyReminder
              description="Create rotated waveforms with default configuration"
              hotkeyConfig={rotationHotkeyConfig}
            />
            <ButtonGroup>
              <Button onClick={onCancel}>Cancel</Button>
              <Button
                intent={dialogState.displayedMessage?.intent ?? 'primary'}
                type="submit"
                disabled={dialogState.displayedMessage?.intent === 'danger'}
                loading={!dialogState.hasRotationTemplates}
                onClick={useHandleSubmit(dialogState, rotationDialogDispatch, onCloseCallback)}
                title="Create Rotated Waveforms"
              >
                Rotate
              </Button>
            </ButtonGroup>
          </>
        }
      >
        {dialogState.displayedMessage && (
          <FormMessage message={dialogState.displayedMessage} hasCopyButton />
        )}
      </DialogFooter>
    </Dialog>
  );
}
