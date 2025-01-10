/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/jsx-props-no-spreading */
import { WeavessTypes } from '@gms/weavess-core';
import { render } from '@testing-library/react';
import * as React from 'react';
import THREE from 'three';

import type { WaveformRendererProps } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/waveform-renderer/types';
import { WaveformRenderer } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/waveform-renderer/waveform-renderer';

jest.mock('lodash/debounce', () => {
  return fn => {
    // eslint-disable-next-line no-param-reassign
    fn.cancel = jest.fn();
    return fn;
  };
});

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
    MeshBasicMaterial: jest.fn(),
    WebGLRenderer: mockWebGLRenderer,
    OrthographicCamera: jest.fn(
      (
        left?: number,
        right?: number,
        top?: number,
        bottom?: number,
        near?: number,
        far?: number
      ) => {
        return {
          left: left ?? 1,
          right: right ?? 1,
          top: top ?? 1,
          bottom: bottom ?? 1,
          near: near ?? 1,
          far: far ?? 1,
          position: new THREE.Vector3(),
          updateProjectionMatrix: jest.fn()
        };
      }
    )
  };
});

function createConfiguredInputString(channelName: string): string {
  const csd = {
    channel: {
      name: channelName,
      effectiveAt: 450
    },
    startTime: 450,
    endTime: 500,
    creationTime: 450
  };
  return JSON.stringify(csd);
}

const maxAmplitudeValue = 10;
const channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
channelSegmentsRecord[WeavessTypes.UNFILTERED] = [
  {
    configuredInputName: createConfiguredInputString('WaveformRendererChannelId'),
    channelName: 'WaveformRendererChannel',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    dataSegments: [
      {
        color: 'dodgerblue',
        displayType: [WeavessTypes.DisplayType.SCATTER],
        pointSize: 2,
        data: {
          startTimeSecs: 450,
          endTimeSecs: 500,
          sampleRate: 1,
          values: [1, 2, 3, 4, 5, 6, 7, 8, 9, maxAmplitudeValue],
          domainTimeRange: {
            startTimeSecs: 460,
            endTimeSecs: 490
          }
        }
      }
    ],
    channelSegmentBoundaries: {
      channelSegmentId: WeavessTypes.UNFILTERED,
      topMax: maxAmplitudeValue,
      bottomMax: -maxAmplitudeValue,
      channelAvg: 0,
      offset: 0
    }
  }
];

const channelSegmentsRecordNoBoundaries: Record<string, WeavessTypes.ChannelSegment[]> = {};
channelSegmentsRecordNoBoundaries[WeavessTypes.UNFILTERED] = [
  {
    configuredInputName: createConfiguredInputString('WaveformRendererChannelId'),
    channelName: 'WaveformRendererChannel',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    dataSegments: [
      {
        color: 'dodgerblue',
        displayType: [WeavessTypes.DisplayType.SCATTER],
        pointSize: 2,
        data: {
          startTimeSecs: 450,
          endTimeSecs: 500,
          sampleRate: 1,
          values: [1, 2, 3, 4, 5, 6, 7, 8, 9, maxAmplitudeValue],
          domainTimeRange: {
            startTimeSecs: 460,
            endTimeSecs: 490
          }
        }
      }
    ],
    channelSegmentBoundaries: {
      channelSegmentId: WeavessTypes.UNFILTERED,
      topMax: maxAmplitudeValue,
      bottomMax: -maxAmplitudeValue,
      channelAvg: 0,
      offset: 0
    }
  }
];

const noWaveformChannelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};
noWaveformChannelSegmentsRecord[WeavessTypes.UNFILTERED] = [
  {
    configuredInputName: createConfiguredInputString('WaveformRendererChannelId'),
    channelName: 'WaveformRendererChannel',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    dataSegments: [
      {
        color: 'dodgerblue',
        displayType: [WeavessTypes.DisplayType.SCATTER],
        pointSize: 2,
        data: {
          id: 'blah',
          startTimeSecs: 450,
          endTimeSecs: 500,
          sampleRate: 1,
          values: undefined,
          domainTimeRange: {
            startTimeSecs: 460,
            endTimeSecs: 490
          }
        }
      }
    ]
  }
];
const waveformRendererProps: WaveformRendererProps = {
  displayInterval: {
    startTimeSecs: 400,
    endTimeSecs: 700
  },
  viewableInterval: {
    startTimeSecs: 450,
    endTimeSecs: 650
  },
  defaultRange: {
    min: 4,
    max: 9
  },
  isSplitChannelOverlayOpen: false,
  splitChannelRefs: {},
  channelName: 'AAK.AAK.BHZ',
  channelSegmentId: WeavessTypes.UNFILTERED,
  channelSegmentsRecord,
  masks: [
    {
      id: `mask_1`,
      startTimeSecs: 420,
      endTimeSecs: 440,
      color: 'green',
      isProcessingMask: false
    }
  ],
  glMin: 0,
  glMax: 100,
  msrWindowWaveformAmplitudeScaleFactor: 2.0,
  isMeasureWindow: false,
  renderWaveforms: jest.fn(),
  setYAxisBounds: jest.fn(),
  setError: jest.fn(),
  // eslint-disable-next-line no-promise-executor-return
  getPositionBuffer: jest.fn(async () => new Promise(resolve => resolve(new Float32Array(0))))
};

