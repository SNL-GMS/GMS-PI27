/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  DATE_TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { DateRangePicker } from '../../../../src/ts/components/ui-widgets/date-range-picker';

const MOCK_TIME = 1609506000000;

const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

describe('DateRangePicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_TIME);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(DateRangePicker).toBeDefined();
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <DateRangePicker
        durations={[
          {
            description: 'one second',
            value: 1000
          },
          {
            description: 'two seconds',
            value: 2000
          }
        ]}
        startTimeMs={MOCK_TIME - 2000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('matches the snapshot with fractional second precision format', () => {
    const { container } = render(
      <DateRangePicker
        durations={[
          {
            description: 'one second',
            value: 1000
          },
          {
            description: 'two seconds',
            value: 2000
          }
        ]}
        startTimeMs={MOCK_TIME - 2000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        format={DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('matches the snapshot with second precision format', () => {
    const { container } = render(
      <DateRangePicker
        durations={[
          {
            description: 'one second',
            value: 1000
          },
          {
            description: 'two seconds',
            value: 2000
          }
        ]}
        startTimeMs={MOCK_TIME - 2000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        format={DATE_TIME_FORMAT_WITH_SECOND_PRECISION}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('opens and closes the popup', async () => {
    render(
      <DateRangePicker
        durations={[
          {
            description: 'one second',
            value: 1000
          },
          {
            description: 'two seconds',
            value: 2000
          }
        ]}
        startTimeMs={MOCK_TIME - 2000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
