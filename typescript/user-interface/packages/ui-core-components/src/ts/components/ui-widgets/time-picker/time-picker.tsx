import { Button, InputGroup, Intent } from '@blueprintjs/core';
import { DatePicker3, TimePrecision } from '@blueprintjs/datetime2';
import { IconNames } from '@blueprintjs/icons';
import {
  convertDateToUTCDate,
  convertUTCDateToDate,
  dateToString,
  ISO_DATE_TIME_FORMAT,
  ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  stringToDate
} from '@gms/common-util';
import React from 'react';

import type { ValidationDefinition } from '../../../util';
import { getValidator } from '../../../util';
import type { Message } from '../form/types';
import type { TimePickerProps } from './types';

/**
 * Timepicker component that allows entering time in ISO format.
 * Includes base validation for proper format, with support for additional
 * validation definitions using {@link ValidationDefinition}s
 */
export function TimePicker({
  date,
  datePickerEnabled,
  shortFormat,
  fillWidth,
  hasHold,
  disabled,
  validationDefinitions,
  onChange,
  onEnter,
  setHold,
  onError,
  invalidFormatMessage = {
    summary: 'Invalid date format',
    details: `Valid dates should be of the form: YYYY-MM-DDTHH:mm${
      shortFormat ? '' : ':ss (seconds may include decimals)'
    }`
  }
}: Readonly<TimePickerProps>) {
  const timePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [invalid, setInvalid] = React.useState<boolean>(false);

  /** This is used by the InputGroup to display the date as UTC */
  const [displayString, setDisplayString] = React.useState<string>(
    shortFormat
      ? dateToString(date, ISO_DATE_TIME_FORMAT)
      : dateToString(date, ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  );
  /** Whether or not the date picker widget from blueprint is displayed */
  const [showDatePicker, setShowDatePicker] = React.useState<boolean>(false);
  /** If true, show the date picker below the element */
  const [datePickerOnBottom, setDatePickerOnBottom] = React.useState<boolean>(false);

  const formatValidationDefs: ValidationDefinition<string>[] = [
    {
      valueIsInvalid: input => {
        const regex: RegExp = shortFormat
          ? /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d/g
          : /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d+/g;

        return !regex.test(input);
      },
      invalidMessage: invalidFormatMessage
    },
    {
      valueIsInvalid: input => {
        const maybeNewDate = convertUTCDateToDate(stringToDate(input));
        return Number.isNaN(maybeNewDate.getTime());
      },
      invalidMessage: { summary: 'Not a valid date' }
    }
  ];

  const internalOnError = React.useCallback(
    (isInvalid: boolean, invalidMessage: Message | undefined) => {
      setInvalid(isInvalid);
      if (setHold) setHold(isInvalid);
      if (onError && invalidMessage) onError(invalidMessage);
    },
    [onError, setHold]
  );

  const validateFormat = getValidator<string>(internalOnError, formatValidationDefs);

  const validateDate = getValidator<Date>(internalOnError, validationDefinitions ?? []);

  /**
   * Hides the date picker in response to a mouse click outside of the date picker
   */
  const hideDatePickerOnClick = React.useCallback((e: MouseEvent): void => {
    if (e.target instanceof HTMLElement) {
      let { parentElement } = e.target;
      let hideDatePicker = true;
      while (parentElement && hideDatePicker) {
        if (
          parentElement?.classList &&
          parentElement.classList.contains('time-picker__date-picker')
        ) {
          hideDatePicker = false;
        }
        parentElement = parentElement.parentElement;
      }
      if (hideDatePicker) {
        e.stopPropagation();
        document.body.removeEventListener('click', hideDatePickerOnClick);
        setShowDatePicker(false);
      }
    }
  }, []);

  /**
   * Positions the date picker
   */
  const repositionDatePicker = React.useCallback(() => {
    if (timePickerRef.current && showDatePicker) {
      const MIN_HEIGHT_OF_DATE_PICKER_PX = 233;

      const elemRect = timePickerRef.current.getBoundingClientRect();
      let container = timePickerRef.current.parentElement;

      // If the time picker is in a normal div, then we use the golden layout component
      // to decide if it's off screen
      if (!container) {
        return;
      }
      while (container.className !== 'lm_content') {
        container = container.parentElement;
        if (!container) {
          break;
        }
      }
      // Otherwise, we use the document body [occurs if time picker is in context menu]
      if (!container) {
        container = document.body;
      }
      const containerRect = container.getBoundingClientRect();

      if (elemRect.top - MIN_HEIGHT_OF_DATE_PICKER_PX < containerRect.top) {
        setDatePickerOnBottom(true);
      }
    }
  }, [showDatePicker]);

  /**
   * On change handler for the date picker
   *
   * @param inputDate the day clicked on by the user
   * @param isUserChange true if the user selected a day, and false if the date was automatically
   * changed by the user navigating to a new month or year rather than explicitly clicking on a
   * date in the calendar
   */
  const datePickerOnChange = React.useCallback(
    (inputDate: Date | null, isUserChange: boolean) => {
      if (!inputDate) {
        setShowDatePicker(false);
      } else if (isUserChange) {
        const convertedDate = convertUTCDateToDate(inputDate);
        onChange(convertedDate);
        validateDate(convertedDate);

        setDisplayString(
          shortFormat
            ? dateToString(convertedDate, ISO_DATE_TIME_FORMAT)
            : dateToString(convertedDate, ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
        );
      }
    },
    [onChange, shortFormat, validateDate]
  );

  /**
   * enter key handler for the text area
   */
  const inputGroupOnKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.code === 'Enter') {
        e.preventDefault();
        if (onEnter) {
          onEnter();
        }
      }
    },
    [onEnter]
  );

  /**
   * On change handler for the text area
   */
  const inputGroupOnChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayString(e.target.value);

      if (invalid) {
        validateFormat(e.target.value);
      }
    },
    [invalid, validateFormat]
  );

  const inputGroupOnBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement, Element>) => {
      const valid = validateFormat(e.target.value);
      const maybeNewDate = convertUTCDateToDate(stringToDate(e.target.value));
      if (valid) {
        onChange(maybeNewDate);
        validateDate(maybeNewDate);
      }
    },
    [onChange, validateDate, validateFormat]
  );

  /**
   * Helper method to build the class names
   *
   * @returns classNames for the timePicker, button, and text input group
   */
  const buildClassNames = React.useCallback(() => {
    const timePickerClassName = datePickerOnBottom
      ? 'time-picker__date-picker time-picker__date-picker--bottom'
      : 'time-picker__date-picker';

    const buttonClassName = showDatePicker
      ? 'time-picker__date-picker-button time-picker__date-picker-button--active'
      : 'time-picker__date-picker-button';
    const textInputClassName = 'time-picker__input';

    let inputGroupClassName = 'time-picker__input-group';
    if (shortFormat) inputGroupClassName = `${inputGroupClassName}--short-format`;
    else if (fillWidth) inputGroupClassName = `${inputGroupClassName}--fill`;

    return { timePickerClassName, buttonClassName, textInputClassName, inputGroupClassName };
  }, [datePickerOnBottom, fillWidth, shortFormat, showDatePicker]);

  const datePickerButtonOnClick = React.useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.stopPropagation();
      setShowDatePicker(prev => !prev);
    },
    []
  );

  const { timePickerClassName, buttonClassName, textInputClassName, inputGroupClassName } =
    buildClassNames();
  //! useEffect updates local state
  React.useEffect(() => {
    repositionDatePicker();
    if (showDatePicker) {
      document.body.addEventListener('click', hideDatePickerOnClick);
    }
    return () => {
      // Cleanup
      document.body.removeEventListener('click', hideDatePickerOnClick);
    };
  }, [hideDatePickerOnClick, repositionDatePicker, showDatePicker]);

  //! useEffect updates local state
  React.useEffect(() => {
    setDisplayString(
      shortFormat
        ? dateToString(date, ISO_DATE_TIME_FORMAT)
        : dateToString(date, ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
    );
  }, [date, shortFormat]);

  return (
    <div
      className="time-picker"
      ref={ref => {
        if (ref) {
          timePickerRef.current = ref;
        }
      }}
    >
      <InputGroup
        value={displayString}
        disabled={disabled}
        inputMode="text"
        className={inputGroupClassName}
        inputClassName={textInputClassName}
        onBlur={inputGroupOnBlur}
        onKeyDown={inputGroupOnKeyDown}
        onChange={inputGroupOnChange}
        intent={invalid && hasHold ? Intent.DANGER : Intent.NONE}
      />
      {showDatePicker && (
        <DatePicker3
          className={timePickerClassName}
          // This needs to be converted so the timepicker displays it as UTC
          value={convertDateToUTCDate(date)}
          timePrecision={TimePrecision.MILLISECOND}
          timePickerProps={{ showArrowButtons: true }}
          onChange={datePickerOnChange}
        />
      )}
      {datePickerEnabled && (
        <Button
          icon={IconNames.CALENDAR}
          onClick={datePickerButtonOnClick}
          className={buttonClassName}
          intent={invalid && hasHold ? Intent.DANGER : Intent.NONE}
          disabled={disabled}
          title="Choose a date and time"
        />
      )}
    </div>
  );
}
