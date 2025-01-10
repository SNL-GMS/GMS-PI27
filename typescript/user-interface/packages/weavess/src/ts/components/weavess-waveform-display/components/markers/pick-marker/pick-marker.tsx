/* eslint-disable react/destructuring-assignment */
import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { UILogger } from '@gms/ui-util';
import classNames from 'classnames';
import React from 'react';

import type { PickMarkerProps } from './types';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

const ICON_SIZE_PX = 13;

/**
 * An interactive marker, that is configurable, and can have specific events.
 */
export class PickMarker extends React.PureComponent<PickMarkerProps> {
  /** container reference */
  private containerRef: HTMLDivElement | null;

  /** line reference */
  private lineRef: HTMLDivElement | null;

  /** label reference */
  private labelRef: HTMLDivElement | null;

  /** Used to prevent collisions between the single and double-click handlers */
  private singleClickTimer: NodeJS.Timeout | undefined;

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   */
  public componentDidUpdate(prevProps: PickMarkerProps): void {
    if (!this.lineRef) return;

    if (prevProps.color !== this.props.color) {
      const timeout = 500;
      // if the color changes, flash animation
      this.lineRef.style.borderColor = this.props.color;
      setTimeout(() => {
        if (!this.lineRef) return;

        this.lineRef.style.borderColor = this.props.color;
        this.lineRef.style.transition = 'border-color 0.5s ease-in';
        setTimeout(() => {
          if (!this.lineRef) return;
          this.lineRef.style.transition = '';
        }, timeout);
      }, timeout);
    }
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to un-mount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  public componentDidCatch(error, info): void {
    logger.error(`Weavess Pick Marker Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * referentially stable click handler for pick markers
   *
   * @param e
   */
  private readonly onClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Prevent from firing single-click handler on double-click
    if (this.props.onClick) {
      const timeout = 200;
      if (this.singleClickTimer) clearTimeout(this.singleClickTimer);
      this.singleClickTimer = setTimeout(() => {
        if (this.props.onClick) {
          this.props.onClick(e, this.props.id);
        }
      }, timeout);
    }
  };

  /**
   * referentially stable double-click handler for pick markers
   */
  private readonly onDoubleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (this.props.onDoubleClick) {
      if (this.singleClickTimer) clearTimeout(this.singleClickTimer);
      this.props.onDoubleClick(e, this.props.id);
    }
  };

  /**
   * onContextMenu menu event handler for pick markers
   *
   * @param e
   */
  private readonly onContextMenu = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (this.props.onContextMenu) {
      this.props.onContextMenu(e, this.props.channelId, this.props.id);
    }
  };

  /**
   * onMouseDown event handler for signal detections
   *
   * @param e
   */
  private readonly onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    this.onClick(e);

    // prevent propagation of these events so that the underlying channel click doesn't register
    e.stopPropagation();

    // if context-menu, don't trigger
    if (e.button === 2) return;

    if (this.props.setPickerMarkerTime && this.props.isDraggable) {
      this.addDragListenerForMove(e);
    }
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

    const onMouseMove = (event: MouseEvent) => {
      if (!this.containerRef) return;
      // Check currentPos is within the viewable interval
      const currentTime = this.props.getTimeSecsForClientX(event.clientX);

      // Using the viewable interval adjusted to this channel's time offset (offset is 0 if no event is open)
      // check if the time of the mouse position is within the adjusted viewable interval
      const viewableStartSecs = this.props.viewableInterval.startTimeSecs + this.props.offsetSecs;
      const viewableEndSecs = this.props.viewableInterval.endTimeSecs + this.props.offsetSecs;
      if (currentTime >= viewableStartSecs && currentTime <= viewableEndSecs) {
        currentPos = event.clientX;
      } else if (currentTime < viewableStartSecs) {
        currentPos = this.props.getClientXForTimeSecs(viewableStartSecs);
      } else if (currentTime > viewableEndSecs) {
        currentPos = this.props.getClientXForTimeSecs(viewableEndSecs);
      }

      // begin drag if moving more than 1 pixel
      const diff = Math.abs(currentPos - start);
      if (diff > 1 && !isDragging) {
        isDragging = true;
        if (this.labelRef) {
          this.labelRef.style.filter = 'brightness(0.5)';
        }
        if (this.lineRef) {
          this.lineRef.style.filter = 'brightness(0.5)';
        }
        this.props.toggleDragIndicator(true, this.props.color);
      }
      if (isDragging) {
        this.props.positionDragIndicator(currentPos);
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      try {
        event.stopPropagation();
        if (!this.containerRef || !isDragging) return;
        this.props.toggleDragIndicator(false, this.props.color);
        if (this.labelRef) {
          this.labelRef.style.filter = this.props.filter ? this.props.filter : 'initial';
        }
        if (this.lineRef) {
          this.lineRef.style.filter = this.props.filter ? this.props.filter : 'initial';
        }
        // Get the new time and make sure it is within the viewable timerange
        let time = this.props.getTimeSecsForClientX(currentPos) - this.props.offsetSecs;
        // round up to nearest milliseconds
        time = Math.round(time * 1000) / 1000;
        if (time != null) {
          if (this.props.setPickerMarkerTime) {
            this.props.setPickerMarkerTime(time);
          }
        }
      } finally {
        document.body.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseup', onMouseUp);
      }
    };

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
  };

  public render(): JSX.Element | undefined {
    const pickMarkerLabelStyle: React.CSSProperties = {
      left: `calc(4px + ${this.props.position}%)`,
      filter: this.props.filter
    };

    return !this.props.isDisabled ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={classNames([
          `pick-marker`,
          {
            'pick-marker--selected': this.props.isSelected,
            'pick-marker--selectable': this.props.isSelectable,
            'pick-marker--action-target': this.props.isActionTarget
          }
        ])}
        data-testid="pick-marker"
        ref={ref => {
          this.containerRef = ref;
        }}
        style={{ '--pick-marker-color': this.props.color } as React.CSSProperties}
        onMouseDown={this.onMouseDown}
        onDoubleClick={this.onDoubleClick}
      >
        <div
          className="pick-marker__vertical"
          data-cy-predicted={`pick-marker-pick-predicted-${this.props.predicted}`}
          ref={ref => {
            this.lineRef = ref;
          }}
          style={{
            left: `${this.props.position}%`,
            filter: this.props.filter
          }}
        />
        <div
          className={classNames([
            `pick-marker__label`,
            { 'pick-marker__label--top': !this.props.predicted },
            { 'pick-marker__label--bottom': this.props.predicted }
          ])}
          data-cy={`pick-marker-${this.props.id}`}
          data-cy-color={`pick-marker-${this.props.color}`}
          data-cy-is-predicted-phase={this.props.predicted}
          data-cy-phase={this.props.label}
          data-cy-style-left={this.props.position}
          onContextMenu={this.props.onContextMenu ? this.onContextMenu : undefined}
          style={pickMarkerLabelStyle}
          ref={ref => {
            this.labelRef = ref;
          }}
        >
          {this.props.label}
          {this.props.isConflicted && (
            <Icon
              icon={IconNames.ISSUE}
              size={ICON_SIZE_PX}
              className={classNames([
                `pick-marker__conflict`,
                {
                  'pick-marker__conflict--selected': this.props.isSelected
                }
              ])}
            />
          )}
        </div>
        {this.props.children}
      </div>
    ) : undefined;
  }
}
