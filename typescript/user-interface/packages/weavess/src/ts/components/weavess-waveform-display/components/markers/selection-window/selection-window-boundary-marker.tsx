/* eslint-disable react/destructuring-assignment */
import { UILogger } from '@gms/ui-util';
import React from 'react';

import { calculateLeftPercent } from '../../../utils';
import { type SelectionWindowBoundaryMarkerProps } from './types';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

/**
 * SelectionWindowBoundaryMarker Component
 */
export class SelectionWindowBoundaryMarker extends React.PureComponent<SelectionWindowBoundaryMarkerProps> {
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
    logger.error(`Weavess Selection Window Boundary Marker Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const timeRange = this.props.timeRange();
    const percentageLocation: number = calculateLeftPercent(
      this.props.timeSecs,
      timeRange.startTimeSecs,
      timeRange.endTimeSecs
    );
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className="moveable-marker"
        data-testid="selection-window-boundary-marker"
        key={this.props?.name}
        style={{
          left: `${percentageLocation}%`
        }}
        onMouseDown={this.onMarkerClick}
      />
    );
  }

  /**
   * Move logic for the markers. Creates mouse move and up listeners to determine
   * Where it should be moved. Only works for pairs currently, if more than two markers
   * Depend on each other, will need to be refactored.
   *
   * @param e
   */
  private readonly onMarkerClick = (mouseClickEvent: React.MouseEvent<HTMLDivElement>) => {
    mouseClickEvent.stopPropagation();
    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      this.props.setIsUpdating(true);
      const currentTimeSecs = this.props.getTimeSecsForClientX(mouseMoveEvent.clientX) as number;
      this.props.onMarkerUpdated(this.props.boundaryType, currentTimeSecs);
    };

    const onMouseUp = (mouseUpEvent: MouseEvent) => {
      this.props.setIsUpdating(false);
      const currentTimeSecs = this.props.getTimeSecsForClientX(mouseUpEvent.clientX) as number;
      this.props.onMarkerUpdated(this.props.boundaryType, currentTimeSecs);

      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
}
