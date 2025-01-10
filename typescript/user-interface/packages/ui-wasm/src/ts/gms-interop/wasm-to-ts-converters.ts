import type { FacetedTypes, FkTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes, QcSegmentTypes } from '@gms/common-model';
import type { DoubleValue } from '@gms/common-model/lib/common';
import { Units } from '@gms/common-model/lib/common';
import type { ToUITime } from '@gms/common-model/lib/time';

import type { GmsInteropModule, Wasm } from './gms-interop-module';

/** Converts a WASM {@link Wasm.Waveform} type to a Typescript {@link WaveformTypes.Waveform}. */
export function convertToTsWaveform(
  gmsInteropModule: GmsInteropModule,
  wasmWaveform: Wasm.Waveform
): WaveformTypes.Waveform {
  return {
    samples: gmsInteropModule.convertToFloat64Array(wasmWaveform.samples),
    startTime: wasmWaveform.startTime,
    endTime: wasmWaveform.endTime,
    sampleRateHz: wasmWaveform.sampleRateHz,
    sampleCount: wasmWaveform.sampleCount,
    type: ChannelSegmentTypes.TimeseriesType.WAVEFORM
  };
}

/** Converts a WASM {@link Wasm.VectorWaveform} type to a Typescript array of {@link WaveformTypes.Waveform}s. */
export function convertToTsWaveforms(
  gmsInteropModule: GmsInteropModule,
  wasmVectorWaveform: Wasm.VectorWaveform
): WaveformTypes.Waveform[] {
  const waveforms: WaveformTypes.Waveform[] = [];
  for (let i: number = 0; i < wasmVectorWaveform.size(); i += 1) {
    const waveform = wasmVectorWaveform.get(i);
    if (waveform) {
      waveforms.push(convertToTsWaveform(gmsInteropModule, waveform));
    }
  }
  return waveforms;
}

/** Converts a WASM {@link Wasm.ProcessingOperation} type to a Typescript {@link ChannelSegmentTypes.ProcessingOperation}. */
export function convertToTsProcessingOperation(
  wasmProcessingOperation: Wasm.ProcessingOperation
): ChannelSegmentTypes.ProcessingOperation {
  return Object.values(ChannelSegmentTypes.ProcessingOperation)[wasmProcessingOperation.value];
}

/** Converts a WASM {@link Wasm.QcSegmentCategory} type to a Typescript {@link QcSegmentTypes.QcSegmentCategory}. */
export function convertToTsQcSegmentCategory(
  wasmQcSegmentCategory: Wasm.QcSegmentCategory
): QcSegmentTypes.QcSegmentCategory {
  return Object.values(QcSegmentTypes.QcSegmentCategory)[wasmQcSegmentCategory.value];
}

/** Converts a WASM {@link Wasm.QcSegmentType} type to a Typescript {@link QcSegmentTypes.QcSegmentType}. */
export function convertToTsQcSegmentType(
  wasmQcSegmentType: Wasm.QcSegmentType
): QcSegmentTypes.QcSegmentType {
  return Object.values(QcSegmentTypes.QcSegmentType)[wasmQcSegmentType.value];
}

/** Converts a WASM {@link Wasm.ChannelVersionReference} type to a Typescript {@link FacetedTypes.EntityReference}. */
export function convertToTsChannelEntityReference(
  wasmChannelVersionReference: Wasm.ChannelVersionReference
): FacetedTypes.EntityReference<'name'> {
  return {
    name: wasmChannelVersionReference?.name as string
  };
}

/** Converts a WASM {@link Wasm.ChannelVersionReference} type to a Typescript {@link FacetedTypes.VersionReference}. */
export function convertToTsChannelVersionReference(
  wasmChannelVersionReference: Wasm.ChannelVersionReference
): FacetedTypes.VersionReference<'name'> {
  return {
    name: wasmChannelVersionReference.name as string,
    effectiveAt: wasmChannelVersionReference.effectiveAt
  };
}

