import type * as Cesium from 'cesium';
import React from 'react';
import type { CesiumMovementEvent, EventTarget } from 'resium';
import { CustomDataSource } from 'resium';

import { mapIanEntitiesToEntityComponent } from '~analyst-ui/components/map/map-utils';

/**
 * entities to be converted into a custom ian-map-data-source, such that each entity contains the
 * provided handlers. The provided name will be assigned to the resulting datasource.
 */
export interface MapDataSourceProps {
  key: string;
  entities: Cesium.Entity[];
  leftClickHandler?: (targetEntity: Cesium.Entity) => () => void;
  rightClickHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void;
  doubleClickHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void;
  mouseEnterHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void;
  mouseLeaveHandler?: (movement: CesiumMovementEvent, target: EventTarget) => void;
  name: string;
  onMount?: () => void;
  show: boolean;
}

/**
 * Creates a CustomDataSource to add to the cesium map by converting an array of entities into entity components
 * and spreading them into the DataSource
 */
export function MapDataSource(props: MapDataSourceProps): JSX.Element {
  const {
    entities,
    leftClickHandler,
    rightClickHandler,
    doubleClickHandler,
    mouseEnterHandler,
    mouseLeaveHandler,
    name,
    onMount,
    show
  } = props;
  const entityComponents = mapIanEntitiesToEntityComponent(
    entities,
    leftClickHandler,
    rightClickHandler,
    doubleClickHandler,
    mouseEnterHandler,
    mouseLeaveHandler,
    onMount
  );
  return (
    <CustomDataSource name={name} show={show}>
      {...entityComponents}
    </CustomDataSource>
  );
}