/**
 * create a mock WaveformRenderer for testing
 *
 * @param props
 * @returns
 */
const getWaveformRenderer = (props = waveformRendererProps) => {
  const mockWaveformRenderer = new WaveformRenderer(props);
  mockWaveformRenderer.camera = {
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    near: 1,
    far: 1,
    position: new THREE.Vector3(),
    updateProjectionMatrix: jest.fn()
  } as any;
  mockWaveformRenderer.scene = new THREE.Scene();
  return mockWaveformRenderer;
};

describe('Weavess Waveform Renderer', () => {
  it('to be defined', () => {
    expect(WaveformRenderer).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<WaveformRenderer {...waveformRendererProps} />);
    expect(container).toMatchSnapshot();
  });

  it('calls render waveforms from updateAmplitude', async () => {
    const updatedProps = {
      ...waveformRendererProps,
      channelSegmentsRecord: channelSegmentsRecordNoBoundaries
    };
    const mockWaveformRenderer = getWaveformRenderer(updatedProps);
    (waveformRendererProps.renderWaveforms as any).mockClear();
    await mockWaveformRenderer.updateAmplitude({ startTimeSecs: 400, endTimeSecs: 700 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(updatedProps.renderWaveforms).toHaveBeenCalled();
    expect((mockWaveformRenderer as any).channelSegmentBoundaries.get(WeavessTypes.UNFILTERED))
      .toMatchInlineSnapshot(`
      [
        {
          "bottomMax": 1,
          "channelAvg": 5.5,
          "channelSegmentId": "Unfiltered",
          "offset": 10,
          "samplesCount": 10,
          "topMax": 10,
        },
      ]
    `);
  });

  it('calls render waveforms from with waveform to calculate CS bounds', async () => {
    const old = waveformRendererProps.channelSegmentsRecord[WeavessTypes.UNFILTERED];
    waveformRendererProps.channelSegmentsRecord[WeavessTypes.UNFILTERED] = [];
    const mockWaveformRenderer = getWaveformRenderer();
    (waveformRendererProps.renderWaveforms as any).mockClear();
    await mockWaveformRenderer.updateAmplitude({ startTimeSecs: 400, endTimeSecs: 700 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(waveformRendererProps.renderWaveforms).toHaveBeenCalled();
    waveformRendererProps.channelSegmentsRecord[WeavessTypes.UNFILTERED] = old;
  });

  it('calls render waveforms from updateAmplitude with no channel segment boundaries', async () => {
    const updatedProps = {
      ...waveformRendererProps,
      channelSegmentsRecord: channelSegmentsRecordNoBoundaries
    };
    const mockWaveformRenderer = getWaveformRenderer(updatedProps);
    (waveformRendererProps.renderWaveforms as any).mockClear();
    await mockWaveformRenderer.updateAmplitude({ startTimeSecs: 400, endTimeSecs: 700 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(updatedProps.renderWaveforms).toHaveBeenCalled();
  });

  it('calls render waveforms from updateAmplitude with no waveform channel segments', async () => {
    const updatedProps = {
      ...waveformRendererProps,
      channelSegmentsRecord: noWaveformChannelSegmentsRecord
    };
    (waveformRendererProps.renderWaveforms as any).mockClear();
    const mockWaveformRenderer = getWaveformRenderer(updatedProps);
    await mockWaveformRenderer.updateAmplitude({ startTimeSecs: 400, endTimeSecs: 700 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(updatedProps.renderWaveforms).toHaveBeenCalled();
  });

  it('calls render waveforms from updateAmplitude with no channel segments', async () => {
    const updatedProps = {
      ...waveformRendererProps,
      channelSegmentsRecord: {}
    };
    (waveformRendererProps.renderWaveforms as any).mockClear();
    const mockWaveformRenderer = getWaveformRenderer(updatedProps);
    await mockWaveformRenderer.updateAmplitude({ startTimeSecs: 400, endTimeSecs: 700 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(updatedProps.renderWaveforms).toHaveBeenCalled();
  });

  it('test setting camera amplitude factor', () => {
    const mockWaveformRenderer = getWaveformRenderer();
    expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toEqual(
      waveformRendererProps.msrWindowWaveformAmplitudeScaleFactor
    );
    (mockWaveformRenderer as any).manualAmplitudeScaledValue = 1.2345;
    expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toMatchInlineSnapshot(`1.2345`);
  });

  it('call componentDidUpdate with various props', async () => {
    const previousPropsDisplayTimeChanges = {
      ...waveformRendererProps,
      displayInterval: {
        startTimeSecs: 300,
        endTimeSecs: 600
      }
    };
    const mockWaveformRenderer = getWaveformRenderer();
    expect(
      await mockWaveformRenderer.componentDidUpdate(previousPropsDisplayTimeChanges)
    ).toBeUndefined();
    const previousPropsDisplayDiffChanSegId = {
      ...waveformRendererProps,
      channelSegmentId: 'foobar'
    };
    expect(
      await mockWaveformRenderer.componentDidUpdate(previousPropsDisplayDiffChanSegId)
    ).toBeUndefined();
    expect(waveformRendererProps.setError).toHaveBeenCalled();
  });

  // // eslint-disable-next-line @typescript-eslint/require-await
  it('test measure window camera amplitude adjustment', () => {
    const mockWaveformRenderer: any = getWaveformRenderer();
    const previousPropsDisplayTimeChanges = {
      ...waveformRendererProps,
      msrWindowWaveformAmplitudeScaleFactor: 2.1
    };
    expect(() =>
      mockWaveformRenderer.componentDidUpdate(previousPropsDisplayTimeChanges)
    ).not.toThrow();
    expect(mockWaveformRenderer.manualAmplitudeScaledValue).toEqual(
      waveformRendererProps.msrWindowWaveformAmplitudeScaleFactor
    );
  });

  it('can componentWillUnmount clean up draw images', () => {
    const mockWaveformRenderer: any = getWaveformRenderer();
    expect(mockWaveformRenderer.shuttingDown).toBeFalsy();
    expect(() => mockWaveformRenderer.componentWillUnmount()).not.toThrow();
    expect(mockWaveformRenderer.shuttingDown).toBeTruthy();
  });

  it('can find the waveform amplitude at a specific point', () => {
    const mockWaveformRenderer: any = getWaveformRenderer();

    const amplitude = mockWaveformRenderer.findAmplitudeAtTime(450);

    expect(amplitude).toEqual(1);
  });

  describe('can manually scale using mouse', () => {
    const buildHTMLDivMouseEvent = (altKey: boolean) => {
      const keyboardEvent = {
        preventDefault: jest.fn(),
        shiftKey: false,
        clientX: 50,
        clientY: 50,
        altKey,
        stopPropagation: jest.fn(() => true)
      };
      return keyboardEvent;
    };
    it('drag mouse to manually scale amplitude', () => {
      const mouseProps = {
        ...waveformRendererProps,
        msrWindowWaveformAmplitudeScaleFactor: 0
      };
      const mockWaveformRenderer: any = getWaveformRenderer(mouseProps);
      // Expect not amplitude not set
      expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toEqual(0);
      const mouseEvent: any = buildHTMLDivMouseEvent(false);
      // Call mouse down when scaling
      expect(() => mockWaveformRenderer.beginScaleAmplitudeDrag(mouseEvent)).not.toThrow();
      expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toMatchInlineSnapshot(`1`);
      // Call mouse mouse when scaling up
      mouseEvent.clientY = 60;
      let mouse = new MouseEvent('mousemove', mouseEvent);
      expect(() => document.body.dispatchEvent(mouse)).not.toThrow();
      expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toMatchInlineSnapshot(`1`);

      // Call mouse mouse when scaling down
      mouseEvent.clientY = 40;
      mouse = new MouseEvent('mousemove', mouseEvent);
      expect(() => document.body.dispatchEvent(mouse)).not.toThrow();
      expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toMatchInlineSnapshot(`1.1`);

      // Internal amplitude scaling flag should be set
      expect(mockWaveformRenderer.isManuallyAmplitudeScaled()).toEqual(true);

      // Reset (disable) manual amplitde scale override
      expect(() => mockWaveformRenderer.resetAmplitude()).not.toThrow();
      expect(mockWaveformRenderer.getCameraManualScaleAmplitude()).toEqual(0);

      // Internal amplitude scaling flag should be unset
      expect(mockWaveformRenderer.isManuallyAmplitudeScaled()).toEqual(false);

      // Remove mouse move and mouse up
      expect(() => document.body.dispatchEvent(new MouseEvent('mouseup'))).not.toThrow();
    });
  });
});
