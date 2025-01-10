import type {
  CellRendererParams,
  ColumnDefinition,
  TooltipParams,
  ValueFormatterParams,
  ValueGetterParams
} from '@gms/ui-core-components';
import { EventsColumn } from '@gms/ui-state';
import { getTextWidth } from '@gms/ui-util';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { medCellWidthPx } from '~common-ui/common/table-types';

import type { EventRow } from '../../types';
import { eventColumnDisplayStrings } from '../../types';

/**
 * Column value getter params - value is of type string
 */
export type EventValueGetterParams = ValueGetterParams<
  EventRow,
  unknown,
  string,
  CellRendererParams<EventRow, unknown, string, ICellRendererParams, IHeaderParams>,
  unknown
>;
/**
 * Returns the value getter for the active analysts array.
 *
 * @param params the table data params
 * @returns the formatted value
 */
export const activeAnalystsValueGetter = (params: EventValueGetterParams): string =>
  params.data?.activeAnalysts?.join(', ');

/**
 * Returns the formatted value for the active analysts array.
 *
 * @param params the table data params
 * @returns the formatted value
 */
export const activeAnalystsValueFormatter = (
  params: ValueFormatterParams<
    EventRow,
    unknown,
    string,
    CellRendererParams<EventRow, unknown, string, ICellRendererParams, IHeaderParams>,
    unknown
  >
): string => {
  let names = '';
  if (params !== undefined && params.data !== undefined) {
    const {
      data: { activeAnalysts },
      column
    } = params;
    const PADDING = 65;
    const colWidth = column ? column.getActualWidth() : Number.MAX_SAFE_INTEGER;

    // eslint-disable-next-line no-plusplus
    for (let i = 1; activeAnalysts && i <= activeAnalysts.length; i++) {
      names = activeAnalysts.slice(0, i).join(', ');
      const textWidth = Number(getTextWidth(names)) + PADDING;
      if (textWidth >= colWidth) {
        names = `${activeAnalysts.slice(0, Math.max(i - 1, 1)).join(', ')} +
       ${Math.min(activeAnalysts.length - 1, activeAnalysts.length + 1 - i)}`;
        break;
      }
    }
  }

  return names;
};

/**
 * Returns the tooltip value getter for the active analysts.
 */
export const activeAnalystsTooltipValueGetter = (params: TooltipParams): string => params.value;

/**
 * Defines the active analysts column definition
 */
export const activeAnalystsColumnDef: ColumnDefinition<
  EventRow,
  unknown,
  string,
  ICellRendererParams,
  IHeaderParams
> = {
  headerName: eventColumnDisplayStrings.get(EventsColumn.activeAnalysts),
  field: EventsColumn.activeAnalysts,
  headerTooltip: eventColumnDisplayStrings.get(EventsColumn.activeAnalysts),
  width: medCellWidthPx,
  valueGetter: activeAnalystsValueGetter,
  valueFormatter: activeAnalystsValueFormatter,
  tooltipValueGetter: activeAnalystsTooltipValueGetter
};
