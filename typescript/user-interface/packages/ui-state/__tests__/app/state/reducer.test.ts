import { resetAppState } from '../../../src/ts/app/state/actions';
import { reducer } from '../../../src/ts/app/state/reducer';
import { getStore } from '../../../src/ts/app/store';

describe('state reducer', () => {
  describe('reducer', () => {
    it('should reset the app', () => {
      const store: any = getStore();
      expect(reducer(store.getState().app, resetAppState)).toMatchSnapshot();
    });
  });
});
