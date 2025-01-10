import type { CommonTypes, EventTypes, StationTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import { findArrivalTimeFeatureMeasurement } from '@gms/common-model/lib/signal-detection/util';
import { Logger, toSentenceCase } from '@gms/common-util';
import type { AnalystWaveformTypes, EventStatus } from '@gms/ui-state';
import {
  MapLayers,
  selectActionTargetEventIds,
  selectActionTargetSignalDetectionIds,
  selectOpenEventId,
  selectOpenIntervalName,
  selectSelectedEventIds,
  selectValidActionTargetEventIds,
  selectValidActionTargetSignalDetectionIds,
  selectWorkflowTimeRange,
  useAppSelector,
  useEventStatusQuery,
  useGetEvents,
  useGetSelectedSdIds,
  useUiTheme,
  useUnassociatedSignalDetectionLengthInMeters
} from '@gms/ui-state';
import type Cesium from 'cesium';
import React from 'react';

import {
  isSignalDetectionCompleteAssociated,
  isSignalDetectionOpenAssociated,
  isSignalDetectionOtherAssociated
} from '~analyst-ui/common/utils/event-util';

import { EventFilterOptions, EventLifecycle } from '../events/types';
import {
  createEventLocationEntities,
  createEventUncertaintyEntities,
  createSignalDetectionEntities,
  createSiteEntitiesFromStationArray,
  createStationEntitiesFromStationArray
} from './create-ian-entities';
import { MapDataSource } from './map-data-source';
import {
  useEventDoubleClickHandler,
  useEventOnClickHandler,
  useSignalDetectionClickHandlers
} from './map-hooks';
import { sdOnMouseEnterHandler, sdOnMouseLeaveHandler } from './map-utils';
import type { MapEventSource, UncertaintyEllipse } from './types';

const logger = Logger.create(
  'GMS_LOG_IAN_MAP_DATA_SOURCES',
  process.env.GMS_LOG_IAN_MAP_DATA_SOURCES
);

const splitSignalDetectionsByAssociation = (
  detections: SignalDetectionTypes.SignalDetection[],
  events: EventTypes.Event[],
  openEventId: string,
  eventsStatuses: Record<string, EventStatus>,
  openIntervalName: string
) => {
  const associatedCompleteDetections: SignalDetectionTypes.SignalDetection[] = [];
  const associatedOpenDetections: SignalDetectionTypes.SignalDetection[] = [];
  const associatedOtherDetections: SignalDetectionTypes.SignalDetection[] = [];
  const unassociatedDetections: SignalDetectionTypes.SignalDetection[] = [];
  const deletedDetections: SignalDetectionTypes.SignalDetection[] = [];
  const unprocessableDetections: SignalDetectionTypes.SignalDetection[] = [];

  if (detections) {
    detections.forEach(signalDetection => {
      const sdHyp = SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetection.signalDetectionHypotheses
      );

      /*
        If the signal detection does not contain an azimuth we can't display the signal detection
        in the map. This situation might arise from signal detections created by the ui via createSignalDetection.
      */
      if (
        !SignalDetectionTypes.Util.findAzimuthFeatureMeasurementValue(sdHyp.featureMeasurements)
      ) {
        unprocessableDetections.push(signalDetection);
      }
      // Sort deleted
      else if (sdHyp.deleted) {
        deletedDetections.push(signalDetection);
      }
      // determine if associated to the open event
      else if (
        isSignalDetectionOpenAssociated(signalDetection, events, openEventId, openIntervalName)
      ) {
        associatedOpenDetections.push(signalDetection);
      }
      // determine if associated to a complete event
      else if (
        isSignalDetectionCompleteAssociated(
          signalDetection,
          events,
          eventsStatuses,
          openIntervalName
        )
      ) {
        associatedCompleteDetections.push(signalDetection);
      }
      // determine if associated to another event
      else if (
        isSignalDetectionOtherAssociated(signalDetection, events, openEventId, openIntervalName)
      ) {
        associatedOtherDetections.push(signalDetection);
      }
      // else it is unassociated
      else {
        unassociatedDetections.push(signalDetection);
      }
    });
  }
  return [
    associatedCompleteDetections,
    associatedOpenDetections,
    associatedOtherDetections,
    deletedDetections,
    unassociatedDetections,
    unprocessableDetections
  ];
};

