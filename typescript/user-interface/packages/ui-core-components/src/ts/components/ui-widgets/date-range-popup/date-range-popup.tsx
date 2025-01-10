import {
  Button,
  ButtonGroup,
  Classes,
  Dialog,
  DialogBody,
  DialogFooter,
  Icon,
  Intent
} from '@blueprintjs/core';
import { Classes as DateTimeClasses, TimePicker } from '@blueprintjs/datetime';
import { DateInput2MigrationUtils, DateInput3, DateRangePicker3 } from '@blueprintjs/datetime2';
import { IconNames } from '@blueprintjs/icons';
import {
  convertDateToUTCDate,
  convertUTCDateToDate,
  DATE_TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';
import { convertTimeFormatToTimePrecision, useRestoreFocus } from '@gms/ui-util';
import debounce from 'lodash/debounce';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import {
  buildDateRangePopupErrorMessage,
  formatDate,
  useDateRangePopupConstants,
  useDateRangePopupDateHandlers,
  useParseDate
} from './date-range-popup-handlers';
import type { DateRangePopupProps, DurationOption } from './types';

const DELAY_MS = 200;

/**
 * ! blueprint specific workaround for an open issue they have see
 * https://github.com/palantir/blueprint/issues/3338
 * this work around is makes it that when clicking a shortcut doesn't dismiss the popover
 * once ticket is closed, should be removed
 * This maybe able to be removed in BP 3.48.
 */
export const removePopoverDismiss = (): void => {
  const shortcuts = document.querySelectorAll(
    `.${DateTimeClasses.DATERANGEPICKER_SHORTCUTS} li .${Classes.MENU_ITEM}`
  );
  shortcuts.forEach(shortcut => {
    shortcut.classList.remove(Classes.POPOVER_DISMISS);
  });
};

function InternalDateRangePopup(props: React.PropsWithChildren<DateRangePopupProps>) {
  const {
    startTimeMs,
    endTimeMs,
    format,
    durations,
    minStartTimeMs,
    maxEndTimeMs,
    maxSelectedRangeMs,
    isOpen,
    resetOnClose,
    title,
    children,
    applyText,
    cancelText,
    isLoading,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    onNewInterval,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    onApply,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    onClose
  } = props;
  const parseDate = useParseDate(format);
  const timePrecision = convertTimeFormatToTimePrecision(format);

  // convert incoming dates to UTC.  We are ignoring timezones in this file and converting between UTC on enter and exit to ensure UTC display
  // Need the null check because new Date(null) is the beginning on unix time

  const [selectedDateRange, setSelectedDateRange] = useState([
    startTimeMs !== null ? convertDateToUTCDate(new Date(startTimeMs)) : null,
    endTimeMs !== null ? convertDateToUTCDate(new Date(endTimeMs)) : null
  ] as [Date, Date]);

  const [isStartDateInvalid, setIsStartDateInvalid] = useState(false);
  const [isEndDateInvalid, setIsEndDateInvalid] = useState(false);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { storeFocus, restoreFocus } = useRestoreFocus();
  const { utcNow, utcMin, utcMax, isSingleMonth, minStartTime, maxEndTime } =
    useDateRangePopupConstants(minStartTimeMs, maxEndTimeMs);
  useEffect(() => {
    storeFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tempErrorMessage = useMemo(() => {
    return buildDateRangePopupErrorMessage(
      selectedDateRange,
      format,
      maxSelectedRangeMs,
      utcMax,
      utcMin,
      isStartDateInvalid,
      isEndDateInvalid
    );
  }, [
    selectedDateRange,
    format,
    maxSelectedRangeMs,
    utcMax,
    utcMin,
    isStartDateInvalid,
    isEndDateInvalid
  ]);
  useEffect(() => {
    // reset values on cleanup
    return () => {
      if (!isOpen && resetOnClose) {
        setSelectedDateRange([
          convertDateToUTCDate(new Date(startTimeMs)),
          convertDateToUTCDate(new Date(endTimeMs))
        ] as [Date, Date]);
      }
    };
  }, [endTimeMs, isOpen, resetOnClose, restoreFocus, startTimeMs]);

  const {
    handleDateRangeChange,
    handleStartDateChange,
    handleStartTimeChange,
    handleEndDateChange,
    handleEndTimeChange
  } = useDateRangePopupDateHandlers(
    setSelectedDateRange,
    setIsStartDateInvalid,
    setIsEndDateInvalid,
    onNewInterval,
    parseDate,
    selectedDateRange
  );

  const handleApplyButton = () => {
    const convertedStartTimeMs = convertUTCDateToDate(selectedDateRange[0]).getTime();
    const convertedEndTimeMs = convertUTCDateToDate(selectedDateRange[1]).getTime();
    onNewInterval(convertedStartTimeMs, convertedEndTimeMs);
    if (onApply) {
      onApply(convertedStartTimeMs, convertedEndTimeMs);
    }
    restoreFocus();
  };
  return (
    <Dialog
      className="open-anything__dialog date-range-dialog dialog_parent dialog_parent--wide"
      isOpen={isOpen}
      title={title}
      onClose={() => {
        restoreFocus();
        if (onClose) {
          onClose();
        }
      }}
      onOpened={removePopoverDismiss}
      shouldReturnFocusOnClose
    >
      <DialogBody>
        <div
          className={
            durations ? 'date-range-picker__selectors-durations' : 'date-range-picker__selectors'
          }
        >
          <div className="date-input-groups">
            <div
              className="date-input-group"
              data-cy="start-date-input"
              // new Date??
              data-start-time={new Date(selectedDateRange[0]).getTime()}
              data-start-date={moment(selectedDateRange[0]).format(
                DATE_TIME_FORMAT_WITH_SECOND_PRECISION
              )}
            >
              <span className="date-input-label">Start</span>
              <DateInput3
                className="date-input"
                data-cy="start_date"
                value={DateInput2MigrationUtils.valueAdapter(selectedDateRange[0])}
                onChange={DateInput2MigrationUtils.onChangeAdapter(date => {
                  if (date) {
                    handleStartDateChange(date);
                  }
                })}
                formatDate={formatDate}
                parseDate={parseDate}
                popoverProps={{ isOpen: false, shouldReturnFocusOnClose: true }}
                minDate={new Date(utcMin)}
                maxDate={new Date(utcMax)}
              />
              <TimePicker
                className="time-input"
                data-cy="start_time"
                showArrowButtons
                precision={timePrecision}
                value={selectedDateRange[0]}
                onChange={handleStartTimeChange}
                minTime={minStartTime}
                maxTime={maxEndTime}
              />
            </div>
            <div
              className="date-input-group"
              data-cy="end-date-input"
              data-end-time={new Date(selectedDateRange[1]).getTime()}
              data-end-date={moment(selectedDateRange[1]).format(
                DATE_TIME_FORMAT_WITH_SECOND_PRECISION
              )}
            >
              <span className="date-input-label">End</span>
              <DateInput3
                className="date-input"
                data-cy="end_date"
                value={DateInput2MigrationUtils.valueAdapter(selectedDateRange[1])}
                formatDate={formatDate}
                parseDate={parseDate}
                popoverProps={{ isOpen: false, shouldReturnFocusOnClose: true }}
                onChange={DateInput2MigrationUtils.onChangeAdapter(date => {
                  if (date) {
                    handleEndDateChange(date);
                  }
                })}
                minDate={new Date(utcMin)}
                maxDate={new Date(utcMax)}
              />
              <TimePicker
                className="time-input"
                data-cy="end_time"
                showArrowButtons
                precision={timePrecision}
                value={selectedDateRange[1]}
                onChange={handleEndTimeChange}
                minTime={minStartTime}
                maxTime={maxEndTime}
              />
            </div>
          </div>
          <div className="calendar-group">
            <DateRangePicker3
              className="date-range-popup__range-input"
              value={selectedDateRange}
              onChange={debounce(handleDateRangeChange, DELAY_MS)}
              shortcuts={
                durations
                  ? durations.map((item: DurationOption) => ({
                      dateRange: [new Date(utcNow - item.value), new Date(utcNow)] as [Date, Date],
                      includeTime: true,
                      label: item.description
                    }))
                  : false
              }
              contiguousCalendarMonths
              allowSingleDayRange
              minDate={new Date(utcMin)}
              maxDate={new Date(utcMax)}
              dayPickerProps={{
                className: 'date-range-picker--column'
              }}
            />
            {isSingleMonth ? <div className="calendar-place-holder">Month out of range </div> : ''}
          </div>
          {children}
        </div>
        <div className={durations ? 'date-input-error-durations' : 'date-input-error'}>
          <Icon
            icon={tempErrorMessage ? IconNames.ERROR : null}
            className="date-input-error-icon"
            size={16}
          />
          <div className="date-input-error-text"> {tempErrorMessage} </div>
        </div>
      </DialogBody>
      <DialogFooter
        minimal
        actions={
          <ButtonGroup>
            <Button
              text={cancelText || 'Cancel'}
              data-cy="date-picker-cancel-button"
              onClick={() => {
                restoreFocus();
                if (onClose) {
                  onClose();
                }
              }}
            />
            <Button
              text={applyText || 'Apply'}
              data-cy="date-picker-apply-button"
              intent={Intent.PRIMARY}
              onClick={handleApplyButton}
              loading={isLoading}
              disabled={
                tempErrorMessage !== '' ||
                selectedDateRange[0] == null ||
                selectedDateRange[1] == null
              }
            />
          </ButtonGroup>
        }
      />
    </Dialog>
  );
}

export const DateRangePopup = React.memo(InternalDateRangePopup);
