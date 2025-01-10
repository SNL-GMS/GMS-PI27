import { Colors } from '@blueprintjs/core';
import type { ColorTypes, ConfigurationTypes, EventTypes, StationTypes } from '@gms/common-model';
import { ArrayUtil, FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { DEFAULT_COLOR_MAP } from '@gms/common-model/lib/color/types';
import { isNumericMeasurementValue } from '@gms/common-model/lib/signal-detection/util';
import { AnalystWorkspaceTypes, FkThumbnailsFilterType, getBoundaries } from '@gms/ui-state';
import type { Point } from '@gms/ui-util';
import { interpolateJet, UILogger } from '@gms/ui-util';
import type { WeavessTypes } from '@gms/weavess-core';
import * as d3 from 'd3';
import {
  interpolateCividis,
  interpolateCool,
  interpolateCubehelixDefault,
  interpolateInferno,
  interpolateMagma,
  interpolatePlasma,
  interpolateTurbo,
  interpolateViridis,
  interpolateWarm
} from 'd3-scale-chromatic';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';

import { gmsColors } from '~scss-config/color-preferences';

const logger = UILogger.create('GMS_LOG_FK', process.env.GMS_LOG_FK);

export const markerRadiusSize = 5;
const CONSTANT_360 = 360;
const CONSTANT_180 = CONSTANT_360 / 2;
const CONSTANT_90 = CONSTANT_180 / 2;

/**
 * Miscellaneous functions for rendering and processing fk data
 */

/**
 * Gets the predicted point values from the incoming signal detection
 *
 * @param sd to get point from
 */
export const getPredictedPoint = (
  featurePredictions: EventTypes.FeaturePrediction[]
): FkTypes.AzimuthSlowness | undefined => {
  const predictedAzimuth = featurePredictions.find(
    fp =>
      fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.RECEIVER_TO_SOURCE_AZIMUTH
  );
  const azValue =
    predictedAzimuth && isNumericMeasurementValue(predictedAzimuth.predictionValue?.predictedValue)
      ? predictedAzimuth.predictionValue.predictedValue
      : undefined;

  const predictedSlowness = featurePredictions.find(
    fp => fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.SLOWNESS
  );

  const slowValue =
    predictedSlowness &&
    isNumericMeasurementValue(predictedSlowness.predictionValue?.predictedValue)
      ? predictedSlowness.predictionValue.predictedValue
      : undefined;

  if (azValue && slowValue) {
    return {
      slowness: slowValue.measuredValue.value,
      slownessUncertainty: slowValue.measuredValue.standardDeviation ?? 0,
      azimuth: azValue.measuredValue.value,
      azimuthUncertainty: azValue.measuredValue.standardDeviation ?? 0,
      extrapolated: !!predictedSlowness?.extrapolated || !!predictedAzimuth?.extrapolated // extrapolated should be the same value for both
    };
  }
  return undefined;
};

/**
 * Returns an array of [min, max] values for the y axis of a spectra
 *
 * @param fkSpectra the spectra to get scales from
 */
export const getYAxisForFkSpectra = (fkSpectra: FkTypes.FkSpectra): number[] => {
  const slowStartY = (fkSpectra.configuration.fkSpectraParameters.slownessGrid.numPoints - 1) / 2;
  return [-slowStartY, slowStartY];
};

/**
 * Returns an array of [min, max] values for the x axis of a spectra
 *
 * @param fkSpectra the spectra to get scales from
 */
export const getXAxisForFkSpectra = (fkSpectra: FkTypes.FkSpectra): number[] => {
  const slowStartX = (fkSpectra.configuration.fkSpectraParameters.slownessGrid.numPoints - 1) / 2;
  return [-slowStartX, slowStartX];
};

export const getChannelSegmentBoundaries = async (
  channelName: string,
  channelSegment: WeavessTypes.ChannelSegment,
  timeRange?: WeavessTypes.TimeRange
): Promise<WeavessTypes.ChannelSegmentBoundaries> => {
  return getBoundaries(channelSegment, timeRange?.startTimeSecs, timeRange?.endTimeSecs);
};

/**
 * Draws a circle
 *
 * @param ctx The canvas context to draw in
 * @param x The x coordinate to start drawing
 * @param y The y coordinate to start drawing at
 * @param strokeColor The circle's color, defaults to RED
 * @param isFilled If true, fills the circle
 */
export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radii: number[],
  strokeColor: string = gmsColors.gmsStrongWarning,
  isFilled = false
): void => {
  ctx.strokeStyle = strokeColor;
  radii.forEach(radius => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (isFilled) {
      ctx.fillStyle = strokeColor;
      ctx.fill();
    } else {
      ctx.stroke();
    }
  });
};

