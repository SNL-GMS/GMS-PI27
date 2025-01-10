import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  secondsToString
} from '@gms/common-util';
import type { ColumnDefinition, ImperativeContextMenuProps } from '@gms/ui-core-components';
import { Table } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu, useUiTheme } from '@gms/ui-state';
import type { RowDoubleClickedEvent } from 'ag-grid-community';
import classNames from 'classnames';
import flatten from 'lodash/flatten';
import React from 'react';

import { setFocusToWaveformDisplay } from '../utils';
import { showQcSegmentEditMenu } from './qc-segment-edit-menu';
import type { SwatchRow } from './qc-segment-utils';
import {
  getQCSegmentCategoryOrTypeString,
  getQCSegmentSwatchColor,
  getTableContainerHeight,
  SwatchCellRenderer
} from './qc-segment-utils';

/**
 * Defines the properties of a table row in {@link QcSegmentSelectionTableMenu}
 */
interface QcSegmentDetailsRow extends SwatchRow {
  channelName: string;
  startTime: number;
  endTime: number;
  category: string;
  type: string;
  stage: string;
  author: string;
  effectiveAt: number;
  rationale: string;
}

/**
 * Component props for {@link QcSegmentSelectionTableMenu}
 */
interface QcSegmentSelectionTableMenuProps {
  /** List of QC segments to be displayed by the table */
  qcSegments: QcSegment[];
}

/** Base column properties for the {@link QcSegmentSelectionTableMenu} */
const DEFAULT_COL_DEF: ColumnDefinition<QcSegmentDetailsRow, unknown, unknown, unknown, unknown> = {
  sortable: true,
  cellClass: ['monospace', 'selectable'],
  cellStyle: { textAlign: 'left' }
};

/**
 * Column definitions for the {@link QcSegmentSelectionTableMenu}
 */
const QC_SEGMENT_DETAILS_COLUMN_DEFINITIONS: ColumnDefinition<
  QcSegmentDetailsRow,
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
    width: 125
  },
  {
    headerName: 'Type',
    field: 'type',
    width: 160
  },
  {
    headerName: 'Channel name',
    field: 'channelName',
    width: 125
  },
  {
    headerName: 'Start time',
    field: 'startTime',
    width: 165,
    sort: 'asc', // Default sort based on Start Time
    valueFormatter: e =>
      secondsToString(e.data.startTime, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'End time',
    field: 'endTime',
    width: 165,
    valueFormatter: e =>
      secondsToString(e.data.endTime, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'Stage',
    field: 'stage',
    width: 125
  },
  {
    headerName: 'Author',
    field: 'author',
    width: 125
  },
  {
    headerName: 'Effective at',
    field: 'effectiveAt',
    width: 165,
    valueFormatter: e =>
      e.data.effectiveAt === -1
        ? 'TBD'
        : secondsToString(e.data.effectiveAt, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)
  },
  {
    headerName: 'Rationale',
    field: 'rationale',
    width: 300
  }
];

/**
 * @returns An array of {@link QcSegmentDetailsRow}s that can be used by AG Grid.
 */
function generateQcSegmentSelectionMenuTableRows(
  qcSegments: QcSegment[],
  uiTheme: UITheme
): QcSegmentDetailsRow[] {
  const rows = flatten(
    qcSegments.map<QcSegmentDetailsRow>(qc => {
      const { versionHistory } = qc;
      const {
        category = 'Unknown',
        startTime,
        endTime,
        createdBy,
        id,
        rationale,
        rejected,
        type = 'Unknown',
        stageId = { name: 'Unknown' }
      } = versionHistory[versionHistory.length - 1];

      const swatchColor = getQCSegmentSwatchColor(category, uiTheme, rejected);

      return {
        color: swatchColor,
        id: qc.id,
        channelName: qc.channel.name,
        startTime,
        endTime,
        category: getQCSegmentCategoryOrTypeString(category, rejected),
        type: getQCSegmentCategoryOrTypeString(type, rejected),
        stage: stageId.name,
        author: createdBy,
        effectiveAt: id.effectiveAt,
        rationale
      };
    })
  );
  if (rows.length > 0) rows[0]['first-in-table'] = true;
  return rows;
}

/**
 * Table that displays the details of a given {@link QcSegment} array.
 * For use within the QcSegmentSelectionMenu.
 */
export const QcSegmentSelectionTableMenu = React.memo(function QcSegmentSelectionTableMenu({
  qcSegments
}: QcSegmentSelectionTableMenuProps): JSX.Element {
  /**
   * Opens the double-clicked QC Segment in the edit menu.
   * Programmatically closes the {@link QcSegmentSelectionMenuTable} (this component).
   */
  const onRowDoubleClickedCallback = React.useCallback(
    (event: RowDoubleClickedEvent) => {
      const { node } = event;
      const selectedQcSegment = qcSegments.find(qc => qc.id === node.data.id);
      showQcSegmentEditMenu(event.event as MouseEvent, { qcSegment: selectedQcSegment });
    },
    [qcSegments]
  );

  const [uiTheme] = useUiTheme();

  const rowData = React.useMemo(
    () => generateQcSegmentSelectionMenuTableRows(qcSegments, uiTheme),
    [qcSegments, uiTheme]
  );

  const maxRows = 5;
  const style = getTableContainerHeight(rowData.length, maxRows);

  // Used to set focus back to Waveform Display on unmount, this is needed when a user
  // triggers the table to open but closes it by clicking off it somewhere and not selecting any qc segments
  const componentWillUnmount = React.useRef(false);

  // This is componentWillUnmount
  React.useEffect(() => {
    return () => {
      componentWillUnmount.current = true;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      // This line only evaluates to true after the componentWillUnmount happens
      if (componentWillUnmount.current) {
        setFocusToWaveformDisplay();
      }
    };
  }, []);

  if (qcSegments?.length > 0) {
    return (
      <div className={classNames('ag-theme-dark', 'qc-segment-selection-menu-table')} style={style}>
        <div className="max">
          <Table<QcSegmentDetailsRow, unknown>
            defaultColDef={DEFAULT_COL_DEF}
            columnDefs={QC_SEGMENT_DETAILS_COLUMN_DEFINITIONS}
            rowData={rowData}
            overlayNoRowsTemplate="No QC segments to display"
            getRowId={params => params.data.id}
            rowSelection="multiple"
            suppressCellFocus
            onRowDoubleClicked={onRowDoubleClickedCallback}
          />
        </div>
      </div>
    );
  }
  return undefined;
});

/**
 * Shows the {@link QcSegmentSelectionTableMenu} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link QcSegmentSelectionTableMenuProps} props
 * @param options (optional) imperative context menu options
 */
export const showQcSegmentsSelectionTableMenu = (
  event: React.MouseEvent | MouseEvent,
  props: QcSegmentSelectionTableMenuProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { qcSegments } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: <QcSegmentSelectionTableMenu qcSegments={qcSegments} />,
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
