/* eslint-disable react/default-props-match-prop-types */
/* eslint-disable react/destructuring-assignment */
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import React from 'react';

import {
  createMoveableMarkers,
  createSelectionWindowMarkers,
  FollowPickMarker,
  memoizedCreateVerticalMarkers
} from '../../../../../markers';
import { PredictedPhases, SignalDetections, TheoreticalPhases } from './components';
import { ChannelDescriptionLabel } from './components/channel-description/channel-description';
import type { ContentRendererProps, ContentRendererState } from './types';

const HIGHLIGHTED_COLOR = 'rgba(150,150,150,0.2)';
const INITIAL_COLOR = 'initial';

/**
 * Content renderer component responsible for rendering the main content of a channel.
 */
export class ContentRenderer extends React.PureComponent<
  React.PropsWithChildren<ContentRendererProps>,
  ContentRendererState
> {
  /** Default channel props, if not provided */
  // eslint-disable-next-line react/static-property-placement
  public static readonly defaultProps: WeavessTypes.ChannelDefaultConfiguration = {
    displayType: [WeavessTypes.DisplayType.LINE],
    pointSize: 2,
    color: '#4580E6'
  };

  /** Ref to the element where this channel will be rendered */
  public containerRef: HTMLElement | null;

  /** Ref to the element where this description label will be rendered */
  public descriptionLabelRef: HTMLElement | null;

  /** Ref to drag indicator element */
  private dragIndicatorRef: HTMLDivElement | null;

  /** Ref to content rendered content element (has the full width of the channel) */
  private contentRendererContentRef: HTMLDivElement | null;

  private readonly resizeObserver: ResizeObserver;

  /**
   * Constructor
   *
   * @param props props as ContentRendererProps
   */
  public constructor(props: ContentRendererProps) {
    super(props);
    this.resizeObserver = new ResizeObserver(() => this.forceUpdate());
    this.state = {
      mouseFocus: false,
      backgroundColor: props.isChannelSelected ? HIGHLIGHTED_COLOR : INITIAL_COLOR
    };
  }

  public componentDidMount(): void {
    const canvasRef = this.props.canvasRef();
    if (canvasRef) {
      this.resizeObserver.observe(canvasRef);
    }
  }

  public componentDidUpdate(
    prevProps: Readonly<React.PropsWithChildren<ContentRendererProps>>
  ): void {
    if (this.props.isChannelSelected !== prevProps.isChannelSelected) {
      this.setState({
        backgroundColor: this.props.isChannelSelected ? HIGHLIGHTED_COLOR : INITIAL_COLOR
      });
    }
  }

  public componentWillUnmount(): void {
    const canvasRef = this.props.canvasRef();
    if (this.resizeObserver && canvasRef) {
      this.resizeObserver.unobserve(canvasRef);
    }
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const labelWidthPx =
      this.props.initialConfiguration?.labelWidthPx ?? WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS;
    const anySignalDetectionsSelected = this.props.signalDetections
      ? this.props.signalDetections.reduce((anySelected, sd) => anySelected || sd.isSelected, false)
      : false;
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={`contentrenderer${
          anySignalDetectionsSelected ? ' contentrenderer--selected' : ''
        }`}
        style={{
          backgroundColor: this.state.backgroundColor
        }}
        ref={ref => {
          if (ref) {
            this.containerRef = ref;
          }
        }}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={this.props.onKeyDown}
        onContextMenu={
          this.props.isSplitStation
            ? e => {
                e.preventDefault();
              }
            : this.props.onContextMenu
        }
        onMouseMove={this.props.onMouseMove}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
        onMouseEnter={this.onChannelMouseEnter}
        onMouseLeave={this.onChannelMouseLeave}
      >
        {this.props.children}
        <div
          className="contentrenderer-content contentrenderer-content--sticky"
          style={{
            width: this.props.canvasRef()?.clientWidth ?? `calc(100% - ${labelWidthPx})`
          }}
        >
          {this.props.description ? (
            <div
              ref={ref => {
                this.descriptionLabelRef = ref;
              }}
              className="channel-description__container"
              data-cy="filtered-channel-label"
              data-cy-color={this.props.descriptionLabelColor}
              style={{
                color: this.props.descriptionLabelColor
              }}
            >
              <ChannelDescriptionLabel description={this.props.description} />
            </div>
          ) : undefined}
        </div>
        <div
          className="contentrenderer-content"
          data-cy-station-waveform={this.props.channelId}
          ref={ref => {
            this.contentRendererContentRef = ref;
          }}
          style={{
            left: labelWidthPx,
            width: `calc(100% - ${labelWidthPx}px)`
          }}
        >
          <div
            ref={ref => {
              this.dragIndicatorRef = ref;
            }}
            className="contentrenderer-content-drag-indicator"
          />
          {...this.props.contentRenderers}
          <div className="contentrenderer-content-markers">{this.createAllMarkers(this.props)}</div>
          <SignalDetections
            stationId={this.props.stationId}
            channelId={this.props.channelId}
            signalDetections={this.props.signalDetections}
            isDefaultChannel={this.props.isDefaultChannel}
            displayInterval={this.props.displayInterval}
            viewableInterval={this.props.viewableInterval}
            offsetSecs={this.props.offsetSecs}
            events={this.props.events}
            initialConfiguration={this.props.initialConfiguration}
            getTimeSecsForClientX={this.getTimeSecsForClientX}
            getClientXForTimeSecs={this.getClientXForTimeSecs}
            toggleDragIndicator={this.toggleDragIndicator}
            positionDragIndicator={this.positionDragIndicator}
            isOnSplitChannel={this.props.isSplitStation || false}
          />
          {/** create a marker that follow the mouse when in overlay mode with focus */}
          {this.shouldShowFollowPickMarker() && (
            <FollowPickMarker
              key={this.props.channelId}
              parentWidthPx={this.contentRendererContentRef?.clientWidth}
              position={50}
              color={this.props.splitModePickMarkerColor ?? 'red'}
              displayInterval={this.props.displayInterval}
              label={this.props.splitChannelPhase || ''}
              offsetSecs={this.props.offsetSecs}
              getTimeSecsForClientX={this.getTimeSecsForClientX}
            />
          )}
          <PredictedPhases
            stationId={this.props.stationId}
            channelId={this.props.channelId}
            predictedPhases={this.props.predictedPhases}
            isDefaultChannel={this.props.isDefaultChannel}
            displayInterval={this.props.displayInterval}
            viewableInterval={this.props.viewableInterval}
            offsetSecs={this.props.offsetSecs}
            events={this.props.events}
            getTimeSecsForClientX={this.getTimeSecsForClientX}
            getClientXForTimeSecs={this.getClientXForTimeSecs}
            toggleDragIndicator={this.toggleDragIndicator}
            positionDragIndicator={this.positionDragIndicator}
          />
          <TheoreticalPhases
            stationId={this.props.stationId}
            theoreticalPhaseWindows={this.props.theoreticalPhaseWindows}
            isDefaultChannel={this.props.isDefaultChannel}
            displayInterval={this.props.displayInterval}
            events={this.props.events}
            getTimeSecsForClientX={this.getTimeSecsForClientX}
            toggleDragIndicator={this.toggleDragIndicator}
            positionDragIndicator={this.positionDragIndicator}
          />
        </div>
      </div>
    );
  }

  /**
   * Check to see if we should be showing the follow marker on a channel
   *
   * @returns true if we can show a follow marker
   */
  private readonly shouldShowFollowPickMarker = (): boolean => {
    /*
    We want to show the pick marker for the default channel and the split channel, if we
    are hovering over the split channel. However, we don't show the pick marker if we are
    only hovering over the default channel.
    */
    return (
      (!this.state.mouseFocus &&
        (this.props.isSplitChannelOverlayOpen || false) &&
        this.props.activeSplitModeType === WeavessTypes.SplitMode.CREATE_SD &&
        this.props.isDefaultChannel) ||
      (this.state.mouseFocus &&
        (this.props.isSplitChannelOverlayOpen || false) &&
        this.props.activeSplitModeType === WeavessTypes.SplitMode.CREATE_SD &&
        (this.props.isSplitStation || false) &&
        !this.props.isDefaultChannel)
    );
  };

  /**
   * Called on mouse enter for the channel, will render a highlight if this is a split channel
   */
  private readonly onChannelMouseEnter = (): void => {
    this.setState({
      mouseFocus: true,
      backgroundColor:
        this.props.isChannelSelected || this.props.isSplitChannelOverlayOpen
          ? HIGHLIGHTED_COLOR
          : INITIAL_COLOR
    });
  };

  /**
   * Called on mouse enter for the channel, will remove a highlight if this is a split channel
   */
  private readonly onChannelMouseLeave = (): void => {
    this.setState({
      mouseFocus: false,
      backgroundColor: this.props.isChannelSelected ? HIGHLIGHTED_COLOR : INITIAL_COLOR
    });
  };

  /**
   * sets the function onUpdateMarker if events and events.onUpdateMarker exist
   *
   * @param marker
   */
  private readonly updateMarker = (marker: WeavessTypes.Marker): void => {
    if (this.props.events && this.props.events.onUpdateMarker) {
      this.props.events.onUpdateMarker(this.props.channelId, marker);
    }
  };

  /**
   * sets the function onMoveSelectionWindow if events and events.onMoveSelectionWindow exist
   *
   * @param marker
   */
  private readonly moveSelectionWindow = (selection: WeavessTypes.SelectionWindow): void => {
    if (this.props.events && this.props.events.onMoveSelectionWindow) {
      this.props.events.onMoveSelectionWindow(this.props.channelId, selection);
    }
  };

  /**
   * sets the function onUpdateSelectionWindow if events and events.onUpdateSelectionWindow
   *
   * @param selection
   */
  private readonly updateSelectionWindow = (selection: WeavessTypes.SelectionWindow): void => {
    if (this.props.events && this.props.events.onUpdateSelectionWindow) {
      this.props.events.onUpdateSelectionWindow(this.props.channelId, selection);
    }
  };

  /**
   * sets the function onClickSelectionWindow if events and events.onClickSelectionWindow exist
   *
   * @param selection
   */
  private readonly clickSelectionWindow = (
    selection: WeavessTypes.SelectionWindow,
    timeSecs: number
  ): void => {
    if (this.props.events && this.props.events.onClickSelectionWindow) {
      this.props.events.onClickSelectionWindow(this.props.channelId, selection, timeSecs);
    }
  };

  /**
   * Creates all of the markers.
   *
   * @param props the content renderer props
   * @returns an array JSX elements
   */
  private readonly createAllMarkers = (props: ContentRendererProps): JSX.Element[] => [
    ...memoizedCreateVerticalMarkers(
      props.displayInterval.startTimeSecs,
      props.displayInterval.endTimeSecs,
      props.markers ? props.markers.verticalMarkers : undefined
    ),
    ...createMoveableMarkers(
      props.displayInterval.startTimeSecs,
      props.displayInterval.endTimeSecs,
      props.markers ? props.markers.moveableMarkers : undefined,
      props.getZoomRatio,
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      props.events ? this.updateMarker : undefined,
      0
    ),
    ...createSelectionWindowMarkers(
      props.displayInterval.startTimeSecs,
      props.displayInterval.endTimeSecs,
      props.markers ? props.markers.selectionWindows : undefined,
      props.getZoomRatio,
      () => props.canvasRef(),
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.converters.computeTimeSecsForMouseXFractionalPosition,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.onMouseMove,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.onMouseDown,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.onMouseUp,
      props.events ? this.moveSelectionWindow : undefined,
      props.events ? this.updateSelectionWindow : undefined,
      props.events ? this.clickSelectionWindow : undefined,
      0
    )
  ];

  /**
   * Returns the time in seconds for the given clientX.
   *
   * @param clientX The clientX
   * @returns The time in seconds; undefined if clientX is
   * out of the channel's bounds on screen.
   */
  private readonly getTimeSecsForClientX = (clientX: number): number => {
    const canvasRef = this.props.canvasRef();

    if (!this.containerRef || !canvasRef) return NaN;

    const offset = canvasRef.getBoundingClientRect();
    if (clientX < offset.left && clientX > offset.right) return NaN;

    // position in [0,1] in the current channel bounds.
    const position = (clientX - offset.left) / offset.width;
    return this.props.converters.computeTimeSecsForMouseXFractionalPosition(position);
  };

  /**
   * Returns clientX position for a given time in epoch seconds.
   *
   * @param clientX The clientX
   * @returns clientX position
   */
  private readonly getClientXForTimeSecs = (timeSecs: number): number => {
    const canvasRef = this.props.canvasRef();

    if (!this.containerRef || !canvasRef) return NaN;

    // Given the display interval and the canvas pixel width
    // return the pixel position based on the ratio
    const displayRangeSecs =
      this.props.displayInterval.endTimeSecs - this.props.displayInterval.startTimeSecs;
    const timeRatio = (timeSecs - this.props.displayInterval.startTimeSecs) / displayRangeSecs;
    const offset = canvasRef.getBoundingClientRect();

    // clientX position
    return timeRatio * offset.width + offset.left;
  };

  /**
   * Toggle display of the drag indicator for this channel
   *
   * @param show True to show drag indicator
   * @param color The color of the drag indicator
   */
  private readonly toggleDragIndicator = (show: boolean, color: string): void => {
    if (!this.dragIndicatorRef) return;

    this.dragIndicatorRef.style.borderColor = color;
    this.dragIndicatorRef.style.display = show ? INITIAL_COLOR : 'none';
  };

  /**
   * Set the position for the drag indicator
   *
   * @param clientX The clientX
   */
  private readonly positionDragIndicator = (clientX: number): void => {
    if (!this.containerRef || !this.dragIndicatorRef) return;

    const fracToPct = 100;
    const boundingRect = this.containerRef.getBoundingClientRect();
    // position in [0,1] in the current channel bounds.
    const position = (clientX - boundingRect.left) / boundingRect.width;
    this.dragIndicatorRef.style.left = `${position * fracToPct}%`;
  };
}
