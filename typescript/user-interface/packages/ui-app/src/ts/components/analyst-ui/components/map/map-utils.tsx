import type { ChannelTypes, CommonTypes, EventTypes } from '@gms/common-model';
import { SignalDetectionTypes, StationTypes } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type { Event } from '@gms/common-model/lib/event';
import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  dateToString,
  Logger,
  toDate
} from '@gms/common-util';
import type { AnalystWorkspaceTypes, AppDispatch, EventStatus } from '@gms/ui-state';
import { analystActions, GLDisplayState, setSelectedStationIds } from '@gms/ui-state';
import * as Cesium from 'cesium';
import produce from 'immer';
import uniqWith from 'lodash/uniqWith';
import React from 'react';
import type { CesiumMovementEvent, EventTarget } from 'resium';
import { Entity } from 'resium';

import {
  HOVER_SIGNAL_DETECTION_WIDTH,
  SIGNAL_DETECTION_WIDTH
} from '~common-ui/components/map/constants';

import { buildEventRow } from '../events/events-util';
import type { EventFilterOptions } from '../events/types';
import { getSDPolylineHoverColor } from './cesium-map-utils';
import type { MapEventSource, MapSDEntityPropertyBagDefinitions } from './types';
import { UncertaintyEllipse } from './types';

const logger = Logger.create('GMS_LOG_MAP', process.env.GMS_LOG_MAP);

/**
 * Given the position of the mouse on the cesium map,
 * it will attempt to return the entity the mouse is hovering over.
 * If there is no entity below the mouse, function returns undefined.
 *
 * @param viewer: the cesium map
 * @param endPosition: mouse position to be checked for an entity
 */
export const getObjectFromPoint = (viewer: Cesium.Viewer, endPosition: Cesium.Cartesian2) => {
  let pickedFeature;
  try {
    pickedFeature = viewer.scene.pick(endPosition);
  } catch (err) {
    logger.error(err);
    return undefined;
  }
  if (Cesium.defined(pickedFeature)) {
    // id is actually an object not a string
    return pickedFeature.id;
  }
  return undefined;
};

export const stationTypeToFriendlyNameMap: Map<StationTypes.StationType, string> = new Map([
  [StationTypes.StationType.SEISMIC_3_COMPONENT, 'Single Station'],
  [StationTypes.StationType.SEISMIC_1_COMPONENT, 'Single Station'],
  [StationTypes.StationType.SEISMIC_ARRAY, 'Array'],
  [StationTypes.StationType.HYDROACOUSTIC, 'Single Station'],
  [StationTypes.StationType.HYDROACOUSTIC_ARRAY, 'Array'],
  [StationTypes.StationType.INFRASOUND, 'Single Station'],
  [StationTypes.StationType.INFRASOUND_ARRAY, 'Array'],
  [StationTypes.StationType.WEATHER, 'Single Station'],
  [StationTypes.StationType.UNKNOWN, 'Unknown']
]);

/**
 * Converts a number to the nearest three decimal places for
 * display in the map tooltip
 *
 * @param num
 * @returns the number fixed to three decimal places
 */
export function formatNumberForTooltipDisplay(num: number): string {
  return num.toFixed(3);
}

/**
 * Given a Station or ChannelGroup Location, returns a Cesium Cartesian3 position with the elevation set to zero.
 * Elevation is set to zero when adding Stations and ChannelGroups/Sites to the map to prevent bug where polylines
 * don't appear on MapMode2D.ROTATE
 *
 *
 * @param location
 */
export function createCartesianFromLocationZeroElevation(
  location: CommonTypes.Location
): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(location.longitudeDegrees, location.latitudeDegrees, 0);
}

/**
 * Send me a type string and I'll tell you if it's a channel group or station
 *
 * @param type
 */
export function isSiteOrStation(type: string): boolean {
  return type === 'ChannelGroup' || type === 'Station';
}

