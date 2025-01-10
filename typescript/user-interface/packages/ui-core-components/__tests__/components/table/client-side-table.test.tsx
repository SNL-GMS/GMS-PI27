/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import * as React from 'react';

import type { ClientSideTableProps } from '../../../src/ts/components/table/client-side-table';
import { ClientSideTable } from '../../../src/ts/components/table/client-side-table';
import type { ColumnDefinition, Row } from '../../../src/ts/ui-core-components';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

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

describe('Client Side Table', () => {
  const clientSideTableProps: ClientSideTableProps<RowType, any> = {
    defaultColDef: undefined,
    onCellClicked: jest.fn(),
    onCellContextMenu: jest.fn(),
    onRowSelected: jest.fn(),
    columnDefs: columnDefs as any,
    rowData: generateTableRows()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('is exported', () => {
    expect(ClientSideTable).toBeDefined();
  });
  it('Renders', () => {
    const result = render(<ClientSideTable {...clientSideTableProps} />);
    expect(result.container).toMatchSnapshot();
  });

  it('can update', () => {
    const result = render(<ClientSideTable {...clientSideTableProps} />);
    columnDefs.push({
      headerName: 'test2',
      field: 'test2',
      headerTooltip: 'test2',
      width: 10,
      sort: 'asc'
    });
    result.rerender(<ClientSideTable columnDefs={columnDefs} />);
    expect(result.container).toMatchSnapshot();
  });
});
