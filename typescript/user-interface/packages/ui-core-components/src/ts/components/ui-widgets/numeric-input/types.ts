import type { Intent } from '@blueprintjs/core';

import type { ValidationDefinition } from '../../../util';
import type { Message } from '../form/types';
import type { MinMax } from '../toolbar/types';

export interface NumericInputProps {
  value: number | string;
  intentOverride?: Intent;
  tooltip: string;
  decimalPrecision?: number;
  placeholder?: string;
  widthPx?: number;
  disabled?: boolean;
  /**
   * Minimum and maximum values. This value will not be used for
   * validation if {@link NumericInputProps.validationDefinitions} is set
   */
  minMax?: MinMax;
  majorStepSize?: number;
  minorStepSize?: number;
  className?: string;
  step?: number;
  /** data field for testing */
  cyData?: string;
  onChange(value: number | string): void;
  /**
   * Custom validation definitions for more granular input control.
   * Uses {@link NumericInputProps.onError} if set.
   */
  validationDefinitions?: ValidationDefinition<number | string>[];
  /** Used during validation if there is an error */
  onError?(value: Message): void;
}
