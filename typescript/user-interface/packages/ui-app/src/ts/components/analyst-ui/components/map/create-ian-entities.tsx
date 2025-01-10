import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { ConfigurationTypes, EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { getLocationToEventDistance } from '@gms/common-model/lib/event/util';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import { toSentenceCase } from '@gms/common-util';
import type { AnalystWaveformTypes } from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import {
  Cartesian3,
  Cartographic,
  Color,
  ColorMaterialProperty,
  ConstantPositionProperty,
  EllipseOutlineGeometry,
  Entity,
  Math as CesiumMath
} from 'cesium';

import { findEventHypothesesForDetection } from '~analyst-ui/common/utils/event-util';
import {
  createBillboard,
  createLabel,
  createPolyline,
  determineEventEyeOffset,
  getSDPolylineBaseColorHex,
  getSDPolylineMaterial
} from '~analyst-ui/components/map/cesium-map-utils';
import { buildStationTriangle } from '~analyst-ui/components/map/img/station-triangle';
import {
  alwaysDisplayDistanceDisplayCondition,
  BILLBOARD_HEIGHT_SELECTED,
  BILLBOARD_HEIGHT_UNSELECTED_CHANNEL,
  BILLBOARD_HEIGHT_UNSELECTED_STATION,
  channelGroupDistanceDisplayCondition,
  eventDistanceDisplayCondition,
  lineDistanceDisplayCondition,
  SIGNAL_DETECTION_WIDTH,
  stationDistanceDisplayCondition,
  UNCERTAINTY_ELLIPSE_ROTATION_OFFSET,
  uncertaintyEllipseGranularity,
  uncertaintyEllipseWidthPx
} from '~common-ui/components/map/constants';

import { EventFilterOptions, EventLifecycle } from '../events/types';
import { buildEventCircle } from './img/event-circle';
import { buildSelectedEventCircle } from './img/selected-event-circle';
import {
  createCartesianFromLocationZeroElevation,
  destGivenBearingStartDistance,
  formatNumberForTooltipDisplay,
  getSignalDetectionEntityProps,
  getStationLocation,
  getUncertaintyEllipsePolylineMaterial,
  stationTypeToFriendlyNameMap
} from './map-utils';
import type {
  MapEventSource,
  MapSDEntityPropertyBagDefinitions,
  UncertaintyEllipse
} from './types';

const logger = UILogger.create('CREATE_IAN_ENTITIES', process.env.GMS_LOG_TOOLBAR);

/**
 * Returns the configured color for a station or site on the map from the current theme as a Color. If the current theme
 * does not have a value configured for mapStationDefault or mapVisibleStation, uses the value from the default theme
 *
 * @param isVisibleStation sites are not visible stations, pass false for this if getting site color
 * @param uiTheme current UITheme
 */
export function getStationOrSiteColor(
  isVisibleStation: boolean,
  uiTheme: ConfigurationTypes.UITheme
): Color {
  const defaultColorString =
    uiTheme?.colors?.mapStationDefault ?? ConfigurationTypes.defaultColorTheme.mapStationDefault;
  const visibleColorString =
    uiTheme?.colors?.mapVisibleStation ?? ConfigurationTypes.defaultColorTheme.mapVisibleStation;

  return Color.fromCssColorString(isVisibleStation ? visibleColorString : defaultColorString);
}

/**
 * Given a station, return a Cesium map Entity containing a label and a billboard (icon)
 *
 * @param station
 * @param selectedStations
 * @param stationVisibility
 * @param uiTheme for determining Station billboard color
 */
export function createMapEntityFromStation(
  station: StationTypes.Station,
  selectedStations: string[],
  stationVisibility: boolean,
  uiTheme: ConfigurationTypes.UITheme
): Entity {
  const isSelected = selectedStations?.indexOf(station.name) > -1;
  const entityProperties = {
    name: station.name,
    type: 'Station',
    selected: isSelected,
    coordinates: {
      longitude: formatNumberForTooltipDisplay(station.location.longitudeDegrees),
      latitude: formatNumberForTooltipDisplay(station.location.latitudeDegrees),
      elevation: formatNumberForTooltipDisplay(station.location.elevationKm)
    },
    statype: stationTypeToFriendlyNameMap.get(station.type)
  };

  const eyeOffSet = isSelected
    ? new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_SELECTED))
    : new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_UNSELECTED_STATION));

  const color = getStationOrSiteColor(stationVisibility, uiTheme);
  const entityOptions: Entity.ConstructorOptions = {
    id: station.name,
    name: station.name,
    show: true,
    label: createLabel(station, stationDistanceDisplayCondition, isSelected),
    billboard: createBillboard(isSelected, eyeOffSet, color, buildStationTriangle()),
    properties: entityProperties,
    position: createCartesianFromLocationZeroElevation(station.location)
  };
  return new Entity(entityOptions);
}

