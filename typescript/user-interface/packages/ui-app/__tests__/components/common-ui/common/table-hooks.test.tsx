import { act, renderHook } from '@testing-library/react';

import { useSyncDisplaySelection } from '~common-ui/common/table-hooks';

describe('Table hooks', () => {
  describe('useSyncDisplaySelection', () => {
    it('works if there is a table ref api', async () => {
      const tableRef = {
        current: {
          api: {
            forEachNode: jest.fn()
          } as any
        }
      } as any;
      await act(() => {
        renderHook(() => useSyncDisplaySelection(tableRef, ['TEST', 'TEST2'], []));
      });
      expect(tableRef.current.api.forEachNode).toHaveBeenCalled();
    });
  });
});
