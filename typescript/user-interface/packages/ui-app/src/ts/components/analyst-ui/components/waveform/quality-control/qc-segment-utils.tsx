import { UNFILTERED } from '@gms/common-model/lib/filter';
import { QcSegmentCategory, QcSegmentType } from '@gms/common-model/lib/qc-segment';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import { humanReadable, toEpochSeconds } from '@gms/common-util';
import type { CellRendererParams, Row } from '@gms/ui-core-components';
import type { FormTypes } from '@gms/ui-core-components/lib/components/ui-widgets/form';
import type { QcSegmentRecord } from '@gms/ui-state';
import { getTimeRangeFromChannelSegment, useAppSelector } from '@gms/ui-state';
import { doTimeRangesOverlap } from '@gms/weavess-core/lib/util';
import flatMap from 'lodash/flatMap';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

/**
 * An interface for a table row that uses {@link SwatchCellRenderer}
 */
export interface SwatchRow extends Row {
  color: string;
}

// Interface for parameter object to compare form values
interface QcFormModificationValues {
  type: QcSegmentType;
  start: Date;
  end: Date;
  rationale: string;
}

/**
 * Renders a given color hex string as a centered cell in the table
 */
export function SwatchCellRenderer(
  params: CellRendererParams<SwatchRow, unknown, unknown, unknown, unknown>
) {
  const { data } = params;

  const style: React.CSSProperties = {
    backgroundColor: data.color,
    top: '25%',
    height: '10px',
    width: '100%',
    display: 'inline-block'
  };

  return <div style={style} />;
}

/**
 * Dynamically determine the height of the AG grid table. Can
 * optionally set a max-height as well.
 *
 * @param rowCount Number of rows being displayed by the table
 * @param maxRows Maximum number of rows to show
 * @returns CSS properties
 */
export function getTableContainerHeight(rowCount: number, maxRows: number = undefined) {
  const TABLE_HEADER_HEIGHT_PX = 32;
  const TABLE_SCROLLBAR_HEIGHT_PX = 15;
  const HEIGHT_PER_ITEM_PX = 25;

  let maxTableContainerHeight;
  if (maxRows) {
    maxTableContainerHeight =
      HEIGHT_PER_ITEM_PX * maxRows + TABLE_HEADER_HEIGHT_PX + TABLE_SCROLLBAR_HEIGHT_PX;
  }

  const tableContainerHeight =
    HEIGHT_PER_ITEM_PX * rowCount + TABLE_HEADER_HEIGHT_PX + TABLE_SCROLLBAR_HEIGHT_PX;

  const style: React.CSSProperties = {
    height: `${tableContainerHeight}px`
  };

  style.maxHeight = maxTableContainerHeight ? `${maxTableContainerHeight}px` : undefined;

  return style;
}

/**
 * Determine the swatch color of a given {@link QcSegmentCategory}
 *
 * @returns Color hex string
 */
export function getQCSegmentSwatchColor(
  category: QcSegmentCategory | 'Unknown',
  uiTheme: UITheme,
  isRejected: boolean
): string {
  if (isRejected) return uiTheme.colors.qcMaskColors.rejected ?? '#FF0000';
  switch (category) {
    case QcSegmentCategory.ANALYST_DEFINED:
      return uiTheme.colors.qcMaskColors.analystDefined ?? '#EB06C8';
    case QcSegmentCategory.DATA_AUTHENTICATION:
      return uiTheme.colors.qcMaskColors.dataAuthentication ?? '#8A57FF';
    case QcSegmentCategory.LONG_TERM:
      return uiTheme.colors.qcMaskColors.longTerm ?? '#0E9B96';
    case QcSegmentCategory.STATION_SOH:
      return uiTheme.colors.qcMaskColors.stationSOH ?? '#B58400';
    case QcSegmentCategory.UNPROCESSED:
      return uiTheme.colors.qcMaskColors.unprocessed ?? '#FFFFFF';
    case QcSegmentCategory.WAVEFORM:
      return uiTheme.colors.qcMaskColors.waveform ?? '#00E22B';
    default:
      return '#000000';
  }
}

/**
 * Convert a QcSegmentCategory or QcSegmentType to a human-readable string
 * depending upon rejection and Unknown status
 */
export function getQCSegmentCategoryOrTypeString(
  field: QcSegmentCategory | QcSegmentType | 'Unknown',
  isRejected: boolean
): string {
  if (isRejected) return 'N/A';
  if (field === QcSegmentCategory.STATION_SOH) {
    return 'Station SOH';
  }
  if (field in QcSegmentType) {
    return humanReadable(QcSegmentType[field]);
  }
  return humanReadable(field);
}

/**
 * Determines if a QC segment ID is already stored in Redux
 *
 * @param qcSegmentRecord
 * @param id
 * @returns
 */
export function isNewQCSegment(qcSegmentRecord: QcSegmentRecord, id: string) {
  const qcSegmentIds: string[] = flatMap(
    flatMap(
      Object.values(qcSegmentRecord).reduce((final, qcSegmentObj) => {
        return [...final, Object.values(qcSegmentObj)];
      }, []),
      segmentArr => segmentArr
    ),
    segment => segment.id
  );

  return !qcSegmentIds.includes(id);
}

