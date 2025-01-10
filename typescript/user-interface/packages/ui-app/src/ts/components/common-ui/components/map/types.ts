import type GoldenLayout from '@gms/golden-layout';
import type { Viewer } from 'cesium';
import type React from 'react';

export interface MapProps {
  readonly glContainer?: GoldenLayout.Container;
  readonly doMultiSelect?: boolean;
  readonly minHeightPx: number;
  readonly selectedStations?: string[];
  readonly selectedEvents?: string[];
  readonly selectedSdIds?: string[];
  readonly entities?: JSX.Element[];
  readonly dataSources?: JSX.Element[];
  readonly handlers?: React.FunctionComponent<unknown>[];
}

export interface MapHandlerProps {
  readonly viewer: Viewer | undefined;
  readonly selectedStations?: string[];
  readonly selectedEvents?: string[];
}

export enum TILE_LOAD_STATUS {
  NOT_LOADED = 'NOT_LOADED',
  LOADING = 'LOADING',
  LOADED = 'LOADED'
}
