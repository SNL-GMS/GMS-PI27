import { Icon, IconSize, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import type { CellRendererParams, Row } from '@gms/ui-core-components';
import { Tooltip2Wrapper } from '@gms/ui-core-components';
import type { AssociationConflictRecord } from '@gms/ui-state';
import {
  selectAssociationConflict,
  selectOpenIntervalName,
  useAppSelector,
  useGetEvents,
  useGetSignalDetections
} from '@gms/ui-state';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';
import * as React from 'react';

import {
  getConflictedEventsForSD,
  getConflictedSDsForEvent
} from '~analyst-ui/common/utils/conflicts-utils';

import type {
  ConflictedEventInfo,
  ConflictedSDInfo
} from '../../tooltips/conflicts-tooltip-content';
import { ConflictsTooltipContent } from '../../tooltips/conflicts-tooltip-content';
import { isEventRow } from './conflict-marker-utils';

export interface ConflictRow extends Row {
  conflict: boolean;
}

export type ConflictMarkerCellRendererParams = CellRendererParams<
  ConflictRow,
  unknown,
  boolean,
  ICellRendererParams,
  IHeaderParams
>;

/**
 * Cell renderer to render the conflict marker column
 */
export function ConflictMarkerCellRenderer(props: ConflictMarkerCellRendererParams) {
  const { data } = props;

  const openEventId = useAppSelector(state => state.app.analyst.openEventId);

  const color = data.id === openEventId ? 'black' : 'red';
  const isConflict = data.conflict;

  const openIntervalName: string = useAppSelector(selectOpenIntervalName);

  const allEventsInInterval: EventTypes.Event[] = useGetEvents().data;
  const allSignalDetectionsInInterval: SignalDetectionTypes.SignalDetection[] =
    useGetSignalDetections().data;

  // every SD in redux with a conflict
  const allConflicts: AssociationConflictRecord = useAppSelector(selectAssociationConflict);

  let sdConflicts: ConflictedSDInfo[];
  let eventConflicts: ConflictedEventInfo[];

  let content: JSX.Element;

  if (isEventRow(data)) {
    // Event Panel conflicts
    sdConflicts = getConflictedSDsForEvent(
      allSignalDetectionsInInterval,
      allEventsInInterval,
      allConflicts,
      openIntervalName,
      data.id
    );
    content = (
      <Tooltip2Wrapper content={<ConflictsTooltipContent data={sdConflicts} />}>
        <Icon icon={IconNames.ISSUE} intent={Intent.DANGER} size={IconSize.LARGE} color={color} />
      </Tooltip2Wrapper>
    );
  } else {
    // SD Panel conflicts
    eventConflicts = getConflictedEventsForSD(
      allEventsInInterval,
      allConflicts,
      openIntervalName,
      data.id
    );
    content = (
      <Tooltip2Wrapper content={<ConflictsTooltipContent data={eventConflicts} />}>
        <Icon icon={IconNames.ISSUE} intent={Intent.DANGER} size={IconSize.LARGE} color={color} />
      </Tooltip2Wrapper>
    );
  }

  return (
    <div className={classNames('table-cell', 'events__conflict-marker')}>
      {isConflict && content}
    </div>
  );
}
