import { H6 } from '@blueprintjs/core';
import { formatTimeForDisplay } from '@gms/common-util';
import { LabelValue } from '@gms/ui-core-components';
import uniqueId from 'lodash/uniqueId';
import React from 'react';

interface ConflictsTooltipContentProps {
  data: ConflictedSDInfo[] | ConflictedEventInfo[];
  lengthLimit?: number;
}

/**
 * used for building an SD's conflict tooltip
 */
export interface ConflictedEventInfo {
  readonly time: number;
}

/**
 * used for building an Event's conflict tooltip
 */
export interface ConflictedSDInfo {
  readonly phase: string;
  readonly station: string;
  readonly time: number;
}

/**
 * typeguard to determine if the data
 * contains event conflicts or SD conflicts
 */

const isConflictedEventData = (object: unknown[]): object is ConflictedSDInfo[] => {
  let isValid = true;
  object.forEach(obj => {
    if ((obj as ConflictedSDInfo).phase === undefined) {
      isValid = false;
    }
  });
  return isValid;
};

/**
 *
 * @param data
 * @param lengthLimit
 * @returns HTML for the Event's conflicts
 */
function EventConflictsBuilder({
  data,
  lengthLimit = 5
}: {
  data: ConflictedSDInfo[];
  lengthLimit: number;
}): JSX.Element {
  const content: JSX.Element = data ? (
    <>
      <H6>Signal Detection(s) in conflict:</H6>
      <LabelValue
        label=""
        value={
          <ul>
            {data.slice(0, lengthLimit).map(sd => {
              return (
                <li key={uniqueId(`${sd.time}`)}>
                  <span className="sd-phase">{sd.phase}</span>
                  <span>&nbsp;on&nbsp;</span>
                  <span className="sd-station">{sd.station}</span>
                  <span>&nbsp;at&nbsp;</span>
                  <span className="sd-time">{formatTimeForDisplay(sd.time)}</span>
                </li>
              );
            })}
            {data.length - lengthLimit > 0 ? (
              <li key={uniqueId()} className="overflow">
                <span>. . . {data.length - lengthLimit} more . . .</span>
              </li>
            ) : undefined}
          </ul>
        }
        tooltip="Signal detection phase, station, time"
        containerClass="tooltip-content"
      />
    </>
  ) : undefined;

  return content;
}

/**
 *
 * @param data
 * @param lengthLimit
 * @returns HTML for the SD's conflicts
 */
function SDConflictsBuilder({
  data,
  lengthLimit = 5
}: {
  data: ConflictedEventInfo[];
  lengthLimit: number;
}): JSX.Element {
  const content: JSX.Element = data ? (
    <>
      <H6>Event(s) in conflict:</H6>
      <LabelValue
        label=""
        value={
          <ul>
            {data.slice(0, lengthLimit).map(event => {
              return (
                <li key={uniqueId(`${event.time}`)}>
                  <span className="event-time">{formatTimeForDisplay(event.time)}</span>
                </li>
              );
            })}
            {data.length - lengthLimit > 0 ? (
              <li key={uniqueId()} className="overflow">
                <span>. . . {data.length - lengthLimit} more . . .</span>
              </li>
            ) : undefined}
          </ul>
        }
        tooltip="Signal detection phase, station, time"
        containerClass="tooltip-content"
      />
    </>
  ) : undefined;

  return content;
}

/**
 *
 * @param props
 * @returns
 */
export function ConflictsTooltipContent(props: ConflictsTooltipContentProps): JSX.Element {
  const { data, lengthLimit } = props;
  let content: JSX.Element;

  const tooltipRef = React.useRef<HTMLElement>(null);

  if (data && data.length > 0 && isConflictedEventData(data)) {
    content = (
      <div
        ref={ref => {
          tooltipRef.current = ref;
        }}
        className="events-conflict-tooltip tooltip"
        data-cy="events-conflict-tooltip"
        // setting the tab index so the keydown listener can be active
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <EventConflictsBuilder data={data} lengthLimit={lengthLimit} />
      </div>
    );
  } else {
    content = (
      <div
        ref={ref => {
          tooltipRef.current = ref;
        }}
        className="signal-detections-conflict-tooltip tooltip"
        data-cy="signal-detections-conflict-tooltip"
        // setting the tab index so the keydown listener can be active
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <SDConflictsBuilder data={data} lengthLimit={lengthLimit} />
      </div>
    );
  }
  return content;
}