/**
 * Draw the crosshairs.
 *
 * @param canvasRef the canvas to draw on
 * @param ctx the canvas' drawing context
 */
export function drawFkCrossHairs(
  canvasRef: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  ctx.strokeStyle = gmsColors.gmsMain;
  ctx.beginPath();

  ctx.moveTo(canvasRef.width / 2, 0);
  ctx.lineTo(canvasRef.width / 2, canvasRef.height);
  ctx.stroke();

  ctx.moveTo(0, canvasRef.height / 2);
  ctx.lineTo(canvasRef.width, canvasRef.height / 2);
  ctx.stroke();
}

/**
 * Draw velocity radius indicators
 *
 * @param canvasRef The canvas to draw on
 * @param ctx The canvas' context
 * @param fkData the data to render
 * @param constantVelocityRings configured rings in km/s
 * @param hideRingLabels if true, hides the ring's labels
 */
export function drawVelocityRings(
  canvasRef: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fkData: FkTypes.FkSpectra,
  constantVelocityRings: number[],
  hideRingLabels = false
): void {
  const slowStartY = (fkData.configuration.fkSpectraParameters.slownessGrid.numPoints - 1) / 2;

  const scale = d3
    .scaleLinear()
    .domain([0, slowStartY])
    .range([0, canvasRef.height / 2]);

  // Convert the values in km/s => s/degrees
  const slownessRings = constantVelocityRings.map(
    velocityRing => 1 / FkTypes.Util.kmToDegreesApproximate(velocityRing)
  );

  // construct the labels
  const fkVelocityRadiiLabels = constantVelocityRings.map(ring => `${ring} km/s`);

  const scaledRadii: number[] = slownessRings.map(scale);

  const center = {
    x: canvasRef.width / 2,
    y: canvasRef.height / 2
  };

  // add labels for each ring
  if (!hideRingLabels) {
    scaledRadii.forEach((value: number, index) => {
      // eslint-disable-next-line no-param-reassign
      ctx.fillStyle = gmsColors.gmsMain;
      const label = `${fkVelocityRadiiLabels[index]}`;
      ctx.fillText(label, Number(center.x) + 3, Number(center.y) - (value + 3));
    });
  }
  drawCircle(ctx, center.x, center.y, scaledRadii, gmsColors.gmsMain);
}

/**
 * Create and draw the x-axis.
 *
 * @param fkData Fk data to create axis
 * @param xAxisContainer HTML element
 */
export function createXAxis(fkData: FkTypes.FkSpectra, xAxisContainer: HTMLDivElement): void {
  // eslint-disable-next-line no-param-reassign
  xAxisContainer.innerHTML = '';

  const svg = d3
    .select(xAxisContainer)
    .append('svg')
    .attr('width', xAxisContainer.clientWidth)
    .attr('height', xAxisContainer.clientHeight)
    .style('fill', Colors.LIGHT_GRAY5);

  const svgAxis = svg.append('g').attr('class', 'fk-axis');

  const padding = 10;
  const x = d3
    .scaleLinear()
    .domain(getXAxisForFkSpectra(fkData))
    .range([padding, xAxisContainer.clientWidth - padding - 1]);

  const tickSize = 7;
  const xAxis = d3.axisBottom(x).tickSize(tickSize);
  svgAxis.call(xAxis);
}

/**
 * Create and draw the y-axis.
 *
 * @param fkData Fk data to create axis
 * @param yAxisContainer HTML element
 */
