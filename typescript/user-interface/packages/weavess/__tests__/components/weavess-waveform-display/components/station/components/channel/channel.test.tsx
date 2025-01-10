/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/jsx-props-no-spreading */
import { WeavessTypes } from '@gms/weavess-core';
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { Channel } from '../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/channel';
import type {
  ChannelProps,
  ChannelState
} from '../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/types';
import {
  getMinMaxAmplitudes,
  hasUserProvidedBoundaries
} from '../../../../../../../src/ts/components/weavess-waveform-display/components/station/utils';
import { initialConfiguration } from '../../../../../../__data__/test-util-data';

const timeRange: WeavessTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 500
};
const domRect: DOMRect = {
  bottom: 100,
  top: 0,
  height: 100,
  left: 0,
  right: 200,
  toJSON: jest.fn(),
  width: 200,
  x: 0,
  y: 0
};
const canvasElement: Partial<HTMLCanvasElement> = {
  getBoundingClientRect: jest.fn(() => domRect)
};

const channelSegmentBoundaries: WeavessTypes.ChannelSegmentBoundaries = {
  topMax: 307.306593,
  bottomMax: 154.606635,
  channelAvg: 230.31431241288792,
  samplesCount: 179980,
  offset: 307.306593,
  channelSegmentId: 'unfiltered'
};
let startAmp = 1;
const csd = {
  channel: {
    name: 'channelId',
    effectiveAt: timeRange.startTimeSecs
  },
  startTime: timeRange.startTimeSecs,
  endTime: timeRange.endTimeSecs,
  creationTime: timeRange.startTimeSecs
};
const channelSegment: WeavessTypes.ChannelSegment = {
  configuredInputName: JSON.stringify(csd),
  channelName: 'channel',
  wfFilterId: WeavessTypes.UNFILTERED,
  isSelected: false,
  dataSegments: [
    {
      color: 'dodgerblue',
      displayType: [WeavessTypes.DisplayType.SCATTER],
      pointSize: 2,
      data: {
        startTimeSecs: timeRange.startTimeSecs,
        endTimeSecs: timeRange.endTimeSecs,
        sampleRate: 1,
        values: Array.from({ length: 10 }, () => {
          startAmp += 1;
          return startAmp;
        })
      }
    }
  ],
  channelSegmentBoundaries
};
const channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
channelSegmentsRecord[WeavessTypes.UNFILTERED] = [channelSegment];

const mockOnKeyPress = jest.fn();

