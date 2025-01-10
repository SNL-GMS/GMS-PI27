import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { Form, FormTypes, hideImperativeContextMenu } from '@gms/ui-core-components';
import { showImperativeReduxContextMenu } from '@gms/ui-state';
import React from 'react';

import { getTableCellStringValue } from '~common-ui/common/table-utils';

/**
 * Props which are passed to the {@link StationDetails} externally
 * (via an imperative callback function)
 */
export interface StationDetailsProps {
  readonly stationName: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly elevation: string;
  readonly detailedType: string;
  readonly entityType: string;
}

/**
 * Displays the Station details
 */
export function StationDetails(props: StationDetailsProps) {
  const { stationName, latitude, longitude, elevation, detailedType, entityType } = props;

  const formItems: FormTypes.FormItem[] = [];
  formItems.push({
    itemKey: 'Name',
    labelText: 'Name',
    itemType: FormTypes.ItemType.Display,
    displayText: `${getTableCellStringValue(stationName)}`,
    displayTextFormat: FormTypes.TextFormats.Time
  });
  formItems.push({
    itemKey: 'Lat (°)',
    labelText: 'Lat (°)',
    itemType: FormTypes.ItemType.Display,
    displayText: `${getTableCellStringValue(latitude)}`,
    // Apply text format below to get monospace typeface per UX
    displayTextFormat: FormTypes.TextFormats.Time
  });
  formItems.push({
    itemKey: 'Lon (°)',
    labelText: 'Lon (°)',
    itemType: FormTypes.ItemType.Display,
    displayText: `${getTableCellStringValue(longitude)}`,
    // Apply text format below to get monospace typeface per UX
    displayTextFormat: FormTypes.TextFormats.Time
  });
  formItems.push({
    itemKey: 'Elevation (km)',
    labelText: 'Elevation (km)',
    itemType: FormTypes.ItemType.Display,
    displayText: `${getTableCellStringValue(elevation)}`,
    // Apply text format below to get monospace typeface per UX
    displayTextFormat: FormTypes.TextFormats.Time
  });
  if (entityType === 'Station') {
    formItems.push({
      itemKey: 'Type',
      labelText: 'Type',
      itemType: FormTypes.ItemType.Display,
      displayText: `${getTableCellStringValue(detailedType)}`
    });
  }

  const defaultPanel: FormTypes.FormPanel = {
    formItems,
    name: 'Additional Details'
  };

  const headerText = entityType === 'Station' ? 'Station Details' : 'Site Details';

  return (
    <div className="map-station-details__container">
      <Form
        header={headerText}
        defaultPanel={defaultPanel}
        disableSubmit
        onCancel={hideImperativeContextMenu}
      />
    </div>
  );
}

/**
 * Shows the {@link StationDetails} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link StationDetails} props
 * @param options (optional) imperative context menu options
 */
export const showStationDetails = (
  event: React.MouseEvent | MouseEvent,
  props: StationDetailsProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { detailedType, elevation, entityType, latitude, longitude, stationName } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <StationDetails
        detailedType={detailedType}
        elevation={elevation}
        entityType={entityType}
        latitude={latitude}
        longitude={longitude}
        stationName={stationName}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