/**
 * Given a channelGroup, return a Cesium map Entity containing a billboard that represents the channelgroup location,
 * and a polyline that connects it back to the station.
 *
 * @param channelGroup
 * @param stationPosition
 * @param uiTheme For Site billboard color
 */
export function createMapEntityFromChannelGroup(
  channelGroup: ChannelTypes.ChannelGroup,
  stationPosition: Cartesian3,
  uiTheme: ConfigurationTypes.UITheme
): Entity {
  const isSelected = false; // cannot select channelGroups
  const entityProperties = {
    name: channelGroup.name,
    type: 'ChannelGroup',
    selected: isSelected,
    coordinates: {
      longitude: formatNumberForTooltipDisplay(channelGroup.location.longitudeDegrees),
      latitude: formatNumberForTooltipDisplay(channelGroup.location.latitudeDegrees),
      elevation: formatNumberForTooltipDisplay(channelGroup.location.elevationKm)
    }
  };
  // elevation is set to zero to prevent bug where polylines don't appear on MapMode2D.ROTATE
  const channelGroupPosition = createCartesianFromLocationZeroElevation(channelGroup.location);
  const eyeOffSet = isSelected
    ? new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_SELECTED))
    : new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_UNSELECTED_CHANNEL));
  const entityOptions: Entity.ConstructorOptions = {
    id: channelGroup.name,
    name: channelGroup.name,
    show: true,
    label: createLabel(channelGroup, channelGroupDistanceDisplayCondition, isSelected),
    billboard: createBillboard(
      isSelected,
      eyeOffSet,
      getStationOrSiteColor(false, uiTheme),
      buildStationTriangle()
    ),
    properties: entityProperties,
    position: channelGroupPosition,
    polyline: createPolyline(
      [channelGroupPosition, stationPosition],
      lineDistanceDisplayCondition,
      new ColorMaterialProperty(Color.fromCssColorString(uiTheme.colors.mapArraySiteLines)),
      1
    )
  };
  return new Entity(entityOptions);
}

/**
 * Given a station, return an array of Cesium Entities containing data for each of the station's uniquely
 * located (by lat, long) channel groups
 *
 * @param station - Station containing the sites to be converted into entities
 * @param uiTheme - For Station/site color configuration
 */
export function processChannelGroups(
  station: StationTypes.Station,
  uiTheme: ConfigurationTypes.UITheme
): Entity[] {
  if (!station.channelGroups || station.channelGroups.length === 0) return [];

  const stationLocation = createCartesianFromLocationZeroElevation(station.location);
  return station.channelGroups.map(channelGroup =>
    createMapEntityFromChannelGroup(channelGroup, stationLocation, uiTheme)
  );
}

