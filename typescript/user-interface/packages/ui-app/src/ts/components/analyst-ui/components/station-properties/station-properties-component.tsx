import type { CommonTypes } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import type GoldenLayout from '@gms/golden-layout';
import { WithNonIdealStates } from '@gms/ui-core-components';
import {
  selectSelectedStationsAndChannelIds,
  useAllStations,
  useAppSelector,
  useGetStationsEffectiveAtTimesQuery,
  useOperationalTimePeriodConfiguration
} from '@gms/ui-state';
import React from 'react';

import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';

import { useSetSelectedStationIds } from '../waveform/weavess-display/weavess-display-component';
import {
  nonIdealStateEmptyEffectiveAtsQuery,
  nonIdealStateLoadingEffectiveAtsQuery,
  nonIdealStateStationSelection
} from './station-properties-non-ideal-states';
import { StationPropertiesPanel } from './station-properties-panel';
import type { StationPropertiesComponentProps, StationPropertiesPanelProps } from './types';

type StationPropertiesPanelOrNonIdealStateProps = StationPropertiesPanelProps & {
  readonly glContainer?: GoldenLayout.Container;
  operationalTimeRange: CommonTypes.TimeRange;
  selectedStations: Station[];
  validStations: Station[];
  selectStations: (selection: Station[]) => void;
};

export function StationPropertiesPanelOrNonIdealState(
  props: StationPropertiesPanelOrNonIdealStateProps
) {
  const { selectedStations, validStations, selectStations, effectiveAtTimes } = props;

  const StationPropertiesPanelOrNonIdealStateComponent =
    WithNonIdealStates<StationPropertiesPanelOrNonIdealStateProps>(
      [
        ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
        ...AnalystNonIdealStates.operationalTimePeriodConfigNonIdealStateDefinitions,
        {
          condition: (): boolean => {
            return selectedStations.length < 1;
          },
          element: nonIdealStateStationSelection(
            'No Station Selected',
            'Select a station in the Waveform, Map Display, or the menu below to view station properties',
            'select',
            validStations,
            selectedStations,
            selectStations
          )
        },
        {
          condition: (): boolean => {
            return selectedStations.length > 1;
          },
          element: nonIdealStateStationSelection(
            'Multiple Stations Selected',
            'Select a single station to view station properties',
            'exclude-row',
            validStations,
            selectedStations,
            selectStations
          )
        },
        {
          condition: (): boolean => {
            return !effectiveAtTimes;
          },
          element: nonIdealStateLoadingEffectiveAtsQuery
        },
        {
          condition: (): boolean => {
            return effectiveAtTimes.length <= 0;
          },
          element: nonIdealStateEmptyEffectiveAtsQuery
        }
      ],
      StationPropertiesPanel
    );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <StationPropertiesPanelOrNonIdealStateComponent {...props} />;
}

export function StationPropertiesComponent(props: StationPropertiesComponentProps) {
  const { glContainer } = props;

  const selectedStationIds = useAppSelector(selectSelectedStationsAndChannelIds);
  const setSelectedStationIds = useSetSelectedStationIds();
  const selectStations = React.useCallback(
    (selection: Station[]) => setSelectedStationIds(selection.map(station => station.name)),
    [setSelectedStationIds]
  );
  const stationData = useAllStations();

  const { timeRange } = useOperationalTimePeriodConfiguration();

  const operationalTimeRange: CommonTypes.TimeRange = {
    startTimeSecs: timeRange?.startTimeSecs,
    endTimeSecs: timeRange?.endTimeSecs
  };

  const selectedStations = React.useMemo(
    () => stationData.filter(station => selectedStationIds.indexOf(station.name) !== -1),
    [selectedStationIds, stationData]
  );

  const effectiveAtTimes: string[] = useGetStationsEffectiveAtTimesQuery({
    stationName: selectedStationIds[0],
    startTime: operationalTimeRange.startTimeSecs,
    endTime: operationalTimeRange.endTimeSecs
  }).data;

  return (
    <BaseDisplay
      glContainer={glContainer}
      className="station-properties-display-window"
      data-cy="station-properties-display-window"
      tabName={IanDisplays.STATION_PROPERTIES}
    >
      <StationPropertiesPanelOrNonIdealState
        selectedStation={selectedStationIds[0]}
        effectiveAtTimes={effectiveAtTimes}
        operationalTimeRange={operationalTimeRange}
        selectedStations={selectedStations}
        validStations={stationData}
        selectStations={selectStations}
      />
    </BaseDisplay>
  );
}
