import {
  isUndoRedoAction,
  undoRedo,
  undoRedoAction,
  undoRedoReducer
} from '../../../../src/ts/app/history/reducers/undo-redo';

describe('history slice', () => {
  it('exists', () => {
    expect(isUndoRedoAction).toBeDefined();
    expect(undoRedo).toBeDefined();
    expect(undoRedoAction).toBeDefined();
    expect(undoRedoReducer).toBeDefined();
  });

  describe('validation', () => {
    it('isUndoRedoAction', () => {
      expect(isUndoRedoAction({ type: 'unknown' })).toBeFalsy();

      expect(isUndoRedoAction({ type: undoRedoAction })).toBeTruthy();

      expect(isUndoRedoAction(undoRedo)).toBeTruthy();
    });
  });
});
