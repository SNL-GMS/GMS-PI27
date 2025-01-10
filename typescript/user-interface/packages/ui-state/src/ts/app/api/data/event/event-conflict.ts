import type { CaseReducer } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { AssociationConflictRecord } from '../../../../types';
import type { DataState } from '../types';

const eventAssociationConflictAction = 'data/eventAssociationConflict' as const;

/**
 * The action for updating event conflict.
 */
export const eventAssociationConflict = createAction<
  { eventAssociationConflictRecord: AssociationConflictRecord },
  typeof eventAssociationConflictAction
>(eventAssociationConflictAction);

export const eventAssociationConflictReducer: CaseReducer<
  DataState,
  ReturnType<typeof eventAssociationConflict>
> = (state, action) => {
  const { eventAssociationConflictRecord } = action.payload;
  state.associationConflict = eventAssociationConflictRecord;
};
