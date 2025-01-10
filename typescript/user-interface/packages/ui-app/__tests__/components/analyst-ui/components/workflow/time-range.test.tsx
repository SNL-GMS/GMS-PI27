/* eslint-disable @typescript-eslint/no-magic-numbers */
import { SECONDS_IN_HOUR } from '@gms/common-util';
import { render } from '@testing-library/react';
import React from 'react';

import type { TimeRangeProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/time-range';
import { TimeRange } from '../../../../../src/ts/components/analyst-ui/components/workflow/time-range';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const secondsForDayPlus10 = SECONDS_IN_HOUR * 24 + 10;

const props: TimeRangeProps = {
  startTime: 0,
  endTime: secondsForDayPlus10
};

describe('workflow time axis tests', () => {
  it('is exported', () => {
    expect(TimeRange).toBeDefined();
  });

  it('matches snapshot', () => {
    const component = render(<TimeRange startTime={props.startTime} endTime={props.endTime} />);
    expect(component.baseElement).toMatchSnapshot();
  });
});
