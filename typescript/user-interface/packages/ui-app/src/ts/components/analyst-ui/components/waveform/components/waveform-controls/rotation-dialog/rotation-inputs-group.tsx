import { Radio, RadioGroup } from '@blueprintjs/core';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

import type { InputMode, SteeringMode } from './types';

/**
 * The type of the props for the {@link RotationInputsGroup} component
 */
export interface RotationInputsGroupProps {
  children: JSX.Element;
  inputMode: InputMode;
  setInputMode: React.Dispatch<React.SetStateAction<InputMode>>;
  setSteeringMode: React.Dispatch<React.SetStateAction<SteeringMode>>;
}

/**
 * Creates a rotation inputs group. Accepts children for rendering within
 */
export function RotationInputsGroup({
  children,
  inputMode,
  setInputMode
}: RotationInputsGroupProps) {
  return (
    <FormGroup
      label="Rotated Waveform Inputs"
      helperText="Choose whether to rotate using specific stations/channels at the time of a predicted phase, or to use signal detection arrival times and default channels"
      accordionIsExpanded
      accordionCanCollapse={false}
      nestedContent={children}
    >
      <RadioGroup
        onChange={React.useCallback(
          val => {
            if (
              val.currentTarget.value === 'signal-detection-mode' ||
              val.currentTarget.value === 'station-phase-mode'
            ) {
              setInputMode(val.currentTarget.value);
            } else {
              throw new Error('Invalid radio button value selected');
            }
          },
          [setInputMode]
        )}
        selectedValue={inputMode}
      >
        <Radio label="Using selected signal detections" value="signal-detection-mode" />
        <Radio label="Using selected stations/channels and phase" value="station-phase-mode" />
      </RadioGroup>
    </FormGroup>
  );
}
