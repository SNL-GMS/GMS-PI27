/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/jsx-props-no-spreading */
import { WeavessTypes } from '@gms/weavess-core';
import { render } from '@testing-library/react';
import * as React from 'react';

import { ContentRenderer } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/content-renderer/content-renderer';
import type { ContentRendererProps } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/content-renderer/types';
import { initialConfiguration } from '../../../../../../../../__data__/test-util-data';

const configuration: WeavessTypes.Configuration = {
  ...initialConfiguration,
  shouldRenderSpectrograms: false,
  defaultChannel: {
    disableMeasureWindow: true,
    disableMaskModification: true
  },
  nonDefaultChannel: {
    disableMeasureWindow: true,
    disableMaskModification: false
  }
};

const timeRange: WeavessTypes.TimeRange = {
  startTimeSecs: 300,
  endTimeSecs: 700
};
const computeTimeSecsForMouseXFractionalPosition = jest.fn(() => 88);
const contentRendererProps: ContentRendererProps = {
  initialConfiguration: configuration,
  channelId: 'channel-id',
  stationId: 'station-id',
  displayInterval: timeRange,
  viewableInterval: timeRange,
  isChannelSelected: false,
  offsetSecs: 0,
  getZoomRatio: jest.fn().mockReturnValue(0.5),
  isDefaultChannel: true,
  predictedPhases: [],
  signalDetections: [],
  isSplitChannelOverlayOpen: true,
  theoreticalPhaseWindows: [],
  contentRenderers: [],
  description: 'description',
  descriptionLabelColor: '#ff000',
  events: {
    onChannelClick: jest.fn(),
    onClickSelectionWindow: jest.fn(),
    onContextMenu: jest.fn(),
    onMaskClick: jest.fn(),
    onMaskContextClick: jest.fn(),
    onMaskCreateDragEnd: jest.fn(),
    onMeasureWindowUpdated: jest.fn(),
    onMoveSelectionWindow: jest.fn(),
    onPredictivePhaseClick: jest.fn(),
    onPredictivePhaseContextMenu: jest.fn(),
    onSignalDetectionClick: jest.fn(),
    onSignalDetectionDoubleClick: jest.fn(),
    onSignalDetectionContextMenu: jest.fn(),
    onSignalDetectionDragEnd: jest.fn(),
    onUpdateMarker: jest.fn(),
    onUpdateSelectionWindow: jest.fn()
  },
  markers: {
    moveableMarkers: [],
    selectionWindows: [],
    verticalMarkers: []
  },
  canvasRef: jest.fn(
    () =>
      ({
        getBoundingClientRect: () => ({
          right: 9,
          left: 11,
          width: 100
        })
      }) as any
  ),
  converters: {
    computeFractionOfCanvasFromMouseXPx: jest.fn(() => 88),
    computeTimeSecsForMouseXFractionalPosition,
    computeTimeSecsFromMouseXPixels: jest.fn(() => 88)
  },
  onContextMenu: jest.fn(),
  onKeyDown: jest.fn(),
  onMouseDown: jest.fn(),
  onMouseMove: jest.fn(),
  onMouseUp: jest.fn(),
  renderWaveforms: jest.fn(),
  updateMeasureWindow: jest.fn()
};

const mockSetState = jest.fn();
/**
 * creates a mock ContentRenderer
 *
 * @returns mock ContentRenderer
 */
const getContentRenderer = (props = contentRendererProps) => {
  const mockContentRenderer: any = new ContentRenderer(props);
  mockContentRenderer.containerRef = {
    getBoundingClientRect: () => {
      return {
        right: 9,
        left: 11,
        width: 100
      };
    }
  };
  mockContentRenderer.dragIndicatorRef = { style: { display: 'initial' } };
  mockContentRenderer.setState = mockSetState;
  return mockContentRenderer;
};

