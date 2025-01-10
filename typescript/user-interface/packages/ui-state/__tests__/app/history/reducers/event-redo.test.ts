import type { HistoryState } from '../../../../src/ts/app/history';
import { historyInitialState } from '../../../../src/ts/app/history';
import {
  historyEventRedoAction,
  validateEventRedoAction,
  validateEventRedoPayload
} from '../../../../src/ts/app/history/reducers/event-redo';

describe('history slice', () => {
  it('exists', () => {
    expect(validateEventRedoPayload).toBeDefined();
    expect(validateEventRedoAction).toBeDefined();
  });

  describe('validation', () => {
    it('validateEventRedoPayload', () => {
      expect(() => {
        validateEventRedoPayload({
          payload: { eventId: 'test', increment: -1 },
          type: historyEventRedoAction.type
        });
      }).toThrow();

      expect(() => {
        validateEventRedoPayload({
          payload: { eventId: 'test', increment: 1 },
          type: historyEventRedoAction.type
        });
      }).not.toThrow();
    });

    it('validateEventRedoAction', () => {
      const historyState: HistoryState = historyInitialState;
      expect(() => {
        validateEventRedoAction(historyState, '1');
      }).not.toThrow();
    });
  });
});
