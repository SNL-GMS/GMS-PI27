import type { FkTypes } from '@gms/common-model';
import { ChannelSegmentTypes, SignalDetectionTypes } from '@gms/common-model';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';
import type { AnyAction, CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';

import { createWorkingHypothesisAndUpdateAssociations } from '../event/create-working-hypothesis';
import type { DataState } from '../types';

export const acceptFkAction = 'data/acceptFkAction' as const;

/**
 * Action for accepting FKs
 */
export const acceptFk = createAction<
  {
    readonly username: string;
    readonly stageId: IntervalId;
    readonly openIntervalName: string;
    readonly sdIdsAndMeasuredValues: FkTypes.FkMeasuredValues[];
  },
  typeof acceptFkAction
>(acceptFkAction);

/**
 * Returns true if the action is of type {@link acceptFkAction}.
 */
export const isAcceptFkAction = (action: AnyAction): action is ReturnType<typeof acceptFk> =>
  action.type === acceptFkAction;

/**
 * Given a signal detection, applies its corresponding Fk Channel Segment to the azimuth and
 * slowness feature measurements.
 *
 * @param state the current redux state
 * @param action the action being invoked
 */
export const acceptFkReducer: CaseReducer<DataState, ReturnType<typeof acceptFk>> = (
  state,
  action
) => {
  const { username, stageId, openIntervalName, sdIdsAndMeasuredValues } = action.payload;

  const signalDetectionIds: string[] = sdIdsAndMeasuredValues.map(obj => obj.signalDetectionId);

  // create any necessary working hypothesis
  createWorkingHypothesisAndUpdateAssociations(state, {
    username,
    openIntervalName,
    stageId,
    eventIds: [],
    signalDetectionIds
  });

  // i. For Each Signal Detection
  sdIdsAndMeasuredValues.forEach(obj => {
    const sd: WritableDraft<SignalDetectionTypes.SignalDetection> =
      state.signalDetections[obj.signalDetectionId];
    // Get fkChannelSegment for this SD
    const currentSdHypothesis: WritableDraft<SignalDetectionTypes.SignalDetectionHypothesis> =
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses);

    if (sd._uiFkChannelSegmentDescriptorId) {
      const azimuthFeatureMeasurement: WritableDraft<
        SignalDetectionTypes.AzimuthFeatureMeasurement | undefined
      > = SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );
      // update with analyst selected measured azimuth value if it exists
      if (obj.measuredValues.azimuth && azimuthFeatureMeasurement)
        azimuthFeatureMeasurement.measurementValue.measuredValue.value = obj.measuredValues.azimuth;

      const slownessFeatureMeasurement: WritableDraft<
        SignalDetectionTypes.SlownessFeatureMeasurement | undefined
      > = SignalDetectionTypes.Util.findSlownessFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );

      // update with analyst selected measured slowness value if it exists
      if (obj.measuredValues.slowness && slownessFeatureMeasurement)
        slownessFeatureMeasurement.measurementValue.measuredValue.value =
          obj.measuredValues.slowness;

      // Find the corresponding ChannelSegment using ChannelSegmentDescriptor
      if (azimuthFeatureMeasurement && slownessFeatureMeasurement) {
        // Get the appropriate FKSpectra out of State
        const fkSpectraCS =
          state.fkChannelSegments[
            ChannelSegmentTypes.Util.createChannelSegmentString(sd._uiFkChannelSegmentDescriptorId)
          ];

        azimuthFeatureMeasurement.measuredChannelSegment = { id: fkSpectraCS.id };
        if (azimuthFeatureMeasurement.analysisWaveform?.waveform?.id) {
          azimuthFeatureMeasurement.analysisWaveform.waveform.id = fkSpectraCS.id;
        }
        azimuthFeatureMeasurement.channel = fkSpectraCS.id.channel;

        slownessFeatureMeasurement.measuredChannelSegment = { id: fkSpectraCS.id };
        if (slownessFeatureMeasurement.analysisWaveform?.waveform?.id) {
          slownessFeatureMeasurement.analysisWaveform.waveform.id = fkSpectraCS.id;
        }
        slownessFeatureMeasurement.channel = fkSpectraCS.id.channel;
      }
    }

    // TODO: Populate arrivalTimeFm.measuredChannelSegment.id = FkBeam.id
  });
};