/**
 * Given two points and a signal detection ID
 * Return an entity with a polyline representing a great circle path
 *
 * @param signalDetectionId
 * @param stationLocation
 * @param sourceLocation
 * @param isUnqualifiedActionTarget affects highlighting and appearance of the resulting entity's polyline
 * @param sdEntityProps parameter object to add to Cesium property bag
 * @param visibility entity visibility
 */
export function createCirclePathEntity(
  signalDetectionId: string,
  stationLocation: Cartesian3,
  sourceLocation: Cartesian3,
  isUnqualifiedActionTarget: boolean,
  sdEntityProps: MapSDEntityPropertyBagDefinitions,
  visibility: boolean
): Entity {
  const entityOptions: Entity.ConstructorOptions = {
    id: signalDetectionId,
    name: signalDetectionId,
    show: visibility,
    position: stationLocation,
    polyline: createPolyline(
      [stationLocation, sourceLocation],
      alwaysDisplayDistanceDisplayCondition,
      getSDPolylineMaterial(
        sdEntityProps.isSelectedOrActionTarget,
        isUnqualifiedActionTarget,
        new ColorMaterialProperty(Color.fromCssColorString(sdEntityProps.signalDetectionBaseColor))
      ),
      SIGNAL_DETECTION_WIDTH,
      sdEntityProps.isSelectedOrActionTarget
    ),
    properties: sdEntityProps
  };

  return new Entity(entityOptions);
}

/**
 * Given a signal detection
 * Return a cesium entity with a great circle path polyline
 *
 * @param signalDetectionArgs SD, edge type, status, visibility, length in meters, associated event time
 * @param isSelected
 * @param areActionTargetsPresent
 * @param isActionTarget
 * @param stations
 * @param uiTheme
 * @param isUnqualifiedActionTarget
 */
export function processSignalDetection(
  signalDetectionArgs: {
    signalDetection: SignalDetectionTypes.SignalDetection;
    edgeSDType: EventFilterOptions;
    status: SignalDetectionTypes.SignalDetectionStatus;
    sdVisibility: boolean;
    signalDetectionLengthMeters: number;
    associatedEventTime: number | null;
  },
  isSelected: boolean,
  areActionTargetsPresent: boolean,
  isActionTarget: boolean,
  stations: StationTypes.Station[],
  uiTheme: UITheme,
  isUnqualifiedActionTarget: boolean
): Entity {
  // get most recent hypothesis
  if (
    !signalDetectionArgs.signalDetection?.signalDetectionHypotheses ||
    signalDetectionArgs.signalDetection.signalDetectionHypotheses.length === 0
  ) {
    return null;
  }
  const {
    signalDetection,
    edgeSDType,
    status,
    sdVisibility,
    signalDetectionLengthMeters,
    associatedEventTime
  } = signalDetectionArgs;

  // determine station location
  const stationLocation = getStationLocation(signalDetection.station.name, stations);
  if (!stationLocation) return null;

  const signalDetectionBaseColor = getSDPolylineBaseColorHex(
    uiTheme,
    status,
    edgeSDType,
    areActionTargetsPresent,
    isActionTarget
  );

  const sdEntityProps = getSignalDetectionEntityProps(
    signalDetection,
    signalDetectionBaseColor,
    status,
    edgeSDType,
    associatedEventTime,
    isSelected || isActionTarget
  );

  // calculate source location
  const sourceLocation = Cartographic.toCartesian(
    destGivenBearingStartDistance(
      sdEntityProps.azimuth.azimuthValue,
      signalDetectionLengthMeters,
      stationLocation.latitudeDegrees,
      stationLocation.longitudeDegrees
    )
  );
  const stationCartesian = createCartesianFromLocationZeroElevation(stationLocation);

  // create entity containing polyline
  return createCirclePathEntity(
    signalDetection.id,
    stationCartesian,
    sourceLocation,
    isUnqualifiedActionTarget,
    sdEntityProps,
    sdVisibility
  );
}