/**
 *  Returns the bounding rectangle for the cesium map widget. This allows us to display html external to the map
 *  relative to the map position (such as map context menus) by giving us the map offset on the screen.
 */
export function getMapBoundingRectangle(): DOMRect {
  const canvas = document.getElementsByClassName('cesium-widget');
  return canvas[0]?.getBoundingClientRect() ?? undefined;
}

/**
 * Returns coordinates for the position of the mouse on the browser window given cesium map coordinates
 * by adding that to the offset of the map canvas on the screen
 *
 * @param movement Cesium mouse movement to pull mouse position from
 * @returns an object containing the x, y coordinates for the position of the mouse
 */
export function getMousePositionFromCesiumMovement(movement: CesiumMovementEvent): {
  x: number;
  y: number;
} {
  const mapPosition = getMapBoundingRectangle();
  const x = Number(movement.position.x) + Number(mapPosition?.x);
  const y = Number(movement.position.y) + Number(mapPosition?.y);
  return { x, y };
}

type EntityProps = React.ComponentProps<typeof Entity>;
interface CustomEntityExtraProps extends EntityProps {
  onMount: () => void;
}

/**
 * This adds onClick and onDoubleClick handlers to each entity to prevent click/dbl-click misfires
 *
 * @returns a Resium entity
 */
