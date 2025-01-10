import { ChannelSegmentTypes, SignalDetectionTypes } from '@gms/common-model';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import type { DataState } from '../types';

export const revertFkAction = 'data/revertFkAction' as const;

/**
 * Action for reverting FK to last accepted
 */
export const revertFk = createAction<
  {
    readonly signalDetectionId: string;
  },
  typeof revertFkAction
>(revertFkAction);

/**
 * Returns true if the action is of type {@link revertFkAction}.
 */
export const isRevertFkAction = (action: AnyAction): action is ReturnType<typeof revertFk> =>
  action.type === revertFkAction;

/**
 * Reverts FK to previous accepted fk
 *
 * @param state the current redux state
 * @param action the action being invoked
 */
export const revertFkReducer: CaseReducer<DataState, ReturnType<typeof revertFk>> = (
  state,
  action
) => {
  const { signalDetectionId } = action.payload;
  const sd = state.signalDetections[signalDetectionId];

  if (sd) {
    const currentSdHypothesis: WritableDraft<SignalDetectionTypes.SignalDetectionHypothesis> =
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses);

    const azimuthFm: WritableDraft<SignalDetectionTypes.AzimuthFeatureMeasurement | undefined> =
      SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );

    const slownessFm: WritableDraft<SignalDetectionTypes.SlownessFeatureMeasurement | undefined> =
      SignalDetectionTypes.Util.findSlownessFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );

    // Reset the _uiFkChannelSegmentDescriptorId to SD's azimuth
    // feature measurement's measured channel segment ID points to a FK channel segment
    if (
      azimuthFm?.measuredChannelSegment &&
      slownessFm?.measuredChannelSegment &&
      state.fkChannelSegments[
        ChannelSegmentTypes.Util.createChannelSegmentString(azimuthFm.measuredChannelSegment.id)
      ]
    ) {
      sd._uiFkChannelSegmentDescriptorId = azimuthFm.measuredChannelSegment.id;
    }

    // Reset the _uiFkBeamChannelSegmentDescriptorId to SD's arrival time
    // feature measurement's measured channel segment ID points to a FK beam channel segment
    const arrivalTimeFm: WritableDraft<
      SignalDetectionTypes.ArrivalTimeFeatureMeasurement | undefined
    > = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
      currentSdHypothesis.featureMeasurements
    );

    if (arrivalTimeFm?.measuredChannelSegment) {
      sd._uiFkBeamChannelSegmentDescriptorId = arrivalTimeFm.measuredChannelSegment.id;
    }
  }
};
