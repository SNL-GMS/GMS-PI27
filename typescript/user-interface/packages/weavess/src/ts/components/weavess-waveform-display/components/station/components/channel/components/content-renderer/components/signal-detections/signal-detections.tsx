import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';

import { SignalDetection } from './signal-detection';
import type { SignalDetectionsProps } from './types';

export class SignalDetections extends React.PureComponent<SignalDetectionsProps> {
  /**
   * Creates SignalDetection components
   *
   * @param props the signal detection props
   * @returns an array of signal detection elements as JSX.Element
   */
  private static readonly createSignalDetectionElements = (
    props: SignalDetectionsProps
  ): JSX.Element[] => {
    if (!props.signalDetections) return [];
    return props.signalDetections.map(signalDetection => {
      return (
        <SignalDetection
          key={`${signalDetection.id}-top`}
          stationId={props.stationId}
          channelId={props.channelId}
          signalDetection={signalDetection}
          displayInterval={props.displayInterval}
          viewableInterval={props.viewableInterval}
          offsetSecs={props.offsetSecs}
          events={props.events}
          isOnSplitChannel={props.isOnSplitChannel}
          initialConfiguration={props.initialConfiguration}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          getTimeSecsForClientX={props.getTimeSecsForClientX}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          getClientXForTimeSecs={props.getClientXForTimeSecs}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          toggleDragIndicator={props.toggleDragIndicator}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          positionDragIndicator={props.positionDragIndicator}
        />
      );
    });
  };

  /**
   * A memoized function for creating the signal detection elements.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param props the signal detection props
   * @returns an array JSX elements
   */
  private readonly memoizedCreateSignalDetectionElements: (
    props: SignalDetectionsProps
  ) => JSX.Element[];

  /**
   * Constructor
   *
   * @param props Waveform props as SignalDetectionsProps
   */
  public constructor(props: SignalDetectionsProps) {
    super(props);
    this.memoizedCreateSignalDetectionElements = memoizeOne(
      SignalDetections.createSignalDetectionElements,
      /* tell memoize to use a deep comparison for complex objects */
      isEqual
    );
    this.state = {};
  }

  public render(): JSX.Element {
    return <>{this.memoizedCreateSignalDetectionElements(this.props)}</>;
  }
}
