/* eslint-disable react/destructuring-assignment */
import classNames from 'classnames';
import React from 'react';

import { calculateLeftPercent } from '../../../utils';
import type { FollowPickMarkerProps } from './types';
import { useMousePosition } from './utils';

/**
 * An marker that follows your mouse
 */
export function FollowPickMarker(props: FollowPickMarkerProps) {
  const mousePosition = useMousePosition();

  let time = props.getTimeSecsForClientX(mousePosition.x);
  // round up to nearest milliseconds
  time = Math.round(time * 1000) / 1000;
  // Calculation for mouse position needs to be on the display interval without offset
  const percentLeft = calculateLeftPercent(
    time,
    props.displayInterval.startTimeSecs,
    props.displayInterval.endTimeSecs
  );
  const positionX = (percentLeft * (props.parentWidthPx ?? 0)) / 100;

  const pickMarkerLabelStyle: React.CSSProperties = {
    left: '4px',
    filter: props.filter ?? ''
  };

  return (
    <div
      role="presentation"
      className={classNames([`follow-pick-marker`])}
      style={
        {
          '--follow-pick-marker-color': props.color ?? '',
          transform: `translateX(${positionX}px)`,
          position: 'relative',
          height: '100%',
          filter: props.filter ?? ''
        } as React.CSSProperties
      }
    >
      <div className="follow-pick-marker__vertical" />
      <div className={classNames([`follow-pick-marker__label`])} style={pickMarkerLabelStyle}>
        {props.label}
      </div>
    </div>
  );
}
