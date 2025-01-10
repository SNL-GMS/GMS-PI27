import { QcSegmentCategory } from '@gms/common-model/lib/qc-segment';
import { DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION, dateToString } from '@gms/common-util';
import type { ValidationDefinition } from '@gms/ui-core-components';
import { DialogItem, TimePicker } from '@gms/ui-core-components';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import React from 'react';

interface TimeValuesProps {
  isRejected: boolean;
  category: QcSegmentCategory | 'Unknown';
  startDate: Date;
  endDate: Date;
  startHold: boolean;
  endHold: boolean;
  dateStartValidationDefs: ValidationDefinition<Date>[];
  dateEndValidationDefs: ValidationDefinition<Date>[];
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  setStartHold: (hold: boolean) => void;
  setEndHold: (hold: boolean) => void;
  dateOnError: (value: Message) => void;
}

/**
 * Additional time-related items, extracted to it's own component to reduce complexity.
 */
export function TimeValues(props: TimeValuesProps): JSX.Element {
  const {
    isRejected,
    category,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    startHold,
    setStartHold,
    endHold,
    setEndHold,
    dateOnError,
    dateStartValidationDefs,
    dateEndValidationDefs
  } = props;
  return (
    <>
      <DialogItem
        label="Start time"
        required
        monospace
        value={
          ((isRejected || category === QcSegmentCategory.UNPROCESSED) && (
            <>{dateToString(startDate, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)}</>
          )) || (
            <TimePicker
              fillWidth
              date={startDate}
              datePickerEnabled
              onChange={setStartDate}
              hasHold={startHold}
              setHold={setStartHold}
              onError={dateOnError}
              validationDefinitions={dateStartValidationDefs}
              disabled={isRejected || category === QcSegmentCategory.UNPROCESSED}
            />
          )
        }
      />
      <DialogItem
        label="End time"
        required
        monospace
        value={
          ((isRejected || category === QcSegmentCategory.UNPROCESSED) && (
            <>{dateToString(endDate, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)}</>
          )) || (
            <TimePicker
              fillWidth
              date={endDate}
              datePickerEnabled
              onChange={setEndDate}
              hasHold={endHold}
              setHold={setEndHold}
              onError={dateOnError}
              validationDefinitions={dateEndValidationDefs}
              disabled={isRejected || category === QcSegmentCategory.UNPROCESSED}
            />
          )
        }
      />
    </>
  );
}