/**
 * Given an array of Stations, parses through the array to create a Cesium Entity array for each Station
 * with proper labels, icons, and distanceDisplayConditions
 *
 * @param stations
 * @param selectedStations
 * @param stationsVisibility
 * @param uiTheme for determining Station billboard color
 */
export function createStationEntitiesFromStationArray(
  stations: StationTypes.Station[],
  selectedStations: string[],
  stationsVisibility: AnalystWaveformTypes.StationVisibilityChangesDictionary,
  uiTheme: ConfigurationTypes.UITheme
): Entity[] {
  const entities: Entity[] = [];

  if (!stations?.length) {
    return entities;
  }

  stations.forEach(station => {
    entities.push(
      createMapEntityFromStation(
        station,
        selectedStations,
        stationsVisibility ? stationsVisibility[station.name]?.visibility : undefined,
        uiTheme
      )
    );
  });
  return entities;
}

/**
 * Given an array of Stations, parses through the array to create a Cesium Entity array for each
 * uniquely located (by long, lat) ChannelGroup with proper labels, icons, and distanceDisplayConditions
 *
 * @param stations containing the Sites/ChannelGroups that we want to create entities for
 * @param uiTheme for determining Site Billboard Color
 */
export function createSiteEntitiesFromStationArray(
  stations: StationTypes.Station[],
  uiTheme: ConfigurationTypes.UITheme
): Entity[] {
  const entities: Entity[] = [];

  if (!!stations && stations.length > 0) {
    stations.forEach(station => {
      processChannelGroups(station, uiTheme).forEach(entity => entities.push(entity));
    });
  }

  return entities;
}

/**
 * If an SD is associated to an event, calculates a unique source to event distance and associated event time
 *
 * @param signalDetection
 * @param status
 * @param signalDetectionLengthMeters
 * @param stations
 * @param events
 * @param openIntervalName
 */
function getSignalDetectionAssociationArgs(
  signalDetection: SignalDetectionTypes.SignalDetection,
  status: SignalDetectionTypes.SignalDetectionStatus,
  signalDetectionLengthMeters: number | null,
  stations: StationTypes.Station[],
  events?: EventTypes.Event[],
  openIntervalName?: string
): [number | null, number | null] {
  let sourceToEventDistance = signalDetectionLengthMeters;
  let associatedEventTime = null;
  if (
    (status === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED ||
      status === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED ||
      status === SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED) &&
    !!events &&
    !!events.length &&
    !!openIntervalName
  ) {
    const eventHypotheses: EventTypes.EventHypothesis[] = findEventHypothesesForDetection(
      signalDetection,
      events,
      openIntervalName
    );
    if (eventHypotheses.length === 0) {
      // shouldn't ever happen but if it does log an error and move on instead of blowing up
      logger.error(
        `No associated eventHypotheses found for provided signal detection id: ${signalDetection.id}`
      );
      return [sourceToEventDistance, associatedEventTime];
    }
    const eventHypothesis = eventHypotheses[0];
    const event = events.find(e => e.id === eventHypothesis.id.eventId);

    const locationSolution = EventTypes.findPreferredLocationSolution(
      eventHypothesis.id.hypothesisId,
      event.eventHypotheses
    );

    const station = stations.find(s => s.name === signalDetection.station.name);
    if (!station) {
      return [sourceToEventDistance, associatedEventTime];
    }
    sourceToEventDistance =
      getLocationToEventDistance(station.location, locationSolution.location).km * 1000;
    associatedEventTime = locationSolution.location.time;
  }
  return [sourceToEventDistance, associatedEventTime];
}

/**
 * Given an array of signal detections
 * Return an array of Cesium entities containing polylines that represent great circle paths
 *
 * @param signalDetectionArgs Parameters pertaining to the signal detections
 * @param validActionTargetSignalDetectionIds string[] of valid action targets
 * @param signalDetectionActionTargets string[] of action targets
 * @param stations
 * @param events list of events to calculate station to event distance with
 * @param openIntervalName
 */
