import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { SelectionWindowBoundaryMarker } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/selection-window/selection-window-boundary-marker';
import {
  type SelectionWindowBoundaryMarkerProps,
  SelectionWindowBoundaryMarkerType
} from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/selection-window/types';

const timeRange = jest.fn(() => ({ startTimeSecs: 0, endTimeSecs: 1000 }));
const props: SelectionWindowBoundaryMarkerProps = {
  boundaryType: SelectionWindowBoundaryMarkerType.LEAD,
  timeSecs: 1,
  timeRange,

  onMarkerUpdated: jest.fn(),
  getTimeSecsForClientX: jest.fn(),
  setIsUpdating: jest.fn()
};

describe('Weavess Selection Window Boundary Marker', () => {
  it('renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<SelectionWindowBoundaryMarker {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('can move marker', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<SelectionWindowBoundaryMarker {...props} />);
    const selection = result.getByTestId('selection-window-boundary-marker');

    fireEvent.mouseDown(selection);
    fireEvent.mouseMove(selection, { clientX: 200 });
    fireEvent.mouseUp(selection);
    // called 4 time when we move the marker
    expect(timeRange).toHaveBeenCalledTimes(2);
  });

  it('componentDidCatch', () => {
    const instance = new SelectionWindowBoundaryMarker(props);
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toHaveBeenCalled();
  });
});