export function createYAxis(fkData: FkTypes.FkSpectra, yAxisContainer: HTMLDivElement): void {
  if (!yAxisContainer) return;
  // eslint-disable-next-line no-param-reassign
  yAxisContainer.innerHTML = '';

  const svg = d3
    .select(yAxisContainer)
    .append('svg')
    .attr('width', yAxisContainer.clientWidth)
    .attr('height', yAxisContainer.clientHeight)
    .style('fill', Colors.LIGHT_GRAY5);

  const svgAxis = svg.append('g').attr('class', 'fk-axis').attr('transform', 'translate(34, 0)');

  const padding = 10;
  const y = d3
    .scaleLinear()
    .domain(getYAxisForFkSpectra(fkData))
    .range([yAxisContainer.clientHeight - padding - 1, padding]);

  const tickSize = 7;
  const yAxis = d3.axisLeft(y).tickSize(tickSize);
  svgAxis.call(yAxis);
}

/**
 * Converts polar point to X,Y point
 *
 * @param slowness Radius in polar coordinates
 * @param azimuth Theta in polar coordinates
 */
export const convertPolarToXY = (slowness: number, azimuth: number): Point => {
  // converts polar - adjusted to have 0 degrees be North
  const radians = (azimuth - CONSTANT_90) * (Math.PI / CONSTANT_180);
  const x = slowness * Math.cos(radians);
  const y = slowness * Math.sin(radians);

  return { x, y };
};

/**
 * Converts the incoming X,Y point to polar coordinates represented by
 * Azimuth Degrees and Radial Slowness
 *
 * @param x x coordinate
 * @param y y coordinate
 */
export const convertXYtoPolar = (
  x: number,
  y: number
): {
  azimuthDeg: number;
  radialSlowness: number;
} => {
  // converts xy to theta in degree - adjusted to have 0 degrees be North
  const adjustmentDegrees = 270;

  let theta =
    CONSTANT_360 -
    ((Math.atan2(y, x) * (CONSTANT_180 / Math.PI) + adjustmentDegrees) % CONSTANT_360);

  // Round to 3 decimals places
  theta = (Math.round(theta * 1000) / 1000) % CONSTANT_360;

  // Calculate radius from center
  const radius = Math.sqrt(x ** 2 + y ** 2);

  return {
    azimuthDeg: theta,
    radialSlowness: radius
  };
};

/**
 * Takes azimuth slowness polar point and converts to x,y coordinate space
 * It then scales x,y for the canvas size
 *
 * @param fkData
 * @param azimuth
 * @param slowness
 * @param canvasSize
 * @returns Point on the canvas
 */
export function getScaledAzimuthSlownessPoint(
  fkData: FkTypes.FkSpectra,
  azimuth: number,
  slowness: number,
  canvasSize: number
): { x: number; y: number } {
  const scale = d3.scaleLinear().domain(getYAxisForFkSpectra(fkData)).range([0, canvasSize]);
  const point = convertPolarToXY(slowness, azimuth);
  return { x: scale(point.x), y: scale(point.y) };
}

/**
 * Derive the peak azimuth and slowness values from a FkSpectra given a spectrum index
 */
export function getPeakAzimuthSlowness(
  fkData: FkTypes.FkSpectra,
  spectrumIndex: number
): FkTypes.AzimuthSlownessValues {
  const currentSpectrum = fkData.samples[spectrumIndex];
  if (!currentSpectrum) {
    logger.warn(`Undefined spectrum - index set to ${spectrumIndex}`);
  }

  const fkAttributes = ArrayUtil.atOrThrow(currentSpectrum?.fkAttributes ?? [], 0);

  return {
    azimuth: fkAttributes.receiverToSourceAzimuth.value,
    slowness: fkAttributes.slowness.value
  };
}

/**
 * Draw the Max FK marker.
 *
 * @param canvasRef The canvas to draw on
 * @param ctx The canvas' context
 * @param fkData the data to render
 * @param arrivalTime the arrival time
 */
export function drawPeakFk(
  canvasRef: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fkData: FkTypes.FkSpectra,
  currentMovieSpectrumIndex: number
): void {
  const { azimuth: peakAzimuth, slowness: peakSlowness } = getPeakAzimuthSlowness(
    fkData,
    currentMovieSpectrumIndex
  );

  // Get the scaled point
  const scaledPoint = getScaledAzimuthSlownessPoint(
    fkData,
    peakAzimuth,
    peakSlowness,
    canvasRef.height
  );
  drawCircle(ctx, scaledPoint.x, scaledPoint.y, [markerRadiusSize - 1], gmsColors.gmsMain, true);
}