function CustomEntity(props: CustomEntityExtraProps) {
  const { onMount, onClick, onDoubleClick } = props;
  const singleClickTimer = React.useRef<NodeJS.Timeout | undefined>();

  /**
   * Referentially stable click handler, prevents {@link onClick}
   * from firing during a double-click
   */
  const delayedOnClick = React.useCallback(
    (movement: CesiumMovementEvent, target: EventTarget) => {
      if (onClick) {
        const timeout = 200;
        if (singleClickTimer.current) clearTimeout(singleClickTimer.current);
        singleClickTimer.current = setTimeout(() => {
          onClick(movement, target);
        }, timeout);
      }
    },
    [onClick]
  );

  /**
   * Referentially stable click handler, prevents {@link onClick}
   * from firing during a double-click
   */
  const delayedOnDoubleClick = React.useCallback(
    (movement: CesiumMovementEvent, target: EventTarget) => {
      if (onDoubleClick) {
        if (singleClickTimer.current) clearTimeout(singleClickTimer.current);
        onDoubleClick(movement, target);
      }
    },
    [onDoubleClick]
  );

  React.useEffect(() => {
    if (onMount) {
      onMount();
    }
    // Only run the first time to make sure we just trigger on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Entity {...props} onClick={delayedOnClick} onDoubleClick={delayedOnDoubleClick} />;
}

/**
 * Takes Cesium entities and maps them to Resium component entities
 *
 * @param entities
 * @param onClickHandler
 * @param onRightClickHandler
 * @param onDoubleClickHandler
 * @param onMount
 * @returns
 */
export const mapIanEntitiesToEntityComponent = (
  entities: Cesium.Entity[],
  onClickHandler?: (targetEntity: Cesium.Entity) => () => void,
  onRightClickHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void,
  onDoubleClickHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void,
  onMouseEnterHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void,
  onMouseLeaveHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void,
  onMount?: () => void
): JSX.Element[] =>
  entities.map((ianEntity: Cesium.Entity) => {
    return (
      <CustomEntity
        onMount={onMount}
        id={ianEntity.id}
        label={ianEntity.label}
        key={ianEntity.id}
        name={ianEntity.name}
        billboard={ianEntity.billboard}
        show={ianEntity.show}
        properties={ianEntity.properties}
        position={
          ianEntity.position ? ianEntity.position.getValue(Cesium.JulianDate.now()) : undefined
        }
        polyline={ianEntity.polyline}
        ellipse={ianEntity.ellipse}
        onClick={onClickHandler ? onClickHandler(ianEntity) : undefined}
        onRightClick={
          onRightClickHandler
            ? (movement, target) => onRightClickHandler(movement, target)
            : undefined
        }
        onDoubleClick={
          onDoubleClickHandler
            ? (movement, target) => onDoubleClickHandler(movement, target)
            : undefined
        }
        onMouseEnter={
          onMouseEnterHandler ? (movement, target) => onMouseEnterHandler(movement, target) : null
        }
        onMouseLeave={
          onMouseLeaveHandler ? (movement, target) => onMouseLeaveHandler(movement, target) : null
        }
      />
    );
  });

/**
 * Returns true if 'waveform-display' is included in the provided map
 *
 * @param openDisplays
 */
export function waveformDisplayIsOpen(openDisplays: Record<string, GLDisplayState>): boolean {
  if (!openDisplays) return false;
  return openDisplays[IanDisplays.WAVEFORM] === GLDisplayState.OPEN;
}

/**
 * Set open event triggered from map and call the setEventId callback
 *
 * @param eventId event id
 * @param dispatch AppDispatch
 * @param setEventId set event id callback from parent component
 */
export const dispatchSetEventId = (
  eventId: string,
  dispatch: AppDispatch,
  setEventId: (eventId: string) => void
): void => {
  dispatch(analystActions.setMapOpenTriggered(true));
  setEventId(eventId);
};

/**
 * returns the onDoubleClickHandler function used for bringing up an event context menu on the map
 *
 * @param dispatch
 * @param openEventId the open event ID. Used to determine if the clicked on event is open
 * @param openEvent the function call to open an event
 * @param closeEvent the function call to close an event
 */
export const getEventOnDoubleClickHandlers = (
  dispatch: AppDispatch,
  openEventId: string,
  closeEvent: (id: string) => Promise<void>,
  setEventId: (eventId: string) => void
): ((movement: CesiumMovementEvent, target: EventTarget) => void) => {
  function onDoubleClickHandler(_movement: CesiumMovementEvent, target: EventTarget): void {
    if (target?.id instanceof Cesium.Entity) {
      // if open, then close
      // we don't care about the promise so ignore the return
      if (target.id.properties.id.getValue() === openEventId) {
        dispatch(analystActions.setMapOpenTriggered(false));
        closeEvent(target.id.properties.id.getValue())
          .catch(e => logger.error('Error closing event', e))
          .finally(() => {
            setEventId(undefined);
          });
      }
      // else open
      else {
        dispatch(analystActions.setMapOpenTriggered(true));
        setEventId(target.id.properties.id.getValue());
      }
      dispatch(analystActions.setSelectedEventIds([target.id.properties.id.getValue()]));
    }
  }
  return onDoubleClickHandler;
};

/**
 * Determines if an interval is selected by ensuring it is defined,
 * and includes startTimeSecs and endTimeSecs values
 *
 * @param currentInterval
 */
export function intervalIsSelected(currentInterval: CommonTypes.TimeRange): boolean {
  return (
    !!currentInterval &&
    (!!currentInterval?.startTimeSecs || currentInterval?.startTimeSecs === 0) &&
    (!!currentInterval?.endTimeSecs || currentInterval?.endTimeSecs === 0)
  );
}

/**
 * Process the items to select from the Cesium.CustomDataSource
 *
 * @param rectangle Cesium Rectangle
 * @param ds Cesium Custom DataSource
 */
export const processItemsToSelect = (
  rectangle: Cesium.Rectangle,
  ds: Cesium.CustomDataSource
): string[] => {
  const north = Cesium.Math.toDegrees(rectangle.north);
  const south = Cesium.Math.toDegrees(rectangle.south);
  const west = Cesium.Math.toDegrees(rectangle.west);
  const east = Cesium.Math.toDegrees(rectangle.east);
  const itemsToSelect = [];
  ds.entities.values.forEach(entity => {
    /*
     * Create a new Cartographic instance from a Cartesian position.
     * The values in the resulting object will be in radians.
     */
    const cartographicPosition = Cesium.Cartographic.fromCartesian(
      entity.position.getValue(Cesium.JulianDate.now())
    );

    // Convert radians to degrees for comparing with the bounding box coordinates.
    const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
    const lon = Cesium.Math.toDegrees(cartographicPosition.longitude);

    if (lat <= north && lat >= south && lon >= west && lon <= east) {
      itemsToSelect.push(entity.id);
    }
  });
  return itemsToSelect;
};

/**
 * Find Map entities that fall within a bounding box, inclusive of rectangle edges.
 *
 * @param rectangle the holder of lat and lon values.
 * @param viewer the Cesium.Viewer
 */
export const selectEntitiesInBox = (
  rectangle: Cesium.Rectangle,
  viewer: Cesium.Viewer
): string[] => {
  let itemsToSelect = [];

  try {
    const ds: Cesium.CustomDataSource = viewer.dataSources.getByName('Stations')[0];

    if (ds) {
      itemsToSelect = processItemsToSelect(rectangle, ds);
    }
  } catch (e) {
    logger.error('Error occurred locating an entity within the bounding box: ', e);
  }

  return itemsToSelect;
};

/**
 * Given current lat long and direction along with a distance, returns a Cesium.Cartographic
 * with the new location
 *
 * @param bearingDeg Azimuth direction from north
 * @param distance length until the new point
 * @param startLatDeg Receiver lat
 * @param startLonDeg Receiver lon
 * @param radius radius of the earth defaulted
 * @returns Cesium.Cartographic
 */
export const destGivenBearingStartDistance = (
  bearingDeg: number,
  distance: number,
  startLatDeg: number,
  startLonDeg: number,
  radius = 6371e3
): Cesium.Cartographic => {
  const HALF_CIRCLE_DEGREES = 180;
  const start = Cesium.Cartographic.fromDegrees(startLonDeg, startLatDeg);
  const bearingRad = (bearingDeg * Math.PI) / HALF_CIRCLE_DEGREES;
  const angDisRad = distance / radius;
  const sinDestinationLat =
    Math.sin(start.latitude) * Math.cos(angDisRad) +
    Math.cos(start.latitude) * Math.sin(angDisRad) * Math.cos(bearingRad);
  const destinationLatRad = Math.asin(sinDestinationLat);
  const y = Math.sin(bearingRad) * Math.sin(angDisRad) * Math.cos(start.latitude);
  const x = Math.cos(angDisRad) - Math.sin(start.latitude) * sinDestinationLat;
  const lon2Rad = start.longitude + Math.atan2(y, x);

  return Cesium.Cartographic.fromRadians(lon2Rad, destinationLatRad);
};

/**
 * Given a ChannelGroup array and Station Location, this function returns an array of ChannelGroups that are unique by
 * latitude and longitude with respect to all other ChannelGroups and the Station Location
 *
 * Two ChannelGroups that have the same latitude and longitude but have a different elevation are not considered unique
 *
 * When duplicate ChannelGroups are found, the first one in the array is kept
 *
 * When a ChannelGroup Location matches the stationLocation, it is dropped (Station trumps ChannelGroup)
 *
 * @param channelGroups The array to be reduced
 * @param stationLocation Any ChannelGroup Locations that match the Station Location will also be dropped
 */
export function getUniquelyLocatedChannelGroups(
  channelGroups: ChannelTypes.ChannelGroup[],
  stationLocation: CommonTypes.Location
): ChannelTypes.ChannelGroup[] {
  if (!channelGroups || channelGroups.length === 0) return [];

  // get array of ChannelGroups with unique locations
  const uniquelyLocatedChannelGroups = uniqWith(
    channelGroups,
    (cg1, cg2) =>
      cg1?.location?.longitudeDegrees === cg2?.location?.longitudeDegrees &&
      cg1?.location?.latitudeDegrees === cg2?.location?.latitudeDegrees
  );

  // drop any channel groups that match the station location and return the more unique list
  return uniquelyLocatedChannelGroups.filter(channelGroup => {
    return (
      channelGroup?.location?.longitudeDegrees !== stationLocation?.longitudeDegrees &&
      channelGroup?.location?.latitudeDegrees !== stationLocation?.latitudeDegrees
    );
  });
}

/**
 *  Given a station name and an array of stations,
 *  Return the station's location
 *
 * @param stationName
 * @param stations
 */
export function getStationLocation(
  stationName: string,
  stations: StationTypes.Station[]
): CommonTypes.Location {
  const stationData = stations.find(station => station.name === stationName);
  return stationData?.location;
}

/**
 * Given a position and reference to the viewer, determines the lat/lon (in degrees).
 *
 * @return latitude/longitude object in degrees if viewer scene is defined, otherwise undefined
 */
export const getLatLonFromCesiumMovement = (
  movement: CesiumMovementEvent,
  viewer: Cesium.Viewer
):
  | {
      latitude: number;
      longitude: number;
    }
  | undefined => {
  const { scene } = viewer;
  if (!scene) return undefined;

  const { ellipsoid } = scene.globe;
  const position = movement?.position ? movement.position : movement.startPosition; // Cesium movement event either has "position", or it has a start and end position
  const mousePositionCartesian = scene.camera.pickEllipsoid(position, ellipsoid);
  if (!mousePositionCartesian) return undefined;
  const { latitude, longitude } = ellipsoid.cartesianToCartographic(mousePositionCartesian);
  return { latitude: Cesium.Math.toDegrees(latitude), longitude: Cesium.Math.toDegrees(longitude) };
};

/**
 * Select/De-Select Entities on the Map given these conditions:
 *
 * Single click on a station:
 * If the station clicked is part of a selected group, de-select members
 * of the group except the one clicked.
 *
 * CTRL or SHIFT click on a station:
 * If the station clicked is part of a selected group, de-select it; otherwise, select it.
 */
export const applyStationMultiSelectionLogic = (
  dispatch: AppDispatch,
  selectedStations: string[],
  id: string
): void => {
  if (selectedStations?.includes(id)) {
    dispatch(setSelectedStationIds(selectedStations.filter(item => item !== id)));
  } else {
    dispatch(setSelectedStationIds([...(selectedStations || []), id]));
  }
};

/**
 * Select/De-Select events on the event list display or map display given these conditions:
 *
 * Single click on an event:
 * If the event clicked is part of a selected group, de-select members
 * of the group except the one clicked.
 *
 * CTRL or SHIFT click on a event:
 * If the event clicked is part of a selected group, de-select it; otherwise, select it.
 */
export const applyEventMultiSelectionLogic = (
  dispatch: AppDispatch,
  selectedEventIds: string[],
  id: string
): void => {
  if (selectedEventIds?.includes(id)) {
    dispatch(analystActions.setSelectedEventIds(selectedEventIds.filter(item => item !== id)));
  } else {
    dispatch(analystActions.setSelectedEventIds([...(selectedEventIds || []), id]));
  }
};

/**
 * Select/De-Select SDs on the map display given these conditions:
 *
 * Single click on an SD:
 * If the SD clicked is part of a selected group, de-select members
 * of the group except the one clicked.
 *
 * CTRL or SHIFT click on an SD:
 * If the SD clicked is part of a selected group, de-select it; otherwise, select it.
 */
export const applySdMultiSelectionLogic = (
  dispatch: AppDispatch,
  selectedSdIds: string[],
  id: string
): void => {
  if (selectedSdIds?.includes(id)) {
    dispatch(analystActions.setSelectedSdIds(selectedSdIds.filter(item => item !== id)));
  } else {
    dispatch(analystActions.setSelectedSdIds([...(selectedSdIds || []), id]));
  }
};

/**
 * Build an event source for the map display
 *
 * @param event
 * @param eventHypothesis
 * @param locationSolution
 * @param timeRange
 * @param findEventStatusQueryData
 * @param isOpen
 */
export const buildMapEventSource = (
  eventDataForSource: {
    event: Event;
    eventStatus: EventStatus;
    eventIsOpen: boolean;
    eventInConflict: boolean;
    eventIsActionTarget: boolean;
  },
  locationSolution: EventTypes.LocationSolution,
  openIntervalName: string,
  timeRange: CommonTypes.TimeRange,
  actionType: AnalystWorkspaceTypes.EventActionTypes
): MapEventSource => {
  const { event, eventStatus, eventIsOpen, eventInConflict, eventIsActionTarget } =
    eventDataForSource;
  const initialRow = buildEventRow(
    {
      event,
      eventStatus,
      eventIsOpen,
      eventInConflict,
      eventIsActionTarget
    },
    openIntervalName,
    timeRange,
    actionType
  );
  // events
  return {
    ...initialRow,
    geoOverlappingEvents: undefined
  };
};

/**
 * Generates signal detection properties for map display tooltip and popover interactions
 */
export const getSignalDetectionEntityProps = (
  signalDetection: SignalDetectionTypes.SignalDetection,
  signalDetectionBaseColor: string,
  status: SignalDetectionTypes.SignalDetectionStatus,
  edgeSDType: EventFilterOptions,
  associatedEventTime: number | null,
  isSelectedOrActionTarget: boolean
): MapSDEntityPropertyBagDefinitions => {
  const sdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection.signalDetectionHypotheses
  );
  const currentHypothesisFeatureMeasurements = sdHypothesis.featureMeasurements;

  const detectionTime = {
    detectionTimeValue: dateToString(
      toDate(
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
          currentHypothesisFeatureMeasurements
        )?.arrivalTime?.value
      ),
      DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
    ),
    detectionTimeUncertainty: SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
      currentHypothesisFeatureMeasurements
    )?.arrivalTime?.standardDeviation
  };

  const azimuth = {
    azimuthValue: SignalDetectionTypes.Util.findAzimuthFeatureMeasurementValue(
      currentHypothesisFeatureMeasurements
    ).measuredValue.value,
    azimuthUncertainty: SignalDetectionTypes.Util.findAzimuthFeatureMeasurementValue(
      currentHypothesisFeatureMeasurements
    ).measuredValue.standardDeviation
  };

  const slowness = {
    slownessValue: SignalDetectionTypes.Util.findSlownessFeatureMeasurementValue(
      currentHypothesisFeatureMeasurements
    ).measuredValue.value,
    slownessUncertainty: SignalDetectionTypes.Util.findSlownessFeatureMeasurementValue(
      currentHypothesisFeatureMeasurements
    ).measuredValue.standardDeviation
  };

  const phaseValue = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
    currentHypothesisFeatureMeasurements
  );

  const stationName = signalDetection.station?.name;

  let associated = false;
  let associatedEventTimeValue = '';

  if (associatedEventTime != null) {
    associated = true;
    associatedEventTimeValue = dateToString(
      toDate(associatedEventTime),
      DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
    );
  }

  return {
    id: signalDetection.id,
    type: 'Signal detection',
    detectionTime,
    azimuth,
    slowness,
    phaseValue,
    deleted: sdHypothesis.deleted,
    associated,
    associatedEventTimeValue,
    signalDetectionBaseColor,
    status,
    edgeSDType,
    stationName,
    isSelectedOrActionTarget
  };
};

