import type { Intent } from '@blueprintjs/core';
import { NumericInput as BlueprintNumericInput } from '@blueprintjs/core';
import * as React from 'react';

import type { ValidationDefinition } from '../../../util';
import { getValidator } from '../../../util';
import type { Message } from '../form/types';
import type { NumericInputProps } from './types';

const isValidNumberRegex = /^-?\d+(\.\d*)?$/;

/** Referentially stable change handler for numeric input
 * Translates values into strings, which is the blueprint required input type for numeric inputs
 * to support string parsing and validation
 */
export const onNumericInputChange =
  (stateSetter: React.Dispatch<React.SetStateAction<string>>) => (value: number | string) => {
    stateSetter(value as string);
  };

/**
 * A wrapper around the Blueprint NumericInput component. Supports custom
 * validation/error handling (turns red if a bad input is given)
 */
export function NumericInput({
  tooltip,
  intentOverride,
  widthPx,
  decimalPrecision,
  disabled,
  minMax,
  className,
  onChange,
  onError,
  validationDefinitions,
  majorStepSize,
  minorStepSize,
  step,
  value,
  cyData,
  placeholder = 'Enter a number...'
}: Readonly<NumericInputProps>) {
  const style = React.useMemo(() => ({ width: `${widthPx}px` }), [widthPx]);
  const [internalIntent, setInternalIntent] = React.useState<Intent>('none');
  const intent = intentOverride ?? internalIntent;

  /** Base validation to handle min/max */
  const minMaxValid: ValidationDefinition<string>[] = React.useMemo(
    () => [
      {
        valueIsInvalid: input => (minMax?.max != null ? parseFloat(input) > minMax.max : false),
        invalidMessage: {
          summary: 'Input is greater than allowed maximum',
          details: `Maximum value allowed is ${minMax?.max}`,
          intent: 'danger'
        }
      },
      {
        valueIsInvalid: input => (minMax?.min != null ? parseFloat(input) < minMax.min : false),
        invalidMessage: {
          summary: 'Input is less than allowed minimum',
          details: `Minimum value allowed is ${minMax?.min}`,
          intent: 'danger'
        }
      }
    ],
    [minMax?.max, minMax?.min]
  );

  const internalOnError = React.useCallback(
    (isInvalid: boolean, invalidMessage: Message | undefined) => {
      setInternalIntent(invalidMessage?.intent ?? 'none');
      if (onError && invalidMessage) onError(invalidMessage);
    },
    [onError]
  );

  // since the callback is generated, the linter can't tell what dependencies it requires
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validate = React.useCallback(
    getValidator(internalOnError, validationDefinitions ?? minMaxValid),
    [internalOnError, minMaxValid, validationDefinitions]
  );

  React.useEffect(() => {
    if (intent !== 'none') {
      // This needs to be a string downstream
      validate(`${value}`);
    }
  }, [intent, validate, value]);

  const constrainToPrecision = React.useCallback(
    (val: string | number) => {
      if (decimalPrecision != null && decimalPrecision >= 0) {
        const valAsString = typeof val === 'string' ? val : val.toString();
        const valAsNumber = typeof val === 'string' ? Number.parseFloat(val) : val;
        const pattern = `^-?\\d+(\\.\\d{1,${decimalPrecision}})?$`; // escaped regex for checking a number with no more than decimal precision places
        const precisionRegex = new RegExp(pattern, 'g');
        // if it is a valid number but the precision is invalid (too many decimal places)
        if (isValidNumberRegex.test(valAsString) && !precisionRegex.test(valAsString)) {
          // round and return with correct precision
          return valAsNumber.toFixed(decimalPrecision);
        }
      }
      return val.toString();
    },
    [decimalPrecision]
  );

  const onInputChange = React.useCallback(
    (valueAsNumber: number, valueAsString: string) => {
      onChange(valueAsString);

      if (internalIntent !== 'none') validate(valueAsString);
    },
    [internalIntent, onChange, validate]
  );

  return (
    <div style={style} className="numeric-input__wrapper">
      <BlueprintNumericInput
        asyncControl
        clampValueOnBlur={!!minMax}
        className={`numeric-input ${className}`}
        defaultValue={value}
        value={value}
        disabled={disabled}
        intent={disabled ? 'none' : internalIntent}
        max={minMax?.max}
        min={minMax?.min}
        onValueChange={onInputChange}
        onBlur={React.useCallback(
          e => {
            const isValid = validate(constrainToPrecision(e.target.value));
            if (isValid) {
              onChange(constrainToPrecision(e.target.value));
            }
          },
          [constrainToPrecision, onChange, validate]
        )}
        onButtonClick={React.useCallback(
          e => {
            const isValid = validate(constrainToPrecision(e.toString()));
            if (isValid) {
              onChange(constrainToPrecision(e.toString()));
            }
          },
          [constrainToPrecision, onChange, validate]
        )}
        placeholder={placeholder}
        title={tooltip}
        minorStepSize={minorStepSize}
        stepSize={step}
        majorStepSize={majorStepSize}
        width={widthPx}
        fill
        data-cy={cyData}
      />
    </div>
  );
}
