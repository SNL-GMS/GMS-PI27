import React from 'react';

import { LabelValue } from '../../label-value';
import type { ToolbarItemBase, ToolbarItemElement } from '../types';

/**
 * Type guard, for use when rendering overflow menu items.
 */
export function isLabelValueToolbarItem(object: unknown): object is LabelValueToolbarItemProps {
  return (object as LabelValueToolbarItemProps).labelValue !== undefined;
}

/**
 * Properties to pass to the {@link LabelValueToolbarItem}
 *
 * @see {@link ToolbarItemBase} for base properties.
 */
export interface LabelValueToolbarItemProps extends ToolbarItemBase {
  labelValue: string | JSX.Element;
  labelValueColor?: string;
  styleForLabelValue?: React.CSSProperties;
}

/**
 * Represents a label/value pair used within a toolbar
 *
 * @param labelValueItem the item to display {@link LabelValueItem}
 */
export function LabelValueToolbarItem({
  labelValue,
  labelValueColor,
  styleForLabelValue,
  style,
  label,
  customStylePrefix,
  hasIssue,
  tooltip,
  tooltipForIssue,
  cyData
}: LabelValueToolbarItemProps): ToolbarItemElement {
  return (
    <div className="toolbar-label-value" style={style ?? {}}>
      <LabelValue
        label={label || ''}
        value={labelValue}
        customStylePrefix={customStylePrefix}
        tooltip={hasIssue && tooltipForIssue ? tooltipForIssue : tooltip || ''}
        styleForValue={styleForLabelValue}
        valueColor={labelValueColor}
        data-cy={cyData}
      />
    </div>
  );
}