export function createSignalDetectionEntities(
  signalDetectionsArgs: {
    signalDetections: SignalDetectionTypes.SignalDetection[];
    selectedSdIds: string[];
    edgeSDType: EventFilterOptions;
    status: SignalDetectionTypes.SignalDetectionStatus;
    sdVisibility: boolean;
    signalDetectionLengthMeters: number | null;
  },
  validActionTargetSignalDetectionIds: string[],
  signalDetectionActionTargets: string[],
  uiTheme: UITheme,
  stations: StationTypes.Station[],
  events?: EventTypes.Event[],
  openIntervalName?: string
): Entity[] {
  const entities: Entity[] = [];
  if (!!signalDetectionsArgs.signalDetections && signalDetectionsArgs.signalDetections.length > 0) {
    const { signalDetections, selectedSdIds, status, signalDetectionLengthMeters } =
      signalDetectionsArgs;

    signalDetections.forEach(sd => {
      const isSelected = selectedSdIds?.includes(sd.id);
      const areActionTargetsPresent = !!signalDetectionActionTargets.length;
      const isActionTarget =
        areActionTargetsPresent && signalDetectionActionTargets?.includes(sd.id);
      const isUnqualifiedActionTarget =
        isActionTarget && !validActionTargetSignalDetectionIds.includes(sd.id);

      const [sourceToEventDistance, associatedEventTime] = getSignalDetectionAssociationArgs(
        sd,
        status,
        signalDetectionLengthMeters,
        stations,
        events,
        openIntervalName
      );

      const entity = processSignalDetection(
        {
          signalDetection: sd,
          edgeSDType: signalDetectionsArgs.edgeSDType,
          status: signalDetectionsArgs.status,
          sdVisibility: signalDetectionsArgs.sdVisibility,
          signalDetectionLengthMeters: sourceToEventDistance,
          associatedEventTime
        },
        isSelected,
        areActionTargetsPresent,
        isActionTarget,
        stations,
        uiTheme,
        isUnqualifiedActionTarget
      );
      if (entity) entities.push(entity);
    });
  }

  return entities;
}

/**
 * Given a map event source and a UI theme
 * Return the appropriate color from the theme
 *
 * @param event
 * @param uiTheme
 * @returns css string
 */
function getEventColor(event: MapEventSource, uiTheme: ConfigurationTypes.UITheme): string {
  if (event.rejected) return uiTheme.colors.rejectedEventColor;
  if (event.deleted) return uiTheme.colors.deletedEventColor;
  if (event.isOpen) return uiTheme.colors.openEventSDColor;
  if (event.status === EventTypes.EventStatus.COMPLETE) return uiTheme.colors.completeEventSDColor;
  if (event.deleted) return uiTheme.colors.deletedEventColor;
  return uiTheme.colors.otherEventSDColor;
}

/**
 * Given an event location within the selected time interval
 * Return a Cesium ellipse entity
 *
 * @param event
 * @param uiTheme
 * @param preferred
 * @param selectedEvents
 * @param actionTargets
 * @param validActionTargets
 */
