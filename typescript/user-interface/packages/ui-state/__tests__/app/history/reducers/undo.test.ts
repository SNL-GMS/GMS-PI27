import type { HistoryState } from '../../../../src/ts/app/history';
import { historyInitialState } from '../../../../src/ts/app/history';
import {
  historyUndoAction,
  validateUndoAction,
  validateUndoPayload
} from '../../../../src/ts/app/history/reducers/undo';

describe('history slice', () => {
  it('exists', () => {
    expect(validateUndoPayload).toBeDefined();
    expect(validateUndoAction).toBeDefined();
  });

  describe('validation', () => {
    it('validateUndoPayload', () => {
      expect(() => {
        validateUndoPayload({ payload: -1, type: historyUndoAction.type });
      }).toThrow();

      expect(() => {
        validateUndoPayload({ payload: 2, type: historyUndoAction.type });
      }).not.toThrow();
    });

    it('validateUndoAction', () => {
      let historyState: HistoryState = historyInitialState;

      // test empty history
      expect(() => {
        validateUndoAction(historyState);
      }).toThrow();

      historyState = {
        ...historyState,
        stack: [
          {
            id: 'b',
            historyId: `1`,
            label: 'label',
            description: 'desc',
            patches: [],
            inversePatches: [],
            status: 'applied',
            time: 1,
            type: 'data/updateArrivalTimeSignalDetection',
            conflictStatus: 'none',
            associatedIds: { events: {}, signalDetections: {} },
            isDeletion: false,
            isRejection: false
          }
        ]
      };
      // test bad undo position history
      expect(() => {
        validateUndoAction(historyState);
      }).toThrow();

      historyState = {
        ...historyState,
        stack: [
          {
            id: 'b',
            historyId: `1`,
            label: 'label',
            description: 'desc',
            patches: [],
            inversePatches: [],
            status: 'not applied',
            time: 1,
            type: 'data/updateArrivalTimeSignalDetection',
            conflictStatus: 'none',
            associatedIds: { events: {}, signalDetections: {} },
            isDeletion: false,
            isRejection: false
          }
        ]
      };
      // test bad undo position history
      expect(() => {
        validateUndoAction(historyState);
      }).not.toThrow();
    });
  });
});
