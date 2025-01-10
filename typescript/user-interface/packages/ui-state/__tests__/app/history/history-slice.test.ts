import {
  historyActions,
  historyInitialState,
  historySlice
} from '../../../src/ts/app/history/history-slice';

describe('history slice', () => {
  it('exists', () => {
    expect(historySlice).toBeDefined();
    expect(historyActions).toBeDefined();
    expect(historyInitialState).toMatchInlineSnapshot(`
      {
        "events": {},
        "mode": "global",
        "signalDetections": {},
        "stack": [],
      }
    `);
  });
});
