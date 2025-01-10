import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import { secondsToString, TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION } from '@gms/common-util';
import { darkenColor, decimalToHex, lightenColor } from '@gms/ui-util';
import type {
  ColorMaterialProperty,
  ConstantPositionProperty,
  DistanceDisplayCondition
} from 'cesium';
import {
  BillboardGraphics,
  Cartesian3,
  Color,
  ConstantProperty,
  HorizontalOrigin,
  JulianDate,
  LabelGraphics,
  LabelStyle,
  PolylineGraphics,
  PolylineOutlineMaterialProperty,
  VerticalOrigin
} from 'cesium';

import {
  alwaysDisplayDistanceDisplayCondition,
  defaultSDOpacity,
  edgeSDOpacityFallback,
  eventOpenEyeOffset,
  eventSelectedEyeOffset,
  eventSelectedOpenEyeOffset,
  eventUnselectedEyeOffset,
  fontStyle,
  hoveredSDTintPercentage,
  imageScale,
  imageScaleSelected,
  LABEL_HEIGHT_SELECTED,
  LABEL_HEIGHT_UNSELECTED,
  monoFontStyle,
  nonActionTargetOpacity,
  SELECT_BLUE as SELECTED_BLUE,
  SELECT_TRANSPARENT as SELECTED_TRANSPARENT,
  SELECTED_SIGNAL_DETECTION_GLOW_ALPHA,
  SELECTED_SIGNAL_DETECTION_GLOW_OUTLINE_WIDTH,
  SELECTED_SIGNAL_DETECTION_WIDTH_OFFSET,
  selectedPixelOffset,
  unselectedPixelOffset
} from '~common-ui/components/map/constants';

import { EventFilterOptions } from '../events/types';
import type { MapEventSource } from './types';

/**
 * Concatenates an opacity on a given hex code based on action targets and edge event status
 *
 * @param color
 * @param uiTheme
 * @param edgeSDType
 * @param areActionTargetsPresent
 * @param isActionTarget
 */
export function applySDPolylineColorOpacity(
  color: string,
  uiTheme: UITheme,
  edgeSDType: EventFilterOptions,
  areActionTargetsPresent: boolean,
  isActionTarget: boolean
): string {
  if ((!areActionTargetsPresent && edgeSDType === EventFilterOptions.INTERVAL) || isActionTarget) {
    return color.concat(decimalToHex(defaultSDOpacity));
  }
  if (areActionTargetsPresent) {
    return color.concat(decimalToHex(nonActionTargetOpacity));
  }
  return color.concat(decimalToHex(uiTheme.display.edgeSDOpacity ?? edgeSDOpacityFallback));
}

/**
 * Lightens or darkens (if white) a polyline color on hover
 *
 * @param color
 */
export function getSDPolylineHoverColor(color: string): string {
  if (color !== '#FFFFFF') {
    return lightenColor(color, hoveredSDTintPercentage);
  }
  return darkenColor(color, hoveredSDTintPercentage);
}

/**
 * Provides a theme color plus concatenated opacity for an SD polyline
 *
 * @param uiTheme
 * @param status
 * @param edgeSDType
 * @param areActionTargetsPresent
 * @param isActionTarget
 */
export function getSDPolylineBaseColorHex(
  uiTheme: UITheme,
  status: SignalDetectionTypes.SignalDetectionStatus,
  edgeSDType: EventFilterOptions,
  areActionTargetsPresent: boolean,
  isActionTarget: boolean
): string {
  let baseColor = '#FFFFFF';
  if (status === SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED)
    baseColor = uiTheme.colors.otherEventSDColor;
  if (status === SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED)
    baseColor = uiTheme.colors.unassociatedSDColor;
  if (status === SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED)
    baseColor = uiTheme.colors.openEventSDColor;
  if (status === SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED)
    baseColor = uiTheme.colors.completeEventSDColor;
  if (status === SignalDetectionTypes.SignalDetectionStatus.DELETED)
    baseColor = uiTheme.colors.deletedSdColor;
  return applySDPolylineColorOpacity(
    baseColor,
    uiTheme,
    edgeSDType,
    areActionTargetsPresent,
    isActionTarget
  );
}

/**
 * Returns polyline material for Signal Detections based on whether or not the signal detection is selected or an action target or not.
 * If the Polyline is not selected, returns just the color
 * If the SD is selected, returns a new PolylineMaterialProperty that includes a semi-transparent outline to give the line a glow effect.
 *
 * @param isSelected
 * @param isUnqualifiedActionTarget
 * @param color
 */
export function getSDPolylineMaterial(
  isSelectedOrActionTarget: boolean,
  isUnqualifiedActionTarget: boolean,
  color: ColorMaterialProperty
): ColorMaterialProperty | PolylineOutlineMaterialProperty {
  if (!isSelectedOrActionTarget) return color;

  const outlineColor = color.color.getValue(JulianDate.now());
  outlineColor.alpha = isUnqualifiedActionTarget ? 0 : SELECTED_SIGNAL_DETECTION_GLOW_ALPHA;
  return new PolylineOutlineMaterialProperty({
    color: color.color,
    outlineWidth: SELECTED_SIGNAL_DETECTION_GLOW_OUTLINE_WIDTH,
    outlineColor
  });
}

