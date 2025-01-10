import type { HistoryState } from '../../../../src/ts/app/history';
import { historyInitialState } from '../../../../src/ts/app/history';
import {
  historyEventUndoAction,
  validateEventUndoAction,
  validateEventUndoPayload
} from '../../../../src/ts/app/history/reducers/event-undo';

describe('history slice', () => {
  it('exists', () => {
    expect(validateEventUndoPayload).toBeDefined();
    expect(validateEventUndoAction).toBeDefined();
  });

  describe('validation', () => {
    it('validateEventUndoPayload', () => {
      expect(() => {
        validateEventUndoPayload({
          payload: { eventId: 'test', decrement: -1 },
          type: historyEventUndoAction.type
        });
      }).toThrow();

      expect(() => {
        validateEventUndoPayload({
          payload: { eventId: 'test', decrement: 1 },
          type: historyEventUndoAction.type
        });
      }).not.toThrow();
    });

    it('validateEventUndoAction', () => {
      const historyState: HistoryState = historyInitialState;
      expect(() => {
        validateEventUndoAction(historyState, '1');
      }).toThrow();
    });
  });
});
