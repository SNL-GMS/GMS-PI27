import type { SignalDetectionTypes } from '@gms/common-model';
import type * as Cesium from 'cesium';
import type { CesiumMovementEvent } from 'resium';

import type { EventFilterOptions, EventRow } from '../events/types';

export type MapRightClickHandler = (
  movement: CesiumMovementEvent,
  target: Cesium.Entity,
  latitude: number,
  longitude: number
) => void;

/**
 * Event source for map display
 * Extending EventRow type with additional geoOverlappingEvents property
 */
export interface MapEventSource extends EventRow {
  geoOverlappingEvents?: number;
}

/**
 * Values to be added to signal detection entity property bag
 */
export interface MapSDEntityPropertyBagDefinitions {
  readonly id: string;
  readonly type: string;
  readonly detectionTime: {
    detectionTimeValue: string;
    detectionTimeUncertainty: number;
  };
  readonly azimuth: {
    azimuthValue: number;
    azimuthUncertainty: number;
  };
  readonly slowness: {
    slownessValue: number;
    slownessUncertainty: number;
  };
  readonly phaseValue: SignalDetectionTypes.PhaseTypeMeasurementValue;
  readonly deleted: boolean;
  readonly associated: boolean;
  readonly associatedEventTimeValue: string;
  readonly signalDetectionBaseColor: string;
  readonly status: SignalDetectionTypes.SignalDetectionStatus;
  readonly edgeSDType: EventFilterOptions;
  readonly stationName: string;
  readonly isSelectedOrActionTarget: boolean;
}

export enum UncertaintyEllipse {
  CONFIDENCE = 'CONFIDENCE',
  COVERAGE = 'COVERAGE'
}