const getEventVisibility = (
  isPreferred: boolean,
  layerVisibility: Record<MapLayers, boolean>,
  edgeEventType: EventFilterOptions,
  eventLifecycle: EventLifecycle,
  isUncertaintyEllipse = false
): boolean => {
  const preferredVisibility =
    isUncertaintyEllipse || // uncertainty ellipses disregard preferred/non-preferred
    (isPreferred
      ? layerVisibility[MapLayers.preferredLocationSolution]
      : layerVisibility[MapLayers.nonPreferredLocationSolution]);

  let eventVisibility = layerVisibility[MapLayers.events];
  switch (edgeEventType) {
    case EventFilterOptions.AFTER:
      eventVisibility = eventVisibility && layerVisibility[MapLayers.edgeEventsAfterInterval];
      break;
    case EventFilterOptions.BEFORE:
      eventVisibility = eventVisibility && layerVisibility[MapLayers.edgeEventsBeforeInterval];
      break;
    default:
  }

  switch (eventLifecycle) {
    case EventLifecycle.DELETED:
      eventVisibility = eventVisibility && layerVisibility[MapLayers.eventsDeleted];
      break;
    case EventLifecycle.REJECTED:
      eventVisibility = eventVisibility && layerVisibility[MapLayers.eventsRejected];
      break;
    default:
  }

  return preferredVisibility && eventVisibility;
};

/**
 * Takes a nested array of signal detections split by association, checks their current hypothesis's time range against
 * the time range of the open interval, filters the nested array by comparing the two time ranges based on param
 * specifying before, after, or within the interval
 *
 * @param splitDetectionsArr
 * @param edgeSDType
 * @param intervalTimeRange
 *
 */
const filterSignalDetectionsByEdgeType = (
  splitDetectionsArr: SignalDetectionTypes.SignalDetection[][],
  edgeSDType: EventFilterOptions,
  intervalTimeRange: CommonTypes.TimeRange
): SignalDetectionTypes.SignalDetection[][] => {
  const compareTimeRanges = (detection: CommonTypes.TimeRange, interval: CommonTypes.TimeRange) => {
    let timeRangeCondition = false;

    // Filter out if the time range does not exist
    if (!detection.startTimeSecs || !detection.endTimeSecs) return false;

    if (edgeSDType === EventFilterOptions.BEFORE) {
      timeRangeCondition = detection.startTimeSecs < interval.startTimeSecs;
    } else if (edgeSDType === EventFilterOptions.AFTER) {
      timeRangeCondition = detection.startTimeSecs > interval.endTimeSecs;
    } else {
      timeRangeCondition =
        detection.startTimeSecs >= interval.startTimeSecs &&
        detection.startTimeSecs <= interval.endTimeSecs;
    }
    return timeRangeCondition;
  };

  return splitDetectionsArr.map(detectionArr =>
    detectionArr.filter(detection => {
      const currentHypo = SignalDetectionTypes.Util.getCurrentHypothesis(
        detection?.signalDetectionHypotheses
      );
      const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(
        currentHypo?.featureMeasurements
      );
      const detectionTimeRange: CommonTypes.TimeRange = {
        startTimeSecs: arrivalTimeFeatureMeasurement?.analysisWaveform?.waveform?.id?.startTime,
        endTimeSecs: arrivalTimeFeatureMeasurement?.analysisWaveform?.waveform?.id?.endTime
      };
      return compareTimeRanges(detectionTimeRange, intervalTimeRange);
    })
  );
};

const getSignalDetectionEdgeTypeVisibility = (
  edgeSDType: EventFilterOptions,
  layerVisibility: Record<MapLayers, boolean>
) => {
  let edgeShowCondition = layerVisibility[MapLayers.signalDetections];
  if (edgeSDType === EventFilterOptions.BEFORE) {
    edgeShowCondition =
      layerVisibility[MapLayers.signalDetections] && layerVisibility[MapLayers.edgeDetectionBefore];
  } else if (edgeSDType === EventFilterOptions.AFTER) {
    edgeShowCondition =
      layerVisibility[MapLayers.signalDetections] && layerVisibility[MapLayers.edgeDetectionAfter];
  }

  return edgeShowCondition;
};