/**
 * Draw the predicted FK marker crosshair dot.
 *
 * @param ctx The canvas' context
 * @param x x coordinate
 * @param y y coordinate
 * @param strokeColor the color of the cross hair dot
 * @param size (OPTIONAL) radius size uses class defined radius by default
 */
export function drawCrosshairDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  strokeColor: string,
  size = markerRadiusSize
): void {
  const length = markerRadiusSize - 1;

  ctx.strokeStyle = gmsColors.gmsRecessed;

  ctx.beginPath();
  ctx.moveTo(x - length, y - length);
  ctx.lineTo(x + length, y + length);

  ctx.moveTo(x + length, y - length);
  ctx.lineTo(x - length, y + length);
  ctx.stroke();

  drawCircle(ctx, x, y, [size], strokeColor, false);
}

/**
 * Draw the predicted FK marker.
 *
 * @param canvasRef The canvas to draw on
 * @param ctx The canvas' context
 * @param fkData the data to render
 * @param predictedPoint
 * @param strokeColor
 */
export function drawPredictedFk(
  canvasRef: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fkData: FkTypes.FkSpectra,
  predictedPoint: FkTypes.AzimuthSlowness,
  strokeColor: string = gmsColors.gmsRecessed
): void {
  if (!fkData || !predictedPoint || !canvasRef) {
    return;
  }
  // Get the scaled point
  const scaledPoint = getScaledAzimuthSlownessPoint(
    fkData,
    predictedPoint.azimuth,
    predictedPoint.slowness,
    canvasRef.height
  );
  drawCrosshairDot(ctx, scaledPoint.x, scaledPoint.y, strokeColor);
}

/**
 * Draws a single dot on the canvas.
 *
 * @param ctx the 2d rendering context
 * @param coordinates the coordinates
 */
function drawDot(ctx: CanvasRenderingContext2D, coordinates: Point) {
  drawCircle(
    ctx,
    +coordinates.x,
    coordinates.y,
    [markerRadiusSize - 1],
    gmsColors.gmsRecessed,
    true
  );
}

/**
 * Draws the main FK image.
 *
 * @param canvasRef The canvas element to draw on
 * @param imageBitmap the bitmap to draw on the canvas
 * @param reduceOpacity optional, if true the drawing is set to 40% opacity
 */
export function drawImage(
  canvasRef: HTMLCanvasElement,
  imageBitmap: ImageBitmap,
  reduceOpacity?: boolean
): void {
  const ctx = canvasRef.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get 2D CanvasRenderingObject');
  }
  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
  const transparencyPower = 0.4;
  if (reduceOpacity) {
    ctx.globalAlpha = transparencyPower;
  }
  ctx.drawImage(imageBitmap, 0, 0, canvasRef.width, canvasRef.height);
}

/**
 * Draws accessory items on the FK image ie; velocity rings, predicted point,
 * FK crosshairs, etc
 *
 * @param canvasRef The canvas element to draw on
 * @param fkData the fk data to be rendered
 * @param predictedPoint predictedPoint as AzimuthSlowness
 * @param currentMovieSpectrumIndex FkSpectrum index to draw image from
 * @param constantVelocityRings
 * @param dotLocation optional, where to draw a black dot
 * @param hideRingLabels  optional, if true, hides the labels for the rings
 */
export function drawImageOverlay(
  canvasRef: HTMLCanvasElement,
  fkData: FkTypes.FkSpectra,
  predictedPoint: FkTypes.AzimuthSlowness | undefined,
  currentMovieSpectrumIndex: number,
  constantVelocityRings: number[],
  dotLocation: Point | undefined,
  hideRingLabels = true
): void {
  const ctx = canvasRef.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get 2D CanvasRenderingObject');
  }
  drawFkCrossHairs(canvasRef, ctx);
  drawVelocityRings(canvasRef, ctx, fkData, constantVelocityRings, hideRingLabels);
  drawPeakFk(canvasRef, ctx, fkData, currentMovieSpectrumIndex);
  if (predictedPoint) {
    drawPredictedFk(canvasRef, ctx, fkData, predictedPoint);
  }
  if (dotLocation) {
    drawDot(ctx, dotLocation);
  }
}