export function processEventLocation(
  event: MapEventSource,
  uiTheme: ConfigurationTypes.UITheme,
  isPreferred: boolean,
  selectedEvents: string[],
  actionTargets: string[],
  validActionTargets: string[],
  visibility: boolean
): Entity {
  const entityProperties = {
    id: event.id,
    type: 'Event location',
    event
  };
  const isSelected = selectedEvents?.indexOf(event.id) > -1;
  const isActionTarget = actionTargets?.includes(event.id);
  let strokeOpacity = 1;
  let fillOpacity = event.eventFilterOptions.includes(EventFilterOptions.INTERVAL)
    ? 1
    : uiTheme.display.edgeEventOpacity;
  if (!isPreferred) fillOpacity = 0;
  if (actionTargets && actionTargets.length > 0 && !actionTargets.includes(event.id)) {
    fillOpacity = uiTheme.display.edgeEventOpacity;
  }
  // TODO #000000 shouldn't be hardcoded, update in next story
  const color = isPreferred ? getEventColor(event, uiTheme) : '#000000';
  // set the position and z-index
  const eventEyeOffset = determineEventEyeOffset(event.isOpen, isSelected);

  let borderColor;
  if (isActionTarget) borderColor = uiTheme.colors.gmsActionTarget;
  else if (isSelected) borderColor = uiTheme.colors.gmsSelection;

  if (isSelected && actionTargets?.length > 0 && !validActionTargets?.includes(event.id)) {
    strokeOpacity /= 2;
    fillOpacity /= 2;
  }
  const entityOptions: Entity.ConstructorOptions = {
    id: event.id,
    name: event.id,
    label: createLabel(event, eventDistanceDisplayCondition, isSelected),
    billboard: createBillboard(
      isSelected || isActionTarget,
      eventEyeOffset,
      Color.WHITE, // White will not change the appearance of the image, any other color will
      isSelected || isActionTarget
        ? buildSelectedEventCircle(
            borderColor,
            color,
            strokeOpacity,
            fillOpacity,
            event?.geoOverlappingEvents
          )
        : buildEventCircle(color, strokeOpacity, fillOpacity, event?.geoOverlappingEvents)
    ),
    properties: entityProperties,
    position: createCartesianFromLocationZeroElevation({
      latitudeDegrees: event.latitudeDegrees,
      longitudeDegrees: event.longitudeDegrees,
      elevationKm: 0,
      depthKm: 0
    }),
    show: visibility
  };

  return new Entity(entityOptions);
}

/**
 * Given an event uncertainty ellipse within the selected time interval
 * rotation uses a negative value because our data is clockwise in degrees from north and Cesium expects counter-clockwise
 * rotationOffset rotates semi-major axis to north/south as Cesium defaults it to east/west
 * toRadians converts our data in degrees to radians
 * Return a Cesium ellipse entity
 *
 * @param event
 * @param uiTheme
 */
export function processEventUncertaintyEllipse(
  event: MapEventSource,
  uiTheme: ConfigurationTypes.UITheme,
  visibility: boolean,
  uncertaintyEllipse: UncertaintyEllipse
): Entity {
  const ellipseLowercaseString = uncertaintyEllipse.toLowerCase();
  const geometry = EllipseOutlineGeometry.createGeometry(
    new EllipseOutlineGeometry({
      center: createCartesianFromLocationZeroElevation({
        latitudeDegrees: event.latitudeDegrees,
        longitudeDegrees: event.longitudeDegrees,
        elevationKm: 0,
        depthKm: 0
      }),
      // Converting kilometers to meters
      semiMajorAxis: (event[`${ellipseLowercaseString}SemiMajorAxis`] ?? 0) * 1000,
      semiMinorAxis: (event[`${ellipseLowercaseString}SemiMinorAxis`] ?? 0) * 1000,
      height: 1,
      rotation: CesiumMath.toRadians(
        -Math.abs(
          (event[`${ellipseLowercaseString}SemiMajorTrend`] ?? 0) +
            UNCERTAINTY_ELLIPSE_ROTATION_OFFSET
        )
      ),
      granularity: uncertaintyEllipseGranularity
    })
  );
  const entityProperties = {
    id: event.id,
    type: `Event${toSentenceCase(uncertaintyEllipse)}Ellipse`,
    coordinates: {
      longitude: formatNumberForTooltipDisplay(event.longitudeDegrees),
      latitude: formatNumberForTooltipDisplay(event.latitudeDegrees)
    }
  };
  const entityOptions: Entity.ConstructorOptions = {
    id: event.id,
    name: event.id,
    position: createCartesianFromLocationZeroElevation({
      latitudeDegrees: event.latitudeDegrees,
      longitudeDegrees: event.longitudeDegrees,
      elevationKm: 0,
      depthKm: 0
    }),
    properties: entityProperties,
    show: visibility
  };
  if (geometry) {
    const color = Color.fromCssColorString(getEventColor(event, uiTheme));
    color.alpha = event.eventFilterOptions.includes(EventFilterOptions.INTERVAL)
      ? 1.0
      : uiTheme.display.edgeEventOpacity;
    entityOptions.polyline = createPolyline(
      Cartesian3.unpackArray(Array.from(geometry.attributes.position.values)),
      alwaysDisplayDistanceDisplayCondition,
      getUncertaintyEllipsePolylineMaterial(color, uncertaintyEllipse),
      uncertaintyEllipseWidthPx
    );
  }
  return new Entity(entityOptions);
}