/** Converts a WASM {@link Wasm.VectorChannelVersionReference} type to a Typescript array of {@link FacetedTypes.VersionReference}s. */
export function convertToTsChannelVersionReferences(
  wasmChannelVersionReferences: Wasm.VectorChannelVersionReference
): FacetedTypes.VersionReference<'name'>[] {
  const versionReferences: FacetedTypes.VersionReference<'name'>[] = [];
  for (let i: number = 0; i < wasmChannelVersionReferences.size(); i += 1) {
    const channelVersionReference = wasmChannelVersionReferences.get(i);
    if (channelVersionReference) {
      versionReferences.push(convertToTsChannelVersionReference(channelVersionReference));
    }
  }
  return versionReferences;
}

/** Converts a WASM {@link Wasm.ChannelSegmentDescriptor} type to a Typescript {@link ChannelSegmentTypes.ChannelSegmentDescriptor}. */
export function convertToTsChannelSegmentDescriptor(
  wasmChannelSegmentDescriptor: Wasm.ChannelSegmentDescriptor
): ChannelSegmentTypes.ChannelSegmentDescriptor {
  return {
    channel: convertToTsChannelVersionReference(wasmChannelSegmentDescriptor.channel),
    startTime: wasmChannelSegmentDescriptor.startTime,
    endTime: wasmChannelSegmentDescriptor.endTime,
    creationTime: wasmChannelSegmentDescriptor.creationTime
  };
}

/** Converts a WASM {@link Wasm.VectorChannelSegmentDescriptor} type to a Typescript array of {@link ChannelSegmentTypes.ChannelSegmentDescriptor}s. */
export function convertToTsChannelSegmentDescriptors(
  wasmChannelSegmentDescriptors: Wasm.VectorChannelSegmentDescriptor
): ChannelSegmentTypes.ChannelSegmentDescriptor[] {
  const channelSegmentDescriptors: ChannelSegmentTypes.ChannelSegmentDescriptor[] = [];
  for (let i: number = 0; i < wasmChannelSegmentDescriptors.size(); i += 1) {
    const channelSegmentDescriptor = wasmChannelSegmentDescriptors.get(i);
    if (channelSegmentDescriptor) {
      channelSegmentDescriptors.push(convertToTsChannelSegmentDescriptor(channelSegmentDescriptor));
    }
  }
  return channelSegmentDescriptors;
}

/** Converts a WASM {@link Wasm.QcSegmentVersion} type to a Typescript {@link QcSegmentTypes.QcSegmentVersion}. */
export function convertToTsQCSegmentVersion(
  wasmQCSegmentVersion: Wasm.QcSegmentVersion
): QcSegmentTypes.QcSegmentVersion {
  return {
    id: {
      parentQcSegmentId: wasmQCSegmentVersion.id.parentQcSegmentId as string,
      effectiveAt: wasmQCSegmentVersion.id.effectiveAt
    },
    startTime: wasmQCSegmentVersion.startTime,
    endTime: wasmQCSegmentVersion.endTime,
    rationale: wasmQCSegmentVersion.rationale as string,
    createdBy: wasmQCSegmentVersion.createdBy as string,
    rejected: wasmQCSegmentVersion.rejected,
    category: convertToTsQcSegmentCategory(wasmQCSegmentVersion.category),
    channels: convertToTsChannelVersionReferences(wasmQCSegmentVersion.channels),
    discoveredOn: convertToTsChannelSegmentDescriptors(wasmQCSegmentVersion.discoveredOn).map(
      descriptor => ({
        id: descriptor
      })
    ),
    stageId: {
      name: wasmQCSegmentVersion.stageId.name as string,
      effectiveTime: wasmQCSegmentVersion.stageId.effectiveAt
    },
    type: convertToTsQcSegmentType(wasmQCSegmentVersion.type)
  };
}

