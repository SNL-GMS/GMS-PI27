/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/destructuring-assignment */
import { Overlay } from '@blueprintjs/core';
import { HotkeyListener, UILogger } from '@gms/ui-util';
import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessConstants } from '@gms/weavess-core';
import classNames from 'classnames';
import * as d3 from 'd3';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import memoizeOne from 'memoize-one';
import React from 'react';
import { toast } from 'react-toastify';
import type * as THREE from 'three';

import { setFocusToWeavess } from '../../../../utils';
import { getMinMaxAmplitudes, hasUserProvidedBoundaries } from '../../utils';
import { ChannelWaveformRenderer } from './channel-waveform-renderer';
import type { WaveformRenderer } from './components';
import { ContentRenderer, Label, SpectrogramRenderer } from './components';
import { EmptyRenderer } from './components/empty-renderer';
import type { ChannelProps, ChannelState } from './types';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

const OVER_RENDER_CHANNEL_BUFFER_PX = 150;

/**
 * Renders the waveform content of the channel
 */
const internalGetSignalDetections = memoizeOne(
  (displayInterval: WeavessTypes.TimeRange, signalDetections: WeavessTypes.PickMarker[]) =>
    signalDetections?.filter(sd => {
      return (
        sd.timeSecs >= displayInterval.startTimeSecs && sd.timeSecs <= displayInterval.endTimeSecs
      );
    })
);

/**
 * Channel Component. Contains a Label, a Waveform (or other graphic component) and optional events
 */
export class Channel extends React.PureComponent<ChannelProps, ChannelState> {
  /** The label container reference. */
  public labelContainerRef: HTMLElement;

  /** The label reference. */
  public labelRef: Label;

  /** The empty container reference. */
  private emptyContainerRef: HTMLElement;

  /** The empty renderer reference. */
  private emptyRendererRef: EmptyRenderer;

  /** The waveform container reference. */
  private waveformContainerRef: HTMLElement;

  /** The waveform content reference. */
  private waveformContentRef: ContentRenderer;

  /** The waveform renderer reference. */
  private waveformRendererRef: WaveformRenderer;

  /** The spectrogram container reference. */
  private spectrogramContainerRef: HTMLElement;

  /** The spectrogram content reference. */
  private spectrogramContentRef: ContentRenderer;

  /** The spectrogram renderer reference. */
  private spectrogramRendererRef: SpectrogramRenderer;

  /** Current mouse position in [0,1] */
  private mouseXPosition = 0;

  /** Current mouse position on mouse down */
  private mouseDownXPosition = 0;

  /** Current mouse position in pixels from the left of the window */
  private mousePosition: WeavessTypes.MousePosition;

  /** The id of the hotkey listener for cleanup on unmount */
  private globalHotkeyListenerId: string;

