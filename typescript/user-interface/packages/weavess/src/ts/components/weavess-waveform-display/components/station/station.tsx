/* eslint-disable react/destructuring-assignment */
import { UILogger } from '@gms/ui-util';
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import memoizeOne from 'memoize-one';
import React from 'react';

import { Channel } from './components';
import type { StationProps } from './types';
import {
  buildWeavessMarkers,
  onChannelClickToOffset,
  onClickSelectionWindowToOffset,
  onMaskCreateDragEndToOffset,
  onMeasureWindowUpdatedToOffset,
  onMoveSelectionWindowToOffset,
  onUpdateMarkerToOffset,
  onUpdateSelectionWindowToOffset,
  sortBySdForChannels
} from './utils';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

/**
 * Station Component. Contains channels, and optional events.
 */
export class Station extends React.PureComponent<StationProps> {
  /** The reference to the default channel. */
  public defaultChannelRef: Channel | null;

  /** The reference to the non-default channels. */
  public nonDefaultChannelRefs: { [id: string]: Channel | null } = {};

  /** Temporary split channels created when adding a signal detection */
  public splitChannelRefs: { [id: string]: Channel | null } = {};

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to unmount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  public componentDidCatch(error, info): void {
    logger.error(`Weavess Station Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Get a list of channels (used by waveform-panel to render the waveforms)
   *
   * @returns list of Channels
   */
  public getChannelList = (): Channel[] => {
    const channels: Channel[] = [];
    if (this.defaultChannelRef) {
      channels.push(this.defaultChannelRef);
    }

    // Add non-default channels if the channel is expanded
    if (this.nonDefaultChannelRefs && this.props.station.areChannelsShowing) {
      Object.keys(this.nonDefaultChannelRefs).forEach(key => {
        const channel = this.nonDefaultChannelRefs[key];
        if (channel) {
          channels.push(channel);
        }
      });
    }

    // Add non-default channels if the channel is expanded
    if (this.splitChannelRefs) {
      Object.keys(this.splitChannelRefs).forEach(key => {
        const channel = this.splitChannelRefs[key];
        if (channel) {
          channels.push(channel);
        }
      });
    }
    return channels;
  };

  /**
   * Get the channel
   *
   * @param channelName
   * @returns channel found or undefined
   */
  public getChannel = (channelName: string): Channel | undefined => {
    const channels: Channel[] = this.getChannelList();
    return channels.find(channel => channel.getChannelId() === channelName);
  };

  /**
   * Sets the ref for a non default channel. Uses memoization to ensure referential stability
   * of this function for each non default channel
   */
  private readonly setNonDefaultChannelRef = memoizeOne((id: string) => ref => {
    this.nonDefaultChannelRefs[id] = ref;
  });

  /**
   * Sets the ref for a split channel. Uses memoization to ensure referential stability
   * of this function for each non default channel
   */
  private readonly setSplitChannelRef = memoizeOne((id: string) => ref => {
    this.splitChannelRefs[id] = ref;
  });

  /** Determine if the channels are showing */
  private readonly areChannelsShowing = () => {
    return (
      !!this.props.station?.areChannelsShowing &&
      this.props.station.areChannelsShowing &&
      !!this.props.station?.nonDefaultChannels
    );
  };

  /** Calculate the row heights for use in rendering channels */
  private readonly buildRowHeights = (): { rowHeights: number[]; totalRowHeight: number } => {
    const rowHeights: number[] = [];
    rowHeights.push(
      this.props.station.defaultChannel.height ||
        this.props.initialConfiguration.defaultChannelHeightPx ||
        WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS
    );

    if (this.areChannelsShowing() && this.props.station.nonDefaultChannels) {
      this.props.station.nonDefaultChannels.forEach(channel => {
        rowHeights.push(
          channel.height ||
            this.props.initialConfiguration.defaultChannelHeightPx ||
            WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS
        );
      });
    }

    if (this.props.station.splitChannels) {
      this.props.station.splitChannels.forEach(channel => {
        rowHeights.push(
          channel.height ||
            this.props.initialConfiguration.defaultChannelHeightPx ||
            WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS
        );
      });
    }

    const totalRowHeight =
      this.areChannelsShowing() || this.props.station.splitChannels
        ? rowHeights.map(rowHeight => rowHeight + 1).reduce((a, b) => a + b, 0)
        : rowHeights[0] + 1;

    return {
      rowHeights,
      totalRowHeight
    };
  };

  /**
   * Resets the manual amplitude scaling on the parent and child channels
   */
  // eslint-disable-next-line react/no-unused-class-component-methods
  public resetAmplitude = (): void => {
    if (this.defaultChannelRef) {
      this.defaultChannelRef.resetAmplitude();
    }

    if (this.splitChannelRefs) {
      Object.keys(this.splitChannelRefs).forEach(key => {
        const channel = this.splitChannelRefs[key];
        if (channel) {
          channel.resetAmplitude();
        }
      });
    }

    if (this.nonDefaultChannelRefs) {
      Object.keys(this.nonDefaultChannelRefs).forEach(key => {
        const channel = this.nonDefaultChannelRefs[key];
        if (channel) {
          channel.resetAmplitude();
        }
      });
    }
  };

  /**
   * @returns List of channels that have their amplitudes manually scaled
   */
  public getManualAmplitudeScaledChannels = (): WeavessTypes.Channel[] => {
    const manuallyScaledChannels: WeavessTypes.Channel[] = [];

    if (this.defaultChannelRef?.isAmplitudeManuallyScaled()) {
      manuallyScaledChannels.push(this.props.station.defaultChannel);
    }

    if (this.nonDefaultChannelRefs) {
      Object.keys(this.nonDefaultChannelRefs).forEach(key => {
        const channel: Channel | null = this.nonDefaultChannelRefs[key];

        // Find the corresponding Weavess channel object that was used to make the Channel component
        const weavessChannel: WeavessTypes.Channel | undefined =
          this.props.station.nonDefaultChannels?.find(
            nonDefaultChannel => nonDefaultChannel.id === channel?.getChannelId()
          );
        if (weavessChannel && channel?.isAmplitudeManuallyScaled()) {
          manuallyScaledChannels.push(weavessChannel);
        }
      });
    }

    return manuallyScaledChannels;
  };

  /**
   * Create the child channels JSX elements. This function helps break
   * up the render method's complexity and makes it more readable
   *
   * @param channels the child Weavess Channel list
   * @param rowHeights for each child Channel
   * @param distanceUnits which distanceUnits to use degrees or km
   * @param isSplitChanel flag to show if this is a split channel
   */
  private readonly createNonDefaultChannelElements = (
    channels: WeavessTypes.Channel[],
    rowHeights: number[],
    distanceUnits: WeavessTypes.DistanceUnits,
    refSetter: (id: string) => (ref: any) => void,
    splitChannel = false
  ): JSX.Element[] => {
    return (splitChannel ? sortBy(channels, sortBySdForChannels) : channels).map(
      (channel, index: number) => {
        let childEvents;
        if (this.props.events?.nonDefaultChannelEvents) {
          childEvents = this.mapEventsToOffset(channel, this.props.events.nonDefaultChannelEvents);
        }

        const timeOffsetSeconds = channel.timeOffsetSeconds || 0;

        return (
          <Channel // Channel (for non-default channels)
            isSplitStation={this.props?.isSplitStation}
            splitModePickMarkerColor={this.props?.splitModePickMarkerColor}
            key={`station-nondefault-channel-${channel.id}`}
            ref={refSetter(channel.id)}
            offsetSecs={timeOffsetSeconds}
            index={(index + 1) * 2}
            height={rowHeights[index + 1]}
            shouldRenderWaveforms={this.props.shouldRenderWaveforms}
            shouldRenderSpectrograms={this.props.shouldRenderSpectrograms}
            initialConfiguration={this.props.initialConfiguration}
            stationId={this.props.station.id}
            channel={this.mapChannelConfigToOffset(channel)}
            displayInterval={this.props.displayInterval}
            viewableInterval={this.props.viewableInterval}
            getZoomRatio={this.props.getZoomRatio}
            isDefaultChannel={false}
            isExpandable={false}
            isSplitChannelOverlayOpen={this.props.isSplitChannelOverlayOpen}
            activeSplitModeType={this.props.activeSplitModeType}
            closeSplitChannelOverlayCallback={this.props.closeSplitChannelOverlayCallback}
            expanded={false}
            showMaskIndicator={false}
            isStationMaskTarget={this.props.isMaskTarget}
            distance={channel.distance || 0}
            distanceUnits={distanceUnits}
            azimuth={channel.azimuth || 0}
            customLabel={this.props.customLabel}
            events={childEvents}
            canvasRef={this.props.canvasRef}
            getCanvasBoundingRect={this.props.getCanvasBoundingRect}
            getPositionBuffer={this.props.getPositionBuffer}
            getBoundaries={this.props.getBoundaries}
            glMin={this.props.glMin}
            glMax={this.props.glMax}
            renderWaveforms={this.props.renderWaveforms}
            converters={this.props.converters}
            onMouseMove={this.props.onMouseMove}
            onMouseDown={this.props.onMouseDown}
            onMouseUp={this.props.onMouseUp}
            onContextMenu={this.props.onContextMenu}
            isMeasureWindow={this.props.isMeasureWindow}
            updateMeasureWindow={this.props.updateMeasureWindow}
            msrWindowWaveformAmplitudeScaleFactor={this.props.msrWindowWaveformAmplitudeScaleFactor}
            channelLabelTooltip={channel.channelLabelTooltip}
            splitChannelRefs={this.splitChannelRefs}
          />
        );
      }
    );
  };

  /**
   * Maps the channel data to the provided time offset in seconds.
   *
   * @param channel
   */
  private readonly mapChannelConfigToOffset = (
    channel: WeavessTypes.Channel
  ): WeavessTypes.Channel => {
    if (!channel.timeOffsetSeconds) {
      return channel;
    }

    const { timeOffsetSeconds } = channel;
    // map the time seconds to the offset time seconds

    const waveform = channel.waveform ? this.buildWaveform(channel, timeOffsetSeconds) : undefined;
    const spectrogram = channel.spectrogram
      ? this.buildSpectrogram(channel, timeOffsetSeconds)
      : undefined;
    const markers: WeavessTypes.Markers | undefined =
      channel && channel.markers
        ? buildWeavessMarkers(channel.markers, timeOffsetSeconds)
        : undefined;

    return {
      ...channel,
      waveform,
      spectrogram,
      markers
    };
  };

  /**
   * Build the waveform content including markers
   *
   * @param waveform
   * @returns Channel WaveformContent
   */
  // eslint-disable-next-line class-methods-use-this
  private readonly buildWaveform = (
    channel: WeavessTypes.Channel,
    timeOffsetSeconds: number
  ): WeavessTypes.ChannelWaveformContent | undefined => {
    const waveformSignalDetections: WeavessTypes.PickMarker[] | undefined =
      channel.waveform && channel.waveform.signalDetections
        ? channel.waveform.signalDetections.map(s => ({
            ...s,
            timeSecs: s.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformPredictedPhases: WeavessTypes.PickMarker[] | undefined =
      channel.waveform && channel.waveform.predictedPhases
        ? channel.waveform.predictedPhases.map(p => ({
            ...p,
            timeSecs: p.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformTheoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined =
      channel.waveform && channel.waveform.theoreticalPhaseWindows
        ? channel.waveform.theoreticalPhaseWindows.map(t => ({
            ...t,
            startTimeSecs: t.startTimeSecs + timeOffsetSeconds,
            endTimeSecs: t.endTimeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformMarkers: WeavessTypes.Markers | undefined =
      channel.waveform && channel.waveform.markers
        ? buildWeavessMarkers(channel.waveform.markers, timeOffsetSeconds)
        : undefined;

    if (channel.waveform) {
      return {
        ...channel.waveform,
        signalDetections: waveformSignalDetections,
        predictedPhases: waveformPredictedPhases,
        theoreticalPhaseWindows: waveformTheoreticalPhaseWindows,
        markers: waveformMarkers
      };
    }
    return undefined;
  };

  /**
   * Build the waveform content including markers
   *
   * @param waveform
   * @returns Channel WaveformContent
   */
  // eslint-disable-next-line class-methods-use-this
  private readonly buildSpectrogram = (
    channel: WeavessTypes.Channel,
    timeOffsetSeconds: number
  ): WeavessTypes.ChannelSpectrogramContent | undefined => {
    const spectrogramSignalDetections: WeavessTypes.PickMarker[] | undefined =
      channel.spectrogram && channel.spectrogram.signalDetections
        ? channel.spectrogram.signalDetections.map(s => ({
            ...s,
            timeSecs: s.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const spectrogramPredictedPhases: WeavessTypes.PickMarker[] | undefined =
      channel.spectrogram && channel.spectrogram.predictedPhases
        ? channel.spectrogram.predictedPhases.map(p => ({
            ...p,
            timeSecs: p.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const spectrogramTheoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined =
      channel.spectrogram && channel.spectrogram.theoreticalPhaseWindows
        ? channel.spectrogram.theoreticalPhaseWindows.map(t => ({
            ...t,
            startTimeSecs: t.startTimeSecs + timeOffsetSeconds,
            endTimeSecs: t.endTimeSecs + timeOffsetSeconds
          }))
        : undefined;

    const spectrogramMarkers: WeavessTypes.Markers | undefined =
      channel.spectrogram && channel.spectrogram.markers
        ? buildWeavessMarkers(channel.spectrogram.markers, timeOffsetSeconds)
        : undefined;

    if (channel.spectrogram) {
      return {
        ...channel.spectrogram,
        signalDetections: spectrogramSignalDetections,
        predictedPhases: spectrogramPredictedPhases,
        theoreticalPhaseWindows: spectrogramTheoreticalPhaseWindows,
        markers: spectrogramMarkers
      };
    }
    return undefined;
  };

  /**
   * Maps the events to the real time from offset in seconds.
   *
   * @param channel
   * @param channelEvents
   */
  // eslint-disable-next-line class-methods-use-this
  private readonly mapEventsToOffset = (
    channel: WeavessTypes.Channel,
    channelEvents: WeavessTypes.ChannelEvents
  ): WeavessTypes.ChannelEvents => {
    if (!channel.timeOffsetSeconds) {
      return channelEvents;
    }

    const { timeOffsetSeconds } = channel;

    return {
      ...channelEvents,
      labelEvents: channelEvents.labelEvents ? channelEvents.labelEvents : undefined,
      events: channelEvents.events
        ? {
            ...channelEvents.events,
            // map the time seconds back to the original time seconds
            onChannelClick: onChannelClickToOffset(channelEvents.events, timeOffsetSeconds),
            onMaskCreateDragEnd: onMaskCreateDragEndToOffset(
              channelEvents.events,
              timeOffsetSeconds
            ),

            onMeasureWindowUpdated: onMeasureWindowUpdatedToOffset(
              channelEvents.events,
              timeOffsetSeconds
            ),

            onUpdateMarker: onUpdateMarkerToOffset(channelEvents.events, timeOffsetSeconds),

            onMoveSelectionWindow: onMoveSelectionWindowToOffset(
              channelEvents.events,
              timeOffsetSeconds
            ),

            onUpdateSelectionWindow: onUpdateSelectionWindowToOffset(
              channelEvents.events,
              timeOffsetSeconds
            ),

            onClickSelectionWindow: onClickSelectionWindowToOffset(
              channelEvents.events,
              timeOffsetSeconds
            )
          }
        : undefined,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      onKeyPress: channelEvents.onKeyPress
    };
  };

  public render(): JSX.Element {
    // calculate and determine the individual row heights
    const { rowHeights, totalRowHeight } = this.buildRowHeights();

    const defaultChannelTimeOffsetSeconds =
      this.props.station.defaultChannel.timeOffsetSeconds || 0;

    const distanceUnits: WeavessTypes.DistanceUnits = this.props.station.distanceUnits
      ? this.props.station.distanceUnits
      : WeavessTypes.DistanceUnits.degrees;

    let parentEvents;
    if (this.props.events?.defaultChannelEvents) {
      parentEvents = this.mapEventsToOffset(
        this.props.station.defaultChannel,
        this.props.events.defaultChannelEvents
      );
    }

    const expanded = this.areChannelsShowing();

    return (
      <div
        className={classNames({
          station: true,
          'station-split-expanded': !!this.props.station?.splitChannels
        })}
        style={{
          height: totalRowHeight
        }}
      >
        <Channel // default channel
          isSplitStation={!!this.props.activeSplitModeType}
          activeSplitModeType={this.props.activeSplitModeType}
          splitModePickMarkerColor={this.props?.splitModePickMarkerColor}
          key={`station-default-channel-${this.props.station.defaultChannel.id}`}
          ref={ref => {
            this.defaultChannelRef = ref;
          }}
          offsetSecs={defaultChannelTimeOffsetSeconds}
          index={0}
          height={rowHeights[0]}
          shouldRenderWaveforms={this.props.shouldRenderWaveforms}
          shouldRenderSpectrograms={this.props.shouldRenderSpectrograms}
          initialConfiguration={this.props.initialConfiguration}
          stationId={this.props.station.id}
          channel={this.mapChannelConfigToOffset(this.props.station.defaultChannel)}
          displayInterval={this.props.displayInterval}
          viewableInterval={this.props.viewableInterval}
          getZoomRatio={this.props.getZoomRatio}
          isDefaultChannel
          isExpandable={!!this.props.station.nonDefaultChannels}
          isSplitChannelOverlayOpen={this.props.isSplitChannelOverlayOpen}
          splitChannelRefs={this.splitChannelRefs}
          closeSplitChannelOverlayCallback={this.props.closeSplitChannelOverlayCallback}
          expanded={expanded}
          showMaskIndicator={this.props.hasQcMasks ?? false}
          distance={this.props.station.distance ? this.props.station.distance : 0}
          distanceUnits={distanceUnits}
          azimuth={this.props.station.azimuth ? this.props.station.azimuth : 0}
          customLabel={this.props.customLabel}
          events={parentEvents}
          canvasRef={this.props.canvasRef}
          getCanvasBoundingRect={this.props.getCanvasBoundingRect}
          getPositionBuffer={this.props.getPositionBuffer}
          getBoundaries={this.props.getBoundaries}
          renderWaveforms={this.props.renderWaveforms}
          glMin={this.props.glMin}
          glMax={this.props.glMax}
          converters={this.props.converters}
          onMouseMove={(e: React.MouseEvent<HTMLDivElement>, xPct: number, timeSecs: number) =>
            this.props.onMouseMove(e, xPct, timeSecs - defaultChannelTimeOffsetSeconds)
          }
          onMouseDown={this.props.onMouseDown}
          onMouseUp={this.props.onMouseUp}
          onContextMenu={this.props.onContextMenu}
          isMeasureWindow={this.props.isMeasureWindow}
          updateMeasureWindow={this.props.updateMeasureWindow}
          msrWindowWaveformAmplitudeScaleFactor={this.props.msrWindowWaveformAmplitudeScaleFactor}
          channelLabelTooltip={this.props.station.defaultChannel.channelLabelTooltip}
        />
        {this.props.station?.splitChannels
          ? this.createNonDefaultChannelElements(
              this.props.station.splitChannels,
              rowHeights,
              distanceUnits,
              this.setSplitChannelRef,
              true
            )
          : []}
        {expanded && !!this.props.station?.nonDefaultChannels
          ? this.createNonDefaultChannelElements(
              this.props.station.nonDefaultChannels,
              rowHeights,
              distanceUnits,
              this.setNonDefaultChannelRef
            )
          : []}
      </div>
    );
  }
}
