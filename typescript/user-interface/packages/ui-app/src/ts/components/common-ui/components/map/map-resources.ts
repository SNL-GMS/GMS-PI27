import { Camera, SceneMode } from 'cesium';

Camera.DEFAULT_VIEW_FACTOR = 0;

export const baseViewerSettings = {
  sceneMode: SceneMode.SCENE2D,
  animation: false,
  baseLayerPicker: true,
  fullscreenButton: false,
  fullscreenElement: document.body,
  geocoder: false,
  homeButton: true,
  infoBox: true,
  sceneModePicker: true,
  selectionIndicator: true,
  targetFrameRate: 60,
  // resolutionScale is not being honored
  // resolutionScale: 1.0,
  // uncomment useBrowserRecommendedResolution below to force high res
  useBrowserRecommendedResolution: false,
  timeline: false,
  navigationHelpButton: false,
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity
};
