import { setDecimalPrecisionAsNumber } from '@gms/common-util';
import type { WeavessTypes } from '@gms/weavess-core';
import classNames from 'classnames';
import React from 'react';

import { memoizedGetConfiguration } from '../../../../../../../../configuration';
import { calculateLeftPercent } from '../../../../../../../../utils';
import { PickMarker, UncertaintyMarker } from '../../../../../../../markers';
import type { SignalDetectionProps, SignalDetectionState } from './types';

export class SignalDetection extends React.PureComponent<
  SignalDetectionProps,
  SignalDetectionState
> {
  /**
   * Constructor
   *
   * @param props Waveform props as SignalDetectionsProps
   */
  public constructor(props: SignalDetectionProps) {
    super(props);
    this.state = {
      uncertaintySecs: props.signalDetection?.uncertaintySecs ?? 0,
      isEditingTimeUncertainty: false
    };
  }

  public componentDidUpdate(prevProps) {
    const { signalDetection } = this.props;
    if (signalDetection?.uncertaintySecs !== prevProps.signalDetection.uncertaintySecs) {
      this.setState({
        uncertaintySecs: signalDetection?.uncertaintySecs ?? 0
      });
    }
  }

  /**
   * Update the uncertainty seconds in state and call events onSignalDetectionDragEnd
   * if uncertainty marker drag has ended
   *
   * @param uncertaintyTime in epoch seconds
   * @param callDragEnd if to update events onSignalDetectionDragEnd
   */
  private readonly setUncertaintyInState = (uncertaintyTime: number, callDragEnd: boolean) => {
    const { offsetSecs, initialConfiguration, signalDetection, viewableInterval } = this.props;

    if (signalDetection) {
      const uncertaintyEpochSecs = uncertaintyTime;
      let uncertaintyDeltaFromSd = Math.abs(signalDetection.timeSecs - uncertaintyEpochSecs);

      // check uncertainty delta is within viewable interval for both markers
      const leftUncertaintyMax =
        signalDetection.timeSecs - viewableInterval.startTimeSecs - offsetSecs;
      const rightUncertaintyMax =
        viewableInterval.endTimeSecs - signalDetection.timeSecs + offsetSecs;
      if (uncertaintyDeltaFromSd > leftUncertaintyMax) {
        uncertaintyDeltaFromSd = leftUncertaintyMax;
      } else if (uncertaintyDeltaFromSd > rightUncertaintyMax) {
        uncertaintyDeltaFromSd = rightUncertaintyMax;
      }
      const configuration = memoizedGetConfiguration(initialConfiguration);
      this.setState(
        {
          uncertaintySecs:
            setDecimalPrecisionAsNumber(
              uncertaintyDeltaFromSd,
              configuration.sdUncertainty.fractionDigits
            ) ?? 0
        },
        () => {
          if (callDragEnd) {
            this.setSignalDetectionTime(signalDetection.timeSecs - offsetSecs);
          }
        }
      );
    }
  };

  /**
   * Set new signal detection arrival time. Calls weavess events' onSignalDetectionDragEnd
   *
   * @param time to update
   */
  private readonly setSignalDetectionTime = (time: number) => {
    const { events, signalDetection } = this.props;
    if (signalDetection && events?.onSignalDetectionDragEnd) {
      const { uncertaintySecs } = this.state;
      events.onSignalDetectionDragEnd(signalDetection.id, time, uncertaintySecs);
    }
  };

  /**
   * Update state's is editing uncertainty
   *
   * @param isEditing
   */
  private readonly setIsEditingTimeUncertainty = (isEditing: boolean) => {
    this.setState({ isEditingTimeUncertainty: isEditing });
  };

  /**
   * Creates the left or right JSX.Element uncertainty marker
   *
   * @param initialConfiguration
   * @param uncertaintySecs
   * @param signalDetectionPosition
   * @param signalDetection
   * @param isLeftUncertaintyBar
   * @param isSplitChannelOverlayOpen
   * @returns JSX.Element or null if showUncertaintyBars is false
   */
  private readonly createUncertaintyElement = (
    initialConfiguration: WeavessTypes.Configuration,
    uncertaintySecs: number,
    signalDetectionPosition: number,
    signalDetection: WeavessTypes.PickMarker,
    isLeftUncertaintyBar: boolean,
    isSplitChannelOverlayOpen: boolean
  ): JSX.Element | null => {
    if (signalDetection.showUncertaintyBars) {
      const { displayInterval, getTimeSecsForClientX } = this.props;
      return (
        <UncertaintyMarker
          startTimeSecs={displayInterval.startTimeSecs}
          endTimeSecs={displayInterval.endTimeSecs}
          uncertaintySecs={uncertaintySecs}
          pickMarkerTimeSecs={signalDetection.timeSecs}
          pickMarkerPosition={signalDetectionPosition}
          isLeftUncertaintyBar={isLeftUncertaintyBar}
          color={signalDetection.color}
          initialConfiguration={initialConfiguration}
          getTimeSecsForClientX={getTimeSecsForClientX}
          setUncertaintySecs={this.setUncertaintyInState}
          setIsEditingTimeUncertainty={this.setIsEditingTimeUncertainty}
          isSplitChannelOverlayOpen={isSplitChannelOverlayOpen}
        />
      );
    }
    return null;
  };

  public render() {
    const {
      channelId,
      displayInterval,
      offsetSecs,
      signalDetection,
      viewableInterval,
      getClientXForTimeSecs,
      getTimeSecsForClientX,
      toggleDragIndicator,
      positionDragIndicator,
      isOnSplitChannel
    } = this.props;
    if (!signalDetection) return undefined;
    const { uncertaintySecs, isEditingTimeUncertainty } = this.state;
    const signalDetectionPosition = calculateLeftPercent(
      signalDetection.timeSecs,
      displayInterval.startTimeSecs,
      displayInterval.endTimeSecs
    );

    const { initialConfiguration } = this.props;
    const leftUncertaintyElement = this.createUncertaintyElement(
      initialConfiguration,
      uncertaintySecs,
      signalDetectionPosition,
      signalDetection,
      true,
      isOnSplitChannel
    );

    const rightUncertaintyElement = this.createUncertaintyElement(
      initialConfiguration,
      uncertaintySecs,
      signalDetectionPosition,
      signalDetection,
      false,
      isOnSplitChannel
    );

    return (
      <div
        // TODO change classname to not have Sd in the name
        className={classNames({
          'signal-detection__pick': true,
          'signal-detection__pick--editing-uncertainty': isEditingTimeUncertainty
        })}
      >
        <PickMarker
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...signalDetection}
          channelId={channelId}
          predicted={false}
          isSelected={signalDetection.isSelected}
          isDisabled={signalDetection.isDisabled}
          isSelectable
          isActionTarget={signalDetection.isActionTarget}
          startTimeSecs={displayInterval.startTimeSecs}
          endTimeSecs={displayInterval.endTimeSecs}
          viewableInterval={viewableInterval}
          offsetSecs={offsetSecs}
          isDraggable={signalDetection.isDraggable && !isOnSplitChannel}
          position={signalDetectionPosition}
          getTimeSecsForClientX={getTimeSecsForClientX}
          getClientXForTimeSecs={getClientXForTimeSecs}
          // eslint-disable-next-line react/destructuring-assignment, @typescript-eslint/unbound-method
          onClick={this.props.events?.onSignalDetectionClick}
          onContextMenu={
            // eslint-disable-next-line react/destructuring-assignment, @typescript-eslint/unbound-method
            isOnSplitChannel ? undefined : this.props.events?.onSignalDetectionContextMenu
          }
          setPickerMarkerTime={
            // eslint-disable-next-line react/destructuring-assignment
            this.props.events?.onSignalDetectionDragEnd ? this.setSignalDetectionTime : undefined
          }
          // eslint-disable-next-line react/destructuring-assignment, @typescript-eslint/unbound-method
          onDoubleClick={this.props.events?.onSignalDetectionDoubleClick}
          toggleDragIndicator={toggleDragIndicator}
          positionDragIndicator={positionDragIndicator}
        >
          {leftUncertaintyElement}
          {rightUncertaintyElement}
        </PickMarker>
      </div>
    );
  }
}