describe('Weavess Content Renderer', () => {
  it('to be defined', () => {
    expect(ContentRenderer).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(
      <ContentRenderer {...contentRendererProps} isSplitChannelOverlayOpen={false} />
    );
    expect(container).toMatchSnapshot();
  });

  it('create all markers', () => {
    const props: ContentRendererProps = {
      ...contentRendererProps,
      markers: {
        moveableMarkers: [
          {
            id: 'moveable',
            timeSecs: 40,
            color: 'ff000',
            lineStyle: WeavessTypes.LineStyle.DASHED,
            minTimeSecsConstraint: 4,
            maxTimeSecsConstraint: 200
          }
        ],
        selectionWindows: [
          {
            id: 'selection',
            color: '00ff00',
            isMoveable: true,
            startMarker: {
              id: 'start',
              color: '#ff0000',
              lineStyle: WeavessTypes.LineStyle.SOLID,
              timeSecs: 10,
              minTimeSecsConstraint: 1,
              maxTimeSecsConstraint: 200
            },
            endMarker: {
              id: 'end',
              color: '#ff0000',
              lineStyle: WeavessTypes.LineStyle.SOLID,
              timeSecs: 80,
              minTimeSecsConstraint: 1,
              maxTimeSecsConstraint: 200
            }
          }
        ],
        verticalMarkers: [
          {
            id: 'vertical',
            color: '0000ff',
            lineStyle: WeavessTypes.LineStyle.DASHED,
            timeSecs: 120,
            minTimeSecsConstraint: 0,
            maxTimeSecsConstraint: 300
          }
        ]
      },
      isSplitChannelOverlayOpen: false
    };
    const { container } = render(<ContentRenderer {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('getTimeSecsForClientX', () => {
    const mockContentRenderer = getContentRenderer();
    computeTimeSecsForMouseXFractionalPosition.mockClear();
    expect(mockContentRenderer.getTimeSecsForClientX(10)).toBeNaN();
    // Test if x position is < left && > right
    expect(mockContentRenderer.getTimeSecsForClientX(10)).toBeNaN();
    expect(mockContentRenderer.getTimeSecsForClientX(18)).toEqual(88);
    expect(computeTimeSecsForMouseXFractionalPosition).toHaveBeenCalled();
  });

  it('getClientXForTimeSecs', () => {
    const mockContentRenderer = getContentRenderer();
    expect(
      mockContentRenderer.getClientXForTimeSecs(timeRange.startTimeSecs + 100)
    ).toMatchInlineSnapshot(`36`);
  });

  it('toggleDragIndicator', () => {
    const mockContentRenderer = getContentRenderer();
    mockContentRenderer.toggleDragIndicator(true, '000000');
    expect(mockContentRenderer.dragIndicatorRef.style.display).toEqual('initial');
    mockContentRenderer.toggleDragIndicator(false, '000000');
    expect(mockContentRenderer.dragIndicatorRef.style.display).toEqual('none');

    mockContentRenderer.dragIndicatorRef = undefined;
    mockContentRenderer.toggleDragIndicator(true, '000000');
  });

  it('onChannelMouseEnter and onChannelMouseLeave', () => {
    const mockContentRenderer = getContentRenderer();
    mockSetState.mockClear();
    mockContentRenderer.onChannelMouseEnter();
    expect(mockSetState.mock.calls[0]).toMatchInlineSnapshot(`
      [
        {
          "backgroundColor": "rgba(150,150,150,0.2)",
          "mouseFocus": true,
        },
      ]
    `);
    mockSetState.mockClear();
    mockContentRenderer.onChannelMouseLeave();
    expect(mockSetState.mock.calls[0]).toMatchInlineSnapshot(`
      [
        {
          "backgroundColor": "initial",
          "mouseFocus": false,
        },
      ]
    `);
  });

  it('positionDragIndicator', () => {
    const mockContentRenderer = getContentRenderer();

    const getBoundingClientRect = jest.fn(() => ({
      left: 44,
      right: 12,
      width: 100
    }));
    expect(mockContentRenderer.dragIndicatorRef.style.display).toMatchInlineSnapshot(`"initial"`);

    mockContentRenderer.containerRef = {
      getBoundingClientRect
    };
    mockContentRenderer.positionDragIndicator(48);
    expect(mockContentRenderer.dragIndicatorRef.style.left).toEqual('4%');
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);

    mockContentRenderer.dragIndicatorRef = undefined;
    mockContentRenderer.positionDragIndicator(48);
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
  });
});