/**
 * Custom hook to split up signal detections and build toggle sources
 *
 * @param signalDetections
 * @param layerVisibility
 * @param stationsResult
 * @param mapContextMenusCb the map callbacks for context menus
 * @returns array of jsx elements containing cesium data sources
 */

export const useMapSignalDetectionSources = (
  signalDetections: SignalDetectionTypes.SignalDetection[],
  layerVisibility: Record<MapLayers, boolean>,
  stationsResult: StationTypes.Station[],
  edgeSDType: EventFilterOptions
): JSX.Element => {
  const [uiTheme] = useUiTheme();

  const eventResults = useGetEvents();
  const currentEventData = eventResults.data;
  const eventStatusQuery = useEventStatusQuery();
  const openEventId = useAppSelector(selectOpenEventId);
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const unassociatedVisibility = layerVisibility[MapLayers.unassociatedDetection];
  const completeVisibility = layerVisibility[MapLayers.associatedCompleteDetection];
  const otherVisibility = layerVisibility[MapLayers.associatedOtherDetection];
  const openVisibility = layerVisibility[MapLayers.associatedOpenDetection];
  const deletedVisibility = layerVisibility[MapLayers.deletedDetection];
  const { sdOnClickHandler, sdOnDoubleClickHandler } = useSignalDetectionClickHandlers();

  const openIntervalName = useAppSelector(selectOpenIntervalName);

  const unassociatedSignalDetectionLengthMeters = useUnassociatedSignalDetectionLengthInMeters();

  const selectedSdIds = useGetSelectedSdIds();
  const signalDetectionActionTargets = useAppSelector(selectActionTargetSignalDetectionIds);
  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );

  const edgeTypeVisibility = getSignalDetectionEdgeTypeVisibility(edgeSDType, layerVisibility);

  const [
    associatedCompleteDetections,
    associatedOpenDetections,
    associatedOtherDetections,
    deletedDetections,
    unassociatedDetections
  ] = React.useMemo(() => {
    logger.debug('splitting detections');
    const splitDetectionsArr = splitSignalDetectionsByAssociation(
      signalDetections,
      currentEventData,
      openEventId,
      eventStatusQuery.data,
      openIntervalName
    );

    return filterSignalDetectionsByEdgeType(splitDetectionsArr, edgeSDType, timeRange);
  }, [
    edgeSDType,
    currentEventData,
    eventStatusQuery.data,
    openEventId,
    signalDetections,
    timeRange,
    openIntervalName
  ]);

  const unassociatedSignalDetectionEntities = React.useMemo(() => {
    logger.debug(`building ${edgeSDType} unassociated detections`);
    return createSignalDetectionEntities(
      {
        signalDetections: unassociatedDetections,
        selectedSdIds,
        edgeSDType,
        status: SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED,
        sdVisibility: edgeTypeVisibility && unassociatedVisibility,
        signalDetectionLengthMeters: unassociatedSignalDetectionLengthMeters
      },
      validActionTargetSignalDetectionIds,
      signalDetectionActionTargets,
      uiTheme,
      stationsResult
    );
  }, [
    edgeSDType,
    unassociatedDetections,
    selectedSdIds,
    edgeTypeVisibility,
    unassociatedVisibility,
    unassociatedSignalDetectionLengthMeters,
    validActionTargetSignalDetectionIds,
    signalDetectionActionTargets,
    uiTheme,
    stationsResult
  ]);

  const associatedCompleteSignalDetectionEntities = React.useMemo(() => {
    logger.debug(`building ${edgeSDType} complete detections`);
    return createSignalDetectionEntities(
      {
        signalDetections: associatedCompleteDetections,
        selectedSdIds,
        edgeSDType,
        status: SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED,
        sdVisibility: edgeTypeVisibility && completeVisibility,
        signalDetectionLengthMeters: null
      },
      validActionTargetSignalDetectionIds,
      signalDetectionActionTargets,
      uiTheme,
      stationsResult,
      currentEventData,
      openIntervalName
    );
  }, [
    edgeSDType,
    associatedCompleteDetections,
    selectedSdIds,
    edgeTypeVisibility,
    completeVisibility,
    validActionTargetSignalDetectionIds,
    signalDetectionActionTargets,
    uiTheme,
    stationsResult,
    currentEventData,
    openIntervalName
  ]);

  const deletedSignalDetectionEntities = React.useMemo(() => {
    logger.debug(`building ${edgeSDType} deleted detections`);
    return createSignalDetectionEntities(
      {
        signalDetections: deletedDetections,
        selectedSdIds,
        edgeSDType,
        status: SignalDetectionTypes.SignalDetectionStatus.DELETED,
        sdVisibility: edgeTypeVisibility && deletedVisibility,
        signalDetectionLengthMeters: unassociatedSignalDetectionLengthMeters
      },
      validActionTargetSignalDetectionIds,
      signalDetectionActionTargets,
      uiTheme,
      stationsResult
    );
  }, [
    edgeSDType,
    deletedDetections,
    selectedSdIds,
    edgeTypeVisibility,
    deletedVisibility,
    unassociatedSignalDetectionLengthMeters,
    validActionTargetSignalDetectionIds,
    signalDetectionActionTargets,
    uiTheme,
    stationsResult
  ]);

  const associatedOpenSignalDetectionEntities = React.useMemo(() => {
    logger.debug(`building ${edgeSDType} open detections`);
    return createSignalDetectionEntities(
      {
        signalDetections: associatedOpenDetections,
        selectedSdIds,
        edgeSDType,
        status: SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED,
        sdVisibility: edgeTypeVisibility && openVisibility,
        signalDetectionLengthMeters: null
      },
      validActionTargetSignalDetectionIds,
      signalDetectionActionTargets,
      uiTheme,
      stationsResult,
      currentEventData,
      openIntervalName
    );
  }, [
    edgeSDType,
    associatedOpenDetections,
    selectedSdIds,
    edgeTypeVisibility,
    openVisibility,
    validActionTargetSignalDetectionIds,
    signalDetectionActionTargets,
    uiTheme,
    stationsResult,
    currentEventData,
    openIntervalName
  ]);

  const associatedOtherSignalDetectionEntities = React.useMemo(() => {
    logger.debug(`building ${edgeSDType} other detections`);
    return createSignalDetectionEntities(
      {
        signalDetections: associatedOtherDetections,
        selectedSdIds,
        edgeSDType,
        status: SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED,
        sdVisibility: edgeTypeVisibility && otherVisibility,
        signalDetectionLengthMeters: null
      },
      validActionTargetSignalDetectionIds,
      signalDetectionActionTargets,
      uiTheme,
      stationsResult,
      currentEventData,
      openIntervalName
    );
  }, [
    edgeSDType,
    associatedOtherDetections,
    selectedSdIds,
    edgeTypeVisibility,
    otherVisibility,
    validActionTargetSignalDetectionIds,
    signalDetectionActionTargets,
    uiTheme,
    stationsResult,
    currentEventData,
    openIntervalName
  ]);
  return React.useMemo(
    () => (
      <MapDataSource
        key={`${edgeSDType}mapSignalDetections`}
        name={`${edgeSDType}mapSignalDetections`}
        entities={[
          ...unassociatedSignalDetectionEntities,
          ...associatedCompleteSignalDetectionEntities,
          ...deletedSignalDetectionEntities,
          ...associatedOpenSignalDetectionEntities,
          ...associatedOtherSignalDetectionEntities
        ]}
        leftClickHandler={sdOnClickHandler}
        mouseEnterHandler={sdOnMouseEnterHandler}
        mouseLeaveHandler={sdOnMouseLeaveHandler}
        doubleClickHandler={sdOnDoubleClickHandler}
        show={layerVisibility.signalDetections}
      />
    ),
    [
      associatedCompleteSignalDetectionEntities,
      associatedOpenSignalDetectionEntities,
      associatedOtherSignalDetectionEntities,
      deletedSignalDetectionEntities,
      edgeSDType,
      layerVisibility.signalDetections,
      sdOnClickHandler,
      sdOnDoubleClickHandler,
      unassociatedSignalDetectionEntities
    ]
  );
};

