/* eslint-disable react/prop-types */
import { Checkbox, Icon, Tooltip } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import { DefiningTypes } from '~analyst-ui/components/location/components/location-signal-detections/types';
import { messageConfig } from '~analyst-ui/config/message-config';

/**
 * When the user changes the checkbox by calling the location SD table's component
 */

export function onCheckboxChange(
  definingType: DefiningTypes,
  signalDetectionId: string,
  setDefining: boolean,
  props: any
): void {
  props.data.updateIsDefining(definingType, signalDetectionId, setDefining);
}

export function DefiningCheckBoxCellRenderer(props) {
  const { colDef, data } = props;
  const { definingType } = colDef.cellRendererParams;
  let isDefining = data.arrivalTimeDefining;
  if (definingType === DefiningTypes.SLOWNESS) {
    isDefining = data.slownessDefining;
  } else if (definingType === DefiningTypes.AZIMUTH) {
    isDefining = data.azimuthDefining;
  }
  return (
    <Checkbox
      label=""
      checked={isDefining}
      disabled={data.historicalMode || data.deletedOrUnassociated}
      onChange={() => {
        onCheckboxChange(definingType, data.signalDetectionId, !isDefining, props);
      }}
    />
  );
}

/**
 * Renders the modified color cell for the signal detection list
 */
export function AddedRemovedSDMarker(props) {
  const { data } = props;
  if (!data.deletedOrUnassociated && !data.isAssociatedDiff) {
    return null;
  }
  const tooltip = data.deletedOrUnassociated
    ? messageConfig.tooltipMessages.location.deletedOrUnassociatedMessage
    : messageConfig.tooltipMessages.location.associatedOrCreatedMessage;
  return (
    <Tooltip content={<div>{tooltip}</div>} className="dirty-dot-wrapper">
      <Icon icon={data.deletedOrUnassociated ? IconNames.GRAPH_REMOVE : IconNames.NEW_OBJECT} />
    </Tooltip>
  );
}
