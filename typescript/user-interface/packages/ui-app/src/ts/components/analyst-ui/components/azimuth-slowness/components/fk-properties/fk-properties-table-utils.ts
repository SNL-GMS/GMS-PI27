import type { EventTypes } from '@gms/common-model';
import { ArrayUtil, FkTypes } from '@gms/common-model';
import type {
  CellRendererParams,
  TooltipParams,
  ValueFormatterParams
} from '@gms/ui-core-components';
import type { ICellRendererParams, IHeaderParams } from 'ag-grid-community';

import {
  getFkHeatmapArrayFromFkSpectra,
  getPeakValueFromAzSlow,
  getPredictedPoint
} from '../fk-util';
import type { DataCell, FkPropertiesRow } from './columns/types';

export const DIGIT_PRECISION = 3;

/**
 * Number formatter
 *
 * @param value Number to format
 * @param uncertainty Uncertainty value ot format
 */
const formatValueUncertaintyPair = (value: number, uncertainty: number): string =>
  `${value.toFixed(DIGIT_PRECISION)} (\u00B1 ${uncertainty.toFixed(DIGIT_PRECISION)})`;

/** Returns true if the params passed in are for the Fstat/Power cell */
export function isFstatOrPowerCell(
  params: ValueFormatterParams<
    FkPropertiesRow,
    unknown,
    DataCell,
    CellRendererParams<FkPropertiesRow, unknown, any, ICellRendererParams, IHeaderParams>,
    IHeaderParams
  >
) {
  return params.data.id === 'Fstat' || params.data.id === 'Power';
}

/**
 * Formats the table data tooltips
 */
export function formatTooltip(params: TooltipParams): string {
  if (params.value && params.value.value) {
    if (params.value.uncertainty) {
      return formatValueUncertaintyPair(params.value.value, params.value.uncertainty);
    }
    return params.value.value.toFixed(DIGIT_PRECISION);
  }
  return '-';
}

/** Custom comparator to compare data cells */
export function dataCellComparator(valueA: DataCell, valueB: DataCell): number {
  // Guard against undefined values
  if (!valueA) {
    return valueB?.value;
  }
  if (!valueB) {
    return valueA.value;
  }
  return valueA.value - valueB.value;
}

/**
 * Helper function for {@link getFkPropertiesRows} that builds the Azimuth row
 */
function buildAzimuthDegRow(
  currentMovieFk: FkTypes.FkSpectrum,
  predictedPoint: FkTypes.AzimuthSlowness | undefined,
  analystSelectedValue: FkTypes.AzimuthSlownessValues | undefined,
  /** Used to determine if an event is open for review */
  openEventId: string | undefined,
  phaseIsInvalid: boolean
): FkPropertiesRow {
  const predictedAzimuthUncertainty = predictedPoint?.azimuthUncertainty;
  const hasAnalystMeasurement = analystSelectedValue?.azimuth !== undefined;

  const fkAttributes = ArrayUtil.atOrThrow(currentMovieFk.fkAttributes ?? [], 0);

  return {
    id: 'Azimuth',
    description: 'Azimuth (°)',
    phaseIsInvalid,
    eventIsOpen: !!openEventId,
    hasAnalystMeasurement,
    extrapolated: predictedPoint ? predictedPoint.extrapolated : false,
    peak: {
      value: fkAttributes.receiverToSourceAzimuth.value,
      uncertainty: fkAttributes.receiverToSourceAzimuth.standardDeviation
    },
    predicted: predictedPoint
      ? { value: predictedPoint.azimuth, uncertainty: predictedAzimuthUncertainty }
      : undefined,
    measured: hasAnalystMeasurement
      ? { value: analystSelectedValue.azimuth, uncertainty: undefined }
      : undefined,
    residual:
      hasAnalystMeasurement && predictedPoint
        ? { value: analystSelectedValue.azimuth - predictedPoint.azimuth, uncertainty: undefined }
        : undefined
  };
}

