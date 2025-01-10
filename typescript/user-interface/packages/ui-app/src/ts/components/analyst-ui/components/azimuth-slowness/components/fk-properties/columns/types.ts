import type { CellRendererParams, Row, ValueFormatterParams } from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import Immutable from 'immutable';

/**
 * Column names for the FK Properties table
 */
export enum FkPropertiesColumn {
  description = 'description',
  peak = 'peak',
  predicted = 'predicted',
  measured = 'measured',
  residual = 'residual'
}

/**
 * Used to match the display strings to values in the FK Properties table
 */
export const FkPropertiesColumnDisplayStrings: Immutable.Map<FkPropertiesColumn, string> =
  Immutable.Map<FkPropertiesColumn, string>([
    [FkPropertiesColumn.description, ''],
    [FkPropertiesColumn.peak, 'Peak'],
    [FkPropertiesColumn.predicted, 'Predicted'],
    [FkPropertiesColumn.measured, 'Measured'],
    [FkPropertiesColumn.residual, 'Residual']
  ]);

/** Interface that defines a cell of data */
export interface DataCell {
  value: number;
  uncertainty: number | undefined;
}

/** Interface for defining a row in the properties table */
export interface FkPropertiesRow extends Row {
  id: string;
  description: string;
  phaseIsInvalid: boolean;
  eventIsOpen: boolean;
  hasAnalystMeasurement?: boolean;
  extrapolated: boolean;
  peak: DataCell | undefined;
  predicted: DataCell | undefined;
  measured: DataCell | undefined;
  residual: DataCell | undefined;
}

export type FkPropertiesCellValueFormatterParams = ValueFormatterParams<
  FkPropertiesRow,
  unknown,
  DataCell,
  CellRendererParams<FkPropertiesRow, unknown, any, ICellRendererParams, IHeaderParams>,
  IHeaderParams
>;
