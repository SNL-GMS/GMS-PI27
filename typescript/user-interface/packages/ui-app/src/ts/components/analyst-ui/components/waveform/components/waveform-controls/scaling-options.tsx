import { Button, HTMLSelect, Popover, Radio, RadioGroup } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { ToolbarTypes } from '@gms/ui-core-components';
import { CustomToolbarItem } from '@gms/ui-core-components';
import { useProcessingAnalystConfiguration } from '@gms/ui-state';
import classNames from 'classnames';
import * as React from 'react';

/**
 * The set of available amplitude scaling algorithms.
 */
export enum AmplitudeScalingOptions {
  AUTO = 'Auto',
  FIXED = 'Fixed'
}

/**
 * The type that a fixed scale value can take.
 */
export type FixedScaleValue = number | 'Current';

interface ScalingOptionsSelectorProps {
  ampScaleOption: AmplitudeScalingOptions;
  fixedScaleVal: FixedScaleValue;
  fixedScaleOptions: FixedScaleValue[];
  setAmpScaleOption: (option: AmplitudeScalingOptions) => void;
  setFixedScaleVal: (val: FixedScaleValue) => void;
}

/**
 * Creates a selector popover that consists of a list of radio buttons, the last of which has
 * a dropdown for selecting fixes scale values.
 */
function ScalingOptionSelector({
  ampScaleOption,
  fixedScaleVal,
  fixedScaleOptions,
  setAmpScaleOption,
  setFixedScaleVal
}: ScalingOptionsSelectorProps) {
  const handleChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      const selection = event.currentTarget.value as AmplitudeScalingOptions;
      setAmpScaleOption(selection);
    },
    [setAmpScaleOption]
  );
  return (
    <RadioGroup
      className={classNames(['amplitude-scaling', 'radio-dropdown', 'popover'])}
      onChange={handleChange}
      selectedValue={ampScaleOption}
    >
      <Radio label="Auto scale" value={AmplitudeScalingOptions.AUTO} data-cy="radio-auto-scale" />
      <Radio
        label="Fix scale to:"
        value={AmplitudeScalingOptions.FIXED}
        data-cy="radio-fixed-scale"
      >
        <HTMLSelect
          disabled={false}
          onChange={e => {
            const newVal = e.target.value;
            setAmpScaleOption(AmplitudeScalingOptions.FIXED);
            setFixedScaleVal(newVal === 'Current' ? newVal : Number.parseFloat(newVal));
          }}
          value={fixedScaleVal}
          data-cy="fixed-scale-menu"
        >
          {fixedScaleOptions.map(val => (
            <option key={val} value={val} data-cy-fixed-scale={val}>
              {val}
            </option>
          ))}
        </HTMLSelect>
      </Radio>
    </RadioGroup>
  );
}

/**
 * Creates a custom toolbar item with text reflecting the current selected scaling option
 * (and fixed value if that is selected)
 *
 * @param rank the position in the toolbar
 * @param ampScaleOption the selected type of amplitude scaling
 * @param fixedScaleOptions the list of fixed scales
 * @param fixedScaleVal The selected fixed value (only enabled if fixed is also selected)
 * @param setAmpScaleOption a setter for the ampScaleOption state variable
 * @param setFixedScaleVal a setter for the fixedScaleVal state variable
 * @param key must be unique
 * @returns a custom toolbar item for the amplitude scaling
 */
const buildNewScalingOptionSelector = (
  ampScaleOption: AmplitudeScalingOptions,
  fixedScaleOptions: FixedScaleValue[],
  fixedScaleVal: FixedScaleValue,
  setAmpScaleOption: (option: AmplitudeScalingOptions) => void,
  setFixedScaleVal: (val: FixedScaleValue) => void,
  key: string | number
): ToolbarTypes.ToolbarItemElement => (
  <CustomToolbarItem
    key={key}
    label="Amp Scale"
    tooltip="Amplitude Scaling"
    element={
      <Popover
        content={
          <ScalingOptionSelector
            ampScaleOption={ampScaleOption}
            fixedScaleVal={fixedScaleVal}
            setAmpScaleOption={setAmpScaleOption}
            fixedScaleOptions={fixedScaleOptions}
            setFixedScaleVal={setFixedScaleVal}
          />
        }
        shouldReturnFocusOnClose
      >
        <Button
          value={ampScaleOption}
          title="Waveform amplitude scaling options"
          alignText="left"
          rightIcon={IconNames.CARET_DOWN}
          data-cy="scaling-option-selector"
        >
          Scale: {ampScaleOption}
        </Button>
      </Popover>
    }
    collapsed={{
      element: (
        <ScalingOptionSelector
          ampScaleOption={ampScaleOption}
          fixedScaleVal={fixedScaleVal}
          setAmpScaleOption={setAmpScaleOption}
          fixedScaleOptions={fixedScaleOptions}
          setFixedScaleVal={setFixedScaleVal}
        />
      ),
      disabled: false
    }}
  />
);

/**
 * Custom hook that creates a toolbar dropdown and manages the state for that dropdown.
 *
 * @param ampScaleOption the selected type of amplitude scaling
 * @param fixedScaleOptions the list of fixed scales
 * @param fixedScaleVal The selected fixed value (only enabled if fixed is also selected)
 * @param setAmpScaleOption a setter for the ampScaleOption state variable
 * @param setFixedScaleVal a setter for the fixedScaleVal state variable
 * @param key must be unique
 * @returns a custom toolbar item, the selected amplitude scale, and the selected fixed scale value.
 */
export const useScalingOptions = (
  ampScaleOption: AmplitudeScalingOptions,
  fixedScaleVal: FixedScaleValue,
  setAmpScaleOption: (option: AmplitudeScalingOptions) => void,
  setFixedScaleVal: (val: FixedScaleValue) => void,
  key: string | number
): {
  toolbarItem: ToolbarTypes.ToolbarItemElement;
  ampScaleOption: AmplitudeScalingOptions;
  fixedScaleVal: FixedScaleValue;
} => {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const scaleValues = React.useMemo<FixedScaleValue[]>(
    () => ['Current', ...processingAnalystConfiguration.fixedAmplitudeScaleValues],
    [processingAnalystConfiguration]
  );
  //! useEffect updates local state (through callbacks)
  React.useEffect(() => {
    if (!scaleValues.includes(fixedScaleVal)) {
      // If initial fixedScaleVal is invalid, set to a valid one
      setFixedScaleVal(scaleValues[0]);
    }
  }, [fixedScaleVal, scaleValues, setFixedScaleVal]);

  return {
    toolbarItem: React.useMemo(
      () =>
        buildNewScalingOptionSelector(
          ampScaleOption,
          scaleValues,
          fixedScaleVal,
          setAmpScaleOption,
          setFixedScaleVal,
          key
        ),
      [ampScaleOption, fixedScaleVal, key, scaleValues, setAmpScaleOption, setFixedScaleVal]
    ),
    ampScaleOption,
    fixedScaleVal
  };
};