/**
 * Converts a clicked x y coordinate and converts to coordinate space
 * and scales based on xy axis
 *
 * @param x x value in graphics space
 * @param y y value in graphics space
 * @param fkData used to retrieve the slowness scale
 * @param width of spectra
 * @param height of spectra
 */
export const convertGraphicsXYtoCoordinate = (
  x: number,
  y: number,
  fkData: FkTypes.FkSpectra,
  width: number,
  height: number
): Point => {
  const xscale = d3.scaleLinear().domain([0, width]).range(getXAxisForFkSpectra(fkData));
  const yscale = d3
    .scaleLinear()
    .domain([0, height])
    // Reversing to properly scale from graphics space to xy space
    .range(getYAxisForFkSpectra(fkData).reverse());

  const scaledX: number = xscale(x);
  const scaledY: number = yscale(y);

  return {
    x: scaledX,
    y: scaledY
  };
};

/**
 * Given an (x,y) coordinate, returns the corresponding azimuth and
 * slowness values represented by those two points.
 *
 * @param x x coordinate
 * @param y y coordinate
 * @returns converted XYPolar
 */
export const getMeasuredValueFromCartesian = (
  x: number,
  y: number
): { azimuth: number; slowness: number } => {
  const polar = convertXYtoPolar(x, y);
  return {
    azimuth: polar.azimuthDeg,
    slowness: polar.radialSlowness
  };
};

/**
 * Converts azimuth and slowness values to x,y coords
 *
 * @param fkData
 * @param azimuth
 * @param slowness
 * @param canvasHeight (canvas is square so only 1 dimension necessary)
 * @returns Point
 */
export const getCartesianFromMeasuredValue = (
  fkData: FkTypes.FkSpectra,
  azimuth: number,
  slowness: number,
  canvasHeight: number
): Point => {
  const scaledPoint = getScaledAzimuthSlownessPoint(fkData, azimuth, slowness, canvasHeight);
  return {
    x: scaledPoint.x,
    y: scaledPoint.y
  };
};

function getColorMapInterpolation(colorMap: ColorTypes.ColorMapName) {
  switch (colorMap) {
    case 'turbo':
      return interpolateTurbo;
    case 'viridis':
      return interpolateViridis;
    case 'inferno':
      return interpolateInferno;
    case 'magma':
      return interpolateMagma;
    case 'plasma':
      return interpolatePlasma;
    case 'cividis':
      return interpolateCividis;
    case 'cool':
      return interpolateCool;
    case 'warm':
      return interpolateWarm;
    case 'cubehelixdefault':
      return interpolateCubehelixDefault;
    case 'jet':
      return interpolateJet;
    default:
      return getColorMapInterpolation(DEFAULT_COLOR_MAP);
  }
}

/**
 * Draws the color scale
 *
 * @param min The minimum frequency value
 * @param max THe maximum frequency value
 * @returns D3 object that turns values into colors d3.ScaleSequential<d3.HSLColor>
 */
export const createColorScale = (min: number, max: number, colorMap: ColorTypes.ColorMapName) =>
  d3.scaleSequential(getColorMapInterpolation(colorMap ?? DEFAULT_COLOR_MAP)).domain([min, max]);

/**
 * Convert fk data to an ImageBitmap
 *
 * @param fkData The data to render
 * @param min The minimum frequency value
 * @param max The maximum frequency value
 * @returns JS Promise that resolves to the FK ImageBitmap
 */
export const createFkImageBitmap = async (
  fkGrid: number[][],
  min: number,
  max: number,
  colorMap: ColorTypes.ColorMapName
): Promise<ImageBitmap> => {
  const dim = fkGrid.length;
  const size = dim * dim;
  const buffer = new Uint8ClampedArray(size * 4); // r, g, b, a for each point
  const uInt8Max = 255;

  const colorScale = createColorScale(min, max, colorMap);
  for (let row = 0; row < fkGrid.length; row += 1) {
    for (let col = 0; col < fkGrid[0].length; col += 1) {
      const value = fkGrid[row][col];
      const pos = (row * fkGrid.length + col) * 4;
      const color = d3.rgb(colorScale(value));
      buffer[pos] = color.r;
      buffer[pos + 1] = color.g;
      buffer[pos + 2] = color.b;
      buffer[pos + 3] = uInt8Max;
    }
  }

  const imgData = new ImageData(buffer, fkGrid.length, fkGrid.length);
  return window.createImageBitmap(imgData);
};