const useEventConfigurations = (
  layerVisibility: Record<MapLayers, boolean>,
  preferredEventsResult: MapEventSource[],
  nonPreferredEventsResult: MapEventSource[]
) => {
  return React.useMemo(() => {
    const results = {
      nonPreferred: { data: preferredEventsResult, isPreferred: true },
      bar: { data: nonPreferredEventsResult, isPreferred: false }
    };

    const edgeEventTypes = [
      EventFilterOptions.AFTER,
      EventFilterOptions.INTERVAL,
      EventFilterOptions.BEFORE
    ];

    const eventLifeCycles = [
      EventLifecycle.ACTIVE,
      EventLifecycle.DELETED,
      EventLifecycle.REJECTED
    ];

    return Object.keys(results).flatMap(resultKey =>
      edgeEventTypes.flatMap(edgeEventType =>
        eventLifeCycles.map(eventLifecycle => ({
          layerVisibility,
          isPreferred: results[resultKey].isPreferred,
          data: results[resultKey].data,
          edgeEventType,
          eventLifecycle
        }))
      )
    );
  }, [layerVisibility, nonPreferredEventsResult, preferredEventsResult]);
};

/**
 * Build the data sources for event locations
 *
 * @param layerVisibility Layer visibility for hte map display
 * @param preferredEventsResult Preferred location data
 * @param nonPreferredEventsResult Non-preferred location data
 * @param mapContextMenusCb the map callbacks for context menus
 * @returns array of jsx elements containing {@link MapDataSource}
 */
