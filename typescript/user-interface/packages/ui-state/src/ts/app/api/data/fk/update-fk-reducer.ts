import type { FkTypes } from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';
import type { CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { DataState } from '../types';

/**
 * The action for updating an FK
 */
export const updateFk = createAction<
  {
    fkChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra>;
    signalDetectionId: string;
  },
  'data/updateFk'
>('data/updateFk');

/**
 * Adds a computed FkSpectra to state, also updates the corresponding signal detection's
 * channel segment descriptor
 *
 * @param state current redux state of the slice
 * @param action action being invoked
 */
export const updateFkReducer: CaseReducer<DataState, ReturnType<typeof updateFk>> = (
  state,
  action
) => {
  const { fkChannelSegment, signalDetectionId } = action.payload;
  const fkChannelSegmentId = ChannelSegmentTypes.Util.createChannelSegmentString(
    fkChannelSegment.id
  );
  state.fkChannelSegments[fkChannelSegmentId] = fkChannelSegment;
  state.signalDetections[signalDetectionId]._uiFkChannelSegmentDescriptorId = fkChannelSegment.id;
};

/**
 * The action for updating an FK thumbnail
 */
export const updateFkThumbnail = createAction<
  {
    fkSpectra: FkTypes.FkSpectra;
    signalDetectionId: string;
  },
  'data/updateFkThumbnail'
>('data/updateFkThumbnail');

/**
 * Updating/inserting an fkFrequencyThumbnail entry to redux state
 *
 * @param state current redux state of the slice
 * @param action action being invoked
 */
export const updateFkThumbnailReducer: CaseReducer<
  DataState,
  ReturnType<typeof updateFkThumbnail>
> = (state, action) => {
  const { fkSpectra, signalDetectionId } = action.payload;

  if (!fkSpectra || !fkSpectra.configuration) return;

  // Create entry if not exists
  if (!state.fkFrequencyThumbnails[signalDetectionId]) {
    state.fkFrequencyThumbnails[signalDetectionId] = [];
  }

  // Find the index of thumbnail to replace, else add it
  const frequencyBand: FkTypes.FkFrequencyRange = {
    lowFrequencyHz: fkSpectra.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz,
    highFrequencyHz: fkSpectra.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz
  };

  const frequencyFk: FkTypes.FkFrequencyThumbnail = {
    fkSpectra,
    frequencyBand
  };

  const index = state.fkFrequencyThumbnails[signalDetectionId].findIndex(
    thumbnail =>
      thumbnail.frequencyBand.lowFrequencyHz === frequencyBand.lowFrequencyHz &&
      thumbnail.frequencyBand.highFrequencyHz === frequencyBand.highFrequencyHz
  );

  // replace or insert
  if (index >= 0) {
    state.fkFrequencyThumbnails[signalDetectionId][index] = frequencyFk;
  } else {
    state.fkFrequencyThumbnails[signalDetectionId].push(frequencyFk);
  }
};
