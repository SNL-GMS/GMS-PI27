import type { DateRange } from '@blueprintjs/datetime2';
import type { DateTimeFormat } from '@gms/common-util';
import {
  convertDateToUTCDate,
  convertUTCDateToDate,
  DATE_FORMAT,
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_HOUR,
  MILLISECONDS_IN_MINUTE,
  MINUTES_IN_HOUR
} from '@gms/common-util';
import moment from 'moment';
import React from 'react';

/** formats a date using the common util DATE_FORMAT */
export const formatDate = (date: Date): string => moment(date).format(DATE_FORMAT);

/**
 * Custom hook that builds the start date handlers for teh date range popup
 *
 * @param setSelectedDateRange function to set the popup date
 * @param setIsStartDateInvalid function to set the popup start date invalid flag
 * @param onNewInterval onNewInterval handler
 * @param parseDate function to parse the date
 * @param selectedDateRange current date range
 * @returns
 */
export const useDateRangePopupStartHandlers = (
  setSelectedDateRange,
  setIsStartDateInvalid,
  onNewInterval,
  parseDate,
  selectedDateRange
): {
  handleStartDateChange: (startDate: Date) => void;
  handleStartTimeChange: (startDate: Date) => void;
} => {
  const handleStartDateChange = React.useCallback(
    (startDate: Date | null) => {
      if (startDate) {
        if (parseDate(formatDate(startDate))) {
          setSelectedDateRange([startDate, selectedDateRange[1]]);
          if (onNewInterval && selectedDateRange[1]) {
            onNewInterval(
              convertUTCDateToDate(startDate).getTime(),
              convertUTCDateToDate(selectedDateRange[1]).getTime()
            );
          }
          setIsStartDateInvalid(false);
        } else {
          setIsStartDateInvalid(true);
          setSelectedDateRange([null, selectedDateRange[1]]);
        }
      }
    },
    [onNewInterval, parseDate, selectedDateRange, setIsStartDateInvalid, setSelectedDateRange]
  );

  const handleStartTimeChange = React.useCallback(
    (startDate: Date | null): void => {
      if (startDate) {
        startDate.setFullYear(
          selectedDateRange[0].getFullYear(),
          selectedDateRange[0].getMonth(),
          selectedDateRange[0].getDate()
        );
        if (parseDate(formatDate(startDate))) {
          setSelectedDateRange([startDate, selectedDateRange[1]]);
          if (onNewInterval && selectedDateRange[1]) {
            onNewInterval(
              convertUTCDateToDate(startDate).getTime(),
              convertUTCDateToDate(selectedDateRange[1]).getTime()
            );
          }
        }
      }
    },
    [onNewInterval, parseDate, selectedDateRange, setSelectedDateRange]
  );

  return { handleStartDateChange, handleStartTimeChange };
};

/**
 * Custom hook that builds the end date handlers for teh date range popup
 *
 * @param setSelectedDateRange function to set the popup date
 * @param setIsEndDateInvalid function to set the popup end date invalid flag
 * @param onNewInterval onNewInterval handler
 * @param parseDate function to parse the date
 * @param selectedDateRange current date range
 * @returns
 */
export const useDateRangePopupEndHandlers = (
  setSelectedDateRange,
  setIsEndDateInvalid,
  onNewInterval,
  parseDate,
  selectedDateRange
): {
  handleEndDateChange: (endDate: Date) => void;
  handleEndTimeChange: (endDate: Date) => void;
} => {
  const handleEndDateChange = React.useCallback(
    (endDate: Date) => {
      if (endDate) {
        if (parseDate(endDate.toString())) {
          setSelectedDateRange([selectedDateRange[0], endDate]);
          if (onNewInterval && selectedDateRange[0])
            onNewInterval(
              convertUTCDateToDate(selectedDateRange[0]).getTime(),
              convertUTCDateToDate(endDate).getTime()
            );
          setIsEndDateInvalid(false);
        } else {
          setIsEndDateInvalid(true);
          setSelectedDateRange([selectedDateRange[0], null]);
        }
      }
    },
    [onNewInterval, parseDate, selectedDateRange, setIsEndDateInvalid, setSelectedDateRange]
  );

  const handleEndTimeChange = React.useCallback(
    (endDate: Date) => {
      if (endDate) {
        endDate.setFullYear(
          selectedDateRange[1].getFullYear(),
          selectedDateRange[1].getMonth(),
          selectedDateRange[1].getDate()
        );
        if (parseDate(endDate.toString())) {
          setSelectedDateRange([selectedDateRange[0], endDate]);
          if (onNewInterval && selectedDateRange[0]) {
            onNewInterval(
              convertUTCDateToDate(selectedDateRange[0]).getTime(),
              convertUTCDateToDate(endDate).getTime()
            );
          }
        }
      }
    },
    [onNewInterval, parseDate, selectedDateRange, setSelectedDateRange]
  );

  return { handleEndDateChange, handleEndTimeChange };
};

/**
 * Custom hook that builds the date handlers for teh date range popup
 *
 * @param setSelectedDateRange function to set the popup date
 * @param setIsStartDateInvalid function to set the popup start date invalid flag
 * @param setIsEndDateInvalid function to set the popup end date invalid flag
 * @param onNewInterval onNewInterval handler
 * @param parseDate function to parse the date
 * @param selectedDateRange current date range
 * @returns
 */