export const useMapEventLocationSource = (
  layerVisibility: Record<MapLayers, boolean>,
  preferredEventsResult: MapEventSource[],
  nonPreferredEventsResult: MapEventSource[],
  setEventId: (eventId: string) => void
): JSX.Element => {
  const [uiTheme] = useUiTheme();

  const selectedEvents = useAppSelector(selectSelectedEventIds);

  const actionTargetEventIds = useAppSelector(selectActionTargetEventIds);
  const validActionTargetEventIds = useAppSelector(selectValidActionTargetEventIds);
  const eventDoubleClickHandler = useEventDoubleClickHandler(setEventId);

  const eventOnClickHandler = useEventOnClickHandler();

  const configurations = useEventConfigurations(
    layerVisibility,
    preferredEventsResult,
    nonPreferredEventsResult
  );

  const entities = React.useMemo(() => {
    return configurations
      .map(config => {
        logger.debug(`building ${config.edgeEventType} ${config.eventLifecycle} location entities`);
        const entityVisibility = getEventVisibility(
          config.isPreferred,
          config.layerVisibility,
          config.edgeEventType,
          config.eventLifecycle
        );
        return createEventLocationEntities(
          {
            events: config.data,
            isPreferred: config.isPreferred,
            eventType: config.edgeEventType,
            selectedEvents,
            eventLifecycle: config.eventLifecycle
          },
          { actionTargets: actionTargetEventIds, validActionTargets: validActionTargetEventIds },
          uiTheme,
          entityVisibility
        );
      })
      .flat();
  }, [actionTargetEventIds, configurations, selectedEvents, uiTheme, validActionTargetEventIds]);

  return React.useMemo(
    () => (
      <MapDataSource
        key="mapEventLocations"
        entities={entities}
        leftClickHandler={eventOnClickHandler}
        doubleClickHandler={eventDoubleClickHandler}
        name="Events"
        show={layerVisibility[MapLayers.events]}
      />
    ),
    [entities, eventDoubleClickHandler, eventOnClickHandler, layerVisibility]
  );
};

/**
 * Build the data sources for uncertainty ellipses
 *
 * @param layerVisibility Layer visibility for hte map display
 * @param preferredEventsResult Preferred location data
 * @param nonPreferredEventsResult Non-preferred location data
 * @param mapContextMenusCb the map callbacks for context menus
 * @returns array of jsx elements containing {@link MapDataSource}
 */
