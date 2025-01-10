import {
  analystActions,
  setSelectedStationIds,
  useAppDispatch,
  useAppSelector
} from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import type { Viewer as CesiumViewer } from 'cesium';
import * as React from 'react';
import type { CesiumComponentRef } from 'resium';

import { getObjectFromPoint } from '~analyst-ui/components/map/map-utils';

import { TILE_LOAD_STATUS } from './types';

const logger = UILogger.create('GMS_CESIUM_LOADER', process.env.GMS_CESIUM_LOADER);

/**
 * Calls requestRender on the scene within the map when the redux selectedStations change.
 *
 * @param viewerRef a ref to the viewer element
 */
export const useRenderMapOnSelection = (
  viewerRef: React.RefObject<CesiumComponentRef<CesiumViewer | null>>
): void => {
  const selectedStations = useAppSelector(state => state.app.common?.selectedStationIds);
  const stationsVisibility = useAppSelector(state => state.app.waveform.stationsVisibility);
  // This useEffect hook is used to rerender the map when the dependencies have changed.
  React.useEffect(() => {
    if (viewerRef?.current?.cesiumElement?.scene) {
      viewerRef.current.cesiumElement.scene.requestRender();
    }
  }, [
    selectedStations,
    stationsVisibility,
    viewerRef,
    viewerRef.current?.cesiumElement,
    viewerRef.current?.cesiumElement?.scene
  ]);
};

export const useTileLoadingStatus = (
  cesiumElement: CesiumViewer | undefined | null
): TILE_LOAD_STATUS => {
  const [loadingStatus, setLoadingStatus] = React.useState(TILE_LOAD_STATUS.NOT_LOADED);
  React.useEffect(() => {
    if (!cesiumElement) {
      return;
    }
    cesiumElement.scene.globe.tileLoadProgressEvent.addEventListener(numToLoad => {
      if (cesiumElement.scene.globe.tilesLoaded) {
        if (numToLoad > 0) {
          setLoadingStatus(TILE_LOAD_STATUS.LOADING);
        } else if (numToLoad === 0) {
          setLoadingStatus(TILE_LOAD_STATUS.LOADED);
        } else {
          logger.warn('Bad Cesium loading event');
        }
      }
    });
  }, [cesiumElement]);
  return loadingStatus;
};

// If the user selects an entity using Shift-Click, keep the existing Entities and add the new one.
export const useOnMultipleSelect = (
  ref: React.RefObject<CesiumComponentRef<CesiumViewer | null>>,
  selectedStations: string[],
  selectedEvents: string[],
  selectedSdIds: string[]
): ((e: any) => void) => {
  const dispatch = useAppDispatch();
  return e => {
    try {
      const entity = ref.current?.cesiumElement
        ? getObjectFromPoint(ref.current.cesiumElement, e.position)
        : undefined;

      if (entity?.properties?.type?.getValue() === 'Station') {
        if (selectedStations.includes(entity.id)) {
          // If Shift-Click is made on a selected station, de-select the clicked station.
          dispatch(setSelectedStationIds(selectedStations.filter(item => item !== entity.id)));
        } else {
          dispatch(setSelectedStationIds([...selectedStations, entity.id]));
        }
      }
      if (entity?.properties?.type?.getValue() === 'Event location') {
        if (selectedEvents.includes(entity.id)) {
          // If Shift-Click is made on a selected event, de-select the clicked event.
          dispatch(
            analystActions.setSelectedEventIds(selectedEvents.filter(item => item !== entity.id))
          );
        } else {
          dispatch(analystActions.setSelectedEventIds([...selectedEvents, entity.id]));
        }
      }
      if (entity?.properties?.type?.getValue() === 'Signal detection') {
        if (selectedSdIds.includes(entity.id)) {
          // If Shift-Click is made on a selected SD, de-select the clicked SD.
          dispatch(
            analystActions.setSelectedSdIds(selectedSdIds.filter(item => item !== entity.id))
          );
        } else {
          dispatch(analystActions.setSelectedSdIds([...selectedSdIds, entity.id]));
        }
      }
    } catch (err) {
      logger.error('Error occurred locating an entity within the bounding box: ', err);
    }
  };
};