export const useDateRangePopupDateHandlers = (
  setSelectedDateRange,
  setIsStartDateInvalid,
  setIsEndDateInvalid,
  onNewInterval,
  parseDate,
  selectedDateRange
): {
  handleDateRangeChange: (dateRange: DateRange) => void;
  handleStartDateChange: (startDate: Date) => void;
  handleStartTimeChange: (startDate: Date) => void;
  handleEndDateChange: (endDate: Date) => void;
  handleEndTimeChange: (endDate: Date) => void;
} => {
  const handleDateRangeChange = React.useCallback(
    (dateRange: DateRange) => {
      setSelectedDateRange(dateRange);
      setIsStartDateInvalid(false);
      setIsEndDateInvalid(false);
      if (onNewInterval && dateRange[0] && dateRange[1])
        onNewInterval(
          convertUTCDateToDate(dateRange[0]).getTime(),
          convertUTCDateToDate(dateRange[1]).getTime()
        );
    },
    [onNewInterval, setIsEndDateInvalid, setIsStartDateInvalid, setSelectedDateRange]
  );

  return {
    handleDateRangeChange,
    ...useDateRangePopupStartHandlers(
      setSelectedDateRange,
      setIsStartDateInvalid,
      onNewInterval,
      parseDate,
      selectedDateRange
    ),
    ...useDateRangePopupEndHandlers(
      setSelectedDateRange,
      setIsEndDateInvalid,
      onNewInterval,
      parseDate,
      selectedDateRange
    )
  };
};
/**
 * A hook that builds a referentially stable parse function based on the format param
 *
 * @param format a DateTimeFormat to use in the parse function
 * @returns
 */
export const useParseDate = (format: DateTimeFormat) => {
  return React.useCallback(
    (str: string): Date | false => {
      if (str) {
        // validate against JS date since it wont parse an invalid format
        const date = new Date(str);
        if (Number.isNaN(date.valueOf())) {
          return false;
        }
        return moment(str, format).toDate(); // return the moment parse instead since it handles UTC better;
      }
      return false;
    },
    [format]
  );
};
/**
 * A custom hook that sets up constants needed by the date range popup for utc conversion
 *
 * @param minStartTimeMs the minimum start time
 * @param maxEndTimeMs the maximum end time
 * @returns
 */
export const useDateRangePopupConstants = (
  minStartTimeMs: number | undefined,
  maxEndTimeMs: number | undefined
): {
  utcNow: number;
  utcMin: number;
  utcMax: number;
  isSingleMonth: boolean;
  minStartTime: Date;
  maxEndTime: Date;
} => {
  // Set up now with UTC offset.
  const now = Date.now();
  const utcNow = now + new Date(now).getTimezoneOffset() * MILLISECONDS_IN_MINUTE;

  // Convert min and max with UTC offset.
  const utcMin =
    minStartTimeMs !== undefined ? convertDateToUTCDate(new Date(minStartTimeMs)).getTime() : 0;
  const utcMax =
    maxEndTimeMs !== undefined
      ? convertDateToUTCDate(new Date(maxEndTimeMs)).getTime()
      : utcNow + MILLISECONDS_IN_DAY;

  let isSingleMonth = false;
  if (
    new Date(utcMax).getFullYear() === new Date(utcMin).getFullYear() &&
    new Date(utcMax).getMonth() === new Date(utcMin).getMonth()
  ) {
    isSingleMonth = true;
  }

  const minStartTime = new Date(new Date(0));

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  const maxEndTime = new Date(
    1970,
    0,
    1,
    23 - minStartTime.getTimezoneOffset() / MINUTES_IN_HOUR,
    59,
    59
  );
  /* eslint-enable @typescript-eslint/no-magic-numbers */

  return { utcNow, utcMin, utcMax, isSingleMonth, minStartTime, maxEndTime };
};

/**
 * a function to build the appropriate error message for the date range popover
 *
 * @param selectedDateRange current date range
 * @param format a DateTimeFormat to use in the parse function
 * @param maxSelectedRangeMs the maximum range that can be selected
 * @param utcMax the maximum end date in utc
 * @param utcMin the minimum start time in utc
 * @param isStartDateInvalid the start date flag
 * @param isEndDateInvalid the end date flag
 * @returns
 */
export const buildDateRangePopupErrorMessage = (
  selectedDateRange: [Date, Date],
  format: DateTimeFormat,
  maxSelectedRangeMs: number | undefined,
  utcMax: number,
  utcMin: number,
  isStartDateInvalid: boolean,
  isEndDateInvalid: boolean
) => {
  if (isStartDateInvalid) {
    return `Invalid Start Date`;
  }
  if (isEndDateInvalid) {
    return `Invalid End Date`;
  }
  if (selectedDateRange[0] == null || selectedDateRange[1] == null) {
    return '';
  }
  if (
    maxSelectedRangeMs != null &&
    selectedDateRange[0].getTime() + maxSelectedRangeMs < selectedDateRange[1].getTime()
  ) {
    const numHours = maxSelectedRangeMs / MILLISECONDS_IN_HOUR;
    return `Time Range exceeds maximum range of ${numHours} hours`;
  }
  if (selectedDateRange[0].getTime() >= selectedDateRange[1].getTime()) {
    return 'Start date overlaps end date';
  }
  if (selectedDateRange[0].getTime() < utcMin) {
    return `Start date is before minimum start date ${moment(new Date(utcMin)).format(format)}`;
  }
  if (selectedDateRange[1].getTime() > utcMax) {
    return `End date is after maximum end date ${moment(new Date(utcMax)).format(format)}`;
  }

  return '';
};
