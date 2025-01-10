import { render } from '@testing-library/react';
import * as React from 'react';

import {
  TableCellRenderer,
  TableCellRendererFramework
} from '../../../src/ts/components/table/table-cell-renderer';

const mockFindIndex = jest.fn(() => fn => fn({ getColId: () => 5 }));
const mockProps: any = {
  columnApi: {
    getAllDisplayedColumns: jest.fn(() => {
      return { findIndex: mockFindIndex, length: 20 };
    })
  }
};

describe('table cell renderer', () => {
  it('is defined', () => {
    expect(TableCellRenderer).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(
      <TableCellRenderer
        className="test-cell"
        heightCSS="100px"
        isNumeric={false}
        shouldCenterText
        tooltipMsg="tooltip message"
        value="cell value"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with leftChild', () => {
    const { container } = render(
      <TableCellRenderer
        className="test-cell"
        heightCSS="100px"
        isNumeric={false}
        shouldCenterText
        tooltipMsg="tooltip message"
        value="cell value"
        leftChild={<div> this is a child div</div>}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders using the TableCellRendererFramework method', () => {
    mockProps.value = '1';
    const frameworkRender = render(TableCellRendererFramework<unknown>(mockProps));
    expect(frameworkRender).toMatchSnapshot();

    mockProps.valueFormatted = 'Mock Value';
    frameworkRender.rerender(TableCellRendererFramework<unknown>(mockProps));
    expect(frameworkRender).toMatchSnapshot();
  });
});
