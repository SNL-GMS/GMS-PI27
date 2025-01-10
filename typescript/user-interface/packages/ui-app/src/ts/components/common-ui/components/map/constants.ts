import * as Cesium from 'cesium';

import fonts from '~css/gms-fonts.scss';
import { gmsColors } from '~scss-config/color-preferences';

// minimum height of viewer
export const MIN_HEIGHT = 300;

// distances between to show the label of the entity
export const NEAR = 0;
export const MEDIUM = 100000;
export const FAR = 5000000;
export const VERYFAR = 12000000;
// a cesium version of the gms blue selection color
export const SELECT_BLUE = Cesium.Color.fromCssColorString(gmsColors.gmsSelection);

// passing an empty string to get the default cesium label color
export const SELECT_TRANSPARENT = Cesium.Color.fromCssColorString('');

// eye offset heights for entities on the map, lower values bring the item closer to the top/camera
export const LABEL_HEIGHT_UNSELECTED = -3;
export const LABEL_HEIGHT_SELECTED = -10;
export const TOOLTIP_HEIGHT = -50;
export const BILLBOARD_HEIGHT_SELECTED = -10;
export const BILLBOARD_HEIGHT_UNSELECTED_STATION = -8;
export const BILLBOARD_HEIGHT_UNSELECTED_CHANNEL = -1;
export const EVENT_CIRCLE_HEIGHT_UNSELECTED = -11;
export const EVENT_CIRCLE_HEIGHT_OPEN = -22;
export const EVENT_CIRCLE_HEIGHT_SELECTED = -33;
export const EVENT_CIRCLE_HEIGHT_SELECTED_OPEN = -44;

export const SIGNAL_DETECTION_WIDTH = 1;

export const HOVER_SIGNAL_DETECTION_WIDTH = 2;

// z-index height, not to be confused with the eyeoffsets above. For items that support a true z-index, higher values bring items to the top
export const SELECTED_SIGNAL_DETECTION_ZINDEX = 20;

// Amount in pixels to add to the provided width after selection a Signal Detection
export const SELECTED_SIGNAL_DETECTION_WIDTH_OFFSET = 4;

// Width of selected Signal Detection glowing outline
export const SELECTED_SIGNAL_DETECTION_GLOW_OUTLINE_WIDTH = 4;
// Alpha level of Signal detection glow. 0 is completely transparent, 1 is completely opaque
export const SELECTED_SIGNAL_DETECTION_GLOW_ALPHA = 0.2;

export const FIFTEEN_MINUTES_IN_SECONDS = 900;

export const UNCERTAINTY_ELLIPSE_ROTATION_OFFSET = 90;

export const eventDistanceDisplayCondition: Cesium.DistanceDisplayCondition =
  new Cesium.DistanceDisplayCondition(NEAR, VERYFAR);
export const stationDistanceDisplayCondition: Cesium.DistanceDisplayCondition =
  new Cesium.DistanceDisplayCondition(NEAR, VERYFAR);
export const channelGroupDistanceDisplayCondition: Cesium.DistanceDisplayCondition =
  new Cesium.DistanceDisplayCondition(NEAR, MEDIUM);
export const lineDistanceDisplayCondition: Cesium.DistanceDisplayCondition =
  new Cesium.DistanceDisplayCondition(NEAR, MEDIUM);
export const alwaysDisplayDistanceDisplayCondition: Cesium.DistanceDisplayCondition =
  new Cesium.DistanceDisplayCondition(NEAR, Number.MAX_SAFE_INTEGER);

/**
 * Hardcoded Cartesian3 coordinates for event circles
 */
export const eventUnselectedEyeOffset = new Cesium.ConstantPositionProperty(
  new Cesium.Cartesian3(0.0, 0.0, EVENT_CIRCLE_HEIGHT_UNSELECTED)
);
export const eventOpenEyeOffset = new Cesium.ConstantPositionProperty(
  new Cesium.Cartesian3(0.0, 0.0, EVENT_CIRCLE_HEIGHT_OPEN)
);
export const eventSelectedEyeOffset = new Cesium.ConstantPositionProperty(
  new Cesium.Cartesian3(0.0, 0.0, EVENT_CIRCLE_HEIGHT_SELECTED)
);
export const eventSelectedOpenEyeOffset = new Cesium.ConstantPositionProperty(
  new Cesium.Cartesian3(0.0, 0.0, EVENT_CIRCLE_HEIGHT_SELECTED_OPEN)
);

/**
 * Value for event uncertainty ellipse polyline width in pixels
 */
export const uncertaintyEllipseWidthPx = 2.0;

/**
 * Value for uncertainty ellipse geometry granularity
 */
export const uncertaintyEllipseGranularity = 0.002;

/**
 * Opacity applied in action target mode for entities that are not action targets so they get dimmed
 */
export const nonActionTargetOpacity = 0.2;

export const hoveredSDTintPercentage = 0.1;

export const defaultSDOpacity = 1.0;

/**
 * Fallback in case edge SD opacity is missing from theme
 */
export const edgeSDOpacityFallback = 0.2;

export const fontStyle = `14px ${fonts.gmsSans}`;
export const monoFontStyle = `14px ${fonts.gmsMono}`;
export const monoFontStyleNoSize = `${fonts.gmsMono}`;
export const MAP_MIN_HEIGHT_PX = 500;

export const imageScale = 0.12;
const imageScaleMultiplier = 1.6;
export const imageScaleSelected = imageScale * imageScaleMultiplier;
const yCartesian = 10;
export const unselectedPixelOffset = new Cesium.Cartesian2(0, yCartesian);
export const selectedPixelOffset = new Cesium.Cartesian2(0, yCartesian + 2);
