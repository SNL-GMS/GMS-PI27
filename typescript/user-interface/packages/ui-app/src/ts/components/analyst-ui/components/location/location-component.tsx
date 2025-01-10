/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable react/destructuring-assignment */
import { NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { SignalDetectionTypes } from '@gms/common-model';
import { selectOpenIntervalName, useAppSelector } from '@gms/ui-state';
import { useForceGlUpdateOnResizeAndShow } from '@gms/ui-util';
import React from 'react';

import {
  getAssocSdsLegacy,
  getDistanceToStationsForLocationSolutionIdLegacy,
  getLegacyOpenEvent
} from '~analyst-ui/common/utils/event-util';
import {
  DataType,
  TableDataState,
  TableInvalidState
} from '~analyst-ui/common/utils/table-invalid-state';

import { LocationPanel } from './components/location-panel';
import type { LocationProps } from './types';

// Fix in the future when converted to event and SD use hooks
const dummyEventsInTimeRangeQuery = {
  isLoading: false,
  data: []
};
const dummySignalDetectionsByStationQuery = {
  isLoading: false,
  data: []
};

// TODO: This is still being wrapped in location-container.tsx's Redux HOC
// which won't actually work. Need to fix when restoring from pre-pivot.
export function Location(this: any, props: LocationProps) {
  const { glContainer } = props;
  useForceGlUpdateOnResizeAndShow(glContainer);
  const openIntervalName = useAppSelector(selectOpenIntervalName);

  /**
   * Renders the component.
   */
  // no spinner if queries haven't been issued
  let dataState: TableDataState = TableDataState.READY;
  if (!dummyEventsInTimeRangeQuery.data || !dummySignalDetectionsByStationQuery.data) {
    dataState = TableDataState.NO_INTERVAL;
  } else if (
    dummySignalDetectionsByStationQuery.isLoading ||
    !dummySignalDetectionsByStationQuery.data
  ) {
    dataState = TableDataState.NO_SDS;
  } else if (!props.openEventId) {
    dataState = TableDataState.NO_EVENT_OPEN;
  }

  if (dataState !== TableDataState.READY) {
    return (
      <TableInvalidState
        visual={IconNames.GEOSEARCH}
        message={dataState}
        dataType={dataState === TableDataState.NO_SDS ? DataType.SD : DataType.EVENT}
        noEventMessage="Select an event to refine location"
      />
    );
  }

  const openEvent = getLegacyOpenEvent(props.openEventId, dummyEventsInTimeRangeQuery.data);
  if (!openEvent) {
    return (
      <NonIdealState
        title="Selected Event Not Found"
        description="Refresh the Page and Cross Your Fingers"
      />
    );
  }
  const assocSDs: SignalDetectionTypes.SignalDetection[] = getAssocSdsLegacy(
    openEvent,
    dummySignalDetectionsByStationQuery.data
  );
  const distances = getDistanceToStationsForLocationSolutionIdLegacy(
    openEvent,
    props.location.selectedPreferredLocationSolutionId
  );

  // If the latest location solution set is NOT selected, enabled historical mode
  const signalDetectionsByStation = dummySignalDetectionsByStationQuery.data ?? [];
  return (
    <LocationPanel
      associatedSignalDetections={assocSDs}
      openIntervalName={openIntervalName}
      changeSignalDetectionAssociations={props.changeSignalDetectionAssociations}
      createEvent={props.createEvent}
      distances={distances}
      locateEvent={props.locateEvent}
      measurementMode={props.measurementMode}
      openEvent={openEvent}
      deleteDetections={props.deleteDetections}
      sdIdsToShowFk={props.sdIdsToShowFk}
      selectedSdIds={props.selectedSdIds}
      setMeasurementModeEntries={props.setMeasurementModeEntries}
      setSelectedSdIds={props.setSelectedSdIds}
      signalDetectionsByStation={signalDetectionsByStation}
      updateDetections={props.updateDetections}
      // ! TODO DO NOT USE `props.glContainer.width` TO CALCULATING WIDTH - COMPONENT MAY NOT BE INSIDE GL
      widthOfDisplayPx={props.glContainer ? props.glContainer.width : 0}
      updateFeaturePredictions={props.updateFeaturePredictions}
      location={props.location}
      setSelectedLocationSolution={props.setSelectedLocationSolution}
      setSelectedPreferredLocationSolution={props.setSelectedPreferredLocationSolution}
    />
  );
}
