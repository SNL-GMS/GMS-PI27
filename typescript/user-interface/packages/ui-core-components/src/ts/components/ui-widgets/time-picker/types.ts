import type { ValidationDefinition } from '../../../util';
import type { Message } from '../form/types';

export interface TimePickerProps {
  date: Date;
  /** If false, the date picker widget button will not be displayed */
  datePickerEnabled: boolean;
  /** use a format that does not have minutes and second */
  shortFormat?: boolean;
  /** If true, fill the entire width of the parent container */
  fillWidth?: boolean;
  /** If true, the date picker is turned red - necessary so hold persists after re-render */
  hasHold?: boolean;
  /** If true, the date picker will be disabled */
  disabled?: boolean;
  /**
   * Custom validation definitions for more granular input control.
   * Uses {@link TimePickerDeprecatedProps.onError} if set.
   */
  validationDefinitions?: ValidationDefinition<Date>[];
  /** Overrides the default error message if the inputted string is a bad format */
  invalidFormatMessage?: Message;
  /** Callback fired when input is accepted */
  onChange(date: Date): void;
  /** Optional callback */
  onEnter?(): void;
  /** Callback fired when an invalid input is entered */
  setHold?(onHold: boolean): void;
  /** Used during validation if there is an error */
  onError?(value: Message): void;
}

/**
 * @deprecated
 * TimePicker Props.
 */
export interface TimePickerDeprecatedProps {
  date: Date;
  /** If false, the date picker widget button will not be displayed */
  datePickerEnabled: boolean;
  /** use a format that does not have minutes and second */
  shortFormat?: boolean;
  /** If true, fill the entire width of the parent container */
  fillWidth?: boolean;
  /** If true, the date picker is turned red - necessary so hold persists after re-render */
  hasHold?: boolean;
  /** If true, the date picker will be disabled */
  disabled?: boolean;
  /** Optional additional validation */
  isExternallyInvalid?: boolean;
  /** Callback fired when input is accepted, returns undefined if provided date isn't valid */
  onMaybeDate(date: Date | undefined): void;
  /** Callback fired when an invalid input is entered */
  setHold?(onHold: boolean): void;
  /** Optional callback */
  onEnter?(): void;
}

/**
 * @deprecated
 * TimePicker State
 */
export interface TimePickerDeprecatedState {
  isValid: boolean;
  // Whether or not the date picker widget from blueprint is displayed
  showDatePicker: boolean;
  // The currently displayed string in the date picker - not always a stringified date
  displayString: string;
  // If true, show the date picker below the element
  datePickerOnBottom: boolean;
}
