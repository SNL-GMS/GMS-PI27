import type { ColumnDefinition } from '@gms/ui-core-components';
import type { ArrivalTime } from '@gms/ui-state';
import { SignalDetectionColumn } from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import { getConflictColumnDef } from '~analyst-ui/common/table/conflict-marker-column';
import { getDirtyDotColumnDef } from '~analyst-ui/common/table/dirty-dot-column';
import {
  getTimeColumnDef,
  getTimeUncertaintyColumnDef
} from '~analyst-ui/common/table/time-columns';

import type { SignalDetectionRow } from '../types';
import { signalDetectionColumnDisplayStrings } from '../types';
import { amplitudeColumnDef } from './columns/amplitude';
import { assocStatusColumnDef } from './columns/assoc-status';
import { azimuthColumnDef } from './columns/azimuth';
import { azimuthStdDevColumnDef } from './columns/azimuth-std-dev';
import { channelColumnDef } from './columns/channel';
import { deletedColumnDef } from './columns/deleted';
import { emergenceAngleColumnDef } from './columns/emergence-angle';
import { longPeriodFirstMotionColumnDef } from './columns/long-period-first-motion';
import { periodColumnDef } from './columns/period';
import { phaseColumnDef } from './columns/phase';
import { phaseConfidenceColumnDef } from './columns/phase-confidence';
import { rectilinearityColumnDef } from './columns/rectilinearity';
import { shortPeriodFirstMotionColumnDef } from './columns/short-period-first-motion';
import { slownessColumnDef } from './columns/slowness';
import { slownessStandardDeviationColumnDef } from './columns/slowness-std-dev';
import { sNRColumnDef } from './columns/snr';
import { stationColumnDef } from './columns/station';

/**
 * @returns List of column definition objects for the Signal Detection Table
 */
export const getSignalDetectionTableColumnDefs = () => {
  /** Extend the default column definition to make it editable */
  const editableTimeColumnDef: ColumnDefinition<
    SignalDetectionRow,
    unknown,
    ArrivalTime,
    ICellRendererParams,
    IHeaderParams
  > = {
    ...getTimeColumnDef<SignalDetectionRow>(
      signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.time),
      SignalDetectionColumn.time,
      'Arrival time'
    ),
    editable: params => params.data.deleted !== 'True',
    cellClass: 'ag-cell-is-editable'
  };

  /** Extend the default column definition to make it editable */
  const editableTimeUncertaintyColumnDef: ColumnDefinition<
    SignalDetectionRow,
    unknown,
    ArrivalTime,
    ICellRendererParams,
    IHeaderParams
  > = {
    ...getTimeUncertaintyColumnDef<SignalDetectionRow>(
      signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.timeStandardDeviation),
      SignalDetectionColumn.timeStandardDeviation,
      'Arrival time standard deviation'
    ),
    editable: params => params.data.deleted !== 'True',
    cellClass: 'ag-cell-is-editable'
  };

  return [
    getDirtyDotColumnDef(
      signalDetectionColumnDisplayStrings.get(
        SignalDetectionColumn.unsavedChanges,
        'Unsaved changes'
      ),
      SignalDetectionColumn.unsavedChanges,
      signalDetectionColumnDisplayStrings.get(
        SignalDetectionColumn.unsavedChanges,
        'Unsaved changes'
      )
    ),
    assocStatusColumnDef,
    getConflictColumnDef(
      signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.conflict, 'Conflict'),
      SignalDetectionColumn.conflict,
      signalDetectionColumnDisplayStrings.get(SignalDetectionColumn.conflict, 'Conflict')
    ),
    stationColumnDef,
    channelColumnDef,
    phaseColumnDef,
    phaseConfidenceColumnDef,
    editableTimeColumnDef,
    editableTimeUncertaintyColumnDef,
    azimuthColumnDef,
    azimuthStdDevColumnDef,
    slownessColumnDef,
    slownessStandardDeviationColumnDef,
    amplitudeColumnDef,
    periodColumnDef,
    sNRColumnDef,
    rectilinearityColumnDef,
    emergenceAngleColumnDef,
    shortPeriodFirstMotionColumnDef,
    longPeriodFirstMotionColumnDef,
    deletedColumnDef
  ];
};