/**
 * Helper function for {@link getFkPropertiesRows} that builds the Slowness (s/deg) row
 */
function buildSlownessSecPerDegRow(
  currentMovieFk: FkTypes.FkSpectrum,
  predictedPoint: FkTypes.AzimuthSlowness | undefined,
  analystSelectedValue: FkTypes.AzimuthSlownessValues | undefined,
  /** Used to determine if an event is open for review */
  openEventId: string | undefined,
  phaseIsInvalid: boolean
): FkPropertiesRow {
  const predictedSlownessUncertainty = predictedPoint?.slownessUncertainty;
  const hasAnalystMeasurement = analystSelectedValue?.slowness !== undefined;
  const fkAttributes = ArrayUtil.atOrThrow(currentMovieFk.fkAttributes ?? [], 0);

  return {
    id: 'Slowness s/deg',
    description: 'Slowness (s/°)',
    phaseIsInvalid,
    eventIsOpen: !!openEventId,
    hasAnalystMeasurement,
    extrapolated: predictedPoint ? predictedPoint.extrapolated : false,
    peak: {
      value: fkAttributes.slowness.value,
      uncertainty: fkAttributes.slowness.standardDeviation
    },
    predicted: predictedPoint
      ? { value: predictedPoint.slowness, uncertainty: predictedSlownessUncertainty }
      : undefined,
    measured: hasAnalystMeasurement
      ? { value: analystSelectedValue.slowness, uncertainty: undefined }
      : undefined,
    residual:
      hasAnalystMeasurement && predictedPoint
        ? { value: analystSelectedValue.slowness - predictedPoint.slowness, uncertainty: undefined }
        : undefined
  };
}

/**
 * Helper function for {@link getFkPropertiesRows} that builds the Slowness (s/km) row
 */
function buildSlownessSecPerKmRow(
  currentMovieFk: FkTypes.FkSpectrum,
  predictedPoint: FkTypes.AzimuthSlowness | undefined,
  analystSelectedValue: FkTypes.AzimuthSlownessValues | undefined,
  /** Used to determine if an event is open for review */
  openEventId: string | undefined,
  phaseIsInvalid: boolean
): FkPropertiesRow {
  const fkAttributes = ArrayUtil.atOrThrow(currentMovieFk.fkAttributes ?? [], 0);
  const peakValue = FkTypes.Util.convertSecondsPerDegreeToSecondsPerKilometer(
    fkAttributes.slowness.value
  );
  const peakUncertainty = fkAttributes.slowness.standardDeviation
    ? FkTypes.Util.convertSecondsPerDegreeToSecondsPerKilometer(
        fkAttributes.slowness.standardDeviation
      )
    : undefined;

  let predictedSlownessSecPerKm: number | undefined;
  let predictedSlownessUncertaintySecPerKm: number | undefined;

  if (predictedPoint) {
    predictedSlownessSecPerKm = FkTypes.Util.convertSecondsPerDegreeToSecondsPerKilometer(
      predictedPoint.slowness
    );
    predictedSlownessUncertaintySecPerKm =
      FkTypes.Util.convertSecondsPerDegreeToSecondsPerKilometer(predictedPoint.slownessUncertainty);
  }

  const hasAnalystMeasurement = analystSelectedValue?.slowness !== undefined;

  return {
    id: 'Slowness s/km',
    description: 'Slowness (s/km)',
    phaseIsInvalid,
    eventIsOpen: !!openEventId,
    hasAnalystMeasurement,
    extrapolated: predictedPoint ? predictedPoint.extrapolated : false,
    peak: {
      value: peakValue,
      uncertainty: peakUncertainty
    },
    predicted:
      predictedSlownessSecPerKm !== undefined && predictedSlownessUncertaintySecPerKm !== undefined
        ? {
            value: predictedSlownessSecPerKm,
            uncertainty: predictedSlownessUncertaintySecPerKm
          }
        : undefined,
    measured: hasAnalystMeasurement
      ? {
          value: FkTypes.Util.convertSecondsPerDegreeToSecondsPerKilometer(
            analystSelectedValue.slowness
          ),
          uncertainty: undefined
        }
      : undefined,
    residual:
      hasAnalystMeasurement && predictedSlownessSecPerKm !== undefined
        ? {
            value:
              FkTypes.Util.convertSecondsPerDegreeToSecondsPerKilometer(
                analystSelectedValue.slowness
              ) - predictedSlownessSecPerKm,
            uncertainty: undefined
          }
        : undefined
  };
}

