import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';

import { calculateLeftPercent } from '../../../../../../../../utils';
import { PickMarker } from '../../../../../../../markers';
import type { PredictedPhasesProps, PredictedPhasesState } from './types';

export class PredictedPhases extends React.PureComponent<
  PredictedPhasesProps,
  PredictedPhasesState
> {
  /**
   * A memoized function for creating the predicted phases.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param props the predicted phase props
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreatePredictivePhaseElements: (
    props: PredictedPhasesProps
  ) => JSX.Element[];

  /**
   * Constructor
   *
   * @param props Waveform props as PredictedPhasesProps
   */
  public constructor(props: PredictedPhasesProps) {
    super(props);
    this.memoizedCreatePredictivePhaseElements = memoizeOne(
      PredictedPhases.createPredictivePhaseElements,
      /* tell memoize to use a deep comparison for complex objects */
      isEqual
    );
    this.state = {};
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  public render(): JSX.Element {
    return <>{this.memoizedCreatePredictivePhaseElements(this.props)}</>;
  }

  /**
   * Creates Predictive phase components
   *
   * @param props
   * @returns an array of predictive phase elements as JSX.Element
   */
  // eslint-disable-next-line react/sort-comp
  private static readonly createPredictivePhaseElements = (
    props: PredictedPhasesProps
  ): JSX.Element[] => {
    if (!props.predictedPhases) return [];

    return props.predictedPhases
      .filter(predictedPhase => predictedPhase)
      .map(predictivePhase => {
        const predictivePhasePosition = calculateLeftPercent(
          predictivePhase.timeSecs,
          props.displayInterval.startTimeSecs,
          props.displayInterval.endTimeSecs
        );

        return (
          <PickMarker
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...predictivePhase}
            key={predictivePhase.id}
            channelId={props.channelId}
            predicted
            isSelected={predictivePhase.isSelected}
            isSelectable={false}
            isActionTarget={false}
            isDraggable={false}
            startTimeSecs={props.displayInterval.startTimeSecs}
            endTimeSecs={props.displayInterval.endTimeSecs}
            viewableInterval={props.viewableInterval}
            offsetSecs={props.offsetSecs}
            position={predictivePhasePosition}
            /* eslint-disable @typescript-eslint/unbound-method */
            getTimeSecsForClientX={props.getTimeSecsForClientX}
            getClientXForTimeSecs={props.getClientXForTimeSecs}
            onClick={
              props.events && props.events.onPredictivePhaseClick
                ? props.events.onPredictivePhaseClick
                : undefined
            }
            onContextMenu={
              props.events && props.events.onPredictivePhaseContextMenu
                ? props.events.onPredictivePhaseContextMenu
                : undefined
            }
            toggleDragIndicator={props.toggleDragIndicator}
            positionDragIndicator={props.positionDragIndicator}
            /* eslint-enable @typescript-eslint/unbound-method */
          />
        );
      });
  };
}
