import type { AppState } from '../../store';

/**
 * @returns a boolean record of the map layers, where 'true' means the layer is visible.
 */
export const selectMapLayerVisibility = (state: AppState) => state.app.map.layerVisibility;

/**
 * @returns true if map is synced with the waveform zoom, otherwise false
 */
export const selectIsSyncedWithWaveformZoom = (state: AppState) =>
  state.app.map.isSyncedWithWaveformZoom;

/**
 * @returns coordinates that are copied from the map display
 */
export const selectCoordinates = (state: AppState) => state.app.map.coordinates;