/**
 * Determines if a entity needs to be added to the working list
 *
 * @param entity
 * @param event
 * @param eventType
 * @param eventLifecycle
 * @returns entity or undefined
 */
const determineIfEntityNeedsToBeAdded = (
  entity: Entity,
  event: MapEventSource,
  eventType: EventFilterOptions,
  eventLifecycle: EventLifecycle
) => {
  if (entity && event.eventFilterOptions.includes(eventType)) {
    if (event.deleted && eventLifecycle === EventLifecycle.DELETED) {
      return entity;
    }
    if (event.rejected && !event.deleted && eventLifecycle === EventLifecycle.REJECTED) {
      return entity;
    }
    if (eventLifecycle === EventLifecycle.ACTIVE && !event.deleted && !event.rejected) {
      return entity;
    }
  }
  return undefined;
};

/**
 * Given an array of events and an event type, parses through the array to create a Cesium entity for each event location that matches the event type
 *
 * @param events
 * @param uiTheme
 * @param preferred
 * @param eventType
 * @param eventLifecycle
 * @param actionTargets
 * @param validActionTargets
 * @returns entity[]
 */
export function createEventLocationEntities(
  eventArgs: {
    events: MapEventSource[];
    isPreferred: boolean;
    eventType: EventFilterOptions;
    selectedEvents: string[];
    eventLifecycle: EventLifecycle;
  },
  actionTargetArgs: { actionTargets: string[]; validActionTargets: string[] },
  uiTheme: ConfigurationTypes.UITheme,
  visibility: boolean
): Entity[] {
  const entities: Entity[] = [];
  const { events, isPreferred, eventType, selectedEvents, eventLifecycle } = eventArgs;
  const { actionTargets, validActionTargets } = actionTargetArgs;
  events?.forEach(event => {
    const entity = determineIfEntityNeedsToBeAdded(
      processEventLocation(
        event,
        uiTheme,
        isPreferred,
        selectedEvents,
        actionTargets,
        validActionTargets,
        visibility
      ),
      event,
      eventType,
      eventLifecycle
    );
    if (entity) entities.push(entity);
  });
  return entities;
}

/**
 * Given an array of events and an event type, parses through the array to create a Cesium entity for each event uncertainty ellipse that matches the event type
 *
 * @param events
 * @param uiTheme
 * @param eventType
 * @param eventLifecycle
 * @returns entity[]
 */
export function createEventUncertaintyEntities(
  events: MapEventSource[],
  uiTheme: ConfigurationTypes.UITheme,
  eventType: EventFilterOptions,
  eventLifecycle: EventLifecycle,
  visibility: boolean,
  uncertaintyEllipse: UncertaintyEllipse
): Entity[] {
  const entities: Entity[] = [];
  events?.forEach(event => {
    const entity = determineIfEntityNeedsToBeAdded(
      processEventUncertaintyEllipse(event, uiTheme, visibility, uncertaintyEllipse),
      event,
      eventType,
      eventLifecycle
    );
    if (entity) entities.push(entity);
  });
  return entities;
}
