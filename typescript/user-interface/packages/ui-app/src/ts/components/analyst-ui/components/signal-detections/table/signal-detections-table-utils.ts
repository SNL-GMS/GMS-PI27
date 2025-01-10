import type { CommonTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import {
  findAmplitudeFeatureMeasurementValue,
  findAzimuthFeatureMeasurementValue,
  findEmergenceAngleFeatureMeasurementValue,
  findFeatureMeasurementChannelName,
  findLongPeriodFirstMotionFeatureMeasurementValue,
  findRectilinearityFeatureMeasurementValue,
  findShortPeriodFirstMotionFeatureMeasurementValue,
  findSlownessFeatureMeasurementValue
} from '@gms/common-model/lib/signal-detection/util';
import type { AgGridCommunity, RowNode } from '@gms/ui-core-components';
import type { DisplayedSignalDetectionConfigurationEnum } from '@gms/ui-state';
import { SignalDetectionColumn } from '@gms/ui-state';
import Immutable from 'immutable';
import includes from 'lodash/includes';

import {
  getEdgeType,
  shouldDisplaySignalDetection
} from '~analyst-ui/common/utils/signal-detection-util';
import { EventFilterOptions } from '~analyst-ui/components/events/types';
import type { SignalDetectionRow } from '~analyst-ui/components/signal-detections/types';
import {
  formatNumberForDisplayFixedThreeDecimalPlaces,
  getTableCellStringValue
} from '~common-ui/common/table-utils';

/**
 * Type guard for {@link SignalDetectionRow}
 */
export function isSignalDetectionRow(object: unknown): object is SignalDetectionRow {
  return (object as SignalDetectionRow).assocStatus !== undefined;
}

/**
 * In charge of setting the row class
 */
export const sdRowClassRules: AgGridCommunity.RowClassRules = {
  'edge-SD-row': params => params.data.edgeType !== EventFilterOptions.INTERVAL,
  'action-target-row': (params: { data: SignalDetectionRow }) => params.data.isActionTarget,
  'unqualified-action-target-row': (params: { data: SignalDetectionRow }) =>
    params.data.isUnqualifiedActionTarget
};

/**
 * This is the set of default columns to be displayed in the SD table
 * This object gets updated when columns are selected/deselected in the column picker so that state
 * doesn't get lost
 */
export const signalDetectionsColumnsToDisplay: Immutable.Map<SignalDetectionColumn, boolean> =
  Immutable.Map([
    ...Object.values(SignalDetectionColumn).map<[SignalDetectionColumn, boolean]>(v => [v, true]),
    [SignalDetectionColumn.phaseConfidence, false],
    [SignalDetectionColumn.rectilinearity, false],
    [SignalDetectionColumn.emergenceAngle, false],
    [SignalDetectionColumn.shortPeriodFirstMotion, false],
    [SignalDetectionColumn.longPeriodFirstMotion, false]
  ]);

/**
 * These two fields have in-band error codes, if we see a '-1', we need to instead display "Unknown"
 * these fields are otherwise treated as the rest of the numeric fields
 *
 * @param value
 */
export function formatRectilinearityOrEmergenceForDisplay(value: number | undefined): string {
  if (value === undefined || value === -1) return 'Unknown';
  return formatNumberForDisplayFixedThreeDecimalPlaces(value);
}

/**
 * Called by ag-grid to determine if an external filter is present/active.
 */
export function agGridIsExternalFilterPresent(
  signalDetectionFilterState: Record<DisplayedSignalDetectionConfigurationEnum, boolean>
): boolean {
  const {
    signalDetectionUnassociated,
    signalDetectionAssociatedToOpenEvent,
    signalDetectionAssociatedToCompletedEvent,
    signalDetectionAssociatedToOtherEvent,
    signalDetectionDeleted,
    signalDetectionConflicts,
    signalDetectionBeforeInterval,
    signalDetectionAfterInterval
  } = signalDetectionFilterState;

  // If any of the event associations are unchecked then the table must be filtered.
  return (
    !signalDetectionUnassociated ||
    !signalDetectionAssociatedToOpenEvent ||
    !signalDetectionAssociatedToCompletedEvent ||
    !signalDetectionAssociatedToOtherEvent ||
    !signalDetectionConflicts ||
    !signalDetectionDeleted ||
    !signalDetectionBeforeInterval ||
    !signalDetectionAfterInterval
  );
}

/**
 * Passed to ag-grid. Should return true if external filter passes, otherwise false.
 */
export function agGridDoesExternalFilterPass(
  node: RowNode,
  signalDetectionFilterState: Record<DisplayedSignalDetectionConfigurationEnum, boolean>
): boolean {
  return shouldDisplaySignalDetection(
    node.data.assocStatus,
    node.data.edgeType,
    node.data.conflict,
    signalDetectionFilterState
  );
}

/**
 * Builds a single {@link SignalDetectionRow} given a {@link SignalDetectionTypes.SignalDetection} object
 *
 * @param sdDataForRow Object containing like data related to the signal detection.
 * @param timeRange Used to determine if SD is an edge SD or not
 */
export function buildSignalDetectionRow(
  sdDataForRow: {
    sd: SignalDetectionTypes.SignalDetection;
    associationStatus: SignalDetectionTypes.SignalDetectionStatus;
    sdInConflict: boolean;
    sdIsActionTarget: boolean;
    validActionTargetSignalDetectionIds: string[];
  },
  timeRange: NonNullable<CommonTypes.TimeRange>
): SignalDetectionRow {
  const {
    sd,
    associationStatus,
    sdInConflict,
    sdIsActionTarget,
    validActionTargetSignalDetectionIds
  } = sdDataForRow;
  const featureMeasurements = SignalDetectionTypes.Util.getCurrentHypothesis(
    sd.signalDetectionHypotheses
  )?.featureMeasurements;

  return {
    id: sd.id,
    unsavedChanges: !!(sd._uiHasUnsavedEventSdhAssociation || sd._uiHasUnsavedChanges),
    assocStatus: associationStatus,
    conflict: sdInConflict,
    isActionTarget: sdIsActionTarget,
    isUnqualifiedActionTarget:
      sdIsActionTarget && !includes(validActionTargetSignalDetectionIds, sd.id),
    station: getTableCellStringValue(sd?.station.name),
    channel: findFeatureMeasurementChannelName(featureMeasurements) ?? '',
    phase: getTableCellStringValue(
      SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(featureMeasurements)?.value
    ),
    phaseConfidence: formatNumberForDisplayFixedThreeDecimalPlaces(
      SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(featureMeasurements).confidence
    ),
    time: {
      value:
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(featureMeasurements)
          .arrivalTime.value,
      uncertainty:
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(featureMeasurements)
          .arrivalTime.standardDeviation
    },
    azimuth: formatNumberForDisplayFixedThreeDecimalPlaces(
      findAzimuthFeatureMeasurementValue(featureMeasurements)?.measuredValue?.value
    ),
    azimuthStandardDeviation: formatNumberForDisplayFixedThreeDecimalPlaces(
      findAzimuthFeatureMeasurementValue(featureMeasurements)?.measuredValue?.standardDeviation
    ),
    slowness: formatNumberForDisplayFixedThreeDecimalPlaces(
      findSlownessFeatureMeasurementValue(featureMeasurements)?.measuredValue?.value
    ),
    slownessStandardDeviation: formatNumberForDisplayFixedThreeDecimalPlaces(
      findSlownessFeatureMeasurementValue(featureMeasurements)?.measuredValue?.standardDeviation
    ),
    amplitude: formatNumberForDisplayFixedThreeDecimalPlaces(
      findAmplitudeFeatureMeasurementValue(
        featureMeasurements,
        SignalDetectionTypes.FeatureMeasurementType.AMPLITUDE_A5_OVER_2
      )?.amplitude
    ),
    period: formatNumberForDisplayFixedThreeDecimalPlaces(
      findAmplitudeFeatureMeasurementValue(
        featureMeasurements,
        SignalDetectionTypes.FeatureMeasurementType.AMPLITUDE_A5_OVER_2
      )?.period
    ),
    sNR: formatNumberForDisplayFixedThreeDecimalPlaces(
      SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(featureMeasurements)?.snr?.value
    ),
    rectilinearity: formatRectilinearityOrEmergenceForDisplay(
      findRectilinearityFeatureMeasurementValue(featureMeasurements)?.measuredValue?.value
    ),
    emergenceAngle: formatRectilinearityOrEmergenceForDisplay(
      findEmergenceAngleFeatureMeasurementValue(featureMeasurements)?.measuredValue?.value
    ),
    shortPeriodFirstMotion: getTableCellStringValue(
      findShortPeriodFirstMotionFeatureMeasurementValue(featureMeasurements)?.value
    ),
    longPeriodFirstMotion: getTableCellStringValue(
      findLongPeriodFirstMotionFeatureMeasurementValue(featureMeasurements)?.value
    ),
    deleted: SignalDetectionTypes.Util.getCurrentHypothesis(sd?.signalDetectionHypotheses).deleted
      ? 'True'
      : 'False',
    edgeType: getEdgeType(
      timeRange,
      SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(featureMeasurements)
        .arrivalTime.value
    )
  };
}

/**
 * Checks for 0 to 4 integer digits before optional period and 0 to 8 fraction digits
 * Trailing period without fraction digits is also permitted
 *
 * @param stdDev
 * @returns boolean from regex test
 */
export const isValidSdListStdDev = (stdDev: string) => {
  const regex = /^\d{0,4}(?:\.\d{0,8})?\.?$/g;

  return regex.test(stdDev);
};

/**
 * Sets focus to signal detection display
 */
export function setFocusToSignalDetectionDisplay(): void {
  const signalDetectionPanel = document.getElementsByClassName('signal-detection-panel');
  const signalDetectionPanelElement = signalDetectionPanel[0].parentElement;
  signalDetectionPanelElement?.focus();
}
