import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import type { UncertaintyMarkerProps } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/uncertainty-marker/types';
import { UncertaintyMarker } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/uncertainty-marker/uncertainty-marker';
import { initialConfiguration } from '../../../../../__data__/test-util-data';

const timeRange = {
  startTimeSecs: 1000,
  endTimeSecs: 2000
};
const mockSetIsEditingTimeUncertainty = jest.fn().mockReturnValue(true);
const props: UncertaintyMarkerProps = {
  color: '#ff0000',
  pickMarkerTimeSecs: 1920,
  pickMarkerPosition: 92,
  isLeftUncertaintyBar: true,
  uncertaintySecs: 1.5,
  startTimeSecs: timeRange.startTimeSecs,
  endTimeSecs: timeRange.endTimeSecs,
  initialConfiguration,
  setIsEditingTimeUncertainty: mockSetIsEditingTimeUncertainty,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  getTimeSecsForClientX: jest.fn().mockReturnValue(1920 + 20),
  setUncertaintySecs: jest.fn(),
  isSplitChannelOverlayOpen: false
};

jest.mock('@gms/ui-util/lib/ui-util/hot-key-util', () => {
  const actual = jest.requireActual('@gms/ui-util/lib/ui-util/hot-key-util');
  return {
    ...actual,
    isGlobalHotKeyCommandSatisfied: jest.fn(() => true)
  };
});

describe('Weavess Vertical Marker', () => {
  it('is defined', () => {
    expect(UncertaintyMarker).toBeDefined();
  });

  it('renders as expected', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<UncertaintyMarker {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('renders as right marker', () => {
    const rightProps = {
      ...props,
      isLeftUncertaintyBar: false
    };
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<UncertaintyMarker {...rightProps} />);
    expect(container).toMatchSnapshot();
  });

  it('can drag uncertainty bars', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<UncertaintyMarker {...props} />);
    const divider = result.getByTestId('uncertainty-marker');

    fireEvent.mouseDown(divider);
    fireEvent.mouseMove(divider, { clientX: 200 });
    fireEvent.mouseUp(divider);

    // first call sets it to true for mouse down
    expect(mockSetIsEditingTimeUncertainty.mock.calls[0][0]).toBe(true);
    // second call sets it to false for mouse up aka no longer dragging
    expect(mockSetIsEditingTimeUncertainty.mock.calls[1][0]).toBe(false);
  });
});
