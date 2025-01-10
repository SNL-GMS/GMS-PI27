/* eslint-disable react/prop-types */
import { Alignment, Checkbox, Position, Tooltip } from '@blueprintjs/core';
import React from 'react';

import { messageConfig } from '~analyst-ui/config/message-config';
import { systemConfig } from '~analyst-ui/config/system-config';

import { MagDefiningStates } from '../../../types';

/**
 * Renders the header for the various defining types
 */
export function DefiningHeader(props) {
  const { magnitudeType, definingState, callback, stationIds } = props;
  return (
    <div className="location-sd-header">
      <div>{systemConfig.magnitudeTypeToDisplayName.get(magnitudeType)}</div>
      <div className="location-sd-subdivider">
        <Tooltip
          content={messageConfig.tooltipMessages.magnitude.setAllStationsDefiningMessage}
          position={Position.BOTTOM}
        >
          <Checkbox
            label="Def All:"
            data-cy={`defining-all-${magnitudeType}`}
            alignIndicator={Alignment.RIGHT}
            checked={definingState === MagDefiningStates.ALL}
            onChange={() => {
              if (definingState !== MagDefiningStates.ALL) {
                callback(magnitudeType, stationIds, true);
              }
            }}
            disabled={stationIds.length < 1}
            className="location-sd-checkbox checkbox-horizontal"
          />
        </Tooltip>

        <Tooltip
          content={
            definingState === MagDefiningStates.NONE
              ? messageConfig.tooltipMessages.magnitude.noStationsSetToDefiningMessage
              : messageConfig.tooltipMessages.magnitude.setAllStationsNotDefiningMessage
          }
          position={Position.BOTTOM}
        >
          <Checkbox
            label="None:"
            data-cy={`defining-none-${magnitudeType}`}
            alignIndicator={Alignment.RIGHT}
            checked={definingState === MagDefiningStates.NONE}
            onChange={() => {
              if (definingState !== MagDefiningStates.NONE) {
                callback(magnitudeType, stationIds, false);
              }
            }}
            disabled={stationIds.length < 1}
            className={`location-sd-checkbox checkbox-horizontal ${
              definingState === MagDefiningStates.NONE ? 'checkbox-warning' : ''
            }`}
          />
        </Tooltip>
      </div>
    </div>
  );
}
