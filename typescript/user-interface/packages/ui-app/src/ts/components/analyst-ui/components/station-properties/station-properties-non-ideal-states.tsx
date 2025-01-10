import type { BlueprintIcons_16Id } from '@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import {
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner,
  nonIdealStateWithWidget
} from '@gms/ui-core-components';
import React from 'react';

import { StationSelector } from '~analyst-ui/common/forms/inputs/station-selector';

export const nonIdealStateStationSelection = (
  title: string,
  description: string,
  icon: BlueprintIcons_16Id,
  validStations: Station[],
  selectedStations: Station[],
  onChange: (selection: Station[]) => void
) =>
  nonIdealStateWithWidget(
    <StationSelector
      helperText=""
      placeholder="Select a station"
      validStations={validStations}
      selectedStations={selectedStations}
      onChange={selection => onChange(selection)}
      disabled={validStations.length < 1}
    />,
    title,
    description,
    icon
  );

export const nonIdealStateLoadingEffectiveAtsQuery = nonIdealStateWithSpinner(
  'Loading',
  'Effective times'
);
export const nonIdealStateLoadingStationDataQuery = nonIdealStateWithSpinner(
  'Loading',
  'Station data'
);
export const nonIdealStateNoDataForStationsSelected = nonIdealStateWithNoSpinner(
  'No Data for Selected Station',
  'There is no data available for this station',
  'exclude-row'
);

export const nonIdealStateSelectChannelGroupRow = nonIdealStateWithNoSpinner(
  'No Channel Selected',
  'Select a channel in the Channel Group Configuration table to view channel configuration data',
  'select'
);
export const nonIdealStateEmptyEffectiveAtsQuery = nonIdealStateWithNoSpinner(
  'Missing Effective Times',
  'No effective times found for selected station',
  'exclude-row'
);
