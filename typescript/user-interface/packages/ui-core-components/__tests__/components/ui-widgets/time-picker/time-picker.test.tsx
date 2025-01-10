/* eslint-disable react/jsx-props-no-spreading */
import { Classes } from '@blueprintjs/core';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import { TimePicker } from '../../../../src/ts/components';
import type { TimePickerProps } from '../../../../src/ts/components/ui-widgets/time-picker/types';

const MOCK_TIME = 1611153271425;
Date.now = jest.fn(() => MOCK_TIME);
Date.constructor = jest.fn(() => new Date(MOCK_TIME));

const initialDate = new Date(Date.now());

const mockSetHold = jest.fn();
const mockOnChange = jest.fn();

const props: TimePickerProps = {
  date: initialDate,
  datePickerEnabled: true,
  setHold: mockSetHold,
  onChange: mockOnChange
};

describe('TimePicker', () => {
  it('is defined', () => {
    expect(TimePicker).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<TimePicker {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('renders with short format', () => {
    const { container } = render(<TimePicker {...props} shortFormat />);
    expect(container).toMatchSnapshot();
  });

  it('opens the calendar popover', () => {
    const { container } = render(<TimePicker {...props} />);

    expect(container.getElementsByClassName('time-picker')).toHaveLength(1);
    expect(container.getElementsByClassName('time-picker__date-picker')).toHaveLength(0);

    // expect(container).toMatchInlineSnapshot('1');

    // date picker button exists
    expect(
      container.getElementsByClassName(`${Classes.BUTTON} time-picker__date-picker-button`)
    ).toHaveLength(1);

    // click button
    fireEvent(
      container.getElementsByClassName(`${Classes.BUTTON} time-picker__date-picker-button`)[0],
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    );

    // Picker popover exists
    expect(container.getElementsByClassName('time-picker__date-picker')).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  it('shows invalid if junk data is entered and valid if a date is entered', () => {
    const { container } = render(<TimePicker {...props} />);

    const timePickerInput = container.getElementsByClassName('time-picker__input')[0];
    // Enter a non-date
    fireEvent.change(timePickerInput, {
      target: { value: 'foobar' }
    });

    // Validation should *not* occur until blur
    expect(mockSetHold).toHaveBeenCalledTimes(0);

    // Blur, now validation should run
    fireEvent.blur(timePickerInput);

    // Is now invalid
    expect(mockSetHold).toHaveBeenCalledWith(true);

    // Clear mocks for next test
    mockSetHold.mockClear();

    // Enter a valid date
    fireEvent.change(container.getElementsByClassName('time-picker__input')[0], {
      target: { value: '1970-01-01T00:00:00.000' }
    });

    // Now that it's invalid, validation will occur onChange

    // Callbacks are called
    expect(mockSetHold).toHaveBeenCalledWith(false);
  });
});
