/* eslint-disable react/prop-types */
import { Checkbox, Position, Tooltip } from '@blueprintjs/core';
import React from 'react';

import { messageConfig } from '~analyst-ui/config/message-config';

import type { MagnitudeDataForRow } from '../types';

/**
 * Universal tool tip renderer
 *
 * @param props to render the tool tip content and ag grid props
 */
export function ToolTipRenderer(props) {
  const { eParentOfValue, valueFormatted, children, tooltip } = props;
  const div = (
    <div
      style={{
        width: `${eParentOfValue.clientWidth}px`,
        height: `${eParentOfValue.clientHeight}px`
      }}
    >
      {valueFormatted}
    </div>
  );

  const confirmedChildren = children || div;

  return tooltip ? (
    <Tooltip content={tooltip} position={Position.BOTTOM}>
      {confirmedChildren}
    </Tooltip>
  ) : (
    confirmedChildren
  );
}

export function MagDefiningCheckBoxCellRenderer(props) {
  const { magnitudeType, data, tooltip } = props;
  const magType = magnitudeType;
  const maybeDataForMag: MagnitudeDataForRow = data.dataForMagnitude.get(magType);
  const isChecked: boolean = maybeDataForMag ? maybeDataForMag.defining : false;
  const hasAmplitudeForMag = maybeDataForMag && maybeDataForMag.amplitudeValue !== undefined;
  const theCheckbox = (
    <Checkbox
      label=""
      checked={isChecked}
      disabled={data.historicalMode || data.rejectedOrUnnassociated || !hasAmplitudeForMag}
      onChange={() => {
        data.checkBoxCallback(magnitudeType, data.station, !maybeDataForMag.defining);
      }}
      data-cy={`mag-defining-checkbox-${magType}`}
      title={tooltip}
    />
  );

  return (
    <ToolTipRenderer
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      tooltip={
        !hasAmplitudeForMag ? messageConfig.tooltipMessages.magnitude.noAmplitudeMessage : tooltip
      }
    >
      {theCheckbox}
    </ToolTipRenderer>
  );
}
