/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/destructuring-assignment */
import { UILogger } from '@gms/ui-util';
import { isGlobalHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import classNames from 'classnames';
import React from 'react';

import { memoizedGetConfiguration } from '../../../configuration';
import { calculateLeftPercent } from '../../../utils';
import type { UncertaintyMarkerProps } from './types';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

interface UncertaintyMarkerState {
  isActive: boolean;
}

/**
 * An interactive marker, that is configurable, and can have specific events.
 */
export class UncertaintyMarker extends React.PureComponent<
  UncertaintyMarkerProps,
  UncertaintyMarkerState
> {
  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Constructor
   *
   * @param props props as PickMarkerProps
   */
  public constructor(props: UncertaintyMarkerProps) {
    super(props);
    this.state = {
      isActive: false
    };
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to un-mount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  public componentDidCatch(error, info): void {
    logger.error(`Weavess Uncertainty Marker Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  private readonly isEditingUncertainty = (): boolean => {
    return isGlobalHotKeyCommandSatisfied(
      this.props.initialConfiguration?.hotKeys?.editSignalDetectionUncertainty?.combos ?? []
    );
  };

  // eslint-disable-next-line class-methods-use-this
  private readonly preventDefaults = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  /**
   * Prevent propagation & default if in editing uncertainty mode, which stops the context menu event
   * from clearing the hotkeys from the global listener.
   */
  private readonly onContextMenu = (e: React.MouseEvent) => {
    if (this.isEditingUncertainty()) {
      this.preventDefaults(e);
    }
  };

  /**
   * onMouseDown event handler for signal detections
   *
   * @param e
   */
  private readonly onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // if holding any meta key down then not picking on the uncertainty marker
    if (e.shiftKey || e.metaKey) {
      return;
    }

    // prevent propagation of these events so that the underlying channel click doesn't register
    this.preventDefaults(e);

    // if context-menu, don't trigger
    if (e.button === 2) return;

    if (this.isEditingUncertainty() && !this.props.isSplitChannelOverlayOpen) {
      this.addDragListenerForMove(e);
    }
  };

  /**
   * Update uncertainty in parent
   *
   * @param time Uncertainty time epoch secs
   * @param callDragEnd if to call update callback
   */
  private readonly setUncertaintyTime = (time: number, callDragEnd: boolean): void => {
    let uncertaintyTimeSecs = time;
    const configuration = memoizedGetConfiguration(this.props.initialConfiguration);
    if (this.props.isLeftUncertaintyBar && uncertaintyTimeSecs > this.props.pickMarkerTimeSecs) {
      uncertaintyTimeSecs =
        this.props.pickMarkerTimeSecs + configuration.sdUncertainty.minUncertainty;
    } else if (
      !this.props.isLeftUncertaintyBar &&
      uncertaintyTimeSecs < this.props.pickMarkerTimeSecs
    ) {
      uncertaintyTimeSecs =
        this.props.pickMarkerTimeSecs - configuration.sdUncertainty.minUncertainty;
    }
    // now compensate for offset of signal detection
    this.props.setUncertaintySecs(uncertaintyTimeSecs, callDragEnd);
  };

  /**
   * Add a drag listener for pick marker move modification. This
   * listener will be removed on mouse up event
   *
   * @param e MouseEvent from mouseDown
   */
  private readonly addDragListenerForMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const start = e.clientX;
    let currentPos = e.clientX;
    let isDragging = false;
    let diff = 0;
    this.setState({ isActive: true });
    this.props.setIsEditingTimeUncertainty(true);
    const onMouseMove = (event: MouseEvent) => {
      currentPos = event.clientX;
      diff = Math.abs(currentPos - start);
      // begin drag if moving more than 1 pixel
      if (diff > 1 && !isDragging) {
        isDragging = true;
      }
      if (isDragging) {
        const time = this.props.getTimeSecsForClientX(currentPos);
        if (time != null) {
          this.setUncertaintyTime(time, false);
        }
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      try {
        event.stopPropagation();
        if (!isDragging) return;
        const time = this.props.getTimeSecsForClientX(currentPos);
        if (time != null) {
          this.setUncertaintyTime(time, true);
        }
      } finally {
        this.setState({ isActive: false });
        this.props.setIsEditingTimeUncertainty(false);
        document.body.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseup', onMouseUp);
      }
    };

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
  };

  public render(): JSX.Element {
    const uncertaintySecs = this.props.isLeftUncertaintyBar
      ? this.props.pickMarkerTimeSecs - this.props.uncertaintySecs
      : this.props.pickMarkerTimeSecs + this.props.uncertaintySecs;
    const position = calculateLeftPercent(
      uncertaintySecs,
      this.props.startTimeSecs,
      this.props.endTimeSecs
    );
    const leftPos = this.props.isLeftUncertaintyBar ? position : this.props.pickMarkerPosition;
    const width = Math.abs(position - this.props.pickMarkerPosition);

    // TODO: calculate this based on some reasonable number of pixels
    // Calculate the left and right positions of the drag target window
    const maxDragTargetDistanceVertical = 0.01;
    let left = position - maxDragTargetDistanceVertical;
    if (!this.props.isLeftUncertaintyBar) {
      left = Math.max(left, this.props.pickMarkerPosition);
    }
    let right = 100 - position - maxDragTargetDistanceVertical;
    if (this.props.isLeftUncertaintyBar) {
      right = Math.max(right, 100 - this.props.pickMarkerPosition);
    }

    return (
      <div className={classNames({ 'uncertainty-marker': true, 'is-active': this.state.isActive })}>
        <div
          className={classNames({
            'uncertainty-marker__vertical': true,
            'uncertainty-marker__vertical--left': this.props.isLeftUncertaintyBar,
            'uncertainty-marker__vertical--right': !this.props.isLeftUncertaintyBar,
            'is-active': this.state.isActive
          })}
          style={{
            borderLeft: `1.5px solid ${this.props.color}`,
            left: `${position}%`
          }}
          onMouseDown={this.preventDefaults}
        />
        <div
          className={classNames({
            'uncertainty-marker__invisible-drag-target': !this.props.isSplitChannelOverlayOpen
          })}
          style={{
            left: `${left}%`,
            right: `${right}%`
          }}
          onMouseDown={this.onMouseDown}
          onContextMenu={this.onContextMenu}
          data-testid="uncertainty-marker"
        />
        <div
          className="uncertainty-marker__horizontal"
          style={{
            borderTop: `1.5px solid ${this.props.color}`,
            left: `${leftPos}%`,
            width: `${width}%`
          }}
          onMouseDown={this.preventDefaults}
        />
      </div>
    );
  }
}