/**
 * Helper function for {@link getFkPropertiesRows} that builds the Velocity (km/s) row
 */
function buildVelocityRow(
  currentMovieFk: FkTypes.FkSpectrum,
  predictedPoint: FkTypes.AzimuthSlowness | undefined,
  analystSelectedValue: FkTypes.AzimuthSlownessValues | undefined,
  /** Used to determine if an event is open for review */
  openEventId: string | undefined,
  phaseIsInvalid: boolean
): FkPropertiesRow {
  const fkAttributes = ArrayUtil.atOrThrow(currentMovieFk.fkAttributes ?? [], 0);

  const peakValue = FkTypes.Util.convertSecondsPerDegreeToKilometersPerSecond(
    fkAttributes.slowness.value
  );
  const peakUncertainty = fkAttributes.slowness.standardDeviation
    ? FkTypes.Util.convertSecondsPerDegreeToKilometersPerSecond(
        fkAttributes.slowness.standardDeviation
      )
    : undefined;

  let predictedVelocity: number | undefined;
  let predictedVelocityUncertainty: number | undefined;

  if (predictedPoint && predictedPoint.slowness) {
    predictedVelocity = FkTypes.Util.convertSecondsPerDegreeToKilometersPerSecond(
      predictedPoint.slowness
    );
    predictedVelocityUncertainty = FkTypes.Util.convertSecondsPerDegreeToKilometersPerSecond(
      predictedPoint.slownessUncertainty
    );
  }

  const hasAnalystMeasurement = analystSelectedValue?.slowness !== undefined;

  return {
    id: 'Velocity',
    description: 'Velocity (km/s)',
    phaseIsInvalid,
    eventIsOpen: !!openEventId,
    hasAnalystMeasurement,
    extrapolated: predictedPoint ? predictedPoint.extrapolated : false,
    peak: {
      value: peakValue,
      uncertainty: peakUncertainty
    },
    predicted:
      predictedVelocity && predictedVelocityUncertainty
        ? { value: predictedVelocity, uncertainty: predictedVelocityUncertainty }
        : undefined,
    measured: hasAnalystMeasurement
      ? {
          value: FkTypes.Util.convertSecondsPerDegreeToKilometersPerSecond(
            analystSelectedValue.slowness
          ),
          uncertainty: undefined
        }
      : undefined,
    residual:
      hasAnalystMeasurement && predictedVelocity
        ? {
            value:
              FkTypes.Util.convertSecondsPerDegreeToKilometersPerSecond(
                analystSelectedValue.slowness
              ) - predictedVelocity,
            uncertainty: undefined
          }
        : undefined
  };
}

/**
 * Helper function for {@link getFkPropertiesRows} that builds the Fstat or Power row
 */
