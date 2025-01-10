import type { ChannelTypes, FkTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes } from '@gms/common-model';

/**
 * Helper method to create the FkData waveforms (azimuthWf, fstatWf, slownessWf)
 *
 * @param fkSpectra the fk spectra
 */
function createFkWaveform(fkSpectra: FkTypes.FkSpectraCOI): WaveformTypes.Waveform {
  return {
    sampleRateHz: fkSpectra.sampleRateHz,
    sampleCount: fkSpectra.samples.length,
    startTime: fkSpectra.startTime,
    endTime: fkSpectra.endTime,
    type: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
    samples: new Float64Array()
  };
}

/**
 * Convert a FkSpectra (received from COI or Streaming Service) into an FstatData representation.
 *
 * @param fkSpectra: FkSpectra from COI/Streaming Service
 * @param beamWaveform: beam from the SD Arrival Time Feature measurement Channel Segment
 * @param arrivalTime: arrival time value
 *
 * @returns FK Stat Data or undefined if not able to create
 */
function convertToPlotData(fkSpectra: FkTypes.FkSpectraCOI): FkTypes.FstatData {
  const fstatData: FkTypes.FstatData = {
    azimuthWf: createFkWaveform(fkSpectra),
    fstatWf: createFkWaveform(fkSpectra),
    slownessWf: createFkWaveform(fkSpectra)
  };

  // Populate fstatData waveforms
  if (fkSpectra && fkSpectra.samples) {
    fstatData.azimuthWf.samples = new Float64Array(
      fkSpectra.samples.flatMap(
        fkSpectrum =>
          fkSpectrum?.fkAttributes?.map(attribute => attribute.receiverToSourceAzimuth.value) || []
      )
    );
    fstatData.fstatWf.samples = new Float64Array(
      fkSpectra.samples.flatMap(
        fkSpectrum => fkSpectrum?.fkAttributes?.map(attribute => attribute.peakFStat) || []
      )
    );
    fstatData.slownessWf.samples = new Float64Array(
      fkSpectra.samples.flatMap(
        fkSpectrum => fkSpectrum?.fkAttributes?.map(attribute => attribute.slowness.value) || []
      )
    );
  }
  return fstatData;
}

/**
 * Update an FkSpectra's metadata to include missing UI fields
 *
 * @param fk COI FK
 * @param configuration FkInputWithConfiguration (includes Configuration to restore)
 * @returns FkSpectra (UI version)
 */
export const updateFkMetadata = (
  fk: FkTypes.FkSpectraCOI,
  configuration: FkTypes.FkSpectraTemplate,
  peakFkAttributes?: FkTypes.FkAttributes // TODO remove optional once legacy is removed
): FkTypes.FkSpectra => {
  return {
    ...fk,
    fstatData: convertToPlotData(fk),
    configuration,
    reviewed: false,
    peakFkAttributes
  };
};

/**
 * converts an object with fully populated Channels
 * to a record
 */
export const convertProcessingMasksByChannelToRecord = processingMasksByChannel => {
  const processingMasksByChannelMap: Record<
    ChannelTypes.Channel['name'],
    ChannelSegmentTypes.ProcessingMask[]
  > = {};

  // convert processingMasksByChannel obj to a Record
  processingMasksByChannel.forEach(obj => {
    processingMasksByChannelMap[obj.channel.name] = obj.processingMasks;
  });
  return processingMasksByChannelMap;
};
