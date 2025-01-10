import { Radio, RadioGroup } from '@blueprintjs/core';
import type { EventTypes } from '@gms/common-model';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

/**
 * The type of the props for the {@link RotationAlignmentGroup} component
 */
export interface RotationAlignmentGroupProps {
  interpolation: string;
  openEvent: EventTypes.Event;
  interpolationMethods: Record<string, string>;
  defaultRotationInterpolation: string;
  setInterpolation: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * A form group that allows the user to choose rotation alignment
 */
export function RotationAlignmentGroup({
  interpolation,
  openEvent,
  interpolationMethods,
  defaultRotationInterpolation,
  setInterpolation
}: RotationAlignmentGroupProps) {
  return (
    <FormGroup helperText="How to align samples" label="Interpolation method">
      {Object.keys(interpolationMethods).length > 1 ? (
        <RadioGroup
          name="Interpolation Method"
          onChange={c => {
            setInterpolation(c.currentTarget.value);
          }}
          selectedValue={interpolation}
        >
          <Radio
            disabled={openEvent == null}
            label="Default configured per station/phase"
            value="default-station-phase"
          />
          {Object.values(interpolationMethods)
            .sort()
            .reverse()
            .map(method => (
              <Radio value={method} key={method}>
                {method}
              </Radio>
            ))}
        </RadioGroup>
      ) : (
        <span>{interpolationMethods[defaultRotationInterpolation]}</span>
      )}
    </FormGroup>
  );
}
