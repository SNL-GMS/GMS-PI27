/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';

import {
  buildWeavessMarkers,
  onChannelClickToOffset,
  onClickSelectionWindowToOffset,
  onMaskCreateDragEndToOffset,
  onMeasureWindowUpdatedToOffset,
  onMoveSelectionWindowToOffset,
  onUpdateMarkerToOffset,
  onUpdateSelectionWindowToOffset
} from '../../../../../src/ts/components/weavess-waveform-display/components/station/utils';

const timeRange: WeavessTypes.TimeRange = {
  startTimeSecs: 200,
  endTimeSecs: 500
};
const selectionWindow = {
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
};

const marker = {
  id: 'marker',
  color: 'lime',
  lineStyle: WeavessTypes.LineStyle.DASHED,
  timeSecs: timeRange.startTimeSecs + 5
};

const markers: WeavessTypes.Markers = {
  verticalMarkers: [marker],
  moveableMarkers: [
    {
      id: 'marker',
      color: 'RED',
      lineStyle: WeavessTypes.LineStyle.DASHED,
      timeSecs: timeRange.startTimeSecs + 50
    }
  ],
  selectionWindows: [selectionWindow]
};

const undefinedMarkers: WeavessTypes.Markers = {
  verticalMarkers: undefined,
  moveableMarkers: undefined,
  selectionWindows: undefined
};

const mouseEvent: Partial<React.MouseEvent<HTMLDivElement>> = {
  preventDefault: jest.fn(),
  shiftKey: true,
  stopPropagation: jest.fn()
};

const undefinedContentEvent: WeavessTypes.ChannelContentEvents =
  WeavessConstants.DEFAULT_UNDEFINED_CHANNEL_CONTENT_EVENTS;

const weavessEvents: WeavessTypes.ChannelContentEvents = {
  onContextMenu: jest.fn(),
  onChannelClick: jest.fn(),
  onSignalDetectionContextMenu: jest.fn(),
  onSignalDetectionClick: jest.fn(),
  onSignalDetectionDragEnd: jest.fn(),
  onPredictivePhaseContextMenu: jest.fn(),
  onPredictivePhaseClick: jest.fn(),
  onMaskCreateDragEnd: jest.fn(),
  onMeasureWindowUpdated: jest.fn(),
  onUpdateMarker: jest.fn(),
  onMoveSelectionWindow: jest.fn(),
  onUpdateSelectionWindow: jest.fn(),
  onClickSelectionWindow: jest.fn()
};

describe('Station utilities', () => {
  it('build weavess markers', () => {
    expect(buildWeavessMarkers(markers, 100)).toMatchSnapshot();
  });

  it('build weavess markers with undefined markers', () => {
    expect(buildWeavessMarkers(undefinedMarkers, 100)).toMatchSnapshot();
  });

  it('exercise the channel content event offsets', () => {
    let func;
    func = onChannelClickToOffset(weavessEvents, 100);
    expect(() => func(mouseEvent, 'fooChannelId', timeRange.startTimeSecs)).not.toThrow();
    func = onMaskCreateDragEndToOffset(weavessEvents, 100);
    expect(() =>
      func(mouseEvent, ['sdId'], timeRange.startTimeSecs, timeRange.endTimeSecs, true)
    ).not.toThrow();
    func = onMeasureWindowUpdatedToOffset(weavessEvents, 100);
    expect(() =>
      func(true, 'fooChannelId', timeRange.startTimeSecs, timeRange.endTimeSecs, 100)
    ).not.toThrow();
    func = onUpdateMarkerToOffset(weavessEvents, 100);
    expect(() => func('fooChannelId', marker)).not.toThrow();

    func = onMoveSelectionWindowToOffset(weavessEvents, 100);
    expect(() => func('fooChannelId', selectionWindow)).not.toThrow();
    func = onUpdateSelectionWindowToOffset(weavessEvents, 100);
    expect(() => func('fooChannelId', selectionWindow)).not.toThrow();
    func = onClickSelectionWindowToOffset(weavessEvents, 100);
    expect(() => func('fooChannelId', selectionWindow, timeRange.startTimeSecs)).not.toThrow();
  });

  it('exercise the channel content event offsets with undefined callbacks', () => {
    expect(onChannelClickToOffset(undefinedContentEvent, 100)).toBeUndefined();
    expect(onMeasureWindowUpdatedToOffset(undefinedContentEvent, 100)).toBeUndefined();
    expect(onUpdateMarkerToOffset(undefinedContentEvent, 100)).toBeUndefined();
    expect(onMoveSelectionWindowToOffset(undefinedContentEvent, 100)).toBeUndefined();
    expect(onUpdateSelectionWindowToOffset(undefinedContentEvent, 100)).toBeUndefined();
    expect(onClickSelectionWindowToOffset(undefinedContentEvent, 100)).toBeUndefined();
    expect(onMaskCreateDragEndToOffset(undefinedContentEvent, 100)).toBeUndefined();
  });
});