/**
 * onMouseEnter handler for signal detections
 * adjusts color and width
 */
export const sdOnMouseEnterHandler = (_movement: CesiumMovementEvent, target: EventTarget) => {
  try {
    const signalDetectionBaseColor =
      target.id.properties.signalDetectionBaseColor.getValue() || '#FFFFFF';
    if (!target.id.properties.isSelectedOrActionTarget.getValue()) {
      /* eslint-disable no-param-reassign */
      target.id.polyline.width = new Cesium.ConstantProperty(HOVER_SIGNAL_DETECTION_WIDTH);
      (target.id.polyline.material as any).color = Cesium.Color.fromCssColorString(
        getSDPolylineHoverColor(signalDetectionBaseColor)
      );
      /* eslint-enable no-param-reassign */
    }
  } catch (err) {
    logger.error(err);
  }
};

/**
 * onMouseLeave handler for signal detections
 * reverts color and width
 */
export const sdOnMouseLeaveHandler = (_movement: CesiumMovementEvent, target: EventTarget) => {
  try {
    const signalDetectionBaseColor =
      target.id.properties.signalDetectionBaseColor.getValue() || '#FFFFFF';
    if (!target.id.properties.isSelectedOrActionTarget.getValue()) {
      /* eslint-disable no-param-reassign */
      target.id.polyline.width = new Cesium.ConstantProperty(SIGNAL_DETECTION_WIDTH);
      (target.id.polyline.material as any).color =
        Cesium.Color.fromCssColorString(signalDetectionBaseColor);
      /* eslint-enable no-param-reassign */
    }
  } catch (err) {
    logger.error(err);
  }
};