/**
 * Given a Cesium entity and a display condition, configure a label for that entity
 *
 * @param item - Station/Channel Group/Event location we are creating a label for
 * @param distanceDisplayCondition - DistanceDisplayCondition
 * @param isSelected - is the entity we are creating a label for selected (affects size and color)
 */
export function createLabel(
  item: ChannelTypes.ChannelGroup | StationTypes.Station | MapEventSource,
  distanceDisplayCondition: DistanceDisplayCondition,
  isSelected: boolean
): LabelGraphics {
  let text;
  let font;
  let backgroundColor;
  if ('name' in item) {
    text = item.name;
    font = fontStyle;
    backgroundColor = SELECTED_BLUE;
  } else {
    text = secondsToString(item.time.value, TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION);
    font = monoFontStyle;
    backgroundColor = SELECTED_TRANSPARENT;
  }
  const options: LabelGraphics.ConstructorOptions = {
    backgroundColor,
    text,
    font,
    fillColor: Color.WHITE,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    showBackground: isSelected,
    style: new ConstantProperty(LabelStyle.FILL_AND_OUTLINE),
    distanceDisplayCondition: new ConstantProperty(
      isSelected ? alwaysDisplayDistanceDisplayCondition : distanceDisplayCondition
    ),
    verticalOrigin: new ConstantProperty(VerticalOrigin.TOP),
    pixelOffset: new ConstantProperty(isSelected ? selectedPixelOffset : unselectedPixelOffset),
    eyeOffset: new Cartesian3(
      0.0,
      0.0,
      isSelected ? LABEL_HEIGHT_SELECTED : LABEL_HEIGHT_UNSELECTED
    )
  };

  return new LabelGraphics(options);
}

/**
 * Returns a new PolyLineGraphics object from an array of positions with given style
 *
 * @param positions Start position and end position as a Cesium.Cartiesian3[]
 * @param distanceDisplayCondition defines what distances you can see the line from
 * @param material If just specifying a color, use ColorMaterialProperty. If you want a line with outline provide a PolylineMaterialProperty
 * @param width of the polyline in pixels
 * @param isSelected
 */
export function createPolyline(
  positions: Cartesian3[],
  distanceDisplayCondition: DistanceDisplayCondition,
  material: ColorMaterialProperty | PolylineOutlineMaterialProperty,
  width: number,
  isSelected = false
): PolylineGraphics {
  return new PolylineGraphics({
    distanceDisplayCondition: new ConstantProperty(distanceDisplayCondition),
    positions,
    show: true,
    width: isSelected
      ? new ConstantProperty(width + (SELECTED_SIGNAL_DETECTION_WIDTH_OFFSET as number))
      : new ConstantProperty(width),
    material
  });
}

/**
 * Create a Billboard for a station, ChannelGroup, or event (i.e. map icons)
 *
 * @param selected : is the entity we are creating a billboard for selected
 * @param eyeOffset: z-index of the billboard
 * @param color
 * @param image
 */
export function createBillboard(
  isSelectedOrActionTarget: boolean,
  eyeOffset: ConstantPositionProperty,
  color: Color,
  image: Document | string
): BillboardGraphics {
  const billboard = new BillboardGraphics();
  billboard.image = new ConstantProperty(image);
  billboard.color = new ConstantProperty(color);
  billboard.scale = isSelectedOrActionTarget
    ? new ConstantProperty(imageScaleSelected)
    : new ConstantProperty(imageScale);
  // billboard should have the center of lat/long in middle of shape;
  billboard.horizontalOrigin = new ConstantProperty(HorizontalOrigin.CENTER);
  billboard.verticalOrigin = new ConstantProperty(VerticalOrigin.CENTER);
  // set eye offset (similar to z-index, which is not yet supported)
  billboard.eyeOffset = eyeOffset;
  return billboard;
}

/**
 * Determines ConstantPositionProperty for Event Eye Offset
 *
 * @param isOpen
 * @param isSelected
 * @returns ConstantPositionProperty for offset
 */
export function determineEventEyeOffset(
  isOpen: boolean,
  isSelected: boolean
): ConstantPositionProperty {
  let eventEyeOffset;
  if (isOpen && isSelected) {
    eventEyeOffset = eventSelectedOpenEyeOffset;
  } else if (isOpen && !isSelected) {
    eventEyeOffset = eventOpenEyeOffset;
  } else if (isSelected && !isOpen) {
    eventEyeOffset = eventSelectedEyeOffset;
  } else {
    eventEyeOffset = eventUnselectedEyeOffset;
  }

  return eventEyeOffset;
}