/**
 * Create heat map color scale.
 *
 * @param heightPx The height in px of the bitmap
 * @param widthPx The width in px of the bitmap
 * @returns JS Promise that resolves to a ColorScale ImageBitmap
 */
export const createColorScaleImageBitmap = async (
  heightPx: number,
  widthPx: number,
  colorMap: ColorTypes.ColorMapName
): Promise<ImageBitmap> => {
  const size = heightPx * widthPx;
  const buffer = new Uint8ClampedArray(size * 4); // r, g, b, a for each point
  const uInt8Max = 255;

  const colorScale = createColorScale(0, heightPx + 1, colorMap);
  for (let row = 0; row < heightPx; row += 1) {
    for (let col = 0; col < widthPx; col += 1) {
      const pos = (row * heightPx + col) * 4;

      const color = d3.rgb(colorScale(col));
      buffer[pos] = color.r;
      buffer[pos + 1] = color.g;
      buffer[pos + 2] = color.b;
      buffer[pos + 3] = uInt8Max;
    }
  }

  const imgData = new ImageData(buffer, heightPx, widthPx);
  return window.createImageBitmap(imgData);
};

/**
 * Finds the min/max frequency of an FK so the heatmap can be drawn.
 *
 * @param fkData the raw fk data to find a min/max for
 * @returns An array where index 0 is a minimum fk freq and an index 1 is a maximum fk freq
 */
export const computeMinMaxFkValues = (fkData: number[][]): [number, number] => {
  let max = -Infinity;
  let min = Infinity;

  // eslint-disable-next-line no-restricted-syntax
  for (const row of fkData) {
    // eslint-disable-next-line no-restricted-syntax
    for (const val of row) {
      if (val > max) max = val;
      if (val < min) min = val;
    }
  }

  return [min, max];
};

/**
 * Return the heatmap array from the FK Spectra
 *
 * @param fkSpectra: an fk power spectra
 * @returns number[][]
 */
export const getFkHeatmapArrayFromFkSpectra = (
  fkSpectrum: FkTypes.FkSpectrum,
  unit: FkTypes.FkUnits
): number[][] => {
  if (!fkSpectrum) return [[]];

  return unit === FkTypes.FkUnits.FSTAT ? fkSpectrum.fstat : fkSpectrum.power;
};

/**
 * Calculates the fstat point based on input heatmap and az slow values
 *
 * @param fkData as fkSpectra
 * @param heatMap as number[][]
 * @param azimuth azimuth
 * @param slowness slowness
 * @param units units as FkUnits
 */
export const getPeakValueFromAzSlow = (
  fkData: FkTypes.FkSpectra,
  heatMap: number[][],
  azimuth: number,
  slowness: number
): number | undefined => {
  const xaxis = getXAxisForFkSpectra(fkData);
  const yaxis = getYAxisForFkSpectra(fkData);
  const xscale = d3
    .scaleLinear()
    .domain(xaxis)
    .range([0, xaxis[1] * 2]);
  const yscale = d3
    .scaleLinear()
    .domain(yaxis)
    .range([0, yaxis[1] * 2]);

  const xyPoint = convertPolarToXY(slowness, azimuth);
  const x = Math.floor(xscale(xyPoint.x));
  const y = Math.floor(yscale(xyPoint.y));
  const maybeRow = heatMap ? heatMap[y] : undefined;
  return maybeRow ? maybeRow[x] : undefined;
};

/**
 * Returns sorted signal detections based on sort type (Distance, Alphabetical)
 */