/**
 * uses immer to update the geoOverlappingEvents attribute of MapEventSource array
 *
 * @param eventsData
 * @returns updatedEventsData
 */
export const updateMapEventSources = (
  eventsData: MapEventSource[],
  layerVisibility
): MapEventSource[] => {
  const eventsByLatLong = {};

  // find events with matching locations, group them together
  eventsData.forEach(mapEventSource => {
    // skip rejected and deleted events if they are not visible on the map
    if (
      (mapEventSource.deleted && !layerVisibility.eventsDeleted) ||
      (mapEventSource.rejected && !layerVisibility.eventsRejected)
    )
      return;

    const key = `${mapEventSource.latitudeDegrees}_${mapEventSource.longitudeDegrees}`;

    if (eventsByLatLong[key]) {
      eventsByLatLong[key].push(mapEventSource.id);
    } else {
      eventsByLatLong[key] = [mapEventSource.id];
    }
  });

  // update the MapEventSource object with geoOverlappingEvents
  const updatedEventsData = produce(eventsData, draft => {
    draft.forEach(mapEventSource => {
      const key = `${mapEventSource.latitudeDegrees}_${mapEventSource.longitudeDegrees}`;
      const n = eventsByLatLong[key]?.length;
      mapEventSource.geoOverlappingEvents = n > 1 ? n : undefined;
    });
  });
  return updatedEventsData;
};

/**
 * Returns a color material property or dash material property depending on type of uncertainty ellipse
 *
 * @param color
 * @param uncertaintyEllipse
 */
export const getUncertaintyEllipsePolylineMaterial = (
  color: Cesium.Color,
  uncertaintyEllipse: UncertaintyEllipse
): Cesium.ColorMaterialProperty | Cesium.PolylineDashMaterialProperty => {
  if (uncertaintyEllipse === UncertaintyEllipse.COVERAGE) {
    return new Cesium.ColorMaterialProperty(color);
  }
  return new Cesium.PolylineDashMaterialProperty({ color });
};

/**
 * Sets focus to map panel
 */
export function setFocusToMap(): void {
  const mapHotkeys = document.getElementsByClassName('map-hotkeys');
  const mapHotkeysElement = mapHotkeys[0] as HTMLElement;
  mapHotkeysElement.focus();
}

/**
 * @return the {@link Map-hotkeys} dom element
 */
export function getMapElement(): HTMLElement {
  return document.getElementsByClassName('map-hotkeys')[0] as HTMLElement;
}
