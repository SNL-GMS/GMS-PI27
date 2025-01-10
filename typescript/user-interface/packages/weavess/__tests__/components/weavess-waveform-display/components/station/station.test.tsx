/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Classes } from '@blueprintjs/core';
import { DistanceUnits } from '@gms/weavess-core/lib/types';
import { render } from '@testing-library/react';
import * as React from 'react';

import { Station } from '../../../../../src/ts/components/weavess-waveform-display/components/station/station';
import type {
  CommonStationProps,
  StationProps
} from '../../../../../src/ts/components/weavess-waveform-display/components/station/types';
import { initialConfiguration } from '../../../../__data__/test-util-data';

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const commonProps: CommonStationProps = {
  converters: {
    computeFractionOfCanvasFromMouseXPx: jest.fn(),
    computeTimeSecsForMouseXFractionalPosition: jest.fn(),
    computeTimeSecsFromMouseXPixels: jest.fn()
  },
  displayInterval: {
    startTimeSecs: 0,
    endTimeSecs: 500
  },
  viewableInterval: {
    startTimeSecs: 100,
    endTimeSecs: 500
  },
  getZoomRatio: jest.fn().mockReturnValue(0.5),
  onMouseDown: jest.fn(),
  onMouseMove: jest.fn(),
  onMouseUp: jest.fn(),
  renderWaveforms: jest.fn(),
  onContextMenu: jest.fn(),
  updateMeasureWindow: jest.fn(),
  isMeasureWindow: false
};

const props: StationProps = {
  ...commonProps,
  isWithinTimeRange: jest.fn().mockReturnValue(true),
  initialConfiguration,
  station: {
    id: 'station-id',
    name: 'station-name',
    defaultChannel: {
      id: 'default-channel-id',
      name: 'default-channel-name',
      isSelected: false
    },
    distance: 0,
    distanceUnits: DistanceUnits.km,
    nonDefaultChannels: [
      {
        id: 'channel',
        name: 'channel',
        isSelected: false,
        waveform: {
          channelSegmentId: '1',
          channelSegmentsRecord: {},
          masks: [
            {
              id: 'mask',
              color: '#ff0000',
              startTimeSecs: 105,
              endTimeSecs: 390,
              isProcessingMask: false
            }
          ]
        }
      }
    ],
    splitChannels: [
      {
        id: 'Splitchannel',
        name: 'Splitchannel',
        isSelected: false,
        waveform: {
          channelSegmentId: '1',
          channelSegmentsRecord: {},
          masks: [
            {
              id: 'mask',
              color: '#ff0000',
              startTimeSecs: 105,
              endTimeSecs: 390,
              isProcessingMask: false
            }
          ]
        }
      }
    ],
    areChannelsShowing: true
  },
  shouldRenderWaveforms: false,
  shouldRenderSpectrograms: false,
  getCanvasBoundingRect: jest.fn(() => new DOMRect(0, 0, 100, 100)),
  events: undefined,
  glMin: 0,
  glMax: 100,
  canvasRef: jest.fn(),
  hasQcMasks: true,
  isSplitChannelOverlayOpen: false
};

describe('Weavess Station', () => {
  it('to be defined', () => {
    expect(Station).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<Station {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('componentDidCatch', () => {
    const instance = new Station(props);
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toHaveBeenCalled();
  });

  it('reset amplitude', () => {
    const instance = new Station(props);
    const spy = jest.spyOn(instance, 'resetAmplitude');
    instance.resetAmplitude();
    expect(spy).toHaveBeenCalled();
  });

  it('getManualAmplitudeScaledChannels', () => {
    const instance = new Station(props);
    const spy = jest.spyOn(instance, 'getManualAmplitudeScaledChannels');
    instance.getManualAmplitudeScaledChannels();
    expect(spy).toHaveBeenCalled();
  });

  it('fades out when isSplitChannelOverlayOpen is true', () => {
    const { container } = render(<Station {...props} isSplitChannelOverlayOpen />);
    expect(container.getElementsByClassName(Classes.OVERLAY).length).toBeGreaterThanOrEqual(1);
  });
});