/** Converts a WASM {@link Wasm.VectorQcSegmentVersion} type to a Typescript array of {@link QcSegmentTypes.QcSegmentVersion}s. */
export function convertToTsQCSegmentVersions(
  wasmQCSegmentVersion: Wasm.VectorQcSegmentVersion
): QcSegmentTypes.QcSegmentVersion[] {
  const qcSegmentVersions: QcSegmentTypes.QcSegmentVersion[] = [];
  for (let i: number = 0; i < wasmQCSegmentVersion.size(); i += 1) {
    const qcSegmentVersion = wasmQCSegmentVersion.get(i);
    if (qcSegmentVersion) {
      qcSegmentVersions.push(convertToTsQCSegmentVersion(qcSegmentVersion));
    }
  }
  return qcSegmentVersions;
}

/** Converts a WASM {@link Wasm.ProcessingMask} type to a Typescript {@link ChannelSegmentTypes.ProcessingMask}. */
export function convertToTsProcessingMask(
  wasmProcessingMask: Wasm.ProcessingMask
): ChannelSegmentTypes.ProcessingMask {
  return {
    id: wasmProcessingMask.id as string,
    startTime: wasmProcessingMask.startTime,
    endTime: wasmProcessingMask.endTime,
    effectiveAt: wasmProcessingMask.effectiveAt,
    appliedToRawChannel: {
      name: wasmProcessingMask.appliedToRawChannel.channelName as string
    },
    processingOperation: convertToTsProcessingOperation(wasmProcessingMask.processingOperation),
    maskedQcSegmentVersions: convertToTsQCSegmentVersions(
      wasmProcessingMask.maskedQcSegmentVersions
    )
  };
}

/** Converts a WASM {@link Wasm.VectorProcessingMask} type to a Typescript array of {@link ChannelSegmentTypes.ProcessingMask}s. */
export function convertToTsProcessingMasks(
  wasmProcessingMasks: Wasm.VectorProcessingMask
): ChannelSegmentTypes.ProcessingMask[] {
  const waveforms: ChannelSegmentTypes.ProcessingMask[] = [];
  for (let i: number = 0; i < wasmProcessingMasks.size(); i += 1) {
    const processingMask = wasmProcessingMasks.get(0);
    if (processingMask) {
      waveforms.push(convertToTsProcessingMask(processingMask));
    }
  }
  return waveforms;
}

/** Converts a WASM {@link Wasm.VectorTimeRangesByChannel} type to a Typescript array of {@link ChannelSegmentTypes.TimeRangesByChannel}s. */
export function convertToTsTimeRangesByChannel(
  wasmTimeRangesByChannel: Wasm.VectorTimeRangesByChannel
): ChannelSegmentTypes.TimeRangesByChannel[] {
  const timeRangesByChannels: ChannelSegmentTypes.TimeRangesByChannel[] = [];
  for (let i: number = 0; i < wasmTimeRangesByChannel.size(); i += 1) {
    const timeRanges: ToUITime<{ startTime: string; endTime: string }>[] = [];
    const timesRangesByChannel = wasmTimeRangesByChannel.get(i);
    if (timesRangesByChannel) {
      for (let j: number = 0; j < timesRangesByChannel.timeRanges.size(); j += 1) {
        const timeRange = timesRangesByChannel.timeRanges.get(j);
        if (timeRange) {
          timeRanges.push({
            startTime: timeRange.startTime,
            endTime: timeRange.endTime
          });
        }
      }
      timeRangesByChannels.push({
        channel: convertToTsChannelEntityReference(timesRangesByChannel.channelVersionReference),
        timeRanges
      });
    }
  }
  return timeRangesByChannels;
}

/** Converts a WASM {@link Wasm.ChannelSegment} type to a Typescript {@link ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>}. */
export function convertToTsChannelSegment(
  gmsInteropModule: GmsInteropModule,
  wasmChannelSegment: Wasm.ChannelSegment
): ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> {
  return {
    id: {
      channel: {
        name: wasmChannelSegment.id.channel.name as string,
        effectiveAt: wasmChannelSegment.id.channel.effectiveAt
      },
      creationTime: wasmChannelSegment.creationTime,
      startTime: wasmChannelSegment.startTime,
      endTime: wasmChannelSegment.endTime
    },
    maskedBy: convertToTsProcessingMasks(wasmChannelSegment.maskedBy),
    missingInputChannels: wasmChannelSegment.missingInputChannels
      ? convertToTsTimeRangesByChannel(wasmChannelSegment.missingInputChannels)
      : [],
    units: CommonTypes.Units.HERTZ,
    timeseriesType: ChannelSegmentTypes.TimeseriesType.WAVEFORM,
    timeseries: convertToTsWaveforms(gmsInteropModule, wasmChannelSegment.timeseries)
  };
}

