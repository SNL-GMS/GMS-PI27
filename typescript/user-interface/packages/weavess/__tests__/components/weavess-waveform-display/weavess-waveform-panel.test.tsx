/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HotkeyListener } from '@gms/ui-util';
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import Immutable from 'immutable';
import type * as React from 'react';
import { act } from 'react-test-renderer';

import type {
  WeavessWaveformPanelProps,
  WeavessWaveformPanelState
} from '../../../src/ts/components/weavess-waveform-display/types';
import { BrushType } from '../../../src/ts/components/weavess-waveform-display/types';
import { WeavessWaveformPanel } from '../../../src/ts/components/weavess-waveform-display/weavess-waveform-panel';
import { initialConfiguration } from '../../__data__/test-util-data';

// remove error log when running this tests since it try to call error
// eslint-disable-next-line no-console
console.error = jest.fn();

const mockSetSize = jest.fn();
const mockRenderer = {
  canvas: 'canvas',
  context: 'context',
  domElement: 'domElement',
  forceContextLoss: jest.fn(),
  setScissor: jest.fn(),
  setScissorTest: jest.fn(),
  render: jest.fn(),
  setSize: mockSetSize,
  setViewport: jest.fn(),
  clear: jest.fn(),
  dispose: jest.fn()
};

jest.mock('three', () => {
  const three = jest.requireActual('three');
  const mockWebGLRenderer = jest.fn();
  mockWebGLRenderer.mockImplementation(() => {
    return mockRenderer;
  });
  return {
    ...three,
    WebGLRenderer: mockWebGLRenderer
  };
});

jest.mock('worker-rpc', () => {
  const realWorkerRpc = jest.requireActual('worker-rpc');
  // We do this here to guarantee that it runs before the waveform panel generates its workers.
  // This works because jest.mock gets hoisted and run before even imports are figured out.
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    writable: false,
    value: 4
  });

  // We don't actually need to mock anything in the worker-rpc module... just to hijack the
  // window before it runs.
  return {
    ...realWorkerRpc,
    RPCProvider: {
      constructor: () => ({
        _dispatch: jest.fn(),
        _nextTransactionId: 0,
        _pendingTransactions: {},
        _rpcHandlers: {},
        _rpcTimeout: 0,
        _signalHandlers: {},
        error: {
          _contexts: [],
          _handlers: [],
          dispatch: jest.fn(),
          hasHandlers: false
        }
      })
    }
  };
});
const mockResetAmplitudes = jest.fn();
const viewableInterval = {
  endTimeSecs: 1100,
  startTimeSecs: 0
};
const zoomInterval = {
  endTimeSecs: 1001,
  startTimeSecs: 200
};

function createConfiguredInputString(channelName: string): string {
  const csd = {
    channel: {
      name: channelName,
      effectiveAt: zoomInterval.startTimeSecs
    },
    startTime: zoomInterval.startTimeSecs,
    endTime: zoomInterval.endTimeSecs,
    creationTime: zoomInterval.startTimeSecs
  };
  return JSON.stringify(csd);
}

const channelSegmentsRecordDefaultChannel: Record<string, WeavessTypes.ChannelSegment[]> = {};
channelSegmentsRecordDefaultChannel.data = [
  {
    configuredInputName: createConfiguredInputString('default channel id'),
    channelName: 'default channel name',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    dataSegments: [
      {
        color: 'tomato',
        pointSize: 1,
        data: {
          startTimeSecs: 0,
          endTimeSecs: 100,
          sampleRate: 40,
          values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
        }
      }
    ]
  }
];
const channelSegmentsRecordNonDefaultChannel: Record<string, WeavessTypes.ChannelSegment[]> = {};
channelSegmentsRecordNonDefaultChannel.data = [
  {
    configuredInputName: createConfiguredInputString('non default channel id'),
    channelName: 'non default channel 1 name',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    dataSegments: [
      {
        color: 'tomato',
        pointSize: 1,
        data: {
          startTimeSecs: 0,
          endTimeSecs: 100,
          sampleRate: 40,
          values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
        }
      }
    ]
  }
];
const channelSegmentsRecordNonDefaultChannel2: Record<string, WeavessTypes.ChannelSegment[]> = {};
channelSegmentsRecordNonDefaultChannel2.data = [
  {
    configuredInputName: createConfiguredInputString('non default channel id 2'),
    channelName: 'non default channel 2 name',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    dataSegments: [
      {
        color: 'tomato',
        pointSize: 1,
        data: {
          startTimeSecs: 0,
          endTimeSecs: 100,
          sampleRate: 40,
          values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
        }
      }
    ]
  }
];
const mockOnZoomChange = jest.fn();
const uncontrolledProps: WeavessWaveformPanelProps = {
  activeSplitModeType: undefined,
  displayInterval: viewableInterval,
  flex: true,
  viewableInterval,
  events: {
    ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS,
    stationEvents: {
      ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS.stationEvents,
      defaultChannelEvents: {
        ...WeavessConstants?.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents,
        events: {
          ...WeavessConstants?.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents
            ?.events,
          onMaskCreateDragEnd: jest.fn(),
          onChannelClick: jest.fn(),
          onWaveformSelectionMouseUp: jest.fn()
        }
      },
      nonDefaultChannelEvents: {
        ...WeavessConstants?.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.nonDefaultChannelEvents,
        events: {
          ...WeavessConstants?.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.nonDefaultChannelEvents
            ?.events,
          onMaskCreateDragEnd: jest.fn(),
          onChannelClick: jest.fn()
        }
      }
    },
    onResetAmplitude: jest.fn(),
    onZoomChange: mockOnZoomChange,
    onCanvasResize: jest.fn()
  },
  shouldRenderSpectrograms: false,
  shouldRenderWaveforms: true,
  isControlledComponent: false,
  clearSelectedChannels: jest.fn(),

  stations: [
    {
      id: 'station id',
      name: `station name`,
      defaultChannel: {
        height: 40,
        id: 'default channel id',
        name: 'default channel name',
        isSelected: true,
        timeOffsetSeconds: 0,
        waveform: {
          channelSegmentId: 'data',
          channelSegmentsRecord: channelSegmentsRecordDefaultChannel
        }
      },
      nonDefaultChannels: [
        {
          height: 40,
          id: 'non default channel 1 id',
          name: 'non default channel 1 name',
          isSelected: false,
          timeOffsetSeconds: 0,
          waveform: {
            channelSegmentId: 'data',
            channelSegmentsRecord: channelSegmentsRecordNonDefaultChannel
          }
        },
        {
          height: 40,
          id: 'non default channel 2 id',
          name: 'non default channel 2 name',
          isSelected: false,
          waveform: {
            channelSegmentId: 'data',
            channelSegmentsRecord: channelSegmentsRecordNonDefaultChannel2
          }
        }
      ]
    }
  ],
  initialConfiguration: {
    ...initialConfiguration,
    shouldRenderSpectrograms: false,
    shouldRenderWaveforms: true,
    defaultChannel: {
      disableMeasureWindow: true
    },
    nonDefaultChannel: {},
    suppressLabelYAxis: false,
    labelWidthPx: 65,
    xAxisLabel: 'x axis'
  },
  convertTimeToGL: jest.fn(),
  resetWaveformPanelAmplitudes: mockResetAmplitudes,
  isResizing: false,
  scrollBarWidthPx: 10
};
const testRect = {
  width: 1000,
  left: 0
};

