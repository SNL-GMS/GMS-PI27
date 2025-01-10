/* eslint-disable @blueprintjs/classes-constants */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { DATE_TIME_FORMAT, MILLISECONDS_IN_DAY } from '@gms/common-util';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { DateRangePopup } from '../../../../src/ts/components/ui-widgets/date-range-popup';

const MOCK_TIME = 1609506000000;

describe('DateRangePopup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_TIME);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(Date.now()).toEqual(MOCK_TIME);
    expect(DateRangePopup).toBeDefined();
  });

  it('matches the snapshot', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );
    expect(component).toMatchSnapshot();
    component.unmount();
  });

  it('matches the duration snapshot', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        durations={[{ description: 'last 24 hours', value: MILLISECONDS_IN_DAY }]}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );
    expect(component).toMatchSnapshot();
    component.unmount();
  });

  it('overlapping dates are not useable', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME}
        endTimeMs={MOCK_TIME - 10000}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    expect(component).toMatchSnapshot();
    const openButton = component.getByRole('button', { name: 'Apply' });
    // toBeDisabled() from testing-library/jest-dom matchers can't be found, so using this instead
    expect(openButton.classList.contains('bp5-disabled')).toBeTruthy();

    component.unmount();
  });

  it('out of range start dates are not useable', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={0}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    jest.runAllTimers();

    const openButton = component.getByRole('button', { name: 'Apply' });
    // toBeDisabled() from testing-library/jest-dom matchers can't be found, so using this instead
    expect(openButton.classList.contains('bp5-disabled')).toBeTruthy();
    const errorText = component.queryByText(
      'Start date is before minimum start date 2020-12-31 13:00'
    );
    expect(errorText).not.toBeNull();
    component.unmount();
  });

  it('out of range end dates are not useable', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME}
        endTimeMs={MOCK_TIME + 2 * MILLISECONDS_IN_DAY}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.getByRole('button', { name: 'Apply' });
    // toBeDisabled() from testing-library/jest-dom matchers can't be found, so using this instead
    expect(openButton.classList.contains('bp5-disabled')).toBeTruthy();

    component.unmount();
  });

  it('dates exceeding maximum range are unusable', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        maxSelectedRangeMs={1}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.getByRole('button', { name: 'Apply' });
    // toBeDisabled() from testing-library/jest-dom matchers can't be found, so using this instead
    expect(openButton.classList.contains('bp5-disabled')).toBeTruthy();

    component.unmount();
  });

  it('valid dates are usable', () => {
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.getByRole('button', { name: 'Apply' });
    // toBeDisabled() from testing-library/jest-dom matchers can't be found, so using this instead
    expect(openButton.classList.contains('bp5-disabled')).toBeFalsy();

    component.unmount();
  });

  it('apply button calls methods', () => {
    const onApply = jest.fn();
    const onNewInterval = jest.fn();
    const onClose = jest.fn();
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={onNewInterval}
        onApply={onApply}
        onClose={onClose}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.getByRole('button', { name: 'Apply' });
    fireEvent.click(openButton);
    expect(onApply).toHaveBeenCalled();
    expect(onNewInterval).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(0);

    component.unmount();
  });

  it('apply button is disabled while loading', () => {
    const component = render(
      <DateRangePopup
        isOpen
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
        isLoading
        onNewInterval={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('close button calls methods', () => {
    const onApply = jest.fn();
    const onNewInterval = jest.fn();
    const onClose = jest.fn();
    const isOpen = true;
    const component = render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={onNewInterval}
        onApply={onApply}
        onClose={onClose}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.getByRole('button', { name: 'Cancel' });
    fireEvent.click(openButton);
    expect(onApply).toHaveBeenCalledTimes(0);
    expect(onNewInterval).toHaveBeenCalledTimes(0);
    expect(onClose).toHaveBeenCalled();

    component.unmount();
  });

  it('handles start time changing', () => {
    const isOpen = true;
    const onNewInterval = jest.fn();
    render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={onNewInterval}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const initialStartTime = new Date(MOCK_TIME - 10000);
    const newStartTime = new Date(initialStartTime);
    newStartTime.setHours(13, 19);
    const hoursElement = screen.getByDisplayValue(initialStartTime.getHours());
    const minutesElement = screen.getByDisplayValue(initialStartTime.getMinutes());

    fireEvent.change(hoursElement, {
      bubbles: true,
      target: { value: newStartTime.getHours() }
    });
    fireEvent.blur(hoursElement);

    fireEvent.change(minutesElement, {
      bubbles: true,
      target: { value: newStartTime.getMinutes() }
    });
    fireEvent.blur(minutesElement);

    fireEvent.click(screen.getByText('Apply'));

    expect(onNewInterval).toHaveBeenCalledWith(new Date(newStartTime).valueOf(), MOCK_TIME);
  });

  it('handles end time changing', () => {
    const isOpen = true;
    const onNewInterval = jest.fn();
    const mockEnd = new Date(MOCK_TIME).setMinutes(22);
    render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={mockEnd}
        onNewInterval={onNewInterval}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const initialEndTime = new Date(mockEnd);
    const newEndTime = new Date(initialEndTime);
    newEndTime.setHours(13, 44);
    const hoursElement = screen.getByDisplayValue(initialEndTime.getHours());
    const minutesElement = screen.getByDisplayValue(initialEndTime.getMinutes());

    fireEvent.change(hoursElement, {
      bubbles: true,
      target: { value: newEndTime.getHours() }
    });
    fireEvent.blur(hoursElement);

    fireEvent.change(minutesElement, {
      bubbles: true,
      target: { value: newEndTime.getMinutes() }
    });
    fireEvent.blur(minutesElement);

    fireEvent.click(screen.getByText('Apply'));

    expect(onNewInterval).toHaveBeenCalledWith(MOCK_TIME - 10000, newEndTime.valueOf());
  });

  it('handles start date changing after end date', () => {
    const isOpen = true;
    const onNewInterval = jest.fn();
    render(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={onNewInterval}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const initialStartDate = new Date(MOCK_TIME - 10000);
    const initialStartDateString = initialStartDate.toISOString().split('T')[0];

    const newStartDateOverlap = new Date(initialStartDate);
    newStartDateOverlap.setDate(2);

    const newStartDateBigChange = new Date(initialStartDate);
    newStartDateBigChange.setFullYear(initialStartDate.getFullYear() - 1);

    const startDateElement = screen.getAllByDisplayValue(initialStartDateString)[0];

    fireEvent.change(startDateElement, {
      bubbles: true,
      target: { value: newStartDateOverlap.toISOString().split('T')[0] }
    });
    fireEvent.blur(startDateElement);

    expect(screen.findByText('Start date overlaps end date')).toBeDefined();
  });
});
