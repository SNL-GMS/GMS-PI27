import { ArrayUtil } from '@gms/common-model';
import { defaultTo, isNumber, setDecimalPrecision } from '@gms/common-util';
import type {
  AgGridReact,
  CellRendererParams,
  Row,
  RowNode,
  ValueFormatterParams
} from '@gms/ui-core-components';
import { EventFilterDropdownOptions, EventsColumn } from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import { isHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import type { ColumnState, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import Immutable from 'immutable';

import { messageConfig } from '~analyst-ui/config/message-config';

import { userPreferences } from '../config/user-preferences';
import { INVALID_CELL_TEXT } from './table-types';

const logger = UILogger.create('GMS_TABLE_UTIL', process.env.GMS_TABLE_UTIL);

/**
 * Returns the height of a row, based on the user preferences, plus a border.
 * This helps get around a linter bug that doesn't see types for values in preferences
 */
export const getRowHeightWithBorder: () => number = () => {
  const defaultBorderSize = 4;
  const rowHeight: number = userPreferences.tableRowHeightPx;
  return rowHeight + defaultBorderSize;
};

/**
 * Returns the height of a row, based on the user preferences, plus a border.
 * This helps get around a linter bug that doesn't see types for values in preferences
 */
export const getHeaderHeight: () => number = () => {
  const extraHeight = 12;
  const rowHeight: number = userPreferences.tableHeaderHeightPx;
  return rowHeight * 2 + extraHeight;
};

/**
 * Returns the height of a multi row header.
 * This helps get around a linter bug that doesn't see types for values in preferences
 */
export const getMultiLineHeaderHeight: (numLines: number) => number = (numLines: number) => {
  const extraHeight = 12;
  const rowHeight: number = userPreferences.tableHeaderHeightPx;
  return rowHeight * numLines + extraHeight;
};

/**
 * This function allows our tables to correctly sort columns that hold numeric values in strings
 *
 * @param valueA The first value in the cells to be compared. Typically sorts are done on these values only.
 * @param valueB The second value in the cells to be compared. Typically sorts are done on these values only.
 */
export function numericStringComparator(valueA: string, valueB: string): number {
  const adjustedA =
    !valueA || valueA === INVALID_CELL_TEXT || Number.isNaN(parseFloat(valueA))
      ? -Number.MAX_VALUE
      : parseFloat(valueA);
  const adjustedB =
    !valueB || valueB === INVALID_CELL_TEXT || Number.isNaN(parseFloat(valueB))
      ? -Number.MAX_VALUE
      : parseFloat(valueB);
  if (adjustedA === adjustedB) return 0;
  return adjustedA > adjustedB ? 1 : -1;
}

/**
 * This function allows our tables to correctly sort columns without caring about case
 *
 * @param valueA The first value in the cells to be compared. Typically sorts are done on these values only.
 * @param valueB The second value in the cells to be compared. Typically sorts are done on these values only.
 */
export function caseInsensitiveComparator(valueA: string, valueB: string): number {
  return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
}

/**
 * This function allows our tables to correctly sort columns that format values down to a single decimal place
 *
 * @param valueA The first value in the cells to be compared. Typically sorts are done on these values only.
 * @param valueB The second value in the cells to be compared. Typically sorts are done on these values only.
 */
export function singleDecimalComparator(valueA: number, valueB: number): number {
  const adjustedA = setDecimalPrecision(valueA, 1);
  const adjustedB = setDecimalPrecision(valueB, 1);
  if (adjustedA === adjustedB) return 0;
  return adjustedA > adjustedB ? 1 : -1;
}

/**
 * Returns @param num with a maximum of three decimal places, rounded
 * to be displayed in tables
 * Returns invalidCellText if passed null or undefined (which is currently 'Unknown')
 *
 * @param num
 * @returns the num maximum of three decimal places, rounded, as a string
 */
export function formatNumberForDisplayMaxThreeDecimalPlaces(num: number): string {
  if (!num && num !== 0) return messageConfig.invalidCellText;
  return parseFloat(num.toFixed(3)).toString();
}

/**
 * Returns @param num with exactly three decimal places, rounded,
 * will pad zeroes as decimal places. Warning: the resulting number's formatting does not take into consideration significant figures,
 * nor do any trailing zeroes imply that any number of significant figures are present. This is purely decorative as per UX guidance
 * to be displayed in tables
 * Returns invalidCellText if passed null or undefined (which is currently 'Unknown')
 *
 * @param num
 * @returns the num with exactly three decimal places
 */
export function formatNumberForDisplayFixedThreeDecimalPlaces(num: number | undefined): string {
  return defaultTo(setDecimalPrecision(num, 3), messageConfig.invalidCellText);
}

/**
 * Takes a string input, and makes sure there is something to display
 * If there is nothing, returns invalidCellText, which is currently: 'Unknown'
 * If there is text, returns the text unchanged
 *
 * @param text
 */
export function getTableCellStringValue(text: string | null | undefined): string {
  return defaultTo(text, messageConfig.invalidCellText);
}

/**
 * Given a row node, updates selection to match the provided boolean {@param selected}
 *
 * @param rowNode
 * @param selected
 */
export function setRowNodeSelection(rowNode: RowNode, selected: boolean): RowNode {
  rowNode.setSelected(selected);
  return rowNode;
}

/**
 * Cycles through all rows in the table and updates their row selection attribute
 * Sets rowSelection to true if their row id is in {@param selectedSdIds}, false otherwise
 *
 * @param tableRef
 * @param selectedSdIds
 */
export function updateRowSelection(
  /** Reference to AG Grid table */
  tableRef: React.MutableRefObject<AgGridReact | null>,
  /** List of Ids that should be marked as selected */
  selectedIds: string[]
): React.MutableRefObject<AgGridReact | null> {
  tableRef?.current?.api?.forEachNode(node =>
    setRowNodeSelection(node, selectedIds.includes(node.id ?? ''))
  );
  return tableRef;
}

/**
 * Takes a column definition {@link Immutable.Map} and converts it back to a {@link Record}.
 */
export const convertMapToObject = (
  columnArguments: Immutable.Map<string, boolean>
): Record<string, boolean> => {
  const newObject: Record<string, boolean> = {} as Record<string, boolean>;
  columnArguments.forEach((value: boolean, key: string) => {
    newObject[key] = value;
  });

  return newObject;
};

/**
 * Format a given parameter of type number with given decimal precision.
 *
 * @param params AG Grid ValueFormatterParams
 * @param parameterName Parameter to format
 * @param decimalPrecision
 * @returns Formatted decimal string or "Unknown" if parameter is undefined
 */
export function decimalPrecisionValueFormatter<RowType extends Row>(
  params: ValueFormatterParams<
    RowType,
    unknown,
    string,
    CellRendererParams<RowType, unknown, string, unknown, unknown>,
    unknown
  >,
  parameterName: keyof RowType,
  decimalPrecision: number
): string {
  const value = params.data[parameterName];
  if (value === undefined) return 'Unknown';
  if (!isNumber(value)) {
    logger.error(`${parameterName.toString()} was found but is not a number`);
    return 'Unknown';
  }
  return setDecimalPrecision(value, decimalPrecision);
}

/**
 * Format a given parameter of type boolean as a string
 *
 * @param params AG Grid ValueFormatterParams
 * @param parameterName Parameter to format
 * @returns "True" if truthy or "False" if falsy
 */
export function booleanValueFormatter<RowType extends Row>(
  params: ValueFormatterParams<
    RowType,
    unknown,
    string,
    CellRendererParams<RowType, unknown, boolean, unknown, unknown>,
    unknown
  >,
  parameterName: keyof RowType
): string {
  const value = params.data[parameterName];
  return value ? 'True' : 'False';
}

/**
 * This is a hack function that gets around the bug where AG Grid does not
 * display 0s in the table.
 */
export function shouldShowZero<RowType extends Row>(
  params: ValueFormatterParams<
    RowType,
    unknown,
    string,
    CellRendererParams<RowType, unknown, boolean, unknown, unknown>,
    unknown
  >,
  parameterName: keyof RowType
) {
  const value = params.data[parameterName];
  if (value === undefined) return '';
  if (!isNumber(value)) {
    logger.error(`${parameterName.toString()} was found but is not a number`);
    return '';
  }
  return value.toString();
}

/**
 * Given a table ref, checks to make sure the table exists and then updates the displayed columns
 * to match {@param columnsToDisplay}. Accepts a generic column type.
 *
 * @param tableRef Ref object for the AG Grid table
 * @param columnsToDisplay Map of columns to be displayed/hidden
 */
export function updateColumns<T extends string>(
  tableRef: React.MutableRefObject<AgGridReact | null>,
  columnsToDisplay: Immutable.Map<T, boolean>
): Immutable.Map<T, boolean> | undefined {
  if (tableRef?.current?.columnApi) {
    columnsToDisplay.forEach((shouldDisplay, columnName) => {
      tableRef.current?.columnApi.setColumnVisible(columnName, shouldDisplay);
    });
    return columnsToDisplay;
  }
  return undefined;
}

/**
 * Handler function for {@link AgGridReact} `onGridReady` prop. Set up
 * to redraw the rows when the container or body height changes (due to
 * GoldenLayout resizes).
 */
export function onGridReady<T extends string>(
  gridReadyEvent: GridReadyEvent,
  columnsToDisplay: Immutable.Map<T, boolean>
) {
  gridReadyEvent.api.addEventListener('rowContainerHeightChanged', () => {
    gridReadyEvent.api.redrawRows();
  });
  gridReadyEvent.api.addEventListener('bodyHeightChanged', () => {
    gridReadyEvent.api.redrawRows();
  });

  // This is so column display state carries over if display is closed/reopened
  const newState = Object.entries(columnsToDisplay.toObject()).map<ColumnState>(item => {
    return {
      colId: item[0], // Column key
      hide: !item[1] // Column bool
    };
  });
  gridReadyEvent.columnApi.applyColumnState({
    state: newState
  });
}

/**
 * Takes the column definition records from redux and converts it to a {@link Immutable.Map}.
 */
export const convertObjectToEventsColumnMap = (
  columnArguments: Record<string, boolean>
): Immutable.Map<EventsColumn, boolean> => {
  const notableValues = [...Object.keys(columnArguments)];
  return Immutable.Map<EventsColumn, boolean>([
    ...Object.values(EventsColumn)
      .filter(v => notableValues.includes(v))
      .map<[EventsColumn, boolean]>(v => [v, columnArguments[v]])
  ]);
};

/**
 * Takes the column definition records from redux and converts it to a {@link Immutable.Map}.
 */
export const convertObjectToEventFiltersMap = (
  columnArguments: Record<string, boolean>
): Immutable.Map<EventFilterDropdownOptions, boolean> => {
  const notableValues = [...Object.keys(columnArguments)];
  return Immutable.Map<EventFilterDropdownOptions, boolean>([
    ...Object.values(EventFilterDropdownOptions)
      .filter(v => notableValues.includes(v))
      .map<[EventFilterDropdownOptions, boolean]>(v => [v, columnArguments[v]])
  ]);
};

// sorting selected rows by their rowIndex
const sortSelectedRowNodes = (rowNodes: RowNode[]) => {
  return rowNodes.sort((a, b) => {
    if (!a.rowIndex || !b.rowIndex || a.rowIndex === b.rowIndex) return 0;
    if (a.rowIndex < b.rowIndex) return -1;
    if (a.rowIndex > b.rowIndex) return 1;
    return 0;
  });
};

/**
 * Helper function for {@link handleSelection}
 */
const handleRangeSelection = (event: RowClickedEvent, allSelectedRowNodes: RowNode[]) => {
  const clickedRowIndex = event.rowIndex;

  const firstSelectedRowIndex = ArrayUtil.atOrThrow(allSelectedRowNodes, 0).rowIndex;
  const lastSelectedRowIndex = ArrayUtil.atOrThrow(allSelectedRowNodes, -1).rowIndex;

  // This should never happen
  if (clickedRowIndex === null || firstSelectedRowIndex === null || lastSelectedRowIndex === null) {
    logger.error(`Row ${event.node.id} rowIndex is null`);
    return;
  }

  // This allows "extending" previously-selected ranges by clicking above/below them
  const selectionAnchor =
    clickedRowIndex < firstSelectedRowIndex ? lastSelectedRowIndex : firstSelectedRowIndex;

  const lowerBound = Math.min(clickedRowIndex, selectionAnchor);
  const upperBound = Math.max(clickedRowIndex, selectionAnchor);

  event.api.forEachNode(rowNode => {
    if (rowNode.rowIndex === null) return;
    if (rowNode.rowIndex >= lowerBound && rowNode.rowIndex <= upperBound) {
      rowNode.setSelected(true);
    } else if (rowNode.isSelected()) {
      // Deselect rows out of the range that were previously selected
      rowNode.setSelected(false);
    }
  });
};

/**
 * Manual handling of AG Grid row selection behavior.
 *
 * Allows:
 * - Ranged select using `shift`
 * - Multi select using `ctrl` or `meta`
 * - Single select
 *
 * !This function should NOT handle GMS "selection."
 * !GMS selection should be handled in the AG Grid onSelectionChanged event handler.
 */
export const handleSelection = (event: RowClickedEvent): void => {
  const { event: nativeEvent } = event;

  // Determine if the cell is being edited
  const isEditing =
    event.api.getEditingCells().find(cell => cell.rowIndex === event.rowIndex) !== undefined;

  const isRowNodeSelected = event.node.isSelected();

  const allSelectedRowNodes = sortSelectedRowNodes(event.api.getSelectedNodes());

  // Range select
  if (
    isHotKeyCommandSatisfied(nativeEvent as MouseEvent, ['Shift']) &&
    allSelectedRowNodes.length > 0
  ) {
    handleRangeSelection(event, allSelectedRowNodes);
    return;
  }

  // Multi select
  if (isHotKeyCommandSatisfied(nativeEvent as MouseEvent, ['Ctrl', 'Meta'])) {
    // Select/deselct AG grid row
    event.node.setSelected(!isRowNodeSelected);
    return;
  }

  // Single select with other rows already selected
  if (allSelectedRowNodes.length > 0) {
    // If clicked row is the only selected row then deselect it
    if (allSelectedRowNodes.length === 1 && isRowNodeSelected && !isEditing) {
      event.node.setSelected(false);
    }
    // Otherwise, leave it selected and deselect all other rows
    else {
      event.node.setSelected(true, true);
    }
    return;
  }

  // Single select
  event.node.setSelected(true);
};
