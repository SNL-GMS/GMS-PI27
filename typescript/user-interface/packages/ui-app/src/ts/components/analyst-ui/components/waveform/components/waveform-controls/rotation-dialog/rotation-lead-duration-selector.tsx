import { FormGroup, NumericInput, onNumericInputChange } from '@gms/ui-core-components';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import { selectOpenEvent, useAppSelector, useViewableInterval } from '@gms/ui-state';
import React from 'react';

import {
  rotationDurationValidationDefs,
  rotationLeadValidationDefs
} from './rotation-error-handling';

/**
 * The type of the props for the {@link RotationLeadDurationSelector} component
 */
export interface RotationLeadDurationSelectorProps {
  leadDurationMode: 'default-station-phase' | 'custom-lead-duration';
  rotationLeadSecs: string;
  rotationDurationSecs: string;
  setRotationLeadSecs: (val: string) => void;
  setRotationDurationSecs: (val: string) => void;
  setLeadInvalidMessage: (message: Message) => void;
  setDurationInvalidMessage: (message: Message) => void;
}

/**
 * Creates the inputs for choosing the lead and duration for rotated waveforms
 */
export function RotationLeadDurationSelector({
  leadDurationMode,
  setLeadInvalidMessage,
  setDurationInvalidMessage,
  rotationLeadSecs,
  rotationDurationSecs,
  setRotationLeadSecs,
  setRotationDurationSecs
}: RotationLeadDurationSelectorProps) {
  const openEvent = useAppSelector(selectOpenEvent);

  const [viewableInterval] = useViewableInterval();

  return (
    <>
      <FormGroup
        key="lead-time-selector-group"
        helperText="Lead time before the predicted phase, arrival time, or start of loaded time range"
        label="Lead Time"
        labelInfo="(seconds)"
      >
        <NumericInput
          decimalPrecision={4} // millisecond precision
          disabled={leadDurationMode !== 'custom-lead-duration'}
          className="monospace"
          minorStepSize={1}
          step={60}
          majorStepSize={600}
          validationDefinitions={React.useMemo(
            () => rotationLeadValidationDefs(true)(viewableInterval, openEvent),
            [viewableInterval, openEvent]
          )}
          value={leadDurationMode === 'custom-lead-duration' ? rotationLeadSecs : ''}
          placeholder={leadDurationMode === 'custom-lead-duration' ? 'Enter lead time' : 'N/A'}
          onChange={onNumericInputChange(setRotationLeadSecs)}
          onError={setLeadInvalidMessage}
          tooltip={
            leadDurationMode !== 'custom-lead-duration'
              ? 'Select custom lead & duration mode to enable'
              : ''
          }
        />
      </FormGroup>
      <FormGroup
        key="duration-selector-group"
        helperText="Duration of the rotated waveform"
        label="Duration"
        labelInfo="(seconds)"
      >
        <NumericInput
          decimalPrecision={4} // millisecond precision
          disabled={leadDurationMode !== 'custom-lead-duration'}
          className="monospace"
          minorStepSize={1}
          step={60}
          majorStepSize={600}
          value={leadDurationMode === 'custom-lead-duration' ? rotationDurationSecs : ''}
          placeholder={leadDurationMode === 'custom-lead-duration' ? 'Enter duration' : 'N/A'}
          validationDefinitions={React.useMemo(
            () => rotationDurationValidationDefs(true)(viewableInterval),
            [viewableInterval]
          )}
          onChange={onNumericInputChange(setRotationDurationSecs)}
          onError={setDurationInvalidMessage}
          tooltip={
            leadDurationMode !== 'custom-lead-duration'
              ? 'Select custom lead & duration mode to enable'
              : ''
          }
        />
      </FormGroup>
    </>
  );
}
