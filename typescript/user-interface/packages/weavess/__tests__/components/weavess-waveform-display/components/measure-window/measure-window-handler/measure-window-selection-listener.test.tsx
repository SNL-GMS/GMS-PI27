/* eslint-disable jsx-a11y/no-static-element-interactions */
import { render } from '@testing-library/react';
import * as React from 'react';

import { MeasureWindowSelectionListener } from '../../../../../../src/ts/components/weavess-waveform-display/components/measure-window/measure-window-selection/measure-window-selection-listener';
import { initialConfiguration } from '../../../../../__data__/test-util-data';

describe('Measure window selection', () => {
  const toaster = jest.fn();
  const updater = jest.fn();
  const computer = jest.fn(clientX => {
    return 100 + Number(clientX);
  });
  const dummyEvent = {
    preventDefault: jest.fn(),
    shiftKey: true,
    clientX: 50,
    clientY: 50,
    altKey: false,
    stopPropagation: jest.fn(() => true)
  } as unknown as React.MouseEvent<HTMLDivElement>;

  it('should return a contentRenderer that matches a snapshot', () => {
    const resultElement = render(
      <MeasureWindowSelectionListener
        disabled={false}
        displayInterval={{
          startTimeSecs: 0,
          endTimeSecs: 1000
        }}
        offsetSecs={0}
        isMeasureWindowEnabled={jest.fn(() => true)}
        toast={toaster}
        hotKeys={initialConfiguration.hotKeys}
        updateMeasureWindowPanel={updater}
        computeTimeSecsFromMouseXPixels={computer}
      >
        {({ contentRenderer, onMouseDown }) => {
          return (
            <>
              <div id="START" onMouseDown={() => onMouseDown(dummyEvent)} />
              {contentRenderer}
            </>
          );
        }}
      </MeasureWindowSelectionListener>
    );
    expect(resultElement.container).toMatchSnapshot();
  });
});
