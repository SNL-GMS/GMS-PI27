import type { WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, FilterTypes, FkTypes } from '@gms/common-model';
import { allSHZPdarRawChannels, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { FilterType, LinearFilterType } from '@gms/common-model/lib/filter';
import { deserializeTypeTransformer } from '@gms/ui-workers';

import dummyFkPowerSpectra from './fk-power-spectra-sample.json';
import dummyFkSpectra from './fk-spectra-sample.json';

let startTime = 0;

export const defaultSpectraTemplate: FkTypes.FkSpectraTemplate = {
  phaseType: 'P',
  station: {
    name: 'ASAR'
  },
  inputChannels: [{ name: 'ASAR' }],
  fkSpectraParameters: {
    phase: 'P',
    fkSpectrumWindow: {
      duration: 5.1,
      lead: 1.1
    },
    fkFrequencyRange: {
      lowFrequencyHz: 0.5,
      highFrequencyHz: 2.0
    },
    minimumWaveformsForSpectra: 1,
    normalizeWaveforms: false,
    orientationAngleToleranceDeg: 0.0,
    preFilter: FilterTypes.UNFILTERED_FILTER.filterDefinition ?? undefined,
    slownessGrid: {
      maxSlowness: 40,
      numPoints: 81
    },
    spectrumStepDuration: 10.0,
    twoDimensional: true,
    waveformSampleRate: {
      waveformSampleRateHz: 20,
      waveformSampleRateToleranceHz: 1.0
    },
    fftTaperFunction: FkTypes.TaperFunction.BLACKMAN,
    fftTaperPercent: 75.0,
    fkUncertaintyOption: FkTypes.FkUncertaintyOption.EMPIRICAL
  },
  fkSpectraWindow: {
    duration: 300,
    lead: 60
  }
};
export const defaultPDARSpectraTemplate: FkTypes.FkSpectraTemplate = {
  phaseType: 'P',
  station: {
    name: 'PDAR'
  },
  inputChannels: [
    { name: 'PDAR' },
    ...allSHZPdarRawChannels.map(channel => {
      return { name: channel.name };
    })
  ],
  fkSpectraParameters: {
    phase: 'P',
    fkSpectrumWindow: {
      duration: 5.1,
      lead: 1.1
    },
    fkFrequencyRange: {
      lowFrequencyHz: 0.5,
      highFrequencyHz: 2.0
    },
    minimumWaveformsForSpectra: 1,
    normalizeWaveforms: false,
    orientationAngleToleranceDeg: 0.0,
    preFilter: FilterTypes.UNFILTERED_FILTER.filterDefinition ?? undefined,
    slownessGrid: {
      maxSlowness: 40,
      numPoints: 81
    },
    spectrumStepDuration: 10.0,
    twoDimensional: true,
    waveformSampleRate: {
      waveformSampleRateHz: 20,
      waveformSampleRateToleranceHz: 1.0
    },
    fftTaperFunction: FkTypes.TaperFunction.BLACKMAN,
    fftTaperPercent: 75.0,
    fkUncertaintyOption: FkTypes.FkUncertaintyOption.EMPIRICAL
  },
  fkSpectraWindow: {
    duration: 300,
    lead: 60
  }
};

export const fkSpectraTemplatesResponse: FkTypes.FkSpectraTemplatesByStationByPhase = {
  ASAR: {
    P: {
      fkSpectraWindow: {
        duration: 300,
        lead: 60
      },
      station: {
        effectiveAt: 1694361600,
        name: 'ASAR'
      },
      phaseType: 'P',
      inputChannels: [],
      fkSpectraParameters: {
        phase: 'P',
        preFilter: {
          name: '0.5 4.0 3 BP non-causal',
          comments: 'Butterworth IIR band-pass 0.5-4.0 Hz, order 3, non-causal',
          filterDescription: {
            comments: '0.5 4.0 3 BP non-causal',
            causal: false,
            filterType: FilterType.LINEAR,
            linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
            lowFrequencyHz: 0.5,
            highFrequencyHz: 4,
            order: 3,
            zeroPhase: true,
            passBandType: FilterTypes.BandType.BAND_PASS,
            parameters: {
              sampleRateHz: 1,
              sampleRateToleranceHz: 1,
              groupDelaySec: 1
            }
          }
        },
        slownessGrid: {
          maxSlowness: 8.883,
          numPoints: 10
        },
        fftTaperFunction: FkTypes.TaperFunction.BLACKMAN,
        fkSpectrumWindow: {
          duration: 4,
          lead: 1
        },
        fkFrequencyRange: {
          lowFrequencyHz: 3.3,
          highFrequencyHz: 4.2
        },
        fkUncertaintyOption: FkTypes.FkUncertaintyOption.EMPIRICAL,
        waveformSampleRate: {
          waveformSampleRateHz: 4.9,
          waveformSampleRateToleranceHz: 9.9737
        },
        spectrumStepDuration: 10,
        orientationAngleToleranceDeg: 0,
        minimumWaveformsForSpectra: 1,
        normalizeWaveforms: false,
        twoDimensional: true,
        fftTaperPercent: 5
      }
    }
  }
};

export const defaultSpectraDefinition: FkTypes.FkSpectraDefinition = {
  fkParameters: { ...defaultSpectraTemplate.fkSpectraParameters },
  orientationAngles: {
    horizontalAngleDeg: 90,
    verticalAngleDeg: 0
  }
};

const frequencyPair = {
  lowFrequencyHz: 3,
  highFrequencyHz: 6
};

/**
 * Helper method to create the FkData waveforms (azimuthWf, fstatWf, slownessWf)
 *
 * @param fkSpectra the fk spectra
 */
function createFkWaveform(
  fkSpectra: FkTypes.FkSpectraCOI | FkTypes.FkPowerSpectraCOI
): WaveformTypes.Waveform {
  return {
    sampleRateHz: fkSpectra.sampleRateHz,
    sampleCount: fkSpectra.sampleCount,
    startTime: startTime + 1.0,
    endTime: startTime + fkSpectra.sampleCount / fkSpectra.sampleRateHz,
    type: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
    samples: new Float64Array()
  };
}

/**
 * Convert a FkSpectra (received from COI or Streaming Service) into an FstatData representation.
 *
 * @param fkSpectra: FkPowerSpectra from COI/Streaming Service
 * @param beamWaveform: beam from the SD Arrival Time Feature measurement Channel Segment
 * @param arrivalTime: arrival time value
 *
 * @returns FK Stat Data or undefined if not able to create
 */
function convertToPlotData(
  fkSpectra: FkTypes.FkSpectraCOI | FkTypes.FkPowerSpectraCOI
): FkTypes.FstatData | undefined {
  // If the channel segment is populated at the top properly
  if (!fkSpectra) {
    return undefined;
  }

  const fstatData: FkTypes.FstatData = {
    azimuthWf: createFkWaveform(fkSpectra),
    fstatWf: createFkWaveform(fkSpectra),
    slownessWf: createFkWaveform(fkSpectra)
  };

  // Populate fstatData waveforms beams was a parameter
  if (fkSpectra && FkTypes.Util.isFkSpectra(fkSpectra)) {
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
  } else if (fkSpectra && FkTypes.Util.isFkPowerSpectra(fkSpectra)) {
    fstatData.azimuthWf.samples = new Float64Array(
      fkSpectra.values.map(fkSpectrum => fkSpectrum.attributes[0].azimuth)
    );
    fstatData.fstatWf.samples = new Float64Array(
      fkSpectra.values.map(fkSpectrum => fkSpectrum.attributes[0].peakFStat)
    );
    fstatData.slownessWf.samples = new Float64Array(
      fkSpectra.values.map(fkSpectrum => fkSpectrum.attributes[0].slowness)
    );
  }
  return fstatData;
}

/**
 * Builds a Fk Spectra COI setting the arrival time as the FK start time
 *
 * @param arrivalTime
 * @returns FkSpectraCOI
 */
export const getTestFkCoiData = (arrivalTime: number): FkTypes.FkSpectraCOI => {
  const fkSpectra: FkTypes.FkSpectraCOI = deserializeTypeTransformer(dummyFkSpectra);
  startTime = arrivalTime - defaultSpectraTemplate.fkSpectraWindow.lead;
  return {
    ...fkSpectra,
    startTime,
    endTime: startTime + fkSpectra.sampleCount / fkSpectra.sampleRateHz
  };
};

/**
 * Builds a Fk Spectra (adds UI fields: fstateData, reviewed and configuration) setting the arrival time as the FK start time
 *
 * @param arrivalTime
 * @returns FkSpectra
 */
export const getTestFkData = (arrivalTime: number): FkTypes.FkSpectra => {
  const fkSpectra: FkTypes.FkSpectraCOI = getTestFkCoiData(arrivalTime);

  const fstatData = convertToPlotData(fkSpectra);
  if (fstatData === undefined) {
    throw new Error('Undefined fstatData');
  }

  return {
    ...fkSpectra,
    fstatData,
    configuration: defaultSpectraTemplate,
    reviewed: false
  };
};

// TODO: old format to be removed when wasm code becomes available
/**
 * Builds a legacy Fk Power Spectra COI setting the arrival time as the FK start time
 *
 * @param arrivalTime
 * @returns FkPowerSpectraCOI
 */
export const getTestFkPowerCoiData = (arrivalTime: number): FkTypes.FkPowerSpectraCOI => {
  const fkSpectra: FkTypes.FkPowerSpectraCOI = deserializeTypeTransformer(dummyFkPowerSpectra);
  startTime = arrivalTime - defaultSpectraTemplate.fkSpectraWindow.lead;
  return {
    ...fkSpectra,
    startTime,
    endTime: startTime + fkSpectra.sampleCount / fkSpectra.sampleRateHz
  };
};

/**
 * Builds a legacy Fk Power Spectra (adds UI fields: fstateData, reviewed and configuration) setting the arrival time as the FK start time
 *
 * @param arrivalTime
 * @returns FkPowerSpectra
 */
export const getTestFkPowerData = (arrivalTime: number): FkTypes.FkPowerSpectra => {
  const fkSpectra: FkTypes.FkPowerSpectraCOI = getTestFkPowerCoiData(arrivalTime);

  const fstatData = convertToPlotData(fkSpectra);
  if (fstatData === undefined) {
    throw new Error('Undefined fstatData');
  }
  return {
    ...fkSpectra,
    fstatData,
    configuration: defaultSpectraTemplate,
    reviewed: false
  };
};

/**
 * Argument to create FK
 */
export const fkInput: FkTypes.FkInputWithConfiguration = {
  fkComputeInput: {
    startTime: 1678215524.509,
    sampleRate: 0.0033333333333333335,
    sampleCount: 1,
    channels: [
      { name: 'BRTR.BR101.SHZ' },
      { name: 'BRTR.BR102.SHZ' },
      { name: 'BRTR.BR103.SHZ' },
      { name: 'BRTR.BR104.SHZ' },
      { name: 'BRTR.BR105.SHZ' },
      { name: 'BRTR.BR106.SHZ' },
      { name: 'BRTR.BR131.BHE' },
      { name: 'BRTR.BR131.BHN' },
      { name: 'BRTR.BR131.BHZ' }
    ],
    windowLead: 'PT1S',
    windowLength: 'PT4S',
    lowFrequency: frequencyPair.lowFrequencyHz,
    highFrequency: frequencyPair.highFrequencyHz,
    useChannelVerticalOffset: false,
    phaseType: 'P',
    normalizeWaveforms: false,
    slowCountX: 81,
    slowCountY: 81,
    slowStartX: -40,
    slowStartY: -40,
    slowDeltaX: 0.008882188700431906,
    slowDeltaY: 0.008882188700431906
  },
  configuration: defaultSpectraTemplate,
  signalDetectionId: signalDetectionsData[0].id,
  isThumbnailRequest: false
};
