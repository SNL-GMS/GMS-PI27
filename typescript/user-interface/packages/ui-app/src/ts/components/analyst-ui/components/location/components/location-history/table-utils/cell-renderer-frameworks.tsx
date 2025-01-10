/* eslint-disable react/prop-types */
import { Switch } from '@blueprintjs/core';
import React from 'react';
/**
 * stateless checkbox used in the LocationHistory table
 */
export function LocationHistoryCheckBox(props) {
  const { data } = props;
  return (
    <Switch
      checked={data.preferred}
      disabled={data.latestLSSId !== data.locationSetId}
      onChange={() => {
        data.setSelectedPreferredLocationSolution(data.locationSetId, data.locationSolutionId);
      }}
    />
  );
}

export function LocationSetSwitch(props) {
  const { data } = props;
  return data.isFirstInLSSet ? (
    <Switch
      data-cy="location-set-to-save-switch"
      checked={data.isLocationSolutionSetPreferred}
      large
      disabled={data.latestLSSId !== data.locationSetId}
      onChange={() => {
        data.setToSave(data.locationSetId, data.locationSolutionId);
      }}
    />
  ) : null;
}