// Grabbed the waveform definition from WeavessExample
// !Should consolidate the definition for re-use
const props: ChannelProps = {
  stationId: 'station-id',
  isSplitChannelOverlayOpen: false,
  activeSplitModeType: undefined,
  splitChannelRefs: {},
  channel: {
    id: 'channel',
    name: 'channel',
    isSelected: false,
    waveform: {
      channelSegmentId: WeavessTypes.UNFILTERED,
      channelSegmentsRecord,
      masks: [
        {
          id: 'mask',
          color: 'red',
          startTimeSecs: 5,
          endTimeSecs: 10,
          isProcessingMask: false
        }
      ],
      signalDetections: [
        {
          id: `sd`,
          timeSecs: timeRange.startTimeSecs + 500,
          color: 'red',
          label: 'P',
          filter: 'brightness(1)',
          isConflicted: false,
          uncertaintySecs: 1.5,
          showUncertaintyBars: true,
          isSelected: true,
          isActionTarget: false,
          isDraggable: true
        }
      ]
    },
    spectrogram: {
      description: 'test spectrogram data',
      descriptionLabelColor: 'black',
      startTimeSecs: timeRange.startTimeSecs,
      timeStep: 0.5,
      frequencyStep: 1,
      data: [[0, 0.5, 1.0, 1.5, 2.0, 2.5]],
      signalDetections: [
        {
          id: `sd`,
          timeSecs: timeRange.startTimeSecs + 500,
          color: 'red',
          label: 'P',
          filter: 'brightness(1)',
          isConflicted: false,
          uncertaintySecs: 1.5,
          showUncertaintyBars: false,
          isSelected: false,
          isActionTarget: false,
          isDraggable: true
        }
      ],
      predictedPhases: [
        {
          id: `predictive`,
          timeSecs: timeRange.startTimeSecs + 515,
          color: 'red',
          label: 'P',
          filter: 'opacity(.6)',
          isConflicted: false,
          uncertaintySecs: 1.5,
          showUncertaintyBars: false,
          isSelected: true,
          isActionTarget: false,
          isDraggable: true
        }
      ],
      theoreticalPhaseWindows: [
        {
          id: 'theoretical-phase',
          startTimeSecs: timeRange.startTimeSecs + 60,
          endTimeSecs: timeRange.startTimeSecs + 120,
          color: 'red',
          label: 'TP'
        }
      ],
      markers: {
        verticalMarkers: [
          {
            id: 'marker',
            color: 'lime',
            lineStyle: WeavessTypes.LineStyle.DASHED,
            timeSecs: timeRange.startTimeSecs + 5
          }
        ],
        moveableMarkers: [
          {
            id: 'marker',
            color: 'RED',
            lineStyle: WeavessTypes.LineStyle.DASHED,
            timeSecs: timeRange.startTimeSecs + 50
          }
        ],
        selectionWindows: [
          {
            id: 'selection',
            startMarker: {
              id: 'marker',
              color: 'purple',
              lineStyle: WeavessTypes.LineStyle.DASHED,
              timeSecs: timeRange.startTimeSecs + 200
            },
            endMarker: {
              id: 'marker',
              color: 'purple',
              lineStyle: WeavessTypes.LineStyle.DASHED,
              timeSecs: timeRange.startTimeSecs + 400
            },
            isMoveable: true,
            color: 'rgba(200,0,0,0.2)'
          }
        ]
      }
    }
  },
  glMin: 0,
  glMax: 100,
  displayInterval: {
    startTimeSecs: timeRange.startTimeSecs,
    endTimeSecs: timeRange.endTimeSecs
  },
  viewableInterval: {
    startTimeSecs: timeRange.startTimeSecs + 100,
    endTimeSecs: timeRange.endTimeSecs
  },
  initialConfiguration,
  distance: 4,
  azimuth: 9,
  expanded: true,
  distanceUnits: WeavessTypes.DistanceUnits.km,
  height: 800,
  index: 1,
  isDefaultChannel: true,
  isExpandable: true,
  getCanvasBoundingRect: jest.fn(() => domRect),
  shouldRenderSpectrograms: true,
  shouldRenderWaveforms: true,
  showMaskIndicator: true,
  defaultRange: {
    min: 4,
    max: 11
  },
  offsetSecs: 0,
  events: {
    labelEvents: {
      onChannelCollapsed: jest.fn(),
      onChannelExpanded: jest.fn(),
      onChannelLabelClick: jest.fn()
    },
    events: {
      onContextMenu: jest.fn(),
      onChannelClick: jest.fn(),
      onSignalDetectionContextMenu: jest.fn(),
      onSignalDetectionClick: jest.fn(),
      onSignalDetectionDoubleClick: jest.fn(),
      onSignalDetectionDragEnd: jest.fn(),
      onPredictivePhaseContextMenu: jest.fn(),
      onPredictivePhaseClick: jest.fn(),
      onMeasureWindowUpdated: jest.fn(),
      onUpdateMarker: jest.fn(),
      onMoveSelectionWindow: jest.fn(),
      onUpdateSelectionWindow: jest.fn(),
      onClickSelectionWindow: jest.fn(),
      onMaskContextClick: jest.fn(),
      onMaskCreateDragEnd: jest.fn(),
      onMaskClick: jest.fn()
    },
    onKeyPress: mockOnKeyPress
  },
  canvasRef: jest.fn(() => canvasElement as HTMLCanvasElement),
  converters: {
    computeFractionOfCanvasFromMouseXPx: jest.fn(),
    computeTimeSecsForMouseXFractionalPosition: jest.fn(),
    computeTimeSecsFromMouseXPixels: jest.fn(
      (clientX: number) => (1 + clientX / 100) * timeRange.startTimeSecs
    )
  },
  getZoomRatio: jest.fn().mockReturnValue(0.5),
  onMouseDown: jest.fn(),
  onMouseMove: jest.fn(),
  onMouseUp: jest.fn(),
  renderWaveforms: jest.fn(),
  onContextMenu: jest.fn(),
  updateMeasureWindow: jest.fn(),
  isMeasureWindow: true,
  getBoundaries: jest.fn(
    async () =>
      new Promise<WeavessTypes.ChannelSegmentBoundaries>(resolve =>
        // eslint-disable-next-line no-promise-executor-return
        resolve(channelSegmentBoundaries)
      )
  )
};