  private readonly contentRenderMouseDown = memoizeOne(
    onMouseDown => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      onMouseDown(e);
      this.onMouseDown(e);
    }
  );

  /**
   * Constructor
   *
   * @param props Channel props as ChannelProps
   */
  public constructor(props: ChannelProps) {
    super(props);

    const { numberOfRenderers } = this.getContent();
    const heightInPercentage = this.getHeightPercentage(numberOfRenderers);

    this.state = {
      waveformYAxisBounds: {
        minAmplitude: -1,
        maxAmplitude: 1,
        heightInPercentage
      },
      spectrogramYAxisBounds: {
        minAmplitude: -1,
        maxAmplitude: 1,
        heightInPercentage
      }
    };
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    // set the initial mouse position
    const canvas = this.props.canvasRef();
    if (canvas) {
      this.mousePosition = {
        clientX: canvas.getBoundingClientRect().left,
        clientY: canvas.getBoundingClientRect().top
      };
      this.mouseXPosition = 0;
    }
    this.globalHotkeyListenerId = HotkeyListener.subscribeToGlobalHotkeyListener();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: ChannelProps, prevState: ChannelState): void {
    const { channelSegments, numberOfRenderers } = this.getContent();
    const heightPercent = this.getHeightPercentage(numberOfRenderers);

    let { minAmplitude, maxAmplitude } = this.state.waveformYAxisBounds;
    if (
      this.isUsingDefaultWaveformYAxisBounds() &&
      hasUserProvidedBoundaries(channelSegments) &&
      channelSegments?.length > 0
    ) {
      const result = getMinMaxAmplitudes(channelSegments);
      minAmplitude = result.minAmplitude;
      maxAmplitude = result.maxAmplitude;
    }

    const waveformYAxisBounds: WeavessTypes.YAxisBounds = {
      ...this.state.waveformYAxisBounds,
      minAmplitude,
      maxAmplitude,
      heightInPercentage: heightPercent
    };

    const spectrogramYAxisBounds: WeavessTypes.YAxisBounds = {
      ...this.state.spectrogramYAxisBounds,
      heightInPercentage: heightPercent
    };

    if (
      !isEqual(waveformYAxisBounds, prevState.waveformYAxisBounds) ||
      !isEqual(spectrogramYAxisBounds, prevState.spectrogramYAxisBounds)
    ) {
      this.setState({
        waveformYAxisBounds,
        spectrogramYAxisBounds
      });
    }
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to unmount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  public componentDidCatch(error, info): void {
    logger.error(`Channel Error: ${error} : ${info}`);
  }

  public componentWillUnmount(): void {
    HotkeyListener.unsubscribeFromGlobalHotkeyListener(this.globalHotkeyListenerId);
  }

  private readonly getContentRenderer = memoizeOne(contentRenderer => [contentRenderer]);

  /**
   * Renders the waveform content of the channel
   */
  private readonly getSignalDetections = (signalDetections: WeavessTypes.PickMarker[]) =>
    internalGetSignalDetections(this.props.displayInterval, signalDetections);

  /**
   * Render the scene of the channel.
   *
   * @param renderer
   * @param boundsRect
   */
  public renderScene = (
    /** THREE.js WebGLRenderer used to draw waveforms */
    renderer: THREE.WebGLRenderer,
    /** Rect of the entire weavess canvas */
    canvasRect: DOMRect,
    /** Rectangle of displayed viewport */
    viewportRect: DOMRect
  ): void => {
    if (this.waveformContainerRef && this.waveformRendererRef) {
      this.internalRenderScene(
        renderer,
        canvasRect,
        viewportRect,
        this.waveformRendererRef.scene,
        this.waveformRendererRef.camera,
        this.waveformContainerRef
      );
    }

    if (this.spectrogramContainerRef && this.spectrogramRendererRef) {
      this.internalRenderScene(
        renderer,
        canvasRect,
        viewportRect,
        this.spectrogramRendererRef.scene,
        this.spectrogramRendererRef.camera,
        this.spectrogramContainerRef
      );
    }

    if (this.emptyContainerRef && this.emptyRendererRef) {
      this.internalRenderScene(
        renderer,
        canvasRect,
        viewportRect,
        this.emptyRendererRef.scene,
        this.emptyRendererRef.camera,
        this.emptyContainerRef
      );
    }
  };
  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const isChannelMaskTarget = this.props.isStationMaskTarget && this.props.channel.isSelected;
    // The split overlay should be activated if we are in split mode but this channel is not split
    const fadeOutThisChannel =
      (this.props.isSplitChannelOverlayOpen && !this.props.channel.splitChannelTime) ||
      (this.props.isMeasureWindow && !!this.props.activeSplitModeType);

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={classNames({
          channel: true,
          'channel--maskTarget': isChannelMaskTarget,
          'split-channel': !!this.props.channel.splitChannelTime && !this.props.isMeasureWindow
        })}
        data-cy={`${this.getChannelId()}-channel`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={this.onKeyDown}
        style={{
          height: `${this.props.height}px`,
          maxHeight: `${this.props.height}px`
        }}
        data-testid="channel-wrapper"
      >
        <Overlay
          data-testid="signal-detection-overlay-fade"
          isOpen={fadeOutThisChannel}
          autoFocus={false}
          enforceFocus={false}
          usePortal={false}
          onClose={this.props.closeSplitChannelOverlayCallback}
        />
        {this.renderChannelLabel()}
        {this.renderContent()}
      </div>
    );
  }

  /**
   * Returns the current mouse position.
   *
   * @returns the mouse position
   */
  public readonly getMousePosition = (): WeavessTypes.MousePosition => this.mousePosition;

  /**
   * Returns the time in seconds for the current mouse x position
   *
   * @returns the time in seconds
   */
  public readonly getTimeSecs = (): number =>
    this.props.converters.computeTimeSecsForMouseXFractionalPosition(this.mouseXPosition);

  /**
   * Reset the amplitude of the waveform.
   */
  public resetAmplitude = (): void => {
    if (this.waveformRendererRef) {
      this.waveformRendererRef.resetAmplitude();
    }
  };

  /**
   * Update amplitudes and y axis with the new boundaries.
   *
   * @param timeRange optionally, provide a time range for which to calculate amplitude bounds.
   */
  public updateAmplitude = async (timeRange: WeavessTypes.TimeRange): Promise<void> => {
    if (this.waveformRendererRef) {
      await this.waveformRendererRef.updateAmplitude(timeRange);
    }
  };

  /**
   * Get channel name
   *
   * @returns channel name
   */
  public getChannelId = (): string | undefined => {
    return this.props?.channel?.id;
  };

  /**
   * Get Waveform YAxisBounds
   *
   * @returns the Waveform YAxisBounds
   */
  public getWaveformYAxisBound = (): WeavessTypes.YAxisBounds | undefined => {
    return this.state.waveformYAxisBounds;
  };

  /**
   * @returns true if this channel's amplitude is manually scaled
   */
  public isAmplitudeManuallyScaled = (): boolean => {
    return this.waveformRendererRef?.isManuallyAmplitudeScaled();
  };

  /** **************************
   * Begin private properties
   *************************** */

  /**
   * Returns a percentage representing how tall each renderer is.
   *
   * @returns the height in percent, equal to 100% / the number of renderers
   */
  private readonly getHeightPercentage = (numberOfRenderers: number) => {
    return WeavessConstants.PERCENT_100 / numberOfRenderers;
  };

  private readonly setLabelRef = ref => {
    if (ref) {
      this.labelRef = ref;
    }
  };

  private readonly getYAxisBounds = memoizeOne(
    (
      waveformYAxisBounds: WeavessTypes.YAxisBounds,
      spectrogramYAxisBounds: WeavessTypes.YAxisBounds
    ) => {
      const { waveform, channelSegments, spectrogram } = this.getContent();

      const yAxisBounds: {
        waveformYAxisBounds?: WeavessTypes.YAxisBounds;
        spectrogramYAxisBounds?: WeavessTypes.YAxisBounds;
      } = {};
      if (waveform && channelSegments) {
        yAxisBounds.waveformYAxisBounds = waveformYAxisBounds;
      }
      if (spectrogram) {
        yAxisBounds.spectrogramYAxisBounds = spectrogramYAxisBounds;
      }
      return yAxisBounds;
    },
    isEqual
  );

  /**
   * Renders the label of the channel
   */
  private readonly renderChannelLabel = (): JSX.Element => {
    return (
      <div
        className={classNames({
          'channel-label-container': true,
          'channel-label-container--manually-scaled':
            !!this.waveformRendererRef?.getCameraManualScaleAmplitude()
        })}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        data-cy={`${this.getChannelId()}-label`}
        ref={ref => {
          if (ref) {
            this.labelContainerRef = ref;
          }
        }}
        style={{
          height: `${this.props.height}px`,
          width: `${this.labelWidthPx()}px`
        }}
      >
        <Label
          ref={this.setLabelRef}
          channelName={this.props.channel.id}
          channel={this.props.channel}
          distance={this.props.distance}
          distanceUnits={this.props.distanceUnits}
          azimuth={this.props.azimuth}
          expanded={this.props.expanded}
          isDefaultChannel={this.props.isDefaultChannel}
          isExpandable={this.props.isExpandable}
          isMeasureWindow={this.props.isMeasureWindow}
          closeSplitChannelOverlayCallback={this.props.closeSplitChannelOverlayCallback}
          showMaskIndicator={this.props.showMaskIndicator}
          channelLabelTooltip={this.props.channelLabelTooltip}
          customLabel={this.props.customLabel}
          labelHeader={this.props.channel.labelHeader}
          events={this.props?.events?.labelEvents}
          yAxisBounds={this.getYAxisBounds(
            this.state.waveformYAxisBounds,
            this.state.spectrogramYAxisBounds
          )}
        />
      </div>
    );
  };

  /**
   * Get the content information of the channel
   */
  private readonly getContent = (): {
    waveform: WeavessTypes.ChannelWaveformContent | undefined;
    channelSegments: WeavessTypes.ChannelSegment[];
    spectrogram: WeavessTypes.ChannelSpectrogramContent | undefined;
    numberOfRenderers: number;
  } => {
    const waveform = this.props.shouldRenderWaveforms ? this.props.channel.waveform : undefined;
    const spectrogram = this.props.shouldRenderSpectrograms
      ? this.props.channel.spectrogram
      : undefined;

    let channelSegments;
    if (
      waveform?.channelSegmentsRecord[waveform.channelSegmentId] &&
      waveform?.channelSegmentsRecord[waveform.channelSegmentId].length > 0
    ) {
      channelSegments = waveform.channelSegmentsRecord[waveform.channelSegmentId];
    }
    const numberOfRenderers = waveform && channelSegments && spectrogram ? 2 : 1;
    return {
      waveform,
      channelSegments: channelSegments || [],
      spectrogram,
      numberOfRenderers
    };
  };

  /**
   * Renders the content of the channel
   */
  private readonly renderContent = (): React.ReactElement => {
    const { waveform, spectrogram, channelSegments, numberOfRenderers } = this.getContent();

    return waveform || spectrogram ? (
      <>
        {waveform && (
          <ChannelWaveformRenderer
            isSplitStation={this.props?.isSplitStation}
            splitModePickMarkerColor={this.props.splitModePickMarkerColor}
            canvasRef={this.props.canvasRef}
            channel={this.props.channel}
            channelSegments={channelSegments}
            contentRenderMouseDown={this.contentRenderMouseDown}
            converters={this.props.converters}
            displayInterval={this.props.displayInterval}
            viewableInterval={this.props.viewableInterval}
            offsetSecs={this.props.offsetSecs}
            events={this.props.events}
            getBoundaries={this.props.getBoundaries}
            getContentRenderer={this.getContentRenderer}
            getPositionBuffer={this.props.getPositionBuffer}
            getSignalDetections={this.getSignalDetections}
            glMax={this.props.glMax}
            glMin={this.props.glMin}
            height={this.props.height}
            initialConfiguration={this.props.initialConfiguration}
            isDefaultChannel={this.props.isDefaultChannel}
            isMeasureWindow={this.props.isMeasureWindow}
            isMeasureWindowEnabled={this.isMeasureWindowEnabled}
            isSplitChannelOverlayOpen={this.props.isSplitChannelOverlayOpen}
            activeSplitModeType={this.props.activeSplitModeType}
            labelWidthPx={this.labelWidthPx()}
            msrWindowWaveformAmplitudeScaleFactor={this.props.msrWindowWaveformAmplitudeScaleFactor}
            numberOfRenderers={numberOfRenderers}
            onMouseMove={this.onMouseMove}
            onWaveformMouseUp={this.onWaveformMouseUp}
            onWaveformContextMenu={this.onWaveformContextMenu}
            setWaveformYAxisBounds={this.setWaveformYAxisBounds}
            onKeyDown={this.onKeyDown}
            renderWaveforms={this.props.renderWaveforms}
            setWaveformContainerRef={this.setWaveformContainerRef}
            setWaveformContentRendererRef={this.setWaveformContentRef}
            setWaveformRendererRef={this.setWaveformRendererRef}
            splitChannelRefs={this.props.splitChannelRefs}
            stationId={this.props.stationId}
            toast={this.toast}
            updateMeasureWindow={this.props.updateMeasureWindow}
            updateMeasureWindowPanel={this.updateMeasureWindowPanel}
            waveform={waveform}
            getZoomRatio={this.props.getZoomRatio}
          />
        )}
        {spectrogram && this.renderSpectrogram()}
      </>
    ) : (
      <>{this.renderNoGraphics()}</>
    );
  };

  /**
   * Renders the channel content with no graphics
   */
  private readonly renderNoGraphics = (): React.ReactElement => (
    <div
      className="channel-content-container"
      ref={ref => {
        if (ref) {
          this.emptyContainerRef = ref;
        }
      }}
      style={{
        height: `${this.props.height}px`,
        width: `calc(100% - ${this.labelWidthPx()}px)`,
        left: `${this.labelWidthPx()}px`
      }}
    >
      <ContentRenderer
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...this.props}
        isChannelSelected={this.props.channel.isSelected}
        channelId={this.props.channel.id}
        contentRenderers={[]}
        description={undefined}
        descriptionLabelColor={undefined}
        signalDetections={undefined}
        predictedPhases={undefined}
        theoreticalPhaseWindows={undefined}
        markers={undefined}
        isSplitChannelOverlayOpen={this.props.isSplitChannelOverlayOpen}
        splitChannelPhase={this.props.channel.splitChannelPhase}
        events={this.props?.events?.events}
        onContextMenu={this.onWaveformContextMenu}
        onMouseMove={this.onMouseMove}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onWaveformMouseUp}
        onKeyDown={this.onKeyDown}
      >
        <EmptyRenderer
          ref={ref => {
            if (ref) {
              this.emptyRendererRef = ref;
            }
          }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...this.props}
        />
      </ContentRenderer>
    </div>
  );

  private readonly updateMeasureWindowPanel = (
    timeRange: WeavessTypes.TimeRange,
    removeMeasureWindowSelection: () => void
  ) => {
    if (this.props.updateMeasureWindow) {
      this.props.updateMeasureWindow(
        this.props.stationId,
        this.props.channel,
        timeRange.startTimeSecs,
        timeRange.endTimeSecs,
        this.props.isDefaultChannel,
        this.waveformRendererRef.getCameraManualScaleAmplitude(),
        removeMeasureWindowSelection
      );
    }
  };

  /**
   * The amount of pixels allocated for the label
   *
   * @returns number of pixels
   */
  private readonly labelWidthPx = (): number => {
    return (
      this.props.initialConfiguration.labelWidthPx || WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS
    );
  };

  private readonly toast = (message: string) => {
    if (!this.props.isMeasureWindow) {
      toast.info(message, {
        toastId: message
      });
    }
  };

  private readonly setWaveformContentRef = (ref: ContentRenderer) => {
    if (ref) {
      this.waveformContentRef = ref;
    }
  };

  private readonly setWaveformContainerRef = (ref: HTMLDivElement) => {
    if (ref) {
      this.waveformContainerRef = ref;
    }
  };

  private readonly setWaveformRendererRef = (ref: WaveformRenderer) => {
    if (ref) {
      this.waveformRendererRef = ref;
    }
  };

  /**
   * Renders the spectrogram content of the channel
   */
  private readonly renderSpectrogram = (): React.ReactElement => {
    const { waveform, channelSegments, spectrogram, numberOfRenderers } = this.getContent();
    return (
      <>
        {spectrogram ? (
          <div
            className="channel-content-container"
            ref={ref => {
              if (ref) {
                this.spectrogramContainerRef = ref;
              }
            }}
            style={{
              height: `${this.props.height / numberOfRenderers}px`,
              width: `calc(100% - ${this.labelWidthPx()}px)`,
              left: `${this.labelWidthPx()}px`,
              top:
                !waveform && channelSegments.length === 0
                  ? '0px'
                  : `${
                      this.props.height / numberOfRenderers +
                      (this.props.height / numberOfRenderers) * this.props.index
                    }px`,
              borderTop: waveform && channelSegments.length > 0 ? `1px solid` : ''
            }}
          >
            <ContentRenderer
              ref={ref => {
                if (ref) {
                  this.spectrogramContentRef = ref;
                }
              }}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...this.props}
              channelId={this.props.channel.id}
              isChannelSelected={this.props.channel.isSelected}
              contentRenderers={[]}
              description={spectrogram?.description}
              descriptionLabelColor={spectrogram?.descriptionLabelColor}
              signalDetections={spectrogram?.signalDetections}
              predictedPhases={spectrogram?.predictedPhases}
              isSplitChannelOverlayOpen={this.props.isSplitChannelOverlayOpen}
              splitChannelPhase={this.props.channel.splitChannelPhase}
              theoreticalPhaseWindows={spectrogram?.theoreticalPhaseWindows}
              markers={spectrogram?.markers}
              events={this.props?.events?.events}
              onContextMenu={this.onSpectrogramContextMenu}
              onMouseMove={this.onMouseMove}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onSpectrogramMouseUp}
              onKeyDown={this.onSpectrogramKeyDown}
            >
              {this.buildSpectrogramRendererElement(spectrogram)}
            </ContentRenderer>
          </div>
        ) : undefined}
      </>
    );
  };

  /**
   * Build spectrogram renderer JSXElement
   *
   * @param spectrogram spectrogram data
   * @returns JSX.Element
   */
  private readonly buildSpectrogramRendererElement = (
    spectrogram: WeavessTypes.ChannelSpectrogramContent
  ): JSX.Element => {
    return (
      <SpectrogramRenderer
        ref={ref => {
          if (ref) {
            this.spectrogramRendererRef = ref;
          }
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...this.props}
        startTimeSecs={spectrogram.startTimeSecs}
        timeStep={spectrogram.timeStep}
        frequencyStep={spectrogram.frequencyStep}
        data={spectrogram.data}
        setYAxisBounds={this.setSpectrogramYAxisBounds}
        // eslint-disable-next-line @typescript-eslint/unbound-method
        colorScale={this.props.initialConfiguration.colorScale}
      />
    );
  };

  /**
   * onWaveformContextMenu event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onWaveformContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 2: Secondary button pressed, usually the right button
    // see: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
    if (e.button === 2) {
      if (this.waveformContentRef && this.waveformRendererRef && this.props.channel.waveform) {
        const masks = this.determineIfMaskIsClicked();
        if (masks.length > 0) {
          if (
            this.props.events &&
            this.props.events.events &&
            this.props.events.events.onMaskContextClick
          ) {
            this.props.events.events.onMaskContextClick(e, this.props.channel.id, masks);
          }
        } else if (this.props.onContextMenu) {
          const timeForMouseXPosition = this.getTimeSecs() - this.props.offsetSecs;
          this.props.onContextMenu(e, this.props.channel.id, timeForMouseXPosition, undefined);
        }
      }
    }
  };

  /**
   * onSpectrogramContextMenu event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onSpectrogramContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (
      this.spectrogramContentRef &&
      this.spectrogramRendererRef &&
      this.props.channel.spectrogram
    ) {
      if (this.props.onContextMenu) {
        this.props.onContextMenu(e, this.props.channel.id, undefined);
      }
    }
  };

  /**
   * onMouseMove event handler
   *
   * @param e The mouse event
   */
  private readonly onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasRect = this.props.getCanvasBoundingRect();
    const leftOffset = canvasRect?.left ?? 0;
    const width = canvasRect?.width ?? 0;
    this.mouseXPosition = (e.clientX - leftOffset) / width;
    this.mousePosition = {
      clientX: e.clientX,
      clientY: e.clientY
    };
    this.props.onMouseMove(e, this.mouseXPosition, this.getTimeSecs() - this.props.offsetSecs);
  };

  /**
   * onWaveformMouseUp event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onWaveformMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeForMouseXPosition = this.getTimeSecs();
    this.props.onMouseUp(
      e,
      this.mouseXPosition,
      this.props.channel,
      timeForMouseXPosition - this.props.offsetSecs,
      this.props.isDefaultChannel,
      this.props.isMeasureWindow,
      this.mouseDownXPosition !== e.clientX
    );
    if (
      this.props.channel.waveform &&
      this.props.channel.waveform.masks &&
      this.props.events &&
      this.props.events.events &&
      this.props.events.events.onMaskClick &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      const maskCreateHotKey = HotkeyListener.isGlobalHotKeyCommandSatisfied(
        this.props.initialConfiguration.hotKeys?.createQcSegments?.combos ?? []
      );

      const viewQcSegmentHotKey = HotkeyListener.isGlobalHotKeyCommandSatisfied(
        this.props.initialConfiguration.hotKeys?.viewQcSegmentDetails?.combos ?? []
      );

      if (viewQcSegmentHotKey) {
        const masks = this.determineIfMaskIsClicked();
        if (masks.length > 0) {
          this.props.events.events.onMaskClick(
            e,
            this.props.channel.id,
            masks,
            maskCreateHotKey,
            viewQcSegmentHotKey
          );
        }
      }
    }
  };

  /**
   * Determines if a mask has been clicked. If a mask is shorter than a second
   * A buffer of 0.5secs to the start and end time is added so that it can be seen
   * visually and a users can click it.
   */
  private readonly determineIfMaskIsClicked = (): string[] => {
    if (!this.props.channel.waveform || !this.props.channel.waveform.masks) {
      return [];
    }

    // determine if any masks were click
    const timeForMouseXPosition = this.getTimeSecs() - this.props.offsetSecs;
    const halfSecond = 0.5;
    // Masks
    return (
      sortBy(
        this.props.channel.waveform.masks,
        (m: WeavessTypes.Mask) => m.endTimeSecs - m.startTimeSecs
      )
        // A mask with less than one second, isn't clickable, thus adding a second to make sure it is clickable
        .filter(m =>
          m.endTimeSecs - m.startTimeSecs < 1
            ? m.startTimeSecs - halfSecond <= timeForMouseXPosition &&
              timeForMouseXPosition <= m.endTimeSecs + halfSecond
            : m.startTimeSecs <= timeForMouseXPosition && timeForMouseXPosition <= m.endTimeSecs
        )
        .map(m => m.id)
    );
  };

  /**
   * onSpectrogramMouseUp event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onSpectrogramMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    this.props.onMouseUp(
      e,
      this.mouseXPosition,
      this.props.channel,
      this.getTimeSecs() - this.props.offsetSecs,
      this.props.isDefaultChannel
    );
  };

  private readonly isMeasureWindowEnabled = () =>
    this.props.isDefaultChannel
      ? !this.props.initialConfiguration.defaultChannel.disableMeasureWindow
      : !this.props.initialConfiguration.nonDefaultChannel.disableMeasureWindow;

  /**
   * onMouseDown event handler, may have to move the measureWindow logic to keydown
   * to distinguish between command click and regular click
   *
   * @param e The mouse event
   */
  private readonly onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    setFocusToWeavess();
    // Prevent propagation of these events so that the underlying channel click doesn't register
    this.mouseDownXPosition = e.clientX;
    // if this is the measure window channel ignore shift key used
    // to select measure window time range
    if ((e.shiftKey && this.props.isMeasureWindow) || e.button === 2) {
      return;
    }

    const timeSecs = this.getTimeSecs();

    if (
      this.waveformRendererRef &&
      HotkeyListener.isGlobalHotKeyCommandSatisfied(
        this.props.initialConfiguration.hotKeys?.scaleWaveformAmplitude?.combos ?? []
      )
    ) {
      e.stopPropagation();
      this.waveformRendererRef.beginScaleAmplitudeDrag(e);
    } else if (
      this.waveformRendererRef &&
      HotkeyListener.isGlobalHotKeyCommandSatisfied(
        this.props.initialConfiguration.hotKeys?.viewQcSegmentDetails?.combos ?? []
      )
    ) {
      e.stopPropagation();
    } else if (this.props.onMouseDown) {
      // Send up the channel
      this.props.onMouseDown(
        e,
        this.mouseXPosition,
        this.props.channel,
        timeSecs - this.props.offsetSecs,
        this.props.isDefaultChannel,
        this.props.isMeasureWindow
      );
    }
  };

  /**
   * onSpectrogramKeyDown event handler
   *
   * @param e mouse event as React.KeyboardEvent<HTMLDivElement>
   */
  private readonly onSpectrogramKeyDown = (): void => {
    // no-op
  };

  /**
   * onKeyPress event handler
   *
   * @param e
   */
  private readonly onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!e.repeat) {
      if (this.waveformContentRef) {
        if (this.props.events) {
          if (this.props.events.onKeyPress) {
            const mousePosition = this.getMousePosition();
            const timeSecs = this.getTimeSecs();
            this.props.events.onKeyPress(
              e,
              mousePosition.clientX,
              mousePosition.clientY,
              this.props.channel,
              timeSecs
            );
          }
        }
      }
    }
  };

  /**
   * @returns true if the min amplitude is -1 and the max amplitude is 1, which are the defaults.
   */
  private readonly isUsingDefaultWaveformYAxisBounds = () =>
    this.state.waveformYAxisBounds.minAmplitude === -1 &&
    this.state.waveformYAxisBounds.maxAmplitude === 1;

  /**
   * Set the waveform y-axis bounds for the channel.
   *
   * @param min
   * @param max
   */
  private readonly setWaveformYAxisBounds = (min: number, max: number) => {
    if (this.state.waveformYAxisBounds) {
      if (
        this.state.waveformYAxisBounds.minAmplitude !== min ||
        this.state.waveformYAxisBounds.maxAmplitude !== max
      ) {
        this.setState(prevState => ({
          waveformYAxisBounds: {
            ...prevState.waveformYAxisBounds,
            minAmplitude: min,
            maxAmplitude: max
          }
        }));
      }
    }
  };

  /**
   * Set the spectrogram y-axis bounds for the channel.
   *
   * @param min
   * @param max
   */
  private readonly setSpectrogramYAxisBounds = (min: number, max: number) => {
    if (this.state.spectrogramYAxisBounds) {
      if (
        this.state.spectrogramYAxisBounds.minAmplitude !== min ||
        this.state.spectrogramYAxisBounds.maxAmplitude !== max
      ) {
        this.setState(prevState => ({
          spectrogramYAxisBounds: {
            ...prevState.spectrogramYAxisBounds,
            minAmplitude: min,
            maxAmplitude: max
          }
        }));
      }
    }
  };

  /**
   *
   * Calculate the offset scale based on the width of the render area.
   *
   * @param width the width of the render area
   */
  private readonly calculateOffset = (width: number): number => {
    const { displayInterval, offsetSecs } = this.props;
    const scale = d3
      .scaleLinear()
      .domain([0, displayInterval.endTimeSecs - displayInterval.startTimeSecs])
      .range([0, width]);

    return scale(offsetSecs);
  };

  /**
   * Renders the scene which had its data calculated in {@link WaveformRenderer}
   */
  private readonly internalRenderScene = (
    /** THREE.js WebGLRenderer used to draw waveforms */
    renderer: THREE.WebGLRenderer,
    /** Rect of the entire weavess canvas */
    canvasRect: ClientRect | DOMRect,
    viewportRect: ClientRect | DOMRect,
    /** THREE.js scene for this channel's individual waveform */
    scene: THREE.Scene | null,
    /** THREE.js camera for this channel's individual waveform */
    camera: THREE.OrthographicCamera | null,
    /** Container to this channel's individual waveform */
    waveformContainer: HTMLElement
  ) => {
    if (!renderer || !canvasRect || !scene || !camera || !waveformContainer) return;

    // get its position relative to the page's viewport
    const waveformRect = waveformContainer.getBoundingClientRect();

    // check if it's out of bounds. If so skip it
    if (
      waveformRect.bottom < viewportRect.top - OVER_RENDER_CHANNEL_BUFFER_PX ||
      waveformRect.top > viewportRect.bottom + OVER_RENDER_CHANNEL_BUFFER_PX
    ) {
      return; // it's out of bounds
    }

    // set the viewport
    const { width } = canvasRect;
    const height = waveformRect.height - WeavessConstants.WAVEFORM_PADDING_PX * 2;
    if (height <= 0) {
      return;
    }
    const x = waveformRect.left - canvasRect.left;
    const y = canvasRect.bottom - (waveformRect.bottom - WeavessConstants.WAVEFORM_PADDING_PX);
    renderer.setViewport(0, y, width, height);

    // adjust the camera view and offset
    const offset = this.calculateOffset(width) / this.props.getZoomRatio();

    camera.setViewOffset(
      waveformContainer.clientWidth,
      waveformContainer.clientHeight,
      Math.abs(x) - offset,
      0,
      canvasRect.width,
      waveformContainer.clientHeight
    );

    renderer.setScissor(x, y, waveformContainer.clientWidth, height);
    renderer.render(scene, camera);
  };
}
