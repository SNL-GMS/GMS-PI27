import { descriptionColumnDef } from './columns/description';
import { measuredColumnDef } from './columns/measured';
import { peakColumnDef } from './columns/peak';
import { predictedColumnDef } from './columns/predicted';
import { residualColumnDef } from './columns/residual';

/**
 * @returns List of column definition objects for the FK Properties Table
 */
export function getFkPropertiesTableColumnDefs() {
  return [
    descriptionColumnDef,
    peakColumnDef,
    predictedColumnDef,
    measuredColumnDef,
    residualColumnDef
  ];
}