describe('Weavess Channel', () => {
  it('channel wrapper to match snapshot', () => {
    const { container } = render(<Channel {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('channel to be defined', () => {
    expect(Channel).toBeDefined();
  });

  it('has a channel name set', () => {
    const instance = new Channel(props);
    expect(instance.getChannelId()).toEqual('channel');
  });

  it('call componentDidUpdate', () => {
    const instance = new Channel(props);
    const state: ChannelState = {
      waveformYAxisBounds: {
        minAmplitude: -1,
        maxAmplitude: 1,
        heightInPercentage: 20
      },
      spectrogramYAxisBounds: {
        minAmplitude: -1,
        maxAmplitude: 1,
        heightInPercentage: 20
      }
    };
    // Set default bounds and measure window
    instance.setState(state);
    expect(() => instance.componentDidUpdate(props, state)).not.toThrow();
  });

  it('componentDidCatch', () => {
    const instance = new Channel(props);
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toHaveBeenCalled();
  });

  it('call updateAmplitude', () => {
    const instance = new Channel(props);
    expect(async () =>
      instance.updateAmplitude({ startTimeSecs: 400, endTimeSecs: 700 })
    ).not.toThrow();
  });

  it('call getTimeSecs', () => {
    const instance = new Channel(props);
    expect(instance.getTimeSecs()).toBe(undefined);
  });

  it('call getMousePosition', () => {
    const instance = new Channel(props);
    instance.componentDidMount();
    expect(instance.getMousePosition()).toMatchSnapshot();
  });

  it('can get min/max amplitudes', () => {
    expect(getMinMaxAmplitudes([channelSegment])).toMatchSnapshot();
    const channelSegmentNoBoundaries = {
      ...channelSegment,
      channelSegmentBoundaries: undefined
    };
    expect(getMinMaxAmplitudes([channelSegmentNoBoundaries])).toMatchSnapshot();
  });

  it('can determine has boundaries', () => {
    expect(hasUserProvidedBoundaries([channelSegment])).toBeTruthy();
    expect(hasUserProvidedBoundaries([])).toBeFalsy();
  });

  it('calls resetAmplitude', () => {
    const instance = new Channel(props);
    const spy = jest.spyOn(instance, 'resetAmplitude');
    instance.resetAmplitude();
    expect(spy).toHaveBeenCalled();
  });

  it('calls isAmplitudeManuallyScaled', () => {
    const instance = new Channel(props);
    const spy = jest.spyOn(instance, 'isAmplitudeManuallyScaled');
    instance.isAmplitudeManuallyScaled();
    expect(spy).toHaveBeenCalled();
  });
});

describe('Weavess Channel private method', () => {
  describe('test keyboard events', () => {
    beforeEach(() => {
      mockOnKeyPress.mockReset();
    });

    it('call onKeyDown amplitude scaling', () => {
      const result = render(<Channel {...props} />);
      fireEvent.keyDown(result.getByTestId('channel-wrapper'), { key: 'y' });
      expect(mockOnKeyPress).toHaveBeenCalled();
    });

    it('call onKeyDown create mask', () => {
      const result = render(<Channel {...props} />);
      fireEvent.keyDown(result.getByTestId('channel-wrapper'), { key: 'm' });
      expect(mockOnKeyPress).toHaveBeenCalled();
    });

    it('call onKeyDown', () => {
      const result = render(<Channel {...props} />);
      fireEvent.keyDown(result.getByTestId('channel-wrapper'), { key: 'a' });
      expect(mockOnKeyPress).toHaveBeenCalled();
    });
  });

  describe('Weavess Channel with no waveform', () => {
    it('channel wrapper to match snapshot undefined waveform', () => {
      const propsNoWaveform = {
        ...props,
        channel: {
          ...props.channel,
          waveform: undefined
        }
      };
      propsNoWaveform.channel.waveform = undefined;
      const { container } = render(<Channel {...propsNoWaveform} />);
      expect(container).toMatchSnapshot();
    });

    it('can mount channel where the props.events are undefined', () => {
      const myProps: ChannelProps = {
        ...props,
        events: {
          labelEvents: props.events?.labelEvents,
          events: undefined
        }
      };
      const { container } = render(<Channel {...myProps} />);
      expect(container).toMatchSnapshot();
    });

    it('adds maskTarget class when channel is selected', () => {
      const propsWithMaskTarget = {
        ...props,
        isStationMaskTarget: true
      };
      const { container } = render(
        <Channel
          {...propsWithMaskTarget}
          channel={{ ...propsWithMaskTarget.channel, isSelected: true }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('omits maskTarget class when different channel within station is selected', () => {
      const propsWithMaskTarget = { ...props, isStationMaskTarget: true };
      const { container } = render(<Channel {...propsWithMaskTarget} />);
      expect(container).toMatchSnapshot();
    });
  });
});
