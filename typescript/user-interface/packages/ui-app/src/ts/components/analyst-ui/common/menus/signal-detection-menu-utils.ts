import type { CommonTypes, ConfigurationTypes, EventTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import type { EventStatus } from '@gms/ui-state';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import produce from 'immer';
import type { WritableDraft } from 'immer/dist/internal';
import includes from 'lodash/includes';

import { getSignalDetectionStatus } from '~analyst-ui/common/utils/event-util';
import {
  getSignalDetectionStatusColor,
  getSignalDetectionStatusString,
  getSwatchTooltipText
} from '~analyst-ui/common/utils/signal-detection-util';
import { systemConfig } from '~analyst-ui/config/system-config';

import type { SignalDetectionDetailsData } from '../dialogs/signal-detection-details/types';

/**
 * @returns the props for {@link SignalDetectionDetailsProps}
 */
export function getSignalDetectionDetailsProps(
  signalDetection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string,
  eventStatuses: Record<string, EventStatus>,
  openIntervalName: string,
  intervalTimeRange: CommonTypes.TimeRange,
  uiTheme: ConfigurationTypes.UITheme
): SignalDetectionDetailsData {
  const assocStatus = getSignalDetectionStatus(
    signalDetection,
    events,
    currentOpenEventId,
    eventStatuses,
    openIntervalName
  );
  const assocColor = getSignalDetectionStatusColor(assocStatus, uiTheme);
  const assocStatusString = getSignalDetectionStatusString(assocStatus);
  const swatchTooltipText = getSwatchTooltipText(assocStatus, signalDetection, intervalTimeRange);
  return {
    signalDetection,
    color: assocColor,
    assocStatus: assocStatusString,
    swatchTooltipText
  };
}

/**
 * Returns true if the provided signal detection can be used to generate
 * an FK.
 *
 * @param signalDetection the signal detection to check if it can be used to
 * generate an FK.
 * @returns true if the signal detection can be used to generate an FK; false otherwise
 */
export function canGenerateFk(signalDetection: SignalDetectionTypes.SignalDetection): boolean {
  const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
    SignalDetectionTypes.Util.getCurrentHypothesis(signalDetection.signalDetectionHypotheses)
      .featureMeasurements
  );
  if (!fmPhase) {
    return false;
  }
  return (
    systemConfig.nonFkSdPhases.findIndex(
      phase => phase.toLowerCase() === fmPhase.value.toString().toLowerCase()
    ) === -1
  );
}

/**
 * Returns true if the provided signal detections can be used to display an FK.
 *
 * @param sds a list of signal detections
 * @returns true if the signal detections can be used to display an FK; false otherwise
 */
export function canDisplayFkForSds(sds: SignalDetectionTypes.SignalDetection[]): boolean {
  sds.forEach(sd => {
    const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
      SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
        .featureMeasurements
    );
    if (!fmPhase) {
      return false;
    }
    if (systemConfig.nonFkSdPhases.findIndex(phase => phase === fmPhase.value) < 0) {
      return true;
    }
    return false;
  });
  return false;
}

/**
 * Method called by hide measurement mode menu onClick to update measurement mode entries to hide
 *
 * @param associatedSignalDetectionHypothesisIds list of signal detection hypos
 */
export function hideMeasurementModeEntries(
  associatedSignalDetectionHypothesisIds: string[],
  measurementMode: AnalystWorkspaceTypes.MeasurementMode,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  setMeasurementModeEntries: (entries: Record<string, boolean>) => void
) {
  // clear out all the additional measurement mode entries
  const updatedEntries = produce(
    measurementMode.entries,
    (draft: WritableDraft<Record<string, boolean>>) => {
      Object.keys(draft).forEach(key => {
        draft[key] = false;
      });

      if (measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT) {
        // hide all auto show
        signalDetections
          .filter(
            sd =>
              includes(
                associatedSignalDetectionHypothesisIds,
                SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).id.id
              ) &&
              includes(
                systemConfig.measurementMode.phases,
                SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
                  SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
                    .featureMeasurements
                ).value
              )
          )
          .forEach(sd => {
            draft[sd.id] = false;
          });
      }
    }
  );

  setMeasurementModeEntries(updatedEntries);
}

/**
   Method called by show measurement mode menu onClick to update measurement mode entries to show
 *
 * @param associatedSignalDetectionHypothesisIds list of signal detection hypos
 */
export function showMeasurementModeEntries(
  associatedSignalDetectionHypothesisIds: string[],
  measurementMode: AnalystWorkspaceTypes.MeasurementMode,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  setMeasurementModeEntries: (entries: Record<string, boolean>) => void
) {
  // Clear out all the additional measurement mode entries
  const updatedEntries = produce(measurementMode.entries, draft => {
    associatedSignalDetectionHypothesisIds.forEach(assocSDHypId => {
      // Retrieve the SD for the given hypotheses ID
      const signalDetection = signalDetections.find(
        sd =>
          SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).id.id ===
          assocSDHypId
      );

      if (
        includes(
          systemConfig.measurementMode.phases,
          SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
            SignalDetectionTypes.Util.getCurrentHypothesis(
              signalDetection.signalDetectionHypotheses
            ).featureMeasurements
          ).value
        )
      ) {
        draft[signalDetection.id] = true;
      }
    });
  });

  setMeasurementModeEntries(updatedEntries);
}

/**
 *
 * show or hide all selected sds
 */
export function toggleShownSDs(
  selectedSdIds: string[],
  areAllSelectedSdsMarkedAsMeasurementEntriesToShow: boolean,
  areAllSelectedAssociatedAndAutoShow: boolean,
  measurementMode: AnalystWorkspaceTypes.MeasurementMode,
  setMeasurementModeEntries: (entries: Record<string, boolean>) => void
) {
  const updatedEntries = produce(
    measurementMode.entries,
    (draft: WritableDraft<Record<string, boolean>>) => {
      selectedSdIds.forEach(id => {
        draft[id] = !(
          areAllSelectedSdsMarkedAsMeasurementEntriesToShow || areAllSelectedAssociatedAndAutoShow
        );
      });
    }
  );
  setMeasurementModeEntries(updatedEntries);
}
