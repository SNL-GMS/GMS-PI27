import type { CommonTypes, FkTypes } from '@gms/common-model';
import { ChannelSegmentTypes, SignalDetectionTypes } from '@gms/common-model';
import type { ChannelSegmentDescriptor } from '@gms/common-model/lib/channel-segment/types';

import type { FkChannelSegmentRecord, FkFrequencyThumbnailRecord } from '../../../src/ts/types';
import { getTestFkData, getTestFkPowerData } from './fk-spectra';

export const fkChannelSegmentDescriptor: ChannelSegmentDescriptor = {
  channel: {
    effectiveAt: 1677974400,
    name: 'ASAR.fk.SHZ/cc6456be8447ec0108077f78b8d73dab3b3059b8edcc6d104f998716a83ba5b3'
  },
  startTime: 1678203144.708,
  endTime: 1678203144.708,
  creationTime: 1678210073.631
};

export const fkChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> = {
  maskedBy: [],
  units: 'NANOMETERS_SQUARED_PER_SECOND' as CommonTypes.Units.NANOMETERS_SQUARED_PER_SECOND,
  timeseriesType: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
  timeseries: [],
  missingInputChannels: [],
  id: fkChannelSegmentDescriptor
};

export const fkPowerChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra> = {
  maskedBy: [],
  units: 'NANOMETERS_SQUARED_PER_SECOND' as CommonTypes.Units.NANOMETERS_SQUARED_PER_SECOND,
  timeseriesType: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA_OLD,
  timeseries: [],
  missingInputChannels: [],
  id: fkChannelSegmentDescriptor
};

export const getTestFkChannelSegment = (
  sd: SignalDetectionTypes.SignalDetection
): ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> => {
  const sdHypo = SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses);
  const arrivalTimeFm = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypo.featureMeasurements
  );
  const azFm = SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(sdHypo.featureMeasurements);
  const fk = getTestFkData(arrivalTimeFm.measurementValue.arrivalTime.value);
  fkChannelSegment.timeseries.push(fk);
  if (azFm?.measuredChannelSegment) {
    fkChannelSegment.id = azFm.measuredChannelSegment.id;
  }
  return fkChannelSegment;
};

export const getTestFkPowerChannelSegment = (
  sd: SignalDetectionTypes.SignalDetection
): ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra> => {
  const sdHypo = SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses);
  const arrivalTimeFm = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypo.featureMeasurements
  );
  const azFm = SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(sdHypo.featureMeasurements);
  const fk = getTestFkPowerData(arrivalTimeFm.measurementValue.arrivalTime.value);
  fkPowerChannelSegment.timeseries.push(fk);
  if (azFm?.measuredChannelSegment) {
    fkChannelSegment.id = azFm.measuredChannelSegment.id;
  }
  return fkPowerChannelSegment;
};

export const getTestFkChannelSegmentRecord = (
  sd: SignalDetectionTypes.SignalDetection
): FkChannelSegmentRecord => {
  const fkCs = getTestFkChannelSegment(sd);
  const record = {};
  record[ChannelSegmentTypes.Util.createChannelSegmentString(fkChannelSegment.id)] = fkCs;
  return record;
};

export const getTestFkFrequencyThumbnailRecord = (
  sds: SignalDetectionTypes.SignalDetection[]
): FkFrequencyThumbnailRecord => {
  const record = {};
  sds.forEach(sd => {
    const sdHypo = SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses);
    const arrivalTimeFm = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
      sdHypo.featureMeasurements
    );
    const fk = getTestFkData(arrivalTimeFm.measurementValue.arrivalTime.value);
    const freqThumbnail: FkTypes.FkFrequencyThumbnail = {
      frequencyBand: {
        lowFrequencyHz: fk.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz,
        highFrequencyHz: fk.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz
      },
      fkSpectra: fk
    };
    record[sd.id] = [freqThumbnail];
  });
  return record;
};