export function getSortedSignalDetections(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType,
  distanceToSource: EventTypes.LocationDistance[]
): SignalDetectionTypes.SignalDetection[] {
  // Organize SDs by station
  const sdsByStation: Record<string, SignalDetectionTypes.SignalDetection[]> = {};
  signalDetections.forEach(sd => {
    if (Object.keys(sdsByStation).includes(sd.station.name)) {
      sdsByStation[sd.station.name].push(sd);
    } else {
      sdsByStation[sd.station.name] = [sd];
    }
  });

  let sortedStationNames: string[] = [];
  // Sort by station distance
  if (
    selectedSortType === AnalystWorkspaceTypes.WaveformSortType.distance &&
    distanceToSource.length > 0
  ) {
    sortedStationNames = sortBy<string>(Object.keys(sdsByStation), [
      stationName => distanceToSource.find(d => d.id === stationName)?.distance.km
    ]);
  }
  // Sort by stations alphabetically
  else {
    sortedStationNames = orderBy<string>(
      Object.keys(sdsByStation),
      [stationName => stationName],
      selectedSortType === AnalystWorkspaceTypes.WaveformSortType.stationNameZA ? ['desc'] : ['asc']
    );
  }

  let result: SignalDetectionTypes.SignalDetection[] = [];
  sortedStationNames.forEach(stationName => {
    const sortedByArrivalTime = sdsByStation[stationName].sort((sd1, sd2) => {
      const sd1Arrival = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(sd1.signalDetectionHypotheses)
          .featureMeasurements
      );
      const sd2Arrival = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(sd2.signalDetectionHypotheses)
          .featureMeasurements
      );
      return sd1Arrival.arrivalTime.value - sd2Arrival.arrivalTime.value;
    });

    result = result.concat(sortedByArrivalTime);
  });
  return result;
}

/**
 * Filter for Key Activity Phases as defined in ui.analyst-settings.json
 */
function keyActivityPhasesFilter(
  sdsToFilter: SignalDetectionTypes.SignalDetection[],
  keyActivityPhases
): SignalDetectionTypes.SignalDetection[] {
  if (!sdsToFilter || sdsToFilter.length === 0 || !keyActivityPhases) return [];

  const filteredSDs = sdsToFilter.filter(sd => {
    const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
        .featureMeasurements
    );
    return keyActivityPhases.includes(fmPhase.value);
  });
  return filteredSDs;
}

/**
 * Filters signal detections based on the selected filter
 *
 * @param sds Signal detections to filter
 */
export function filterSignalDetections(
  associatedSDs: SignalDetectionTypes.SignalDetection[],
  unassociatedSDs: SignalDetectionTypes.SignalDetection[],
  currentFkThumbnailFilter: FkThumbnailsFilterType,
  keyActivityPhases: string[],
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType,
  distances: EventTypes.LocationDistance[],
  fksNeedReview: (
    associatedSDs: SignalDetectionTypes.SignalDetection[],
    isForFiltering?: boolean
  ) => SignalDetectionTypes.SignalDetection[]
): SignalDetectionTypes.SignalDetection[] {
  let sdToDraw: SignalDetectionTypes.SignalDetection[];

  switch (currentFkThumbnailFilter) {
    case FkThumbnailsFilterType.ALL: {
      sdToDraw = getSortedSignalDetections(
        [...associatedSDs, ...unassociatedSDs],
        selectedSortType,
        distances
      );
      break;
    }
    case FkThumbnailsFilterType.NEEDSREVIEW: {
      const sortedSignalDetections = getSortedSignalDetections(
        associatedSDs,
        selectedSortType,
        distances
      );
      sdToDraw = fksNeedReview(sortedSignalDetections, true);
      break;
    }
    case FkThumbnailsFilterType.OPENEVENT: {
      sdToDraw = getSortedSignalDetections(associatedSDs, selectedSortType, distances);
      break;
    }
    case FkThumbnailsFilterType.KEYACTIVITYPHASES:
    default: {
      const sortedSignalDetections = getSortedSignalDetections(
        [...associatedSDs, ...unassociatedSDs],
        selectedSortType,
        distances
      );
      sdToDraw = keyActivityPhasesFilter(sortedSignalDetections, keyActivityPhases);
      break;
    }
  }
  return sdToDraw;
}

/**
 * Retrieves constant velocity rings from the analyst config for a station type
 *
 * @param allStations: StationTypes.Station[] all stations
 * @param signalDetection: SignalDetectionTypes.SignalDetection
 * @param processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration
 *
 * @returns number[]
 */
