import { renderHook } from '@testing-library/react';

import { useDatasource } from '../../../src/ts/components/table/use-datasource';

const rows: any[] = [
  {
    hasNotificationStatusError: false,
    entry: {
      availableEntry: {
        first: 'first'
      },
      selectedEntry: 'string',
      onSelect: jest.fn()
    },
    category: 'color',
    subcategory: 'primary',
    severity: 'normal',
    message: 'message 1'
  },
  {
    hasNotificationStatusError: false,
    entry: {
      availableEntry: {
        second: 'second'
      },
      selectedEntry: 'string',
      onSelect: jest.fn()
    },
    category: 'color',
    subcategory: 'primary',
    severity: 'normal',
    message: 'message 2'
  }
];

describe('Use Data Source', () => {
  it('is exported', () => {
    expect(useDatasource).toBeDefined();
  });
  it('Returns the data source', () => {
    const { result } = renderHook(() => useDatasource(rows));
    expect(result.current).toMatchInlineSnapshot(`
      {
        "destroy": [Function],
        "getRows": [Function],
      }
    `);
  });
});
