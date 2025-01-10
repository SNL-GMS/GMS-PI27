import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { HorizontalDivider } from '@gms/ui-core-components';
import type { RowClickedEvent } from 'ag-grid-community';
import type Immutable from 'immutable';
import React from 'react';

import { sortStationDefinitionChannels } from '~analyst-ui/common/utils/station-definition-util';

import { ChannelConfigurationTable } from './channel-configuration-table';
import { SiteConfigurationTable } from './site-configuration-table';
import { nonIdealStateSelectChannelGroupRow } from './station-properties-non-ideal-states';
import { setFocusToStationPropertiesDisplay } from './station-properties-utils';
import type { ChannelColumn, SiteColumn } from './types';

export interface StationPropertiesTablesProps {
  stationData: StationTypes.Station;
  onChannelGroupRowSelection: (event: RowClickedEvent) => void;
  selectedSiteColumnsToDisplay: Immutable.Map<SiteColumn, boolean>;
  selectedChannelGroup: string;
  channels: ChannelTypes.Channel[];
  selectedChannelColumnsToDisplay: Immutable.Map<ChannelColumn, boolean>;
}

export function StationPropertiesTables({
  stationData,
  onChannelGroupRowSelection,
  selectedSiteColumnsToDisplay,
  selectedChannelGroup,
  channels,
  selectedChannelColumnsToDisplay
}: StationPropertiesTablesProps) {
  // sort the channels based on rules for 3C channel orientation i.e. (Z,N,E) or (Z,1,2)
  const sortedChannels = sortStationDefinitionChannels(channels);
  return (
    <HorizontalDivider
      sizeRange={{
        minimumBottomHeightPx: 200,
        minimumTopHeightPx: 200
      }}
      setFocusToDisplay={setFocusToStationPropertiesDisplay}
      topHeightPx={250}
      top={
        <SiteConfigurationTable
          selectedChannelGroup={selectedChannelGroup}
          station={stationData}
          onRowSelection={onChannelGroupRowSelection}
          columnsToDisplay={selectedSiteColumnsToDisplay}
        />
      }
      bottom={
        selectedChannelGroup ? (
          <ChannelConfigurationTable
            stationData={stationData}
            channels={sortedChannels}
            columnsToDisplay={selectedChannelColumnsToDisplay}
          />
        ) : (
          nonIdealStateSelectChannelGroupRow
        )
      }
    />
  );
}
