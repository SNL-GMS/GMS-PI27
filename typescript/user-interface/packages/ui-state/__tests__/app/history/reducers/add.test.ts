import type { HistoryState } from '../../../../src/ts/app/history';
import { historyInitialState } from '../../../../src/ts/app/history';
import { maxHistory } from '../../../../src/ts/app/history/constants';
import { validateAddAction } from '../../../../src/ts/app/history/reducers/add';

describe('history slice', () => {
  it('exists', () => {
    expect(validateAddAction).toBeDefined();
  });

  describe('validation', () => {
    it('validateAddAction', () => {
      let historyState: HistoryState = historyInitialState;

      // test empty history
      expect(() => {
        validateAddAction(historyState);
      }).toThrow();

      // test case were the history was not applied
      historyState = {
        ...historyState,
        stack: [
          {
            id: 'c',
            historyId: `111111`,
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
      expect(() => {
        validateAddAction(historyState);
      }).toThrow();

      // test position and stack greater than max allowed
      historyState = {
        ...historyState,
        stack: [...Array(maxHistory + 2).keys()].map(v => ({
          id: 'c',
          historyId: `${v}`,
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
        }))
      };
      expect(() => {
        validateAddAction(historyState);
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
            isDeletion: true,
            isRejection: false
          }
        ]
      };

      expect(() => {
        validateAddAction(historyState);
      }).not.toThrow();
    });
  });
});