/** Converts a WASM {@link Wasm.DoubleValue} type to a Typescript {@link DoubleValue}. */
export function convertToTsDoubleValue(
  gmsInteropModule: GmsInteropModule,
  wasmDoubleValue: Wasm.DoubleValue
): DoubleValue {
  const unitIndex = Object.values(gmsInteropModule.Units).indexOf(wasmDoubleValue.units);
  const tsUnits: Units = Object.values(Units)[unitIndex - 1];
  return {
    standardDeviation: wasmDoubleValue.standardDeviation,
    units: tsUnits,
    value: wasmDoubleValue.value
  };
}

/** Converts a WASM {@link Wasm.FkAttributes} type to a Typescript {@link FkTypes.FkAttributes}. */
export function convertToTsFkAttributes(
  gmsInteropModule: GmsInteropModule,
  wasmFkAttributes: Wasm.FkAttributes
): FkTypes.FkAttributes {
  return {
    peakFStat: wasmFkAttributes.peakFstat,
    slowness: convertToTsDoubleValue(gmsInteropModule, wasmFkAttributes.slowness),
    receiverToSourceAzimuth: convertToTsDoubleValue(
      gmsInteropModule,
      wasmFkAttributes.receiverToSourceAzimuth
    )
  };
}

/** Converts a WASM {@link Wasm.VectorFkAttributes} type to a Typescript {@link FkTypes.FkAttributes[]}. */
export function convertToTsVectorFkAttributes(
  gmsInteropModule: GmsInteropModule,
  wasmVectorFkAttributes: Wasm.VectorFkAttributes
): FkTypes.FkAttributes[] {
  const fkAttributesArray: FkTypes.FkAttributes[] = [];
  for (let i: number = 0; i < wasmVectorFkAttributes.size(); i += 1) {
    const attributes = wasmVectorFkAttributes.get(i);
    if (attributes) {
      fkAttributesArray[i] = convertToTsFkAttributes(gmsInteropModule, attributes);
    }
  }
  return fkAttributesArray;
}

/** Converts a WASM {@link Wasm.FkSpectrum} type to a Typescript {@link FkTypes.FkSpectrum}. */
export function convertToTsFkSpectrum(
  gmsInteropModule: GmsInteropModule,
  wasmFkSpectrum: Wasm.FkSpectrum
): FkTypes.FkSpectrum {
  const fkAttributes = wasmFkSpectrum.fkAttributes
    ? convertToTsVectorFkAttributes(gmsInteropModule, wasmFkSpectrum.fkAttributes)
    : undefined;

  const fstatArray: number[][] = [];
  for (let i: number = 0; i < wasmFkSpectrum.fstat.size(); i += 1) {
    const fstat = wasmFkSpectrum.fstat.get(i);
    if (fstat) {
      fstatArray[i] = gmsInteropModule.convertToFloat64Array(fstat);
    }
  }

  const powerArray: number[][] = [];
  for (let i: number = 0; i < wasmFkSpectrum.power.size(); i += 1) {
    const power = wasmFkSpectrum.power.get(i);
    if (power) {
      powerArray[i] = gmsInteropModule.convertToFloat64Array(power);
    }
  }

  return {
    fkAttributes,
    fkQual: wasmFkSpectrum.fkQual,
    fstat: fstatArray,
    power: powerArray
  };
}

