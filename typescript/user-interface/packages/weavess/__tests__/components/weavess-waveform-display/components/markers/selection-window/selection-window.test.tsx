/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WeavessTypes } from '@gms/weavess-core';
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { SelectionWindow } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/selection-window/selection-window';
import type { SelectionWindowProps } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/selection-window/types';
import { SelectionWindowBoundaryMarkerType } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/selection-window/types';

jest.mock('lodash/debounce', () => {
  return fn => {
    fn();
    // eslint-disable-next-line no-param-reassign
    fn.cancel = jest.fn();
    return fn;
  };
});
const selectionWindowRef = {
  containerRef: {
    style: { left: 1, right: 2 }
  },
  offsetLeft: 10
};
const testRect = {
  width: 1000,
  left: 0
};
const onMouseMove = jest.fn();
const onMouseDown = jest.fn();
const onMouseUp = jest.fn();
let position = 0;
const props: SelectionWindowProps = {
  selectionWindow: {
    id: 'selection-window',
    startMarker: {
      id: 'my-start-marker',
      color: '#ff0000',
      lineStyle: WeavessTypes.LineStyle.DASHED,
      timeSecs: 200,
      minTimeSecsConstraint: 15,
      maxTimeSecsConstraint: 600
    },
    endMarker: {
      id: 'my-end-marker',
      color: '#ff0000',
      lineStyle: WeavessTypes.LineStyle.DASHED,
      timeSecs: 400,
      minTimeSecsConstraint: 15,
      maxTimeSecsConstraint: 600
    },
    color: '#ff0000',
    isMoveable: true
  },
  minimumSelectionWindowDuration: { durationInSeconds: 1, onDurationReached: jest.fn() },
  labelWidthPx: 5,
  timeRange: jest.fn(() => ({ startTimeSecs: 0, endTimeSecs: 1000 })),
  getZoomRatio: jest.fn(() => 0.5),
  canvasRef: jest.fn().mockReturnValue({
    rect: testRect,
    getBoundingClientRect: jest.fn(() => testRect),
    offsetWidth: 1,
    offsetHeight: 1
  }),
  containerClientWidth: jest.fn(() => 800),
  viewportClientWidth: jest.fn(() => 800),
  computeTimeSecsForMouseXPosition: jest.fn(() => {
    position += 10;
    return position;
  }),
  onMoveSelectionWindow: jest.fn(),
  onUpdateSelectionWindow: jest.fn(),
  onClickSelectionWindow: jest.fn(),
  onMouseMove,
  onMouseDown,
  onMouseUp
};

const event: any = {
  clientX: 50,
  stopPropagation: jest.fn(),
  target: {
    offsetLeft: 5,
    style: { right: 1, left: 2 }
  },
  nativeEvent: {
    offsetX: 200,
    offsetY: 180
  }
};

describe('Weavess SelectionWindow Marker', () => {
  it('Weavess Selection Window to be defined', () => {
    expect(SelectionWindow).toBeDefined();
  });

  it('renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<SelectionWindow {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('onSelectionWindowClick', () => {
    const sw: any = new SelectionWindow(props);
    const spy = jest.spyOn(sw, 'onSelectionWindowClick');
    const spy2 = jest.spyOn(sw, 'getTimeSecsForClientX');
    sw.onSelectionWindowClick(event);
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    event.clientX = 500;
    const moveEvent = {
      ...event,
      clientX: 500
    };
    let mouse = new MouseEvent('mousemove', moveEvent);
    expect(document.body.dispatchEvent(mouse)).toBeTruthy();
    mouse = new MouseEvent('mouseup', moveEvent);
    expect(document.body.dispatchEvent(mouse)).toBeTruthy();
  });

  it('onSelectionWindowClick handleSingleDoubleClick', () => {
    const sw: any = new SelectionWindow(props);
    sw.onSelectionWindowClick(event);
    const mouse = new MouseEvent('mouseup', event);
    expect(document.body.dispatchEvent(mouse)).toBeTruthy();
  });

  it('onMarkerUpdated', () => {
    const sw: any = new SelectionWindow(props);
    const spy = jest.spyOn(sw, 'onMarkerUpdated');
    sw.onMarkerUpdated(SelectionWindowBoundaryMarkerType.LEAD, 1);
    expect(spy).toHaveBeenCalled();
  });

  it('updateSelectionWindowPosition', () => {
    const sw: any = new SelectionWindow(props);
    sw.selectionWindowRef = selectionWindowRef;
    sw.mouseDown = true;
    sw.onSelectionWindowClick(event);
    const spy = jest.spyOn(sw, 'updateSelectionWindowPosition');
    sw.updateSelectionWindowPosition(10);
    expect(spy).toHaveBeenCalled();
  });

  it('getTimeSecsForClientX', () => {
    const sw: any = new SelectionWindow(props);
    const spy = jest.spyOn(sw, 'getTimeSecsForClientX');
    sw.getTimeSecsForClientX(event);
    expect(spy).toHaveBeenCalled();
  });

  it('can handle drag events', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<SelectionWindow {...props} />);
    const selection = result.getByTestId('selection-window');

    fireEvent.mouseDown(selection);
    fireEvent.mouseMove(selection, { clientX: 200 });
    fireEvent.mouseUp(selection);
    expect((onMouseDown.mock.calls[0][0] as React.SyntheticEvent).type).toMatchInlineSnapshot(
      `"mousedown"`
    );
    expect((onMouseMove.mock.calls[0][0] as React.SyntheticEvent).type).toMatchInlineSnapshot(
      `"mousemove"`
    );
    expect((onMouseUp.mock.calls[0][0] as React.SyntheticEvent).type).toMatchInlineSnapshot(
      `"mouseup"`
    );
  });

  it('can update onSelectionWindow function', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<SelectionWindow {...props} />);
    const newOnMoveSelectionWindow = jest.fn();
    result.rerender(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <SelectionWindow {...{ ...props, onMoveSelectionWindow: newOnMoveSelectionWindow }} />
    );
    expect(newOnMoveSelectionWindow).toHaveBeenCalledTimes(1);
  });

  it('componentDidCatch', () => {
    const instance = new SelectionWindow(props);
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toHaveBeenCalled();
  });
});
