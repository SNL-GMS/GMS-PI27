import { Alignment, Checkbox } from '@blueprintjs/core';
import React from 'react';

import { DefiningStates, DefiningTypes } from '../types';

/**
 * Renders the header for the various defining types
 */
export class DefiningHeader extends React.PureComponent<any> {
  public render(): JSX.Element {
    const { definingState } = this.props;
    const { definingType } = this.props;
    const definingTypeDisplayString =
      definingType === DefiningTypes.AZIMUTH ? 'Azimuth (\u00B0)' : 'Slowness';
    const { definingCallback } = this.props;
    return (
      <div className="location-sd-header">
        <div>
          {definingType === DefiningTypes.ARRIVAL_TIME ? 'Time' : definingTypeDisplayString}
        </div>
        <div className="location-sd-subdivider">
          <Checkbox
            label="Def All:"
            alignIndicator={Alignment.RIGHT}
            checked={definingState === DefiningStates.ALL}
            onClick={() => {
              definingCallback(true, definingType);
            }}
            className="location-sd-checkbox checkbox-horizontal"
          />
          <Checkbox
            label="None: "
            alignIndicator={Alignment.RIGHT}
            checked={definingState === DefiningStates.NONE}
            onClick={() => {
              definingCallback(false, definingType);
            }}
            className="location-sd-checkbox checkbox-horizontal"
          />
        </div>
      </div>
    );
  }
}
