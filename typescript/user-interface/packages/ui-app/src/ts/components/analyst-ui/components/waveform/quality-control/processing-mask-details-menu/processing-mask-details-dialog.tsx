import { Button, Classes } from '@blueprintjs/core';
import type { ProcessingMask } from '@gms/common-model/lib/channel-segment/types';
import type { QcSegment, QcSegmentVersion } from '@gms/common-model/lib/qc-segment';
import { QcSegmentCategory, QcSegmentType } from '@gms/common-model/lib/qc-segment';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  humanReadable,
  secondsToString
} from '@gms/common-util';
import type { ColumnDefinition } from '@gms/ui-core-components';
import { hideImperativeContextMenu, Table } from '@gms/ui-core-components';
import { useUiTheme } from '@gms/ui-state';
import type { RowDoubleClickedEvent } from 'ag-grid-community';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import React from 'react';

import { showQcSegmentEditMenu } from '../qc-segment-edit-menu';
import type { SwatchRow } from '../qc-segment-utils';
import {
  getQCSegmentSwatchColor,
  getTableContainerHeight,
  SwatchCellRenderer
} from '../qc-segment-utils';

interface QCSegmentInputRow extends SwatchRow {
  startTime: number;
  endTime: number;
  category: string;
  type: string;
  channelName: string;
}

const DEFAULT_QC_SEGMENT_INPUTS_COL_DEF: ColumnDefinition<
  QCSegmentInputRow,
  unknown,
  unknown,
  unknown,
  unknown
> = {
  sortable: true,
  cellClass: 'monospace',
  cellStyle: { textAlign: 'left' }
};

/**
 * Column definitions for the overlapping mask table.
 */
const QC_SEGMENT_INPUTS_COLUMN_DEFINITIONS: ColumnDefinition<
  QCSegmentInputRow,
  unknown,
  unknown,
  unknown,
  unknown
>[] = [
  {
    headerName: '', // No header text for the swatch
    field: 'color',
    width: 30,
    sortable: false,
    cellRenderer: SwatchCellRenderer,
    cellStyle: { paddingLeft: '0px', paddingRight: '0px' } // Allow the swatch to fully fill the cell
  },
  {
    headerName: 'Category',
    field: 'category',
    width: 145,
    valueFormatter: e => humanReadable(QcSegmentCategory[e.data.category] ?? 'N/A')
  },
  {
    headerName: 'Type',
    field: 'type',
    width: 130,
    valueFormatter: e => humanReadable(QcSegmentType[e.data.type] ?? 'N/A')
  },
  {
    headerName: 'Channel name',
    field: 'channelName',
    width: 125
  },
  {
    headerName: 'Start time',
    field: 'startTime',
    width: 210,
    sort: 'asc', // Default sort based on Start Time
    valueFormatter: e =>
      secondsToString(e.data.startTime, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'End time',
    field: 'endTime',
    width: 210,
    valueFormatter: e =>
      secondsToString(e.data.endTime, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  }
];

/**
 * build the qc segment input row
 */
const useQCSegmentInputRows = (
  segments: QcSegmentVersion[],
  uiTheme: UITheme
): QCSegmentInputRow[] => {
  return React.useMemo(
    () =>
      sortBy(segments, s => s.startTime).map<QCSegmentInputRow>(segment => ({
        id: segment.id?.parentQcSegmentId,
        color: getQCSegmentSwatchColor(segment.category || 'Unknown', uiTheme, false),
        category: segment.category || '',
        type: segment.type || '',
        startTime: segment.startTime,
        endTime: segment.endTime,
        channelName: segment.channels?.at(0)?.name || ''
      })),
    [segments, uiTheme]
  );
};

export interface ProcessingMaskDetailsDialogProps {
  processingMask: ProcessingMask;
  qcSegments: QcSegment[];
}

/**
 * A dialog for displaying processing mask details
 */
export function ProcessingMaskDetailsDialog({
  processingMask,
  qcSegments
}: ProcessingMaskDetailsDialogProps): JSX.Element {
  const [uiTheme] = useUiTheme();

  const rows = useQCSegmentInputRows(processingMask.maskedQcSegmentVersions, uiTheme);

  const onRowDoubleClickedCallback = React.useCallback(
    (event: RowDoubleClickedEvent) => {
      const { node } = event;

      const selectedQcSegment = qcSegments.find(qc => qc.id === node.data.id);
      showQcSegmentEditMenu(event.event as MouseEvent, { qcSegment: selectedQcSegment });
    },
    [qcSegments]
  );

  const maxRows = 5;
  const tableStyle = getTableContainerHeight(rows.length, maxRows);

  return (
    <div className={classNames('form', 'processing-mask-form')}>
      <div className="form__header">
        <div>Processing Mask</div>
        <div className="form__header-decoration">
          <div>
            <div
              className="processing-mask-swatch"
              style={{ backgroundColor: uiTheme.colors.qcMaskColors.processingMask }}
            />
          </div>
        </div>
      </div>
      <div className="form">
        <div className="form-content">
          <div className="form-label">Processing Operation</div>
          <div className="form-value form-value--uneditable monospace" title="">
            {humanReadable(processingMask.processingOperation)}
          </div>
          <div className="form-label">Channel name</div>
          <div className="form-value monospace" title="">
            <div className="form__text--wrap">{processingMask.appliedToRawChannel.name}</div>
          </div>
          <div className="form-label">Start time</div>
          <div className="form-value form-value--uneditable monospace" title="">
            {secondsToString(
              processingMask.startTime,
              DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
            )}
          </div>
          <div className="form-label">End time</div>
          <div className="form-value form-value form-value--time monospace" title="">
            {secondsToString(
              processingMask.endTime,
              DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
            )}
          </div>
          <div className="form-label">Effective at</div>
          <div className="form-value form-value--uneditable monospace" title="">
            {secondsToString(
              processingMask.effectiveAt,
              DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
            )}
          </div>
          <div className={classNames('form-label', 'multi-column-label')}>QC segment inputs:</div>
          <div
            className={classNames('ag-theme-dark', 'processing-mask-form-input-table')}
            style={tableStyle}
          >
            <div className="max">
              <Table
                defaultColDef={DEFAULT_QC_SEGMENT_INPUTS_COL_DEF}
                columnDefs={QC_SEGMENT_INPUTS_COLUMN_DEFINITIONS}
                getRowId={node => node.data.id}
                rowSelection="single"
                rowData={rows}
                onRowDoubleClicked={onRowDoubleClickedCallback}
              />
            </div>
          </div>
          <div />
          <div className="form__buttons">
            <div className="form__buttons--right">
              <Button type="submit" className="form__button" onClick={hideImperativeContextMenu}>
                <span className={Classes.BUTTON_TEXT}>Close</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