/**
 * Creates a WeavessWaveformPanel and populates some of the refs and returns it
 *
 * @param props optional props to use instead of default
 * @returns WeavessWaveformPanel
 */
const buildUncontrolledWaveformPanel = (props = uncontrolledProps) => {
  const uncontrolledWrapper: any = new WeavessWaveformPanel(props);
  uncontrolledWrapper.setState = jest.fn();
  uncontrolledWrapper.waveformsViewportRef = {
    scroll: jest.fn(),
    scrollLeft: jest.fn()
  };
  uncontrolledWrapper.waveformsContainerRef = {
    style: {
      width: '100px'
    }
  };
  uncontrolledWrapper.dimensions.canvas.rect.height = 1000;
  uncontrolledWrapper.canvasRef = {
    rect: testRect,
    getBoundingClientRect: jest.fn(() => testRect),
    offsetWidth: 1,
    offsetHeight: 1
  };
  uncontrolledWrapper.postZoomUpdate = jest.fn();
  uncontrolledWrapper.renderer = mockRenderer;
  uncontrolledWrapper.visibleChannels = Immutable.List();
  return uncontrolledWrapper;
};
let element = document.createElement('div');
element = {
  ...element,
  style: {
    ...element.style,
    width: '1000px'
  },
  clientWidth: 1065
};
const controlledProps: WeavessWaveformPanelProps = {
  ...uncontrolledProps,
  isControlledComponent: true,
  displayInterval: viewableInterval,
  flex: false
};

/**
 * Creates a controlled WeavessWaveformPanel and populates some of the refs and returns it
 *
 * @param props optional props to use instead of default
 * @returns WeavessWaveformPanel
 */
const buildControlledWaveformPanel = (props = controlledProps) => {
  const controlledWrapper: any = new WeavessWaveformPanel(props);
  controlledWrapper.waveformsContainerRef = element;
  controlledWrapper.canvasRef = {
    clientWidth: 1000,
    rect: testRect,
    getBoundingClientRect: jest.fn(() => testRect),
    offsetWidth: 1,
    offsetHeight: 1
  };
  controlledWrapper.waveformsViewportRef = {
    scrollLeft: 0,
    clientHeight: 200,
    clientWidth: 1000,
    scrollWidth: 1000,
    scrollHeight: 200,
    scrollTop: 20
  };
  controlledWrapper.timeAxisRef = {
    update: jest.fn()
  };
  controlledWrapper.brushType = BrushType.Zoom;
  return controlledWrapper;
};

window.getComputedStyle = jest.fn().mockReturnValue({
  width: '1000px'
});

const defaultChannelRef = {
  getChannelId: jest.fn().mockReturnValue('default channel name'),
  resetAmplitude: mockResetAmplitudes
};
const nonDefaultChannelRefs = {
  chanId: {
    getChannelId: jest.fn().mockReturnValue('non default channel name'),
    resetAmplitude: mockResetAmplitudes
  }
};
const testStation = {
  defaultChannelRef,
  state: {
    expanded: true
  },
  nonDefaultChannelRefs,
  resetAmplitude: mockResetAmplitudes,
  getChannelList: jest.fn(() => {
    return [defaultChannelRef, nonDefaultChannelRefs.chanId];
  }),
  getManualAmplitudeScaledChannels: jest.fn(() => [])
};

