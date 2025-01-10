import { Radio, RadioGroup } from '@blueprintjs/core';
import type { EventTypes } from '@gms/common-model';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

import type { InputMode, LeadDurationMode } from './types';

/**
 * The type of the props for the {@link RotationLeadDurationGroup} component
 */
export interface RotationLeadDurationGroupProps {
  children: JSX.Element;
  inputMode: InputMode;
  openEvent: EventTypes.Event;
  leadDurationMode: LeadDurationMode;
  setLeadDurationMode: (mode: LeadDurationMode) => void;
}

/**
 * The lead and duration form group including the radio button options and the lead/duration selectors
 */
export function RotationLeadDurationGroup({
  children,
  inputMode,
  openEvent,
  leadDurationMode,
  setLeadDurationMode
}: RotationLeadDurationGroupProps) {
  return (
    <FormGroup
      label="Waveform lead and duration"
      helperText="Choose whether to use the default lead/duration per station and phase, or set custom values."
      accordionIsExpanded
      accordionCanCollapse={false}
      nestedContent={children}
    >
      <RadioGroup
        onChange={React.useCallback(
          val => {
            if (
              val.currentTarget.value === 'default-station-phase' ||
              val.currentTarget.value === 'custom-lead-duration'
            ) {
              setLeadDurationMode(val.currentTarget.value);
            } else {
              throw new Error('invalid radio button value selected');
            }
          },
          [setLeadDurationMode]
        )}
        selectedValue={leadDurationMode}
      >
        <Radio
          disabled={openEvent == null && inputMode !== 'signal-detection-mode'}
          label="Default configured per station/phase"
          value="default-station-phase"
        />
        <Radio label="Custom lead & duration" value="custom-lead-duration" />
      </RadioGroup>
    </FormGroup>
  );
}