export const useMapEventUncertaintyEllipseSource = (
  layerVisibility: Record<MapLayers, boolean>,
  preferredEventsResult: MapEventSource[],
  nonPreferredEventsResult: MapEventSource[],
  setEventId: (eventId: string) => void,
  uncertaintyEllipse: UncertaintyEllipse
): JSX.Element => {
  const [uiTheme] = useUiTheme();
  const uncertaintyLowercaseString = uncertaintyEllipse.toLowerCase();

  const eventDoubleClickHandler = useEventDoubleClickHandler(setEventId);
  const uncertaintyTypeSentenceString = toSentenceCase(uncertaintyEllipse);

  const configurations = useEventConfigurations(
    layerVisibility,
    preferredEventsResult,
    nonPreferredEventsResult
  );

  const entities = React.useMemo(() => {
    return configurations
      .map(config => {
        logger.debug(`building ${config.edgeEventType} ${uncertaintyLowercaseString} ellipses`);

        const entityVisibility =
          getEventVisibility(
            config.isPreferred,
            config.layerVisibility,
            config.edgeEventType,
            config.eventLifecycle,
            true
          ) && config.layerVisibility[MapLayers[`${uncertaintyLowercaseString}Ellipse`]];
        return createEventUncertaintyEntities(
          config.data,
          uiTheme,
          config.edgeEventType,
          config.eventLifecycle,
          entityVisibility,
          uncertaintyEllipse
        );
      })
      .flat();
  }, [configurations, uiTheme, uncertaintyEllipse, uncertaintyLowercaseString]);

  return React.useMemo(
    () => (
      <MapDataSource
        key={`mapEvent${uncertaintyTypeSentenceString}Ellipses`}
        entities={entities}
        doubleClickHandler={eventDoubleClickHandler}
        name={`Event ${uncertaintyTypeSentenceString} Ellipses`}
        show={layerVisibility[MapLayers[`${uncertaintyLowercaseString}Ellipse`]]}
      />
    ),
    [
      entities,
      eventDoubleClickHandler,
      layerVisibility,
      uncertaintyLowercaseString,
      uncertaintyTypeSentenceString
    ]
  );
};

/**
 * Build the data sources for confidence ellipses
 *
 * @param layerVisibility Layer visibility for hte map display
 * @param stationsResult stations data
 * @param stationsVisibility station visibility dictionary
 * @param onStationClickHandler left click handler for stations and sites
 * @param rightClickHandler right click handler for stations and sites
 * @returns jsx element {@link MapDataSource}
 */
export const useMapStationSource = (
  layerVisibility: Record<MapLayers, boolean>,
  stationsResult: StationTypes.Station[],
  stationsVisibility: AnalystWaveformTypes.StationVisibilityChangesDictionary,
  onStationClickHandler: (targetEntity: Cesium.Entity) => () => void
): JSX.Element => {
  const [uiTheme] = useUiTheme();
  const selectedStations = useAppSelector(state => state.app.common?.selectedStationIds);
  const stationLayerVisibility = layerVisibility[MapLayers.stations];

  return React.useMemo(() => {
    logger.debug(`building stations`);

    const stationEntities: Cesium.Entity[] = createStationEntitiesFromStationArray(
      stationsResult,
      selectedStations,
      stationsVisibility,
      uiTheme
    );

    return (
      <MapDataSource
        key="Stations"
        entities={stationEntities}
        leftClickHandler={onStationClickHandler}
        name="Stations"
        show={stationLayerVisibility}
      />
    );
  }, [
    stationsResult,
    selectedStations,
    stationsVisibility,
    uiTheme,
    onStationClickHandler,
    stationLayerVisibility
  ]);
};

/**
 * Build the data sources for confidence ellipses
 *
 * @param layerVisibility Layer visibility for hte map display
 * @param stationsResult stations data
 * @param onStationClickHandler left click handler for stations and sites
 * @param rightClickHandler right click handler for stations and sites
 * @returns jsx element {@link MapDataSource}
 */
export const useMapSiteSource = (
  layerVisibility: Record<MapLayers, boolean>,
  stationsResult: StationTypes.Station[],
  onStationClickHandler: (targetEntity: Cesium.Entity) => () => void
): JSX.Element => {
  const siteLayerVisibility = layerVisibility[MapLayers.sites];
  const [uiTheme] = useUiTheme();
  return React.useMemo(() => {
    logger.debug(`building sites`);
    const siteEntities: Cesium.Entity[] = createSiteEntitiesFromStationArray(
      stationsResult,
      uiTheme
    );

    return (
      <MapDataSource
        key="Sites"
        entities={siteEntities}
        leftClickHandler={onStationClickHandler}
        name="Sites"
        show={siteLayerVisibility}
      />
    );
  }, [stationsResult, onStationClickHandler, siteLayerVisibility, uiTheme]);
};
