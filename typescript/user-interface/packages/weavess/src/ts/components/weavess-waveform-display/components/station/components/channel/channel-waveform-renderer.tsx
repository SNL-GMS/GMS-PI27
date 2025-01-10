import type { WeavessTypes } from '@gms/weavess-core';
import * as React from 'react';

import type { PositionConverters } from '../../../../../../util/types';
import type {
  AnimationFrameOptions,
  updateMeasureWindow as updateMeasureWindowFunction
} from '../../../../types';
import { MeasureWindowSelectionListener } from '../../../measure-window/measure-window-selection';
import type { Channel } from './channel';
import { ContentRenderer } from './components/content-renderer/content-renderer';
import { WaveformRenderer } from './components/waveform-renderer/waveform-renderer';

/**
 * returns an object containing a description that should be displayed in the bottom right corner of the channel row,
 * along with setError to set isError: boolean, and errorMessage: string.
 *
 * If isError == true, description will be the error message, and a hover tooltip with additional error info will be added
 * If the channel already has a description, use that.
 * If all channel segments share a description, use that.
 * If channel segments have multiple descriptions, use 'mixed' as the description
 * and finally, uses undefined if there are no descriptions and there is no error.
 */
export function useDescription(
  channel: WeavessTypes.Channel,
  channelSegments: WeavessTypes.ChannelSegment[]
): {
  setError: (isError: boolean, errorMessage?: string | undefined) => void;
  description: string | WeavessTypes.ChannelDescription | undefined;
} {
  const [isError, setIsError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
  const setError = React.useCallback((isE: boolean, msg?: string | undefined): void => {
    setIsError(isE);
    setErrorMessage(msg);
  }, []);
  return React.useMemo(() => {
    if (isError) {
      return {
        setError,
        description: {
          message:
            typeof channel.description === 'string'
              ? channel.description
              : channel?.description?.message,
          tooltipMessage: isError ? errorMessage ?? 'Filtering operation failed' : undefined
        }
      };
    }
    if (channel.description) {
      return { setError, description: channel.description };
    }
    if (channelSegments.every(cs => cs.description === channelSegments[0]?.description)) {
      return { setError, description: channelSegments[0]?.description };
    }
    if (channelSegments.find(cs => cs.description != null)) {
      return { setError, description: 'mixed' };
    }
    return {
      setError,
      description: undefined
    };
  }, [channel.description, channelSegments, errorMessage, isError, setError]);
}

/**
 * The type of the props for the {@link ChannelWaveformRenderer} component
 */
export interface ChannelWaveformRendererProps {
  canvasRef(): HTMLCanvasElement | null;
  channel: WeavessTypes.Channel;
  channelSegments: WeavessTypes.ChannelSegment[];
  contentRenderMouseDown;
  converters: PositionConverters;
  /** viewable interval plus its min/max offsets; full amount of data window */
  displayInterval: WeavessTypes.TimeRange;
  /** viewable time interval, the amount of data initially loaded into weavess (excluding offsets) */
  viewableInterval: WeavessTypes.TimeRange;
  offsetSecs: number;
  events: WeavessTypes.ChannelEvents | undefined;
  getBoundaries:
    | ((
        channelName: string,
        channelSegment?: WeavessTypes.ChannelSegment,
        timeRange?: WeavessTypes.TimeRange
      ) => Promise<WeavessTypes.ChannelSegmentBoundaries | undefined>)
    | undefined;
  getContentRenderer: (this: any, contentRenderer: any) => any[];
  getPositionBuffer:
    | ((
        id: string,
        startTime: number,
        endTime: number,
        domainTimeRange: WeavessTypes.TimeRange
      ) => Promise<Float32Array>)
    | undefined;
  getSignalDetections: (signalDetections: WeavessTypes.PickMarker[]) => WeavessTypes.PickMarker[];
  getZoomRatio: () => number;
  glMax: number;
  glMin: number;
  height: number;
  initialConfiguration: WeavessTypes.Configuration;
  isDefaultChannel: boolean;
  isMeasureWindow: boolean;
  splitModePickMarkerColor?: string;
  isMeasureWindowEnabled(): boolean;
  isSplitChannelOverlayOpen: boolean;
  isSplitStation?: boolean;
  activeSplitModeType?: WeavessTypes.SplitMode;
  labelWidthPx: number;
  msrWindowWaveformAmplitudeScaleFactor?: number;
  numberOfRenderers: number;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onWaveformContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onWaveformMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  renderWaveforms(options?: AnimationFrameOptions): void;
  setWaveformContainerRef: (ref: HTMLDivElement) => void;
  setWaveformContentRendererRef: (ref: ContentRenderer) => void;
  setWaveformRendererRef: (ref: WaveformRenderer) => void;
  setWaveformYAxisBounds: (min: number, max: number) => void;
  splitChannelRefs: { [id: string]: Channel | null };
  stationId: string;
  toast: (message: string) => void;
  updateMeasureWindow: updateMeasureWindowFunction | undefined;
  updateMeasureWindowPanel: (
    timeRange: WeavessTypes.TimeRange,
    removeMeasureWindowSelection: () => void
  ) => void;
  waveform: WeavessTypes.ChannelWaveformContent;
}

/**
 * Renders the waveform content for the channel, including the measure window
 * selection listener, the ContentRenderer, and the waveform renderer
 */
export function InternalChannelWaveformRenderer({
  canvasRef,
  channel,
  channelSegments,
  contentRenderMouseDown,
  converters,
  displayInterval,
  viewableInterval,
  offsetSecs,
  events,
  getBoundaries,
  getContentRenderer,
  getPositionBuffer,
  getSignalDetections,
  getZoomRatio,
  glMax,
  glMin,
  height,
  initialConfiguration,
  isDefaultChannel,
  isMeasureWindow,
  isMeasureWindowEnabled,
  isSplitChannelOverlayOpen,
  isSplitStation,
  activeSplitModeType,
  labelWidthPx,
  msrWindowWaveformAmplitudeScaleFactor,
  numberOfRenderers,
  splitModePickMarkerColor,
  onMouseMove,
  onWaveformContextMenu,
  onKeyDown,
  onWaveformMouseUp,
  renderWaveforms,
  setWaveformContainerRef,
  setWaveformContentRendererRef,
  setWaveformRendererRef,
  setWaveformYAxisBounds,
  splitChannelRefs,
  stationId,
  toast,
  updateMeasureWindow,
  updateMeasureWindowPanel,
  waveform
}: ChannelWaveformRendererProps) {
  const { description, setError } = useDescription(channel, channelSegments);
  const onSetAmplitude = React.useCallback(
    (
      channelId: string,
      channelSegmentBounds: WeavessTypes.ChannelSegmentBoundaries,
      measureWindow: boolean
    ) => {
      return events?.onSetAmplitude
        ? events?.onSetAmplitude(channelId, channelSegmentBounds, measureWindow)
        : undefined;
    },
    [events]
  );
  const renderMeasureWindowSelectionChildren = React.useCallback(
    ({ contentRenderer, onMouseDown }) => {
      return (
        <div
          className="channel-content-container"
          /* Using channel.name reduces unnecessary unmounts in the case of filtering
          since the channelSegmentId's will change in the case of filtering */
          key={`channel-segment-${channel.name}`}
          ref={setWaveformContainerRef}
          style={{
            height: `${height / numberOfRenderers}px`,
            width: `calc(100% - ${labelWidthPx}px)`,
            left: `${labelWidthPx}px`
          }}
        >
          <ContentRenderer
            ref={setWaveformContentRendererRef}
            canvasRef={canvasRef}
            isSplitStation={isSplitStation}
            splitModePickMarkerColor={splitModePickMarkerColor}
            converters={converters}
            displayInterval={displayInterval}
            viewableInterval={viewableInterval}
            offsetSecs={offsetSecs}
            initialConfiguration={initialConfiguration}
            isDefaultChannel={isDefaultChannel}
            renderWaveforms={renderWaveforms}
            stationId={stationId}
            getZoomRatio={getZoomRatio}
            updateMeasureWindow={updateMeasureWindow}
            contentRenderers={getContentRenderer(contentRenderer)}
            isSplitChannelOverlayOpen={isSplitChannelOverlayOpen}
            activeSplitModeType={activeSplitModeType}
            splitChannelPhase={channel.splitChannelPhase}
            channelId={channel.id}
            isChannelSelected={channel.isSelected}
            description={description}
            descriptionLabelColor={channelSegments[0]?.descriptionLabelColor}
            signalDetections={getSignalDetections(waveform.signalDetections || [])}
            predictedPhases={waveform?.predictedPhases}
            theoreticalPhaseWindows={waveform?.theoreticalPhaseWindows}
            markers={waveform?.markers}
            events={events?.events}
            onContextMenu={onWaveformContextMenu}
            onMouseMove={onMouseMove}
            onMouseDown={contentRenderMouseDown(onMouseDown)}
            onMouseUp={onWaveformMouseUp}
            onKeyDown={onKeyDown}
          />
          <WaveformRenderer
            ref={setWaveformRendererRef}
            displayInterval={displayInterval}
            viewableInterval={viewableInterval}
            glMax={glMax}
            glMin={glMin}
            onSetAmplitude={onSetAmplitude}
            renderWaveforms={renderWaveforms}
            initialConfiguration={initialConfiguration}
            getPositionBuffer={getPositionBuffer}
            getBoundaries={getBoundaries}
            channelName={channel.id}
            defaultRange={channel.defaultRange}
            channelSegmentId={waveform.channelSegmentId ?? ''}
            channelSegmentsRecord={waveform.channelSegmentsRecord ?? {}}
            masks={waveform?.masks}
            setYAxisBounds={setWaveformYAxisBounds}
            msrWindowWaveformAmplitudeScaleFactor={msrWindowWaveformAmplitudeScaleFactor}
            isMeasureWindow={isMeasureWindow}
            channelOffset={channel.timeOffsetSeconds}
            setError={setError}
            splitChannelRefs={splitChannelRefs}
            isSplitChannelOverlayOpen={isSplitChannelOverlayOpen}
            isAutoDimmed={waveform.isAutoDimmed}
          />
        </div>
      );
    },
    [
      channel.name,
      channel.splitChannelPhase,
      channel.id,
      channel.isSelected,
      channel.defaultRange,
      channel.timeOffsetSeconds,
      setWaveformContainerRef,
      height,
      numberOfRenderers,
      labelWidthPx,
      setWaveformContentRendererRef,
      canvasRef,
      isSplitStation,
      splitModePickMarkerColor,
      converters,
      displayInterval,
      viewableInterval,
      offsetSecs,
      initialConfiguration,
      isDefaultChannel,
      renderWaveforms,
      stationId,
      getZoomRatio,
      updateMeasureWindow,
      getContentRenderer,
      isSplitChannelOverlayOpen,
      activeSplitModeType,
      description,
      channelSegments,
      getSignalDetections,
      waveform.signalDetections,
      waveform?.predictedPhases,
      waveform?.theoreticalPhaseWindows,
      waveform?.markers,
      waveform.channelSegmentId,
      waveform.channelSegmentsRecord,
      waveform?.masks,
      waveform.isAutoDimmed,
      events?.events,
      onWaveformContextMenu,
      onMouseMove,
      contentRenderMouseDown,
      onWaveformMouseUp,
      onKeyDown,
      setWaveformRendererRef,
      glMax,
      glMin,
      onSetAmplitude,
      getPositionBuffer,
      getBoundaries,
      setWaveformYAxisBounds,
      msrWindowWaveformAmplitudeScaleFactor,
      isMeasureWindow,
      setError,
      splitChannelRefs
    ]
  );

  if (!waveform) {
    return null;
  }

  return (
    <MeasureWindowSelectionListener
      displayInterval={displayInterval}
      offsetSecs={channel.timeOffsetSeconds}
      hotKeys={initialConfiguration.hotKeys}
      isMeasureWindowEnabled={isMeasureWindowEnabled}
      // eslint-disable-next-line @typescript-eslint/unbound-method
      computeTimeSecsFromMouseXPixels={converters.computeTimeSecsFromMouseXPixels}
      toast={toast}
      updateMeasureWindowPanel={updateMeasureWindowPanel}
      disabled={isSplitChannelOverlayOpen}
    >
      {renderMeasureWindowSelectionChildren}
    </MeasureWindowSelectionListener>
  );
}

export const ChannelWaveformRenderer = React.memo(InternalChannelWaveformRenderer);
