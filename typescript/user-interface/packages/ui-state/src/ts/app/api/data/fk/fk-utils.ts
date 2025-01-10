import type { ConfigurationTypes, StationTypes } from '@gms/common-model';
import { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { convertSecondsToDuration, SECONDS_IN_MINUTES } from '@gms/common-util';
import produce from 'immer';

import type { AppDispatch } from '../../../store';
import { computeLegacyFkSpectra } from './compute-legacy-fk-spectra';

/**
 * Calculates start time for fk service
 *
 * @param wfStartTime start of the signal detection beam
 * @param arrivalTime arrival time of the signal detection
 * @param leadTime lead time for fk calculation
 * @param stepSize step size for fk calculation
 *
 * @return epoch seconds representing the start time for fk calculation
 */
export function calculateStartTimeForFk(
  wfStartTime: number,
  arrivalTime: number,
  leadTime: number,
  stepSize: number
): number {
  if (
    wfStartTime === undefined ||
    arrivalTime === undefined ||
    leadTime === undefined ||
    stepSize === undefined
  ) {
    throw new Error('Cannot calculate fk start time with undefined parameters');
  }
  const stepTime = arrivalTime - wfStartTime - leadTime;
  const numberOfSteps = Math.floor(stepTime / stepSize);
  if (numberOfSteps < 0) {
    throw new Error(
      'Cannot calculate fk start time. Wf start time is not far enough before arrival time'
    );
  }
  const timeBeforeArrival = stepSize * numberOfSteps + leadTime;
  return arrivalTime - timeBeforeArrival;
}

/**
 * Helper function that builds the ComputeFk Input object. Shared by computeFk and computeFkFrequencyThumbnails
 *
 * @param userContext user context for current user
 * @param input FkInput sent by UI
 * @param sdHyp signal detection hypothesis for fk
 * @param areThumbnails (Modifies sample rate so Thumbnails only returns one spectrum in fk)
 *
 * @returns fk input
 */
export const createComputeFkInput = (
  detection: SignalDetectionTypes.SignalDetection,
  fkData: FkTypes.FkSpectra | undefined,
  configuration: FkTypes.FkSpectraTemplate | undefined,
  isThumbnailRequest: boolean
): FkTypes.FkInputWithConfiguration | undefined => {
  if (!detection || !configuration) {
    return undefined;
  }

  // TODO: remove once the fk spectra template service returns corrected values
  const fkTemplate = produce(configuration, draft => {
    draft.fkSpectraParameters.spectrumStepDuration = 10.0;
  });

  // Get arrivalTime segment to figure out length in secs
  // Lookup the Azimuth feature measurement and get the fkDataId (channel segment id)
  const arrivalFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    SignalDetectionTypes.Util.getCurrentHypothesis(detection.signalDetectionHypotheses)
      ?.featureMeasurements
  );

  // Set start and end time based on arrival segment if it exists,
  // else default to one minute before and 4 minutes after arrival time
  const startTime = fkData
    ? fkData.startTime
    : arrivalFM.measurementValue.arrivalTime.value - SECONDS_IN_MINUTES;
  const endTime = fkData
    ? fkData.endTime
    : arrivalFM.measurementValue.arrivalTime.value + SECONDS_IN_MINUTES * 4;
  // For thumbnail with sample count of 1 just use arrival start time
  const offsetStartTime = isThumbnailRequest
    ? arrivalFM.measurementValue.arrivalTime.value
    : calculateStartTimeForFk(
        startTime,
        arrivalFM.measurementValue.arrivalTime.value,
        fkTemplate.fkSpectraWindow.lead,
        fkTemplate.fkSpectraParameters.spectrumStepDuration
      );
  // Compute sample count if thumbnail only want one spectrum
  const timeSpanAvailable = endTime - startTime;
  const sampleCount = isThumbnailRequest
    ? 1
    : Math.floor(timeSpanAvailable / fkTemplate.fkSpectraParameters.spectrumStepDuration);
  const sampleRate = sampleCount / timeSpanAvailable;

  const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
    SignalDetectionTypes.Util.getCurrentHypothesis(detection.signalDetectionHypotheses)
      .featureMeasurements
  );
  const slowStartXY = (fkTemplate.fkSpectraParameters.slownessGrid.numPoints - 1) / 2;
  return {
    fkComputeInput: {
      startTime: offsetStartTime,
      sampleRate,
      sampleCount,
      channels: fkTemplate.inputChannels,
      windowLead: convertSecondsToDuration(fkTemplate.fkSpectraParameters.fkSpectrumWindow.lead),
      windowLength: convertSecondsToDuration(
        fkTemplate.fkSpectraParameters.fkSpectrumWindow.duration
      ),
      lowFrequency: fkTemplate.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz,
      highFrequency: fkTemplate.fkSpectraParameters.fkFrequencyRange.highFrequencyHz,
      useChannelVerticalOffset: false,
      phaseType: fmPhase.value,
      normalizeWaveforms: fkTemplate.fkSpectraParameters.normalizeWaveforms,
      slowCountX: Math.floor(fkTemplate.fkSpectraParameters.slownessGrid.numPoints),
      slowCountY: Math.floor(fkTemplate.fkSpectraParameters.slownessGrid.numPoints),
      // Start at the bottom left corner in seconds/degrees
      slowStartX: FkTypes.Util.kmToDegreesApproximate(-slowStartXY),
      slowStartY: FkTypes.Util.kmToDegreesApproximate(-slowStartXY),
      slowDeltaX:
        (FkTypes.Util.kmToDegreesApproximate(slowStartXY) * 2) /
        fkTemplate.fkSpectraParameters.slownessGrid.numPoints,
      slowDeltaY:
        (FkTypes.Util.kmToDegreesApproximate(slowStartXY) * 2) /
        fkTemplate.fkSpectraParameters.slownessGrid.numPoints
    },
    configuration: fkTemplate,
    signalDetectionId: detection.id,
    isThumbnailRequest
  };
};

/**
 * TODO: This should be reworked after the computeFk WASM implementation
 * Queries for fk frequency thumbnail list
 *
 * @param fkInput input variables for requesting frequency thumbnails
 */
export const queryFkFrequencyThumbnails = async (
  fkInput: FkTypes.FkInputWithConfiguration | undefined,
  signalDetection: SignalDetectionTypes.SignalDetection,
  stations: StationTypes.Station[],
  fkStationTypeConfigurations: ConfigurationTypes.FkStationTypeConfigurations,
  dispatch: AppDispatch
): Promise<void> => {
  if (!fkInput) {
    return;
  }
  const station = signalDetection
    ? stations.find(s => s.name === signalDetection.station.name)
    : undefined;

  if (!station) {
    throw new Error('Unable to find signal detection associated station');
  }

  if (fkInput) {
    const promises = fkStationTypeConfigurations[`${station.type}`].frequencyBands.map(
      async (fb: FkTypes.FkFrequencyRange) => {
        const input: FkTypes.FkInputWithConfiguration = {
          ...fkInput,
          fkComputeInput: {
            ...fkInput.fkComputeInput,
            lowFrequency: fb.lowFrequencyHz,
            highFrequency: fb.highFrequencyHz
          }
        };
        return dispatch(computeLegacyFkSpectra(input));
      }
    );
    await Promise.all(promises);
  }
};
