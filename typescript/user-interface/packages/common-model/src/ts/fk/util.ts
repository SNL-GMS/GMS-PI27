import type { ChannelSegment, Timeseries } from '../channel-segment/types';
import { TimeseriesType } from '../channel-segment/types';
import type { FkTypes, SignalDetectionTypes } from '../common-model';
import { findPhaseFeatureMeasurementValue, getCurrentHypothesis } from '../signal-detection/util';
import type { FkFrequencyRange, FkPowerSpectra, FkSpectra } from './types';

/** Kilometer per degree of Earth */
const KM_PER_DEGREE = 111.19492664;

/**
 * Checks if FK spectra channel segment
 *
 * @param object Channel Segment
 * @returns boolean
 */
export function isFkSpectraChannelSegment(
  object: ChannelSegment<Timeseries>
): object is ChannelSegment<FkSpectra> {
  return object.timeseriesType === TimeseriesType.FK_SPECTRA;
}

/**
 * Checks if FK spectra
 *
 * @param object FkSpectra Timeseries
 * @returns boolean
 */
export function isFkSpectra(object: Timeseries): object is FkSpectra {
  return object.type === TimeseriesType.FK_SPECTRA;
}

/**
 * Checks if FK power spectra channel segment
 *
 * @param object Channel Segment
 * @returns boolean
 */
export function isFkPowerSpectraChannelSegment(
  object: ChannelSegment<Timeseries>
): object is ChannelSegment<FkSpectra> {
  return object.timeseriesType === TimeseriesType.FK_SPECTRA_OLD;
}

/**
 * Checks if FK spectra
 *
 * @param object FkSpectra Timeseries
 * @returns boolean
 */
export function isFkPowerSpectra(object: Timeseries): object is FkPowerSpectra {
  return object.type === TimeseriesType.FK_SPECTRA_OLD;
}

// TODO: Review to see what might make more sense as part of configuration
/** Width/height of y and x axis respectively */
export const SIZE_OF_FK_RENDERING_AXIS_PX = 35;

/** The height of the rendering needs to be 8 pixels smaller than the width */
export const FK_RENDERING_HEIGHT_OFFSET = 8;
/** The width of the x axis markers needs to be 10 pixels wider than the canvas */
export const FK_X_AXIS_WIDTH_OFFSET = 10;
/** The height of the y axis markers needs to be 12 pixels taller than the canvas */
export const FK_Y_AXIS_HEIGHT_OFFSET = 12;

export const BEAM_TOOLBAR_WIDTH_OFFSET = -80;

/** Default Frequency Bands */
export const FrequencyBands: FkFrequencyRange[] = [
  {
    lowFrequencyHz: 0.5,
    highFrequencyHz: 2
  },
  {
    lowFrequencyHz: 1,
    highFrequencyHz: 2.5
  },
  {
    lowFrequencyHz: 1.5,
    highFrequencyHz: 3
  },
  {
    lowFrequencyHz: 2,
    highFrequencyHz: 4
  },
  {
    lowFrequencyHz: 3,
    highFrequencyHz: 6
  }
];

/**
 * Formats a frequency band into a string for the drop down
 *
 * @param band Frequency band to format
 */
export function frequencyBandToString(band: FkTypes.FkFrequencyRange): string {
  return `${band.lowFrequencyHz} - ${band.highFrequencyHz} Hz`;
}

/**
 * Creates menu options for frequency bands
 */
export const generateFrequencyBandOptions = (): string[] => {
  const items: string[] = [];
  FrequencyBands.forEach(frequency => {
    items.push(frequencyBandToString(frequency));
  });
  return items;
};

/**
 * Approximate conversion between degrees and km
 *
 * @returns Kilometer
 */
export function degreeToKmApproximate(degree: number): number {
  const DEGREES_IN_CIRCLE = 360;
  const RAD_EARTH = 6371;
  const TWO_PI = Math.PI * 2;
  return degree / (DEGREES_IN_CIRCLE / (RAD_EARTH * TWO_PI));
}

/**
 * Approximate conversion between km and degrees
 *
 * @returns Degree
 */
export function kmToDegreesApproximate(km: number): number {
  const DEGREES_IN_CIRCLE = 360;
  const RAD_EARTH = 6371;
  const TWO_PI = Math.PI * 2;
  return km * (DEGREES_IN_CIRCLE / (RAD_EARTH * TWO_PI));
}

/**
 * @returns Input value in s/degree converted to km/s
 */
export function convertSecondsPerDegreeToKilometersPerSecond(value: number) {
  return KM_PER_DEGREE / value;
}

/**
 * @returns Input value in s/degree converted to s/km
 */
export function convertSecondsPerDegreeToSecondsPerKilometer(value: number) {
  return 1 / convertSecondsPerDegreeToKilometersPerSecond(value);
}

/**
 * Determines if the fk needs review
 *
 * @param sd: the signal detection to check
 * @returns true if needs review, otherwise false
 */
export const fkNeedsReview = (
  fk: FkTypes.FkSpectra | undefined,
  phasesNeedingReview: string[] | undefined,
  sd: SignalDetectionTypes.SignalDetection | undefined,
  isForFiltering = false
): boolean => {
  if (!fk || !sd || !phasesNeedingReview) {
    return false;
  }
  if (fk.reviewed && !isForFiltering) {
    return false;
  }
  const currentSdHypothesis = getCurrentHypothesis(sd.signalDetectionHypotheses);
  const phase = findPhaseFeatureMeasurementValue(currentSdHypothesis.featureMeasurements)?.value;

  if (phase && phasesNeedingReview.indexOf(phase) > -1) {
    return true;
  }
  return false;
};
