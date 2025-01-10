import { Button, Classes, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { SignalDetectionTypes, StationTypes } from '@gms/common-model';
import { Displays } from '@gms/common-model';
import {
  mapActions,
  selectIsSyncedWithWaveformZoom,
  selectMapLayerVisibility,
  selectSelectedEventIds,
  selectSelectedStationsAndChannelIds,
  useAppDispatch,
  useAppSelector,
  useGetSelectedSdIds,
  useStationsVisibility,
  useUiTheme
} from '@gms/ui-state';
import React from 'react';

import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import {
  layerDisplayStrings,
  layerSettings
} from '~analyst-ui/components/map/layer-selector-drawer/layer-selector-static-content';
import { MapDataSource } from '~analyst-ui/components/map/map-data-source';
import { messageConfig } from '~analyst-ui/config/message-config';
import { useSelectionInformationControl } from '~common-ui/common/selection-information';
import { MAP_MIN_HEIGHT_PX } from '~common-ui/components/map/constants';
import { MapLayerPanelDrawer } from '~common-ui/components/map/map-layer-panel-drawer';
import { Map } from '~components/common-ui/components/map';
import { FEATURE_TOGGLES } from '~config/feature-toggles';

import { IANConfirmOpenEventPopup } from '../events/confirm-open-event-popup';
import { EventFilterOptions } from '../events/types';
import {
  useMapEventLocationSource,
  useMapEventUncertaintyEllipseSource,
  useMapSignalDetectionSources,
  useMapSiteSource,
  useMapStationSource
} from './create-ian-map-data-sources';
import { useInteractionHandler } from './interaction-handler';
import {
  clearEventTooltip,
  clearHoverTooltip,
  eventTooltipLabel,
  setViewer,
  stationTooltipLabel
} from './interaction-utils';
import { useStationOnClickHandler } from './map-hooks';
import { setFocusToMap } from './map-utils';
import type { MapEventSource } from './types';
import { UncertaintyEllipse } from './types';

export interface MapPanelProps {
  stationsResult: StationTypes.Station[];
  signalDetections: SignalDetectionTypes.SignalDetection[];
  preferredEventsResult: MapEventSource[];
  nonPreferredEventsResult: MapEventSource[];
  setPhaseMenuVisibilityCb: (visibility: boolean) => void;
  /** set the create event menu state (visibility, latitude, longitude) */
  setCreateEventMenuState: (value: CreateEventMenuState) => void;
}
/**
 * Map panel component. Renders a Cesium map and queries for Station Groups
 */
export function MapPanelComponent(props: MapPanelProps) {
  const {
    stationsResult,
    signalDetections,
    preferredEventsResult,
    nonPreferredEventsResult,
    setCreateEventMenuState,
    setPhaseMenuVisibilityCb
  } = props;

  const allowMultiSelect = FEATURE_TOGGLES.IAN_MAP_MULTI_SELECT;
  const selectedStations = useAppSelector(selectSelectedStationsAndChannelIds);
  const selectedEvents = useAppSelector(selectSelectedEventIds);
  const selectedSdIds = useGetSelectedSdIds();
  const isSyncedWithWaveformZoom = useAppSelector(selectIsSyncedWithWaveformZoom);
  const dispatch = useAppDispatch();
  const [uiTheme] = useUiTheme();

  // Use custom hook for the on-left-click handler for IAN entities displayed on the map.
  const onStationClickHandler = useStationOnClickHandler();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [eventId, setEventId] = React.useState(undefined);
  const [isCurrentlyOpen, setIsCurrentlyOpen] = React.useState(false);

  const layerVisibility = useAppSelector(selectMapLayerVisibility);

  const onCheckedCallback = React.useCallback(
    (checkedItem: string) => {
      if (checkedItem === messageConfig.labels.syncToWaveformDisplayVisibleTimeRange) {
        dispatch(mapActions.setIsMapSyncedWithWaveformZoom(!isSyncedWithWaveformZoom));
      } else {
        const newLayerVisibility = { ...layerVisibility };
        newLayerVisibility[layerDisplayStrings.keyOf(checkedItem)] =
          !layerVisibility[layerDisplayStrings.keyOf(checkedItem)];
        dispatch(mapActions.updateLayerVisibility(newLayerVisibility));
      }
    },
    [dispatch, isSyncedWithWaveformZoom, layerVisibility]
  );

  const interactionHandler = useInteractionHandler(
    setPhaseMenuVisibilityCb,
    setEventId,
    setCreateEventMenuState
  );

  // on mount use effect
  React.useEffect(
    () => {
      document.addEventListener('keydown', clearEventTooltip);
      document.addEventListener('keydown', clearHoverTooltip);

      return () => {
        document.removeEventListener('keydown', clearEventTooltip);
        document.removeEventListener('keydown', clearHoverTooltip);
        // clear out the viewer ref to prevent memory leak
        setViewer(null);
      };
    },
    // We only want this to run onMount so we need no dependencies
    []
  );

  const { stationsVisibility } = useStationsVisibility();

  const canvas = document.getElementsByClassName('cesium-widget');

  React.useEffect(() => {
    // if the canvas exists set it to focusable
    if (canvas.length > 0) {
      canvas[0].setAttribute('tabindex', '0');
    }
  }, [canvas]);

  // Build data sources using custom hooks to split them into separate toggle data sources

  // Signal Detections
  const intervalSignalDetectionDataSource = useMapSignalDetectionSources(
    signalDetections,
    layerVisibility,
    stationsResult,
    EventFilterOptions.INTERVAL
  );

  const beforeSignalDetectionDataSource = useMapSignalDetectionSources(
    signalDetections,
    layerVisibility,
    stationsResult,
    EventFilterOptions.BEFORE
  );

  const afterSignalDetectionDataSource = useMapSignalDetectionSources(
    signalDetections,
    layerVisibility,
    stationsResult,
    EventFilterOptions.AFTER
  );

  // Event Locations
  const mapEventLocationSource = useMapEventLocationSource(
    layerVisibility,
    preferredEventsResult,
    nonPreferredEventsResult,
    setEventId
  );

  // Coverage Ellipses
  const mapEventCoverageEllipseSource = useMapEventUncertaintyEllipseSource(
    layerVisibility,
    preferredEventsResult,
    nonPreferredEventsResult,
    setEventId,
    UncertaintyEllipse.COVERAGE
  );

  // Confidence Ellipses
  const mapEventConfidenceEllipseSource = useMapEventUncertaintyEllipseSource(
    layerVisibility,
    preferredEventsResult,
    nonPreferredEventsResult,
    setEventId,
    UncertaintyEllipse.CONFIDENCE
  );

  // Stations and sites

  // Put stations in their own data source to prevent z-index bugs occurring between stations and sites
  // create entities from stations array

  const stationDataSource = useMapStationSource(
    layerVisibility,
    stationsResult,
    stationsVisibility,
    onStationClickHandler
  );

  // Put sites in their own data source to prevent z-index bugs occurring between stations and sites
  const siteDataSource = useMapSiteSource(layerVisibility, stationsResult, onStationClickHandler);

  const tooltipDataSource = React.useMemo(
    () => (
      <MapDataSource
        key="Tooltip"
        entities={[stationTooltipLabel, eventTooltipLabel]}
        name="Tooltip"
        show
      />
    ),
    []
  );

  const layerSelectionEntries = React.useMemo(
    () => layerSettings(onCheckedCallback, layerVisibility, isSyncedWithWaveformZoom, uiTheme),
    [isSyncedWithWaveformZoom, layerVisibility, onCheckedCallback, uiTheme]
  );

  const selectionInformation = useSelectionInformationControl(
    'mapselectioninfo',
    Displays.IanDisplays.MAP,
    setFocusToMap
  );

  return (
    <div className="ian-map-wrapper">
      <div>
        <Button
          type="button"
          id="layer-panel-button"
          className="map__layer-button cesium-button cesium-toolbar-button"
          title="Select map layers"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <Icon icon={IconNames.LAYERS} />
        </Button>
        <div
          className={`map__selection-information-button ${
            selectionInformation ? Classes.BUTTON : ''
          }`}
        >
          {selectionInformation}
        </div>
      </div>
      <IANConfirmOpenEventPopup
        isCurrentlyOpen={isCurrentlyOpen}
        setIsCurrentlyOpen={setIsCurrentlyOpen}
        eventId={eventId}
        setEventId={setEventId}
        parentComponentId="map"
      />
      <Map
        doMultiSelect={allowMultiSelect}
        selectedStations={selectedStations}
        selectedEvents={selectedEvents}
        selectedSdIds={selectedSdIds}
        dataSources={[
          stationDataSource,
          siteDataSource,
          tooltipDataSource,
          // !Signal detection sources
          intervalSignalDetectionDataSource,
          beforeSignalDetectionDataSource,
          afterSignalDetectionDataSource,
          // !Event sources
          mapEventLocationSource,
          mapEventCoverageEllipseSource,
          mapEventConfidenceEllipseSource
        ]}
        minHeightPx={MAP_MIN_HEIGHT_PX}
        handlers={[interactionHandler]}
      />
      <MapLayerPanelDrawer
        layerSelectionEntries={layerSelectionEntries}
        isDrawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
        drawerClassName="ian-select-map-layers"
        title="Select Map Layers"
        checkboxOnChangeCallback={onCheckedCallback}
      />
    </div>
  );
}

/**
 * If map entities change, reload map display
 * Extracted for readability and testing
 *
 * @param prevProps
 * @param nextProps
 */
export const mapPanelMemoCheck = (prevProps: MapPanelProps, nextProps: MapPanelProps): boolean => {
  // if false, reload
  if (!prevProps?.stationsResult) {
    return false;
  }

  // if signal detections have changed reload
  if (nextProps?.signalDetections && prevProps.signalDetections !== nextProps.signalDetections) {
    return false;
  }
  // if preferred events have changed reload
  if (
    nextProps?.preferredEventsResult &&
    prevProps.preferredEventsResult !== nextProps.preferredEventsResult
  ) {
    return false;
  }
  // if non-preferred events have changed reload
  if (
    nextProps?.nonPreferredEventsResult &&
    prevProps.nonPreferredEventsResult !== nextProps.nonPreferredEventsResult
  ) {
    return false;
  }

  // if stations have changed reload
  if (nextProps?.stationsResult && prevProps.stationsResult !== nextProps.stationsResult) {
    return false;
  }
  return true;
};

export const MapPanel = React.memo(MapPanelComponent, mapPanelMemoCheck);
