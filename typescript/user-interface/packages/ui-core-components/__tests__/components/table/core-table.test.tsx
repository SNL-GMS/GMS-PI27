/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import * as React from 'react';
import { act } from 'react-test-renderer';

import type { CoreTableProps } from '../../../src/ts/components/table/core-table';
import { CoreTable } from '../../../src/ts/components/table/core-table';
import type { ColumnDefinition, Row } from '../../../src/ts/ui-core-components';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

jest.mock('ag-grid-react', () => {
  const actual = jest.requireActual('ag-grid-react');

  function AgGridReact(props: any) {
    // eslint-disable-next-line react/destructuring-assignment
    props.onGridReady({
      api: {
        getModel: jest.fn(() => {
          return { getType: jest.fn(() => 'infinite') };
        }),
        forEachNode: jest.fn(fn => fn({})),
        refreshCells: jest.fn(),
        destroy: jest.fn(),
        setDatasource: jest.fn(),
        purgeInfiniteCache: jest.fn(),
        getRenderedNodes: jest.fn(() => {
          return [{}];
        })
      },
      columnApi: {}
    });
    // eslint-disable-next-line react/destructuring-assignment
    props.onColumnMoved({});
    return <div />;
  }

  return { ...actual, AgGridReact };
});

interface RowType extends Row {
  versionId: number;
  color: string;
  category: string;
  type: string;
  startTime: number;
  endTime: number;
  Ids: number[];
  rationale: string;
}

const generateTableRows = () => {
  const rows: RowType[] = [
    {
      id: '1',
      versionId: 1,
      color: 'RED',
      category: 'normal',
      type: 'info',
      startTime: 1000,
      endTime: 2000,
      Ids: [1, 2],
      rationale: 'user'
    },
    {
      id: '2',
      versionId: 1,
      color: 'GREEN',
      category: 'normal',
      type: 'info',
      startTime: 2000,
      endTime: 3000,
      Ids: [1, 2],
      rationale: 'user'
    }
  ];
  rows[0]['first-in-table'] = true;
  return rows;
};

const columns: any[] = [
  {
    headerName: 'test',
    field: 'test',
    headerTooltip: 'test',
    width: 10
  },
  {
    headerName: 'test2',
    field: 'test2',
    headerTooltip: 'test2',
    width: 10,
    sort: 'asc'
  }
];

const columnDefs: ColumnDefinition<RowType, unknown, unknown, unknown, unknown>[] = [...columns];
describe('Core Table', () => {
  const onRowClicked = jest.fn();
  const onCellClicked = jest.fn();
  const onCellContextMenu = jest.fn();
  const onRowSelected = jest.fn();
  const onColumnMoved = jest.fn();
  const tableProps: CoreTableProps<RowType, any> = {
    defaultColDef: undefined,
    onRowClicked,
    onCellClicked,
    onCellContextMenu,
    onRowSelected,
    onColumnMoved,
    columnDefs: columnDefs as any,
    rowData: generateTableRows(),
    debug: true
  };

  it('is exported', () => {
    expect(CoreTable).toBeDefined();
  });
  it('Renders', async () => {
    let result;
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      result = await render(<CoreTable {...tableProps} />);
    });
    expect(result.container).toMatchSnapshot();
  });

  it('can handle rerenders with new props', () => {
    const result = render(<CoreTable {...tableProps} />);
    columnDefs.push({
      headerName: 'test3',
      field: 'test3',
      headerTooltip: 'test3',
      width: 10
    });
    result.rerender(<CoreTable columnDefs={columnDefs} />);
    expect(result.container).toMatchSnapshot();
  });
});