/** Converts a WASM {@link Wasm.FkSpectra} type to a Typescript {@link FkTypes.FkSpectra}. */
export function convertToTsFkSpectra(
  gmsInteropModule: GmsInteropModule,
  wasmFkSpectra: Wasm.FkSpectra
): FkTypes.FkSpectraCOI {
  const fkSpectrums: FkTypes.FkSpectrum[] = [];

  for (let i = 0; i < wasmFkSpectra.samples.size(); i += 1) {
    const fkSpectrum = wasmFkSpectra.samples.get(i);
    if (fkSpectrum) {
      fkSpectrums[i] = convertToTsFkSpectrum(gmsInteropModule, fkSpectrum);
    }
  }

  return {
    fkSpectraMetadata: wasmFkSpectra.fkSpectraMetadata
      ? {
          phase: wasmFkSpectra.fkSpectraMetadata.phase as string,
          slownessGrid: {
            maxSlowness: wasmFkSpectra.fkSpectraMetadata.slownessGrid.maxSlowness,
            numPoints: wasmFkSpectra.fkSpectraMetadata.slownessGrid.numPoints
          },
          fkSpectrumWindow: {
            duration: wasmFkSpectra.fkSpectraMetadata.fkSpectrumWindow.duration,
            lead: wasmFkSpectra.fkSpectraMetadata.fkSpectrumWindow.lead
          }
        }
      : undefined,
    samples: fkSpectrums,
    type: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
    startTime: wasmFkSpectra.startTime,
    endTime: wasmFkSpectra.endTime,
    sampleRateHz: wasmFkSpectra.sampleRateHz,
    sampleCount: wasmFkSpectra.sampleCount
  };
}

/** Converts a WASM {@link Wasm.VectorFkSpectra} type to a Typescript array of {@link FkTypes.FkSpectraCOI}s. */
export function convertToTsFkSpectras(
  gmsInteropModule: GmsInteropModule,
  wasmVectorFkSpectra: Wasm.VectorFkSpectra
): FkTypes.FkSpectraCOI[] {
  const fkSpectras: FkTypes.FkSpectraCOI[] = [];
  for (let i: number = 0; i < wasmVectorFkSpectra.size(); i += 1) {
    const fkSpectra = wasmVectorFkSpectra.get(i);
    if (fkSpectra) {
      fkSpectras.push(convertToTsFkSpectra(gmsInteropModule, fkSpectra));
    }
  }
  return fkSpectras;
}

/** Converts a WASM {@link Wasm.TimeseriesWithMissingInputChannels} type to a Typescript type of {@link CommonTypes.TimeseriesWithMissingInputChannels}. */
export function convertToTsTimeseriesWithMissingInputChannels(
  gmsInteropModule: GmsInteropModule,
  wasmTimeseriesWithMissingInputChannels: Wasm.TimeseriesWithMissingInputChannels
): CommonTypes.TimeseriesWithMissingInputChannels<WaveformTypes.Waveform> {
  return {
    timeseries: convertToTsWaveforms(
      gmsInteropModule,
      wasmTimeseriesWithMissingInputChannels.timeseries
    ),
    missingInputChannels: convertToTsTimeRangesByChannel(
      wasmTimeseriesWithMissingInputChannels.missingInputChannels
    )
  };
}

/** Converts a WASM {@link Wasm.FkTimeseriesWithMissingInputChannels} type to a Typescript type of {@link CommonTypes.TimeseriesWithMissingInputChannels}. */
export function convertToTsFkTimeseriesWithMissingInputChannels(
  gmsInteropModule: GmsInteropModule,
  wasmFkTimeseriesWithMissingInputChannels: Wasm.FkTimeseriesWithMissingInputChannels
): CommonTypes.TimeseriesWithMissingInputChannels<FkTypes.FkSpectraCOI> {
  return {
    timeseries: convertToTsFkSpectras(
      gmsInteropModule,
      wasmFkTimeseriesWithMissingInputChannels.timeseries
    ),
    missingInputChannels: convertToTsTimeRangesByChannel(
      wasmFkTimeseriesWithMissingInputChannels.missingInputChannels
    )
  };
}