/**
 * Utility that returns a save error tooltip when there is a flagged issue for saving
 *
 * @param category the {@link QcSegmentCategory} of the {@link QcSegment}
 * @param isRejected true if rejected; false otherwise
 * @param startEndDateInvalidMsg if there is an error with the start or end dates; this will be set with that error message
 * @returns a string tooltip if there is an issue for saving; otherwise null
 */
const getSaveErrorTooltip = (
  category: QcSegmentCategory,
  isRejected: boolean,
  startEndDateInvalidMsg: FormTypes.Message
): string => {
  if (isRejected) {
    return 'Rejected QC segments cannot be modified.';
  }
  if (category === QcSegmentCategory.UNPROCESSED) {
    return 'Unprocessed QC segments cannot be modified.';
  }
  return startEndDateInvalidMsg && !isEmpty(startEndDateInvalidMsg)
    ? startEndDateInvalidMsg.summary
    : undefined;
};

/**
 * Determines which channels have overlapping data for the provided start and end dates.
 *
 * @param channelNames the unique channel names
 * @param startDate the start date
 * @param endDate the end date
 * @returns returns two lists; first list contains the list of the unique channel ids of the
 * channels that have overlapping data, the second list returns a list of the
 * unique channel ids of the channels that do not have overlapping data
 */
export const useDetermineChannelsWithOverlappingData = (
  channelNames: string[],
  startDate: Date,
  endDate: Date
): [string[], string[]] => {
  const uiChannelSegments = useAppSelector(state => state.data.uiChannelSegments);

  const channelIdsWithData: string[] = [];
  const channelIdsWithoutData: string[] = [];

  channelNames.forEach(channelName => {
    if (uiChannelSegments[channelName] && uiChannelSegments[channelName][UNFILTERED]) {
      const timeRanges = flatMap(
        uiChannelSegments[channelName][UNFILTERED].map(seg =>
          getTimeRangeFromChannelSegment(seg.channelSegment)
        )
      );

      if (
        timeRanges.some(tr =>
          doTimeRangesOverlap(tr, {
            startTimeSecs: toEpochSeconds(startDate.toISOString()),
            endTimeSecs: toEpochSeconds(endDate.toISOString())
          })
        )
      ) {
        channelIdsWithData.push(channelName);
      } else {
        channelIdsWithoutData.push(channelName);
      }
    } else {
      channelIdsWithoutData.push(channelName);
    }
  });
  return [channelIdsWithData, channelIdsWithoutData];
};

/**
 * Utility that returns a form message that can be used for displaying warnings or errors.
 *
 * @param category the {@link QcSegmentCategory} of the {@link QcSegment}
 * @param isRejected true if rejected; false otherwise
 * @param startEndDateInvalidMsg if there is an error with the start or end dates; this will be set with that error message
 * @param channelIdsWithData the unique channel ids that have data within the start and end timerange of the {@link QcSegment}
 * @param channelIdsWithoutData the unique channel ids that do not have data within the start and end timerange of the {@link QcSegment}
 * @returns a message; otherwise null
 */
export const getFormErrorMessage = (
  category: QcSegmentCategory,
  isRejected: boolean,
  startEndDateInvalidMsg: FormTypes.Message,
  channelIdsWithData: string[],
  channelIdsWithoutData: string[]
): FormTypes.Message => {
  const errorTooltip = getSaveErrorTooltip(category, isRejected, startEndDateInvalidMsg);
  const summary = `No data in selected channels`;
  const details = `There is no data to mask in the selected time range for channels: ${channelIdsWithoutData.join(
    ', '
  )}.`;

  if (channelIdsWithData.length === 0) {
    return { summary, details, intent: 'danger' };
  }

  if (errorTooltip !== undefined) {
    return { summary: errorTooltip, intent: 'danger' };
  }

  if (channelIdsWithoutData.length > 0) {
    return { summary, details, intent: 'warning' };
  }

  return undefined;
};

/**
 * Utility to create tooltip for Save button in QC edit dialog based on params
 *
 * @param category
 * @param isRejected
 * @returns
 */
export const useRejectTooltip = (category: QcSegmentCategory, isRejected: boolean) => {
  if (isRejected) return 'The QC segment has already been rejected.';
  if (category === QcSegmentCategory.UNPROCESSED)
    return 'Unprocessed QC segments cannot be rejected.';
  return null;
};

/**
 * Compares original segment editing form values with updated values
 * Updates `isModified` to reflect changes
 * If form is editing a new segment, `isModified` cannot be set false
 *
 * @param refValues
 * @param updatedValues
 * @param isSegmentNew
 * @param setIsModified
 */
export function validateQcFormModifications(
  refValues: QcFormModificationValues,
  updatedValues: QcFormModificationValues,
  isSegmentNew: boolean,
  setIsModified: (isModified: boolean) => void
) {
  if (
    refValues.type === updatedValues.type &&
    refValues.start.getTime() === updatedValues.start.getTime() &&
    refValues.end.getTime() === updatedValues.end.getTime() &&
    refValues.rationale === updatedValues.rationale &&
    !isSegmentNew
  ) {
    setIsModified(false);
  } else {
    setIsModified(true);
  }
}