export function buildFstatOrPowerRow(
  /** Row to build */
  rowType: FkTypes.FkUnits,
  displayedFk: FkTypes.FkSpectra,
  currentMovieIndex: number,
  /** Used to determine if an event is open for review */
  openEventId: string | undefined,
  phaseIsInvalid: boolean,
  analystSelectedValue: FkTypes.AzimuthSlownessValues | undefined,
  predictedPoint: FkTypes.AzimuthSlowness | undefined
) {
  // Value setup
  const currentMovieSpectrum = displayedFk.samples[currentMovieIndex];
  const powerHeatMap = getFkHeatmapArrayFromFkSpectra(
    displayedFk.samples[currentMovieIndex],
    rowType
  );

  const fkAttributes = ArrayUtil.atOrThrow(currentMovieSpectrum.fkAttributes ?? [], 0);

  // Fstat and Power Row setup
  const peakFstatFkValue = getPeakValueFromAzSlow(
    displayedFk,
    powerHeatMap,
    fkAttributes.receiverToSourceAzimuth.value,
    fkAttributes.slowness.value
  );

  let selectedFkValue: number | undefined;
  if (analystSelectedValue?.azimuth !== undefined && analystSelectedValue?.slowness !== undefined) {
    selectedFkValue = getPeakValueFromAzSlow(
      displayedFk,
      powerHeatMap,
      analystSelectedValue.azimuth,
      analystSelectedValue.slowness
    );
  }

  return {
    id: rowType === FkTypes.FkUnits.FSTAT ? 'Fstat' : 'Power',
    description: rowType === FkTypes.FkUnits.FSTAT ? 'Fstat' : 'Power (dB)',
    phaseIsInvalid,
    eventIsOpen: !!openEventId,
    hasAnalystMeasurement: selectedFkValue !== undefined,
    extrapolated: predictedPoint ? predictedPoint.extrapolated : false,
    peak: peakFstatFkValue ? { value: peakFstatFkValue, uncertainty: undefined } : undefined,
    // Fstat/power rows do not have predicted values
    predicted: undefined,
    measured: selectedFkValue ? { value: selectedFkValue, uncertainty: undefined } : undefined,
    // Fstat/power rows do not have residual values
    residual: undefined
  };
}

export function getFkPropertiesRows(
  featurePredictionsForDisplayedSignalDetection: EventTypes.FeaturePrediction[],
  displayedFk: FkTypes.FkSpectra,
  analystMeasuredValue: FkTypes.AzimuthSlownessValues | undefined,
  currentMovieIndex: number,
  sdPhase: string,
  /** Used to determine if an event is open for review */
  openEventId: string | undefined,
  /** List of phases that cannot/do not have prediction values */
  phasesWithoutPredictions: string[]
) {
  if (!displayedFk) return [];

  // Begin building rows
  const currentMovieFk = displayedFk.samples[currentMovieIndex];
  const predictedPoint: FkTypes.AzimuthSlowness | undefined = getPredictedPoint(
    featurePredictionsForDisplayedSignalDetection
  );
  const phaseIsInvalid = phasesWithoutPredictions.includes(sdPhase);

  const dataRows: FkPropertiesRow[] = [];

  // Azimuth row
  dataRows.push(
    buildAzimuthDegRow(
      currentMovieFk,
      predictedPoint,
      analystMeasuredValue,
      openEventId,
      phaseIsInvalid
    )
  );
  // Slowness (s/deg) row
  dataRows.push(
    buildSlownessSecPerDegRow(
      currentMovieFk,
      predictedPoint,
      analystMeasuredValue,
      openEventId,
      phaseIsInvalid
    )
  );
  // Slowness (s/km) row
  dataRows.push(
    buildSlownessSecPerKmRow(
      currentMovieFk,
      predictedPoint,
      analystMeasuredValue,
      openEventId,
      phaseIsInvalid
    )
  );
  // Velocity (km/s) row
  dataRows.push(
    buildVelocityRow(
      currentMovieFk,
      predictedPoint,
      analystMeasuredValue,
      openEventId,
      phaseIsInvalid
    )
  );

  // Fstat Row
  dataRows.push(
    buildFstatOrPowerRow(
      FkTypes.FkUnits.FSTAT,
      displayedFk,
      currentMovieIndex,
      openEventId,
      phaseIsInvalid,
      analystMeasuredValue,
      predictedPoint
    )
  );

  // Power (dB) Row
  dataRows.push(
    buildFstatOrPowerRow(
      FkTypes.FkUnits.POWER,
      displayedFk,
      currentMovieIndex,
      openEventId,
      phaseIsInvalid,
      analystMeasuredValue,
      predictedPoint
    )
  );

  return dataRows;
}
