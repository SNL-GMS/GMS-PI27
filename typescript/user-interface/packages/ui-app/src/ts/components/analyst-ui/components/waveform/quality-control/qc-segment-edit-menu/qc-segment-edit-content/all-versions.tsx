import type { QcSegmentVersion } from '@gms/common-model/lib/qc-segment';
import { Table } from '@gms/ui-core-components';
import classNames from 'classnames';
import React from 'react';

import { DEFAULT_MASK_HISTORY_COL_DEF, MASK_HISTORY_COLUMN_DEFINITIONS } from '../../constants';
import { getQCSegmentCategoryOrTypeString } from '../../qc-segment-utils';
import type { QcMaskHistoryRow } from '../../types';

interface AllVersionsTableProps {
  versions: QcSegmentVersion[];
}

/**
 * Produces a list of {@link QcMaskHistoryRow} objects, for use in {@link AllVersionsTable}
 */
export const generateSegmentHistoryTableRows = (
  versionHistory: QcSegmentVersion[]
): QcMaskHistoryRow[] => {
  const rows = versionHistory.map<QcMaskHistoryRow>((version, index) => ({
    id: index.toString(),
    category: getQCSegmentCategoryOrTypeString(version.category ?? 'Unknown', version.rejected),
    type: getQCSegmentCategoryOrTypeString(version.type ?? 'Unknown', version.rejected),
    channelName: version.channels.map(channel => channel.name),
    startTime: version.startTime,
    endTime: version.endTime,
    stage: version.stageId?.name || 'Unknown',
    author: version.createdBy,
    effectiveAt: version.id.effectiveAt,
    rejected: version.rejected ? 'True' : 'False',
    rationale: version.rationale
  }));
  rows[rows.length - 1]['first-in-table'] = true;
  return rows;
};

/**
 * Produces a table showing the QC Segment version history.
 */
export function AllVersionsTable({ versions }: AllVersionsTableProps): JSX.Element {
  const rowClassRules: {
    'qc-segment-versions-table__row--first-in-table': (params: { data }) => boolean;
  } = {
    'qc-segment-versions-table__row--first-in-table': (params: { data }) =>
      params.data['first-in-table']
  };

  return (
    <div className={classNames('ag-theme-dark', 'qc-segment-form-details-versions-table')}>
      <div className="max">
        <Table
          defaultColDef={DEFAULT_MASK_HISTORY_COL_DEF}
          columnDefs={MASK_HISTORY_COLUMN_DEFINITIONS}
          getRowId={node => node.data.id}
          rowSelection="single"
          rowData={generateSegmentHistoryTableRows(versions)}
          rowClassRules={rowClassRules}
        />
      </div>
    </div>
  );
}