describe('Uncontrolled Weavess Waveform Panel', () => {
  let subscriptionId;
  beforeEach(() => {
    subscriptionId = HotkeyListener.subscribeToGlobalHotkeyListener();
  });
  afterEach(() => {
    HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
  });
  it('matches a snapshot', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    expect(uncontrolledWrapper).toMatchSnapshot();
  });
  it('WeavessWaveformPanel componentDidMount', async () => {
    const onCanvasResize = jest.fn();
    const props: WeavessWaveformPanelProps = {
      ...uncontrolledProps,
      isResizing: false,
      events: { ...uncontrolledProps.events, onCanvasResize }
    };
    const instance: any = buildUncontrolledWaveformPanel(props);
    instance.canvasResizeObserver = jest.fn();
    instance.renderWaveforms = jest.fn();
    await act(async () => {
      await instance.updateSize();
    });
    expect(onCanvasResize.mock.calls[0][0]).toMatchInlineSnapshot(`1`);
  });
  it('get waveform y axis bounds', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    expect(
      uncontrolledWrapper.getChannelWaveformYAxisBounds('default channel id')
    ).toMatchSnapshot();
  });

  it('get waveform y axis bounds for non existing channel', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    expect(uncontrolledWrapper.getChannelWaveformYAxisBounds('FOO')).toBeUndefined();
  });

  it('updates its dimensions when updateTrackedDimensions is called', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    const testDimensions = {
      clientHeight: 100,
      clientWidth: 0,
      scrollWidth: 1000,
      scrollLeft: 1000
    };
    uncontrolledWrapper.waveformsViewportRef = {
      ...uncontrolledWrapper.waveformsViewportRef,
      clientHeight: 100,
      clientWidth: 100,
      scrollWidth: 1000,
      scrollLeft: 1000
    };
    uncontrolledWrapper.canvasRef = {
      rect: testRect,
      getBoundingClientRect: jest.fn(() => testRect),
      offsetWidth: 1,
      offsetHeight: 1
    };

    uncontrolledWrapper.updateTrackedDimensions();
    expect(uncontrolledWrapper.dimensions.viewport.clientHeight).toBe(testDimensions.clientHeight);
    expect(uncontrolledWrapper.dimensions.viewport.clientWidth).not.toBe(
      testDimensions.clientWidth
    );
    expect(uncontrolledWrapper.dimensions.viewport.scrollWidth).toBe(testDimensions.scrollWidth);
    expect(uncontrolledWrapper.dimensions.viewport.scrollLeft).toBe(testDimensions.scrollLeft);
    expect(uncontrolledWrapper.dimensions.canvas.rect.width).toBe(testRect.width);
    expect(uncontrolledWrapper.dimensions.canvas.rect.left).toBe(testRect.left);
    expect(uncontrolledWrapper.getCanvasBoundingClientRect()).toMatchSnapshot();
  });

  it('calls renderWaveforms on scroll', async () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    uncontrolledWrapper.renderWaveforms = jest.fn();
    uncontrolledWrapper.waveformsContainerRef = element;
    uncontrolledWrapper.waveformsViewportRef = {
      scrollLeft: 0,
      scrollTop: 0,
      scroll: jest.fn()
    };
    uncontrolledWrapper.canvasRef = {
      clientWidth: 1000,
      getBoundingClientRect: jest.fn(() => ({
        width: 1000,
        left: 0
      }))
    };
    uncontrolledWrapper.stationComponentRefs = new Map();
    uncontrolledWrapper.timeAxisRef = {
      update: jest.fn()
    };

    // Set uncontrolled state zoom to interval other than where current viewport
    // is causing update
    const movedZoomInterval = {
      startTimeSecs: zoomInterval.startTimeSecs + 15,
      endTimeSecs: zoomInterval.endTimeSecs + 5
    };
    uncontrolledWrapper.state.zoomInterval = movedZoomInterval;
    const spy = jest.spyOn(uncontrolledWrapper, 'postZoomUpdate');
    await act(async () => {
      await uncontrolledWrapper.onScroll();
    });

    expect(spy).toHaveBeenCalled();
  });

  it('can get the current view range in seconds', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    const zoomIntervalSet = uncontrolledWrapper.getCurrentZoomInterval();
    expect(zoomIntervalSet.startTimeSecs).toBe(viewableInterval.startTimeSecs);
    expect(zoomIntervalSet.endTimeSecs).toBe(viewableInterval.endTimeSecs);
    expect(zoomIntervalSet).toMatchSnapshot();
  });

  it('updates the visible child channels for a station when updateVisibleChannelsForStation is called', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    uncontrolledWrapper.stationComponentRefs.set('testStation', testStation);
    expect(uncontrolledWrapper.getStationsChannels()).toHaveLength(2);
  });

  it('gets code coverage for not calling reset amplitudes on stations if stationComponentRefs undefined', () => {
    const mockOnResetAmplitude = jest.fn();
    const mockResetAmplitude = jest.fn();
    const props: WeavessWaveformPanelProps = {
      ...uncontrolledProps,
      isResizing: false,
      events: { ...uncontrolledProps.events, onResetAmplitude: mockOnResetAmplitude }
    };
    const uncontrolledWrapper = buildUncontrolledWaveformPanel(props);
    uncontrolledWrapper.stationComponentRefs = undefined;
    uncontrolledWrapper.resetAmplitudes();
    expect(mockResetAmplitude).toHaveBeenCalledTimes(0);
    expect(mockOnResetAmplitude).toHaveBeenCalledTimes(1);

    uncontrolledWrapper.stationComponentRefs = [{ resetAmplitude: mockResetAmplitude }];
    uncontrolledWrapper.resetAmplitudes();
    expect(mockResetAmplitude).toHaveBeenCalledTimes(1);
    expect(mockOnResetAmplitude).toHaveBeenCalledTimes(2);
  });

  it('can update the size of the webgl renderer', async () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    // Call update size
    uncontrolledWrapper.canvasRef = {
      ...uncontrolledWrapper.canvasRef,
      offsetWidth: 1234,
      offsetHeight: 50
    };
    uncontrolledWrapper.waveformsContainerRef = element;
    uncontrolledWrapper.waveformsViewportRef = {
      scrollLeft: 0
    };
    uncontrolledWrapper.timeAxisRef = {
      update: jest.fn()
    };
    mockSetSize.mockClear();

    await act(() => {
      uncontrolledWrapper.updateSize();
    });
    expect(mockSetSize.mock.calls[0]).toMatchInlineSnapshot(`
      [
        1234,
        50,
        false,
      ]
    `);
  });

  it('can update the size of the webgl renderer width equal, but not height', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    // Call update size
    uncontrolledWrapper.canvasRef = {
      ...uncontrolledWrapper.canvasRef,
      offsetWidth: 1,
      offsetHeight: 50
    };

    uncontrolledWrapper.waveformsContainerRef = element;
    uncontrolledWrapper.waveformsViewportRef = {
      scrollLeft: 0
    };
    uncontrolledWrapper.timeAxisRef = {
      update: jest.fn()
    };
    const sizeSpy = jest.spyOn(uncontrolledWrapper.renderer, 'setSize');
    sizeSpy.mockClear();
    uncontrolledWrapper.updateSize();
    expect(sizeSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        1,
        50,
        false,
      ]
    `);
  });
  it('can update the size of the webgl renderer wd', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    // Call update size
    uncontrolledWrapper.canvasRef = {
      ...uncontrolledWrapper.canvasRef,
      offsetWidth: 1234,
      offsetHeight: 50
    };
    uncontrolledWrapper.waveformsContainerRef = element;
    uncontrolledWrapper.waveformsViewportRef = {
      scrollLeft: 0
    };
    uncontrolledWrapper.timeAxisRef = {
      update: jest.fn()
    };
    const sizeSpy = jest.spyOn(uncontrolledWrapper.renderer, 'setSize');
    sizeSpy.mockClear();
    uncontrolledWrapper.updateSize();
    expect(sizeSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        1234,
        50,
        false,
      ]
    `);
  });

  it('calls renderWaveforms when you call refresh', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    uncontrolledWrapper.waveformsContainerRef = element;
    uncontrolledWrapper.canvasRef = {
      clientWidth: 1000,
      rect: testRect,
      getBoundingClientRect: jest.fn(() => testRect),
      offsetWidth: 1,
      offsetHeight: 1
    };
    uncontrolledWrapper.waveformsViewportRef = {
      scrollLeft: 0
    };
    uncontrolledWrapper.timeAxisRef = {
      update: jest.fn()
    };
    uncontrolledWrapper.renderWaveforms = jest.fn();
    uncontrolledWrapper.refresh();
    expect(uncontrolledWrapper.renderWaveforms.mock.calls[0]).toMatchInlineSnapshot(`[]`);
  });

  it('zoom back out with double click', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    uncontrolledWrapper.waveformsContainerRef = element;
    uncontrolledWrapper.canvasRef = {
      clientWidth: 1000,
      rect: testRect,
      getBoundingClientRect: jest.fn(() => testRect),
      offsetWidth: 1,
      offsetHeight: 1
    };
    uncontrolledWrapper.waveformsViewportRef = {
      scrollLeft: 0,
      clientHeight: 200,
      clientWidth: 1000,
      scrollWidth: 1000,
      scrollHeight: 200,
      scrollTop: 20
    };
    uncontrolledWrapper.timeAxisRef = {
      update: jest.fn()
    };

    const newZoomInterval = {
      startTimeSecs: viewableInterval.startTimeSecs + 100,
      endTimeSecs: viewableInterval.endTimeSecs - 100
    };

    // Update the track dimensions
    expect(() => uncontrolledWrapper.updateTrackedDimensions()).not.toThrow();
    // zoom to zoom time interval
    expect(() => uncontrolledWrapper.zoomToTimeWindow(newZoomInterval)).not.toThrow();
    expect(uncontrolledWrapper.getCurrentZoomInterval()).toMatchInlineSnapshot(`
      {
        "endTimeSecs": 1100,
        "startTimeSecs": 0,
      }
    `);

    expect(() => uncontrolledWrapper.fullZoomOut()).not.toThrow();
  });

  describe('Keyboard and Mouse Wheel events', () => {
    interface KeyboardEventRequest {
      code: string;
      key: string;
      altKey: boolean;
      shiftKey: boolean;
      ctrlKey: boolean;
    }
    interface MouseEventRequest {
      altKey: boolean;
      shiftKey: boolean;
      ctrlKey: boolean;
    }
    const buildKeyboardEvent = (eventReq: KeyboardEventRequest): Partial<KeyboardEvent> => {
      const nativeKeyboardEvent: Partial<KeyboardEvent> = {
        code: eventReq.code,
        key: eventReq.key,
        altKey: eventReq.altKey,
        shiftKey: eventReq.shiftKey,
        ctrlKey: eventReq.ctrlKey
      };
      return nativeKeyboardEvent;
    };

    const buildHTMLDivKeyboardEvent = (
      nativeKeyboardEvent: Partial<KeyboardEvent>
    ): Partial<React.KeyboardEvent<HTMLDivElement>> => {
      const keyboardEvent: Partial<React.KeyboardEvent<HTMLDivElement>> = {
        preventDefault: jest.fn(),
        shiftKey: nativeKeyboardEvent.shiftKey,
        repeat: false,
        nativeEvent: nativeKeyboardEvent as KeyboardEvent,
        stopPropagation: jest.fn(() => true)
      };
      return keyboardEvent;
    };

    const buildWheelEvent = (eventReq: MouseEventRequest, left: boolean): Partial<WheelEvent> => {
      const nativeKeyboardEvent: Partial<WheelEvent> = {
        ctrlKey: eventReq.ctrlKey,
        shiftKey: eventReq.shiftKey,
        altKey: eventReq.altKey,
        deltaY: left ? -1 : 1
      };
      return nativeKeyboardEvent;
    };

    const buildHTMLDivWheelEvent = (
      nativeWheelEvent: Partial<WheelEvent>
    ): Partial<React.WheelEvent<HTMLDivElement>> => {
      const wheelEvent: Partial<React.WheelEvent<HTMLDivElement>> = {
        preventDefault: jest.fn(),
        ctrlKey: nativeWheelEvent.ctrlKey,
        shiftKey: nativeWheelEvent.shiftKey,
        deltaY: nativeWheelEvent.deltaY,
        nativeEvent: nativeWheelEvent as WheelEvent,
        stopPropagation: jest.fn(() => true)
      };
      return wheelEvent;
    };

    const buildMouseEvent = (eventReq: MouseEventRequest): Partial<MouseEvent> => {
      const nativeKeyboardEvent: Partial<MouseEvent> = {
        ctrlKey: eventReq.ctrlKey,
        shiftKey: eventReq.shiftKey,
        altKey: eventReq.altKey
      };
      return nativeKeyboardEvent;
    };

    const buildHTMLDivMouseEvent = (
      nativeWheelEvent: Partial<MouseEvent>
    ): Partial<React.MouseEvent<HTMLDivElement>> => {
      const wheelEvent: Partial<React.MouseEvent<HTMLDivElement>> = {
        preventDefault: jest.fn(),
        ctrlKey: nativeWheelEvent.ctrlKey,
        shiftKey: nativeWheelEvent.shiftKey,
        nativeEvent: nativeWheelEvent as MouseEvent,
        stopPropagation: jest.fn(() => true)
      };
      return wheelEvent;
    };

    describe('Keyboard events', () => {
      it('scrolls down when pageDown is called', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.dimensions.viewport.scrollTop = 500;
        uncontrolledWrapper.dimensions.canvas.rect.height = 1000;
        const start = uncontrolledWrapper.dimensions.viewport.scrollTop;
        uncontrolledWrapper.pageDown();
        expect(uncontrolledWrapper.waveformsViewportRef.scroll).toHaveBeenCalled();
        expect(
          uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls[
            uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls.length - 1
          ][
            uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls[
              uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls.length - 1
            ].length - 1
          ].top
        ).toBeGreaterThan(start);
      });
      it('scrolls up when pageUp is called', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.dimensions.viewport.scrollTop = 500;
        uncontrolledWrapper.dimensions.canvas.rect.height = 1000;
        const start = uncontrolledWrapper.dimensions.viewport.scrollTop;
        uncontrolledWrapper.dimensions.viewport.scrollTop = start;
        uncontrolledWrapper.pageUp();
        expect(uncontrolledWrapper.waveformsViewportRef.scroll).toHaveBeenCalled();
        expect(
          uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls[
            uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls.length - 1
          ][
            uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls[
              uncontrolledWrapper.waveformsViewportRef.scroll.mock.calls.length - 1
            ].length - 1
          ].top
        ).toBeLessThan(start);
      });

      it('makes a call to reset amplitudes for selected channels', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.stationComponentRefs.set('testStation', testStation);

        // Reset call count to 0
        mockResetAmplitudes.mockClear();
        expect(mockResetAmplitudes).not.toHaveBeenCalled();
        expect(() =>
          uncontrolledWrapper.resetSelectedWaveformAmplitudeScaling(['default channel name'], false)
        ).not.toThrow();
        expect(mockResetAmplitudes).toHaveBeenCalled();
      });

      it('toggles the brush type to "mask" when the M key is pressed', () => {
        const eventReq: KeyboardEventRequest = {
          code: 'KeyM',
          key: 'm',
          altKey: false,
          shiftKey: false,
          ctrlKey: false
        };
        const maskKey = buildHTMLDivKeyboardEvent(buildKeyboardEvent(eventReq));
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        // Key down
        expect(() => uncontrolledWrapper.createQcSegmentsKeyDown(maskKey)).not.toThrow();
        expect(uncontrolledWrapper.brushType).toEqual(BrushType.CreateMask);

        // Key up
        expect(() => uncontrolledWrapper.createQcSegmentsKeyUp(maskKey)).not.toThrow();
        expect(uncontrolledWrapper.brushType).toMatchInlineSnapshot(`undefined`);
      });
    });

    describe('Wheel events', () => {
      it('correctly calls to zoom for control + mouse down', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.canvasRef = {
          clientWidth: 1000,
          getBoundingClientRect: jest.fn(() => ({
            width: 1000,
            left: 0
          }))
        };
        // In this case ctrl and not shift
        const eventReq: MouseEventRequest = {
          altKey: false,
          shiftKey: false,
          ctrlKey: true
        };
        const wheelEvent = buildHTMLDivMouseEvent(buildMouseEvent(eventReq));
        expect(() => uncontrolledWrapper.onWheel(wheelEvent)).not.toThrow();
        expect(() => uncontrolledWrapper.onRenderWaveformsLoopEnd()).not.toThrow();
        wheelEvent.ctrlKey = false;
        expect(() => uncontrolledWrapper.onWheel(wheelEvent)).not.toThrow();
      });

      it('correctly calls to scroll with the control + shift + mouse down event', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.canvasRef = {
          clientWidth: 1000,
          getBoundingClientRect: jest.fn(() => ({
            width: 1000,
            left: 0
          }))
        };

        // In this case holding down ctrl and shift keys
        const eventReq: MouseEventRequest = {
          altKey: false,
          shiftKey: true,
          ctrlKey: true
        };
        const wheelEvent = buildHTMLDivMouseEvent(buildMouseEvent(eventReq));
        expect(() => uncontrolledWrapper.onWheel(wheelEvent)).not.toThrow();
        expect(() => uncontrolledWrapper.onRenderWaveformsLoopEnd()).not.toThrow();
        wheelEvent.shiftKey = false;
        expect(() => uncontrolledWrapper.onWheel(wheelEvent)).not.toThrow();
        wheelEvent.ctrlKey = false;
        expect(() => uncontrolledWrapper.onWheel(wheelEvent)).not.toThrow();
      });

      it('can control + wheel', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.canvasRef = {
          clientWidth: 1000,
          getBoundingClientRect: jest.fn(() => ({
            width: 1000,
            left: 100
          }))
        };
        // In this case ctrl and not shift
        const eventReq: MouseEventRequest = {
          altKey: false,
          shiftKey: false,
          ctrlKey: true
        };
        expect(() =>
          uncontrolledWrapper.onWheel(buildHTMLDivWheelEvent(buildWheelEvent(eventReq, false)))
        ).not.toThrow();

        expect(() =>
          uncontrolledWrapper.onWheel(buildHTMLDivWheelEvent(buildWheelEvent(eventReq, true)))
        ).not.toThrow();
      });

      it('can control + shift + wheel', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.canvasRef = {
          clientWidth: 1000,
          getBoundingClientRect: jest.fn(() => ({
            width: 1000,
            left: 0
          }))
        };
        // In this case ctrl and shift
        const eventReq: MouseEventRequest = {
          altKey: false,
          shiftKey: true,
          ctrlKey: true
        };
        expect(() =>
          uncontrolledWrapper.onWheel(buildHTMLDivWheelEvent(buildWheelEvent(eventReq, false)))
        ).not.toThrow();

        expect(() =>
          uncontrolledWrapper.onWheel(buildHTMLDivWheelEvent(buildWheelEvent(eventReq, true)))
        ).not.toThrow();
      });

      it('can retrieve ordered visible channels', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        expect(uncontrolledWrapper.getOrderedVisibleChannelNames()).toMatchInlineSnapshot(`
          [
            "default channel id",
            "non default channel 1 id",
            "non default channel 2 id",
          ]
        `);
      });

      it('componentWillUnmount nulls out refs', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.componentWillUnmount();
        expect(uncontrolledWrapper.renderer).toEqual(null);
      });

      it('can mount with missing canvas', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        uncontrolledWrapper.canvasRef = undefined;
        expect(() => uncontrolledWrapper.componentDidMount()).not.toThrow();
      });

      it('componentDidCatch', () => {
        const uncontrolledWrapper = buildUncontrolledWaveformPanel();
        const spy = jest.spyOn(uncontrolledWrapper, 'componentDidCatch');
        spy.mockClear();
        uncontrolledWrapper.componentDidCatch(new Error('error'), { componentStack: undefined });
        expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
          [
            [Error: error],
            {
              "componentStack": undefined,
            },
          ]
        `);
      });
    });
  });

  it('calls getManualAmplitudeScaledChannels', () => {
    const uncontrolledWrapper = buildUncontrolledWaveformPanel();
    uncontrolledWrapper.stationComponentRefs.set('testStation', testStation);
    expect(uncontrolledWrapper.getManualAmplitudeScaledChannels()).not.toBeUndefined();
  });
});

// Controlled waveform panel component is thru prop changes from the parent
// events.onZoomChange and therefore more difficult to test
describe('Controlled Weavess Waveform Panel', () => {
  const controlledZoomInterval = {
    startTimeSecs: 100,
    endTimeSecs: 200
  };

  test('can mount and render controlled waveform panel', () => {
    const controlledWrapper = buildControlledWaveformPanel();
    expect(controlledWrapper).toBeDefined();
  });

  it('controlled component update when zoom interval has changed and pruneStationComponentRefs with and without stationComponentRefs', async () => {
    const prevZoomInterval = {
      startTimeSecs: controlledZoomInterval.startTimeSecs + 5,
      endTimeSecs: controlledZoomInterval.endTimeSecs + 5
    };
    const controlledWrapper = buildControlledWaveformPanel();
    const prevState: WeavessWaveformPanelState = {
      ...controlledWrapper.state,
      zoomTimeInterval: prevZoomInterval
    };
    // Set current zoom interval to previous zoom interval
    await act(() => {
      expect(() =>
        controlledWrapper.setZoomIntervalInState(
          controlledWrapper.checkMaxZoomInterval(prevZoomInterval)
        )
      ).not.toThrow();
    });
    await act(() => {
      controlledWrapper.stationComponentRefs.set('testStation', testStation);
      expect(() => controlledWrapper.componentDidUpdate(controlledProps, prevState)).not.toThrow();
    });
    await act(() => {
      controlledWrapper.stationComponentRefs = undefined;
      expect(() => controlledWrapper.componentDidUpdate(controlledProps, prevState)).not.toThrow();
    });
  });

  it('can update zoom interval in parent for controlled components', () => {
    const controlledWrapper = buildControlledWaveformPanel();
    mockOnZoomChange.mockClear();
    controlledWrapper.updateZoomIntervalInControlledComponent();
    expect(mockOnZoomChange).toHaveBeenCalled();
  });

  it('controlled component update when viewable interval has changed and ignores when it has not', async () => {
    const controlledWrapper = buildControlledWaveformPanel();
    const prevViewableInterval = {
      startTimeSecs: viewableInterval.startTimeSecs - 10,
      endTimeSecs: zoomInterval.endTimeSecs + 10
    };
    const prevControlledProps = {
      ...controlledProps,
      viewableInterval: prevViewableInterval
    };
    await act(() => {
      expect(() =>
        controlledWrapper.componentDidUpdate(prevControlledProps, controlledWrapper.state)
      ).not.toThrow();
    });
  });

  it('is zoom interval the same', async () => {
    const controlledWrapper = buildControlledWaveformPanel();
    await act(() => {
      expect(
        async () =>
          // eslint-disable-next-line no-return-await
          await controlledWrapper.setZoomIntervalInState(
            controlledWrapper.checkMaxZoomInterval(zoomInterval)
          )
      ).not.toThrow();
    });
    expect(controlledWrapper.isCurrentZoomIntervalEqual(zoomInterval)).toBeTruthy();
    expect(controlledWrapper.isCurrentZoomIntervalEqual(undefined)).toBeFalsy();
  });
  it('clear the brush stroke with selectionAreaRef', () => {
    const controlledWrapper = buildControlledWaveformPanel();
    expect(() => controlledWrapper.clearBrushStroke()).not.toThrow();
  });

  it('update the brush stroke with selectionAreaRef', () => {
    const controlledWrapper = buildControlledWaveformPanel();
    expect(() =>
      controlledWrapper.updateBrushStroke(
        viewableInterval.startTimeSecs,
        viewableInterval.endTimeSecs
      )
    ).not.toThrow();
  });
  test('can call scroll', async () => {
    const controlledWrapper = buildControlledWaveformPanel();
    await act(() => {
      // eslint-disable-next-line no-return-await
      expect(async () => await controlledWrapper.onScroll()).not.toThrow();
    });
  });

  it('updates its dimensions after updateTrackedDimensions is called', () => {
    const controlledWrapper = buildControlledWaveformPanel();
    const testDimensions = {
      clientHeight: 100,
      clientWidth: 100,
      scrollWidth: 1000,
      scrollLeft: 1000
    };
    controlledWrapper.waveformsViewportRef = {
      ...controlledWrapper.waveformsViewportRef,
      clientHeight: 100,
      clientWidth: 100,
      scrollWidth: 1000,
      scrollLeft: 1000
    };
    const canvasRef = {
      rect: testRect,
      getBoundingClientRect: jest.fn(() => testRect),
      offsetWidth: 1,
      offsetHeight: 1
    };
    controlledWrapper.canvasRef = canvasRef;
    controlledWrapper.updateTrackedDimensions();
    expect(controlledWrapper.dimensions.viewport.clientHeight).toBe(testDimensions.clientHeight);
    expect(controlledWrapper.dimensions.viewport.clientWidth).toBe(testDimensions.clientWidth);
    expect(controlledWrapper.dimensions.viewport.scrollWidth).toBe(testDimensions.scrollWidth);
    expect(controlledWrapper.dimensions.viewport.scrollLeft).toBe(testDimensions.scrollLeft);
    expect(controlledWrapper.dimensions.canvas.rect.width).toBe(testRect.width);
    expect(controlledWrapper.dimensions.canvas.rect.left).toBe(testRect.left);
    expect(controlledWrapper.getCanvasBoundingClientRect()).toMatchInlineSnapshot(`
      {
        "left": 0,
        "width": 1000,
      }
    `);
    controlledWrapper.dimensions.canvas.rect = undefined;
    const modifiedTestRect = {
      ...testRect,
      left: 5
    };
    const modifiedCanvasRef = {
      ...canvasRef,
      getBoundingClientRect: jest.fn(() => modifiedTestRect)
    };
    controlledWrapper.canvasRef = modifiedCanvasRef;
    expect(controlledWrapper.getCanvasBoundingClientRect()).toEqual(modifiedTestRect);
  });

  it('can compute time from mouse fractional position', () => {
    const controlledWrapper = buildControlledWaveformPanel();
    expect(
      controlledWrapper.computeTimeSecsForMouseXFractionalPosition(0.73)
    ).toMatchInlineSnapshot(`803`);
  });

  it('can update size while resizing and not resizing', async () => {
    const props = {
      ...controlledProps,
      isResizing: true
    };
    const controlledWrapper = buildControlledWaveformPanel(props);
    controlledWrapper.renderer = { ...controlledWrapper.renderer, clear: jest.fn() };
    await act(() => {
      expect(() => controlledWrapper.updateSize()).not.toThrow();
    });
  });
  describe('can zoom', () => {
    it('controlled component zoom start end range are robust', async () => {
      const controlledWrapper = buildControlledWaveformPanel();
      controlledWrapper.renderer = {
        canvas: 'canvas',
        context: 'context',
        domElement: 'domElement',
        forceContextLoss: jest.fn(),
        setScissor: jest.fn(),
        setScissorTest: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
        setViewport: jest.fn(),
        clear: jest.fn(),
        dispose: jest.fn()
      };
      const zoomElement = {
        ...element,
        clientWidth: 1000
      };
      controlledWrapper.waveformsContainerRef = zoomElement;
      controlledWrapper.waveformsViewportRef = {
        scrollLeft: 0,
        scrollTop: 0,
        scroll: jest.fn()
      };
      controlledWrapper.canvasRef = {
        clientWidth: 1000,
        getBoundingClientRect: jest.fn(() => ({
          width: 1000,
          left: 0
        }))
      };
      // start < 0
      let interval = {
        startTimeSecs: viewableInterval.startTimeSecs - 10,
        endTimeSecs: viewableInterval.endTimeSecs
      };
      await act(() => {
        expect(() => controlledWrapper.zoom(interval)).not.toThrow();
      });
      expect(controlledWrapper.getCurrentZoomInterval()).toMatchInlineSnapshot(`
        {
          "endTimeSecs": 1100,
          "startTimeSecs": 0,
        }
      `);
      // end > 1
      interval = {
        startTimeSecs: viewableInterval.startTimeSecs,
        endTimeSecs: viewableInterval.endTimeSecs + 100
      };
      await act(() => {
        expect(() => controlledWrapper.zoom(interval)).not.toThrow();
      });
      expect(controlledWrapper.getCurrentZoomInterval()).toMatchInlineSnapshot(`
        {
          "endTimeSecs": 1100,
          "startTimeSecs": 0,
        }
      `);
      // end before start
      interval = {
        startTimeSecs: zoomInterval.endTimeSecs,
        endTimeSecs: zoomInterval.startTimeSecs
      };
      await act(() => {
        expect(() => controlledWrapper.zoom(interval)).not.toThrow();
      });
      expect(controlledWrapper.getCurrentZoomInterval()).toMatchInlineSnapshot(`
        {
          "endTimeSecs": 1100,
          "startTimeSecs": 0,
        }
      `);
      // start and end undefined
      await act(() => {
        expect(() => controlledWrapper.zoom(undefined, undefined)).not.toThrow();
      });
    });
  });
  describe('Mouse events for zoom and create masks', () => {
    const dummyEvent = {
      preventDefault: jest.fn(),
      shiftKey: true,
      clientX: 50,
      clientY: 50,
      altKey: false,
      stopPropagation: jest.fn(() => true)
    } as unknown as React.MouseEvent<HTMLDivElement>;
    it('mouse up', () => {
      const controlledWrapper = buildControlledWaveformPanel();
      // test undefined state
      expect(() => controlledWrapper.onMouseUp(dummyEvent)).not.toThrow();
      // set up to call handleSingleDoubleClick
      controlledWrapper.isMouseDown = {
        clientX: 50,
        clientY: 50
      };
      // set up to call zoomOrCreateMas
      controlledWrapper.isMouseDown = {
        clientX: 50,
        clientY: 50
      };
      controlledWrapper.brushType = BrushType.Zoom;
      controlledWrapper.startOfBrush = false;
      controlledWrapper.selectionStart = true;
      expect(() =>
        controlledWrapper.onMouseUp(
          dummyEvent,
          undefined,
          'default channel id',
          zoomInterval.startTimeSecs,
          true
        )
      ).not.toThrow();
      expect(() =>
        controlledWrapper.onMouseDown(
          dummyEvent,
          undefined,
          'default channel id',
          zoomInterval.startTimeSecs,
          true
        )
      ).not.toThrow();
    });
  });
  describe('Mouse move events', () => {
    const dummyEvent2 = {
      shiftKey: true,
      clientX: 50,
      clientY: 50
    } as unknown as React.MouseEvent<HTMLDivElement>;
    it('mouse move', () => {
      const controlledWrapper = buildControlledWaveformPanel();
      // set up to call handleSingleDoubleClick
      controlledWrapper.isMouseDown = {
        clientX: 50,
        clientY: 50
      };
      controlledWrapper.brushType = BrushType.Zoom;
      controlledWrapper.startOfBrush = true;
      controlledWrapper.selectionStart = true;
      // test undefined state
      expect(() => controlledWrapper.onMouseMove(dummyEvent2)).not.toThrow();
      expect(() => controlledWrapper.onMouseMove(dummyEvent2, 2)).not.toThrow();
      expect(() =>
        controlledWrapper.onMouseDown(dummyEvent2, undefined, undefined, undefined, undefined)
      ).not.toThrow();
    });
  });
});