export function getConstantVelocityRingsForStationType(
  allStations: StationTypes.Station[],
  signalDetection: SignalDetectionTypes.SignalDetection | undefined,
  processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration
): number[] {
  if (!signalDetection) return [];

  const station = ArrayUtil.findOrThrow(allStations, s => s.name === signalDetection.station.name);

  return (
    processingAnalystConfig?.fkConfigurations?.fkStationTypeConfigurations[station.type]
      ?.constantVelocityRings ?? []
  );
}

/**
 * Retrieves spectra from the analyst config for a station type
 *
 * @param allStations: StationTypes.Station[] all stations
 * @param signalDetection: SignalDetectionTypes.SignalDetection
 * @param processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration
 *
 * @returns List of FkFrequencyRange objects
 */
export function getFrequencyBandsForStationType(
  allStations: StationTypes.Station[],
  signalDetection: SignalDetectionTypes.SignalDetection | undefined,
  processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration
): FkTypes.FkFrequencyRange[] {
  if (!signalDetection) return [];

  const station = ArrayUtil.findOrThrow(allStations, s => s.name === signalDetection.station.name);

  return (
    processingAnalystConfig.fkConfigurations.fkStationTypeConfigurations[station.type]
      ?.frequencyBands ?? []
  );
}

/**
 * List of unassociated Signal Detections to Open Event
 * returns SD's in optional list which are unassociated
 * or all SD's in open interval for visible stations which are unassociated
 *
 * @param event: EventTypes.Event -> Event to check in
 * @param allSDsForVisibleStationsInInterval: SignalDetectionTypes.SignalDetection[]
 * @param openIntervalName: string
 * @param sdIdsToCheck: string[] -> list of SD ids to check
 *
 * @returns SignalDetectionTypes.SignalDetection[]
 */
export const getUnassociatedDetectionsForShowFk = (
  allSDsForVisibleStationsInInterval: SignalDetectionTypes.SignalDetection[],
  sdIdsToCheck: string[],
  associatedSignalDetections: SignalDetectionTypes.SignalDetection[]
): SignalDetectionTypes.SignalDetection[] => {
  const unassociatedDetectionsForShowFk: SignalDetectionTypes.SignalDetection[] = [];
  // All unassociated SDs (if in associated SDs then exclude)
  sdIdsToCheck.forEach(sdId => {
    const unassociatedSd = allSDsForVisibleStationsInInterval.find(sd => sd.id === sdId);
    if (
      unassociatedSd &&
      !associatedSignalDetections.find(assocSd => assocSd.id === unassociatedSd.id) &&
      // Do not included deleted SDs
      !SignalDetectionTypes.Util.getCurrentHypothesis(unassociatedSd.signalDetectionHypotheses)
        .deleted
    ) {
      unassociatedDetectionsForShowFk.push(unassociatedSd);
    }
  });

  return unassociatedDetectionsForShowFk;
};

/**
 * Determines the index for the arrival time spectra
 *
 * @param fkData fk data used for the thumbnail
 * @param signalDetection signal detection for the thumbnail
 * @returns index for arrival time spectra
 */
export const determineArrivalTimeSpectrumIndex = (
  fkData: FkTypes.FkSpectra,
  signalDetection: SignalDetectionTypes.SignalDetection
) => {
  if (!fkData || !signalDetection) return 0;
  const { lead } = fkData.configuration.fkSpectraParameters.fkSpectrumWindow;
  const stepSizeDuration = fkData.configuration.fkSpectraParameters.spectrumStepDuration;
  const { startTime } = fkData;
  const arrivalTime =
    SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementUsingSignalDetection(signalDetection)
      .measurementValue.arrivalTime.value;
  // Calculating the offset starting point of the first marker
  const adjustedLead = lead % stepSizeDuration;
  const startOffset = (arrivalTime - adjustedLead - startTime) % stepSizeDuration;
  // Setting the position in epoch time
  const startEpoch = startTime + startOffset;
  const index = (arrivalTime - startEpoch - lead) / stepSizeDuration;
  if (startOffset > 0) {
    return index + 1;
  }
  return index;
};
