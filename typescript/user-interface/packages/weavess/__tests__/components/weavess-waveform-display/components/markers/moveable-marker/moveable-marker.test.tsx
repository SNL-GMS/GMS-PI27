/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WeavessTypes } from '@gms/weavess-core';
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { MoveableMarker } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/moveable-marker/moveable-marker';
import type { MoveableMarkerProps } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/moveable-marker/types';

const timeRange = jest.fn(() => ({ startTimeSecs: 0, endTimeSecs: 1000 }));
const props: MoveableMarkerProps = {
  marker: {
    id: 'my-marker',
    color: '#ff0000',
    lineStyle: WeavessTypes.LineStyle.DASHED,
    timeSecs: 200,
    minTimeSecsConstraint: 15,
    maxTimeSecsConstraint: 600
  },
  percentageLocation: 80,
  labelWidthPx: 10,
  timeRange,
  getZoomRatio: jest.fn(() => 0.5),
  containerClientWidth: () => 900,
  viewportClientWidth: () => 900,
  onUpdateMarker: undefined,
  updateTimeWindowSelection: undefined,
  associatedStartMarker: {
    id: 'assoc-start-marker',
    color: 'ffff00',
    lineStyle: WeavessTypes.LineStyle.DASHED,
    timeSecs: 8,
    minTimeSecsConstraint: 5,
    maxTimeSecsConstraint: 100
  },
  associatedEndMarker: {
    id: 'assoc-end-marker',
    color: 'ffffff',
    lineStyle: WeavessTypes.LineStyle.DASHED,
    timeSecs: 650,
    minTimeSecsConstraint: 400,
    maxTimeSecsConstraint: 700
  }
};

describe('Weavess Moveable Marker', () => {
  it('Weavess Moveable Marker to be defined', () => {
    expect(MoveableMarker).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<MoveableMarker {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('can move marker', () => {
    const result = render(<MoveableMarker {...props} />);
    const selection = result.getByTestId('moveable-marker');

    fireEvent.mouseDown(selection);
    fireEvent.mouseMove(selection, { clientX: 200 });
    fireEvent.mouseUp(selection);
    // called 4 time when we move the marker
    expect(timeRange).toHaveBeenCalledTimes(4);
  });
  it('getMinConstraintPercentage', () => {
    const mm: any = new MoveableMarker(props);
    expect(mm.getMinConstraintPercentage()).toEqual(1.55);
  });

  it('getMaxConstraintPercentage', () => {
    const mm: any = new MoveableMarker(props);
    expect(mm.getMaxConstraintPercentage()).toEqual(59.95);
  });

  it('onMoveableMarkerClick', () => {
    const event: any = {
      stopPropagation: jest.fn(),
      target: {
        offsetLeft: 5
      },
      nativeEvent: {
        offsetX: 200,
        offsetY: 180
      }
    };

    const mm: any = new MoveableMarker(props);
    const spy = jest.spyOn(mm, 'onMoveableMarkerClick');
    mm.onMoveableMarkerClick(event);
    expect(spy).toHaveBeenCalled();
  });
});
