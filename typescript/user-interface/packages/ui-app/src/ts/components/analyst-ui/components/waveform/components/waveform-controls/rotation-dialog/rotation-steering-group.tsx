import { Radio, RadioGroup } from '@blueprintjs/core';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

/**
 * The type of the props for the {@link RotationSteeringGroup} component
 */
export interface RotationSteeringGroupProps {
  children: JSX.Element;
  isMeasuredAzimuthEnabled: boolean;
  steeringMode: 'reference-location' | 'azimuth' | 'measured-azimuth';
  setSteeringMode: React.Dispatch<
    React.SetStateAction<'reference-location' | 'azimuth' | 'measured-azimuth'>
  >;
}

/**
 * A form group for choosing the rotation steering method and inputs
 */
export function RotationSteeringGroup({
  children,
  isMeasuredAzimuthEnabled,
  steeringMode,
  setSteeringMode
}: RotationSteeringGroupProps) {
  return (
    <FormGroup
      label="Steering"
      helperText="Choose how to determine azimuth: station to reference location, manual input, or from selected signal detections"
      accordionIsExpanded
      accordionCanCollapse={false}
      nestedContent={children}
    >
      <RadioGroup
        onChange={React.useCallback(
          val => {
            if (
              val.currentTarget.value === 'reference-location' ||
              val.currentTarget.value === 'azimuth' ||
              val.currentTarget.value === 'measured-azimuth'
            ) {
              setSteeringMode(val.currentTarget.value);
            } else {
              throw new Error('invalid radio button value selected');
            }
          },
          [setSteeringMode]
        )}
        selectedValue={steeringMode}
      >
        <Radio label="Towards reference location" value="reference-location" />
        <Radio label="Azimuth" value="azimuth" />
        <Radio
          disabled={isMeasuredAzimuthEnabled}
          label="Measured azimuth"
          value="measured-azimuth"
        />
      </RadioGroup>
    </FormGroup>
  );
}
