import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { CellRendererParams, Row } from '@gms/ui-core-components';
import { getColumnPosition, TableCellRenderer } from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import React from 'react';

export interface UnsavedChangesRow extends Row {
  unsavedChanges: boolean;
}

export type DirtyDotCellRendererParams = CellRendererParams<
  UnsavedChangesRow,
  unknown,
  boolean,
  ICellRendererParams,
  IHeaderParams
>;

/**
 * Cell renderer to render the dirty dot column
 */
export function DirtyDotCellRenderer(props: DirtyDotCellRendererParams) {
  const { data } = props;
  return (
    <TableCellRenderer
      data-col-position={getColumnPosition<UnsavedChangesRow>(props)}
      isNumeric={false}
      tooltipMsg={data.unsavedChanges ? 'Unsaved Changes' : 'No Unsaved Changes'}
    >
      {data.unsavedChanges && <Icon icon={IconNames.Asterisk} />}
    </TableCellRenderer>
  );
}
