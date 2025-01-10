/* eslint-disable react/destructuring-assignment */
import { Colors } from '@blueprintjs/core';
import { UILogger } from '@gms/ui-util';
import { WeavessConstants } from '@gms/weavess-core';
import * as d3 from 'd3';
import throttle from 'lodash/throttle';
import moment from 'moment';
import React from 'react';

import type { XAxisProps, XAxisState } from './types';

const SIG_FIG_MULTIPLICATIVE = 10;
const TEN_PERCENT = 0.1;
const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

/**
 * The tick formatter used for the axis.
 *
 * @param date the date object
 * @returns the formatted time string
 */
export const tickFormatter = (date: Date): string => moment.utc(date).format('HH:mm:ss.SSS');

/** Time interval threshold to use sub millisecond time formatting */
const minTimeIntervalSecs = 60.0;

/** The number of decimal places to show when zoomed below one second */
const SUB_SECOND_DIGITS = 5;

/** The number of digits to show by default (showing over 1 second of data) */
const DEFAULT_NUM_DIGITS = 3;

const getNumberString = (num: number): string =>
  num < SIG_FIG_MULTIPLICATIVE ? `0${num}` : `${num}`;

const getSubSecondDigits = (duration: number) => {
  if (duration > 1) return DEFAULT_NUM_DIGITS;
  if (duration > TEN_PERCENT) return DEFAULT_NUM_DIGITS + 1;
  return SUB_SECOND_DIGITS;
};

/**
 * The tick formatter used for the axis when time interval is below minimum threshold
 *
 * @param epochSeconds time in epoch seconds
 * @returns the formatted time string
 */
export const subMillisecondFormatterFactory =
  (numberOfDigits = 3) =>
  (epochSeconds: number): string => {
    const EXPANDED_PRECISION = SIG_FIG_MULTIPLICATIVE ** numberOfDigits;
    // Get the sub second string to 4 decimal places. Note toFixed rounds
    const microSeconds = (epochSeconds * EXPANDED_PRECISION) % EXPANDED_PRECISION;

    const subSecondString = (microSeconds / EXPANDED_PRECISION)
      .toFixed(numberOfDigits)
      .replace('0.', '');

    // Round seconds to the nearest millisecond and create Date
    const roundedSeconds = Math.round(epochSeconds * EXPANDED_PRECISION) / EXPANDED_PRECISION;
    const date = new Date(roundedSeconds * 1000);
    return `${getNumberString(date.getUTCHours())}:${getNumberString(
      date.getUTCMinutes()
    )}:${getNumberString(date.getUTCSeconds())}.${subSecondString}`;
  };

/**
 * A D3-based Time Axis component
 */
export class XAxis extends React.PureComponent<XAxisProps, XAxisState> {
  /** A handle to the axis wrapper HTML element */
  public axisRef: HTMLElement | null;

  /** A handle to the svg selection d3 returns, where the axis will be created */
  private svgAxis: d3.Selection<SVGGElement, unknown, null, undefined>;

  /**
   * Constructor
   *
   * @param props X Axis props as XAxisProps
   */
  public constructor(props: XAxisProps) {
    super(props);
    this.state = {};
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    const svg = d3
      .select(this.axisRef)
      .append('svg')
      .attr('width', '100%')
      .attr('height', WeavessConstants.DEFAULT_XAXIS_HEIGHT_PIXELS)
      .style('fill', Colors.LIGHT_GRAY5);

    this.svgAxis = svg.append('g').attr('class', 'x-axis-axis');
    this.update();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: XAxisProps): void {
    if (prevProps.displayInterval !== this.props.displayInterval) {
      this.update();
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
    logger.error(`Weavess XAxis Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    if (
      !this.props.displayInterval ||
      Number.isNaN(this.props.displayInterval.startTimeSecs) ||
      Number.isNaN(this.props.displayInterval.endTimeSecs)
    ) {
      return <div />;
    }
    return (
      <div
        className={this.props.borderTop ? 'x-axis' : 'x-axis no-border'}
        style={{
          height: `${WeavessConstants.DEFAULT_XAXIS_HEIGHT_PIXELS}px`
        }}
        data-start-time={this.props.displayInterval.startTimeSecs}
        data-end-time={this.props.displayInterval.endTimeSecs}
        data-cy="x-axis"
      >
        <div
          ref={axis => {
            this.axisRef = axis;
          }}
          style={{
            width: '100%'
          }}
        />
        <div
          style={{
            textAlign: 'center'
          }}
        >
          {this.props.label}
        </div>
      </div>
    );
  }

  /**
   * Re-draw the axis based on new parameters
   * Not a react life cycle method. Used to manually update the time axis
   * This is done to keep it performant, and not have to rerender the DOM
   */
  public readonly update = (): void => {
    throttle(this.internalUpdate, WeavessConstants.ONE_FRAME_MS * 1)();
  };

  private readonly internalUpdate = (): void => {
    if (!this.axisRef) return;
    const timeInterval =
      this.props.displayInterval.endTimeSecs - this.props.displayInterval.startTimeSecs;

    // Figure out when to use Date formatting vs sub millisecond formatting (sub seconds to 4 places)
    const useDateScale = timeInterval > minTimeIntervalSecs;
    const range = [this.props.labelWidthPx, this.axisRef.clientWidth - this.props.scrollbarWidthPx];
    const x = useDateScale
      ? d3
          .scaleUtc()
          .domain([
            new Date(
              this.props.displayInterval.startTimeSecs * WeavessConstants.MILLISECONDS_IN_SECOND
            ),
            new Date(
              this.props.displayInterval.endTimeSecs * WeavessConstants.MILLISECONDS_IN_SECOND
            )
          ])
          .range(range)
      : d3
          .scaleLinear()
          .domain([
            this.props.displayInterval.startTimeSecs,
            this.props.displayInterval.endTimeSecs
          ])
          .range(range);

    const spaceBetweenTicksPx = 150;

    let numTicks = Math.floor(
      (this.axisRef.clientWidth - (this.props.labelWidthPx - 1) - this.props.scrollbarWidthPx) /
        spaceBetweenTicksPx
    );

    let subSecondDigits;
    // If using sub milliseconds figure out num ticks based on time interval so
    // we don't have multiple time ticks with the same value
    if (!useDateScale) {
      // Calculate the number of microseconds will use if less than calculated based on width
      // min is 1
      subSecondDigits = getSubSecondDigits(timeInterval);
      const numMicroSecs = Math.max(
        Math.round(timeInterval * SIG_FIG_MULTIPLICATIVE ** subSecondDigits),
        1
      );
      numTicks = numMicroSecs < numTicks ? numMicroSecs : numTicks;
    }
    const tickHeight = 7;
    const tf: any = useDateScale ? tickFormatter : subMillisecondFormatterFactory(subSecondDigits);
    const xAxis = d3.axisBottom(x).ticks(numTicks).tickSize(tickHeight).tickFormat(tf);
    this.svgAxis.call(xAxis);
  };
}
