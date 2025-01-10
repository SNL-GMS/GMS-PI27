import type {
  ChannelTypes,
  FacetedTypes,
  FilterTypes,
  RotationTypes,
  SignalDetectionTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';
import {
  BeamformingTemplateTypes,
  ChannelSegmentTypes,
  CommonTypes,
  FkTypes,
  ProcessingMaskDefinitionTypes
} from '@gms/common-model';
import {
  isCascadeFilterDescription,
  isLinearFilterDescription
} from '@gms/common-model/lib/filter';
import { UILogger } from '@gms/ui-util';

import {
  convertCascadeFilterDescription,
  convertIIRLinearFilterDescription
} from './filters/converter';
import { isIirFilterParameters } from './filters/util';
import type { GmsInteropModule, Wasm } from './gms-interop-module';

const logger = UILogger.create('GMS_TS_TO_WASM_CONVERTER', process.env.GMS_TS_TO_WASM_CONVERTER);

/** Converts a Typescript {@link RotationTypes.RotationDescription} type to a WASM {@link Wasm.RotationDescription}. */
export function convertToWasmRotationDescription(
  gmsInteropModule: GmsInteropModule,
  arg: RotationTypes.RotationDescription
): Wasm.RotationDescription {
  const wasmSamplingType: Wasm.SamplingType =
    CommonTypes.SamplingType[arg.samplingType] === CommonTypes.SamplingType.INTERPOLATED
      ? gmsInteropModule.SamplingType.INTERPOLATED
      : gmsInteropModule.SamplingType.NEAREST_SAMPLE;
  return new gmsInteropModule.RotationDescription(
    arg.twoDimensional,
    arg.phaseType,
    wasmSamplingType
  );
}

/** Converts a Typescript {@link CommonTypes.Location} type to a WASM {@link Wasm.Location}. */
export function convertToWasmLocation(
  gmsInteropModule: GmsInteropModule,
  location: CommonTypes.Location
): Wasm.Location {
  // Location(double latitudeDegrees, double longitudeDegrees, double elevationKm, double depthKm)
  return new gmsInteropModule.Location(
    location.latitudeDegrees,
    location.longitudeDegrees,
    location.elevationKm,
    location.depthKm
  );
}

/** Converts a Typescript {@link ChannelTypes.OrientationAngles} type to a WASM {@link Wasm.OrientationAngles}. */
export function convertToWasmOrientationAngles(
  gmsInteropModule: GmsInteropModule,
  orientationAngles: ChannelTypes.OrientationAngles
): Wasm.OrientationAngles {
  const illegalRadius = -366;
  return new gmsInteropModule.OrientationAngles(
    orientationAngles.horizontalAngleDeg ? orientationAngles.horizontalAngleDeg : illegalRadius,
    orientationAngles.verticalAngleDeg ? orientationAngles.verticalAngleDeg : illegalRadius
  );
}

/** Converts a Typescript {@link RotationTypes.RotationParameters} type to a WASM {@link Wasm.RotationParameters}. */
export function convertToWasmRotationParameters(
  gmsInteropModule: GmsInteropModule,
  arg: RotationTypes.RotationParameters
): Wasm.RotationParameters {
  const builder: Wasm.RotationParametersBuilder = new gmsInteropModule.RotationParametersBuilder();
  const location: Wasm.Location = convertToWasmLocation(gmsInteropModule, arg.location);
  const orientationAngles: Wasm.OrientationAngles = convertToWasmOrientationAngles(
    gmsInteropModule,
    arg.orientationAngles
  );
  const result = builder
    .location(location)
    .locationToleranceKm(arg.locationToleranceKm)
    .orientationAngleToleranceDeg(arg.orientationAngleToleranceDeg)
    .orientationAngles(orientationAngles)
    .receiverToSourceAzimuthDeg(arg.receiverToSourceAzimuthDeg)
    .sampleRateHz(arg.sampleRateHz)
    .sampleRateToleranceHz(arg.sampleRateToleranceHz)
    .build();
  builder.delete();
  return result;
}

/** Converts a Typescript {@link RotationTypes.RotationDefinition} type to a WASM {@link Wasm.RotationDefinition}. */
export function convertToWasmRotationDefinition(
  gmsInteropModule: GmsInteropModule,
  arg: RotationTypes.RotationDefinition
): Wasm.RotationDefinition {
  return new gmsInteropModule.RotationDefinition(
    convertToWasmRotationDescription(gmsInteropModule, arg.rotationDescription),
    convertToWasmRotationParameters(gmsInteropModule, arg.rotationParameters)
  );
}

/** Converts a Typescript start {@link number} and end {@link number} time to a WASM {@link Wasm.TimeRange}. */
export function convertToWasmTimeRange(
  gmsInteropModule: GmsInteropModule,
  startTimeSecs: number,
  endTimeSecs: number
): Wasm.TimeRange {
  return new gmsInteropModule.TimeRange(startTimeSecs, endTimeSecs);
}

/** Converts a Typescript {@link ChannelSegmentTypes.TimeRangesByChannel} type to a WASM {@link Wasm.TimeRangesByChannel}. */
export function convertToWasmTimeRangesByChannel(
  gmsInteropModule: GmsInteropModule,
  arg: ChannelSegmentTypes.TimeRangesByChannel[]
): Wasm.VectorTimeRangesByChannel {
  const timeRangesByChannel = new gmsInteropModule.VectorTimeRangesByChannel();
  arg.forEach(mc => {
    const channelVersionReference: Wasm.ChannelVersionReference =
      new gmsInteropModule.ChannelVersionReference(mc.channel.name, 0);
    const timeRanges: Wasm.VectorTimeRange = new gmsInteropModule.VectorTimeRange();
    mc.timeRanges.forEach(timerange => {
      timeRanges.push_back(
        convertToWasmTimeRange(gmsInteropModule, timerange.startTime, timerange.endTime)
      );
    });
    timeRangesByChannel.push_back(
      new gmsInteropModule.TimeRangesByChannel(channelVersionReference, timeRanges)
    );
  });
  return timeRangesByChannel;
}

/** Converts a Typescript {@link FacetedTypes.VersionReference} {@link ChannelTypes.Channel} type to a WASM {@link Wasm.ChannelVersionReference}. */
export function convertToWasmChannelVersionReference(
  gmsInteropModule: GmsInteropModule,
  arg: FacetedTypes.VersionReference<'name', ChannelTypes.Channel>
): Wasm.ChannelVersionReference {
  return new gmsInteropModule.ChannelVersionReference(arg.name, arg.effectiveAt);
}

/** Converts a Typescript {@link ChannelSegmentTypes.ChannelSegmentDescriptor} type to a WASM {@link Wasm.ChannelSegmentDescriptor}. */
export function convertToWasmChannelSegmentDescriptor(
  gmsInteropModule: GmsInteropModule,
  arg: ChannelSegmentTypes.ChannelSegmentDescriptor
): Wasm.ChannelSegmentDescriptor {
  return new gmsInteropModule.ChannelSegmentDescriptor(
    convertToWasmChannelVersionReference(gmsInteropModule, arg.channel),
    arg.startTime,
    arg.endTime,
    arg.creationTime
  );
}

/** Converts a Typescript {@link ChannelSegmentTypes.ChannelSegment} type to a WASM {@link Wasm.ChannelSegment}. */
export function convertToWasmChannelSegment(
  gmsInteropModule: GmsInteropModule,
  channelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>
): Wasm.ChannelSegment {
  const unitIndex = Object.keys(CommonTypes.Units).indexOf(channelSegment.units);
  const waveformVector: Wasm.VectorWaveform = new gmsInteropModule.VectorWaveform();
  channelSegment.timeseries.forEach(ts => {
    const wasmSamples: Wasm.VectorDouble = gmsInteropModule.convertToVectorDouble(ts.samples);
    const wasmWaveform: Wasm.Waveform = new gmsInteropModule.Waveform(
      wasmSamples,
      ts.startTime,
      ts.endTime,
      ts.sampleRateHz
    );
    waveformVector.push_back(wasmWaveform);
  });

  const builder: Wasm.ChannelSegmentBuilder = new gmsInteropModule.ChannelSegmentBuilder();
  const channelSegmentUnits: Wasm.Units = Object.values(gmsInteropModule.Units)[unitIndex + 1];
  const result = builder
    .channelSegmentUnits(channelSegmentUnits)
    .creationTime(channelSegment.id.creationTime)
    .endTime(channelSegment.id.endTime)
    .id(convertToWasmChannelSegmentDescriptor(gmsInteropModule, channelSegment.id))
    .startTime(channelSegment.id.startTime)
    .timeseries(waveformVector)
    .timeseriesType(gmsInteropModule.TimeseriesType.WAVEFORM)
    .build();
  builder.delete();
  return result;
}

/** Converts a Typescript array of {@link ChannelSegmentTypes.ChannelSegment}s to a WASM {@link Wasm.VectorChannelSegmentWaveform}. */
export function convertToWasmChannelSegments(
  gmsInteropModule: GmsInteropModule,
  channelSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[]
): Wasm.VectorChannelSegment {
  const wasmVector = new gmsInteropModule.VectorChannelSegment();
  channelSegments.forEach(cs => {
    wasmVector.push_back(convertToWasmChannelSegment(gmsInteropModule, cs));
  });
  return wasmVector;
}

/** Converts a Typescript {@link ChannelSegmentTypes.ProcessingOperation} type to a WASM {@link Wasm.ProcessingOperation}. */
export function convertToWasmProcessingOperation(
  gmsInteropModule: GmsInteropModule,
  arg: ChannelSegmentTypes.ProcessingOperation
): Wasm.ProcessingOperation {
  const uiIndex = Object.keys(ChannelSegmentTypes.ProcessingOperation).indexOf(arg);
  const result: Wasm.ProcessingOperation = Object.values(gmsInteropModule.ProcessingOperation)[
    uiIndex + 1
  ];
  return result;
}

/** Converts a Typescript {@link ChannelSegmentTypes.ProcessingMask} type to a WASM {@link Wasm.ProcessingMask}. */
export function convertToWasmProcessingMask(
  gmsInteropModule: GmsInteropModule,
  mask: ChannelSegmentTypes.ProcessingMask
): Wasm.ProcessingMask {
  const maskChannel: Wasm.Channel = new gmsInteropModule.Channel(mask.appliedToRawChannel.name);
  const qcSegmentVector: Wasm.VectorQcSegmentVersion =
    new gmsInteropModule.VectorQcSegmentVersion();
  return new gmsInteropModule.ProcessingMask(
    mask.id,
    maskChannel,
    mask.effectiveAt,
    mask.startTime,
    mask.endTime,
    qcSegmentVector,
    convertToWasmProcessingOperation(gmsInteropModule, mask.processingOperation)
  );
}

/** Converts a Typescript {@link ChannelSegmentTypes.ProcessingMask} array type to a WASM {@link Wasm.VectorProcessingMask}. */
export function convertToWasmProcessingMaskArray(
  gmsInteropModule: GmsInteropModule,
  processingMasks: ChannelSegmentTypes.ProcessingMask[]
): Wasm.VectorProcessingMask {
  const maskVector = new gmsInteropModule.VectorProcessingMask();
  processingMasks.forEach(pm => {
    maskVector.push_back(convertToWasmProcessingMask(gmsInteropModule, pm));
  });
  return maskVector;
}

/** Converts a Typescript {@link SignalDetectionTypes.InstantValue} type to a WASM {@link Wasm.InstantValue}. */
export function convertToWasmInstantValue(
  gmsInteropModule: GmsInteropModule,
  arg: SignalDetectionTypes.InstantValue
): Wasm.InstantValue {
  return new gmsInteropModule.InstantValue(arg.value, arg.standardDeviation);
}

/** Converts a Typescript {@link FilterTypes.LinearFilterDescription} type to a WASM {@link Wasm.LinearIIRFilterDescription} or {@link Wasm.LinearFIRFilterDescription}. */
export function convertToWasmLinearFilterDescription(
  gmsInteropModule: GmsInteropModule,
  arg: FilterTypes.LinearFilterDescription
): Wasm.LinearIIRFilterDescription | Wasm.LinearFIRFilterDescription {
  let description;
  if (isIirFilterParameters(arg.parameters)) {
    description = convertIIRLinearFilterDescription(gmsInteropModule, arg);
  } else {
    throw new Error(`Invalid linear filter description`);
  }
  return description;
}

/** Converts a Typescript {@link FilterTypes.FilterDefinition} type to a WASM {@link Wasm.BaseFilterDefinition}. */
export function convertToWasmFilterDefinition(
  gmsInteropModule: GmsInteropModule,
  arg: FilterTypes.FilterDefinition | undefined
): Wasm.BaseFilterDefinition {
  let filterDescription;
  if (isLinearFilterDescription(arg?.filterDescription)) {
    filterDescription = convertToWasmLinearFilterDescription(
      gmsInteropModule,
      arg?.filterDescription
    );
  } else if (isCascadeFilterDescription(arg?.filterDescription)) {
    filterDescription = convertCascadeFilterDescription(gmsInteropModule, arg.filterDescription);
  }
  logger.debug(`Filter definition args: ${arg?.name} ${arg?.comments} ${filterDescription}`);
  return new gmsInteropModule.BaseFilterDefinition();
}

/** Converts a Typescript {@link SignalDetectionTypes.SignalDetectionHypothesisId} type to a WASM {@link Wasm.SignalDetectionHypothesisId}. */
export function convertToWasmSignalDetectionHypothesisId(
  gmsInteropModule: GmsInteropModule,
  arg: SignalDetectionTypes.SignalDetectionHypothesisId
): Wasm.SignalDetectionHypothesisId {
  return new gmsInteropModule.SignalDetectionHypothesisId(arg.id, arg.signalDetectionId);
}

/** Converts a Typescript {@link CommonTypes.DoubleValue} type to a WASM {@link Wasm.DoubleValue}. */
export function convertToWasmDoubleValue(
  gmsInteropModule: GmsInteropModule,
  arg: CommonTypes.DoubleValue
): Wasm.DoubleValue {
  const unitIndex = Object.keys(CommonTypes.Units).indexOf(arg.units);
  const units: Wasm.Units = Object.values(gmsInteropModule.Units)[unitIndex + 1];
  return new gmsInteropModule.DoubleValue(arg.standardDeviation, units, arg.value);
}

/** Converts a Typescript {@link SignalDetectionTypes.NumericMeasurementValue} type to a WASM {@link Wasm.NumericMeasurementValue}. */
export function convertToWasmNumericMeasurementValue(
  gmsInteropModule: GmsInteropModule,
  arg: SignalDetectionTypes.NumericMeasurementValue
): Wasm.NumericMeasurementValue {
  const measuredValue = convertToWasmDoubleValue(gmsInteropModule, arg.measuredValue);
  const { referenceTime } = arg;
  return new gmsInteropModule.NumericMeasurementValue(measuredValue, referenceTime);
}

/** Converts a Typescript {@link FacetedTypes.VersionReference} {@link StationTypes.Station} type to a WASM {@link Wasm.StationVersionReference}. */
export function convertToWasmStationVersionReference(
  gmsInteropModule: GmsInteropModule,
  arg: FacetedTypes.VersionReference<'name', StationTypes.Station>
): Wasm.StationVersionReference {
  if (!arg.effectiveAt) {
    throw new Error('effectiveAt time required for version reference');
  }
  const { effectiveAt } = arg;
  return new gmsInteropModule.StationVersionReference(arg.name, effectiveAt);
}

/** Converts a Typescript {@link ChannelTypes.Channel} type to a WASM {@link Wasm.Channel}. */
export function convertToWasmChannel(
  gmsInteropModule: GmsInteropModule,
  arg: ChannelTypes.Channel
): Wasm.Channel {
  return new gmsInteropModule.Channel(arg.name);
}

/** Converts a Typescript {@link ChannelTypes.RelativePosition} type to a WASM {@link Wasm.RelativePosition}. */
export function convertToWasmRelativePosition(
  gmsInteropModule: GmsInteropModule,
  arg: ChannelTypes.RelativePosition
): Wasm.RelativePosition {
  return new gmsInteropModule.RelativePosition(
    arg.northDisplacementKm,
    arg.eastDisplacementKm,
    arg.verticalDisplacementKm
  );
}

/** Converts a Typescript {@link ChannelTypes.RelativePosition} record type to a WASM {@link Wasm.RelativePositionByChannelMap}. */
export function convertToWasmRelativePositionByChannelMap(
  gmsInteropModule: GmsInteropModule,
  arg: Record<string, ChannelTypes.RelativePosition>
): Wasm.RelativePositionByChannelMap {
  const map = new gmsInteropModule.RelativePositionByChannelMap();
  Object.keys(arg).forEach(channelName => {
    map.add(channelName, convertToWasmRelativePosition(gmsInteropModule, arg[channelName]));
  });
  return map;
}

/** Converts a Typescript {@link ProcessingMaskDefinitionTypes.TaperDefinition} type to a WASM {@link Wasm.TaperDefinition}. */
export function convertToWasmTaperDefinition(
  gmsInteropModule: GmsInteropModule,
  arg: ProcessingMaskDefinitionTypes.TaperDefinition
): Wasm.TaperDefinition {
  const functionIndex = Object.keys(ProcessingMaskDefinitionTypes.TaperFunction).indexOf(
    arg.taperFunction
  );
  const taperFunction = Object.values(gmsInteropModule.TaperFunction)[functionIndex + 1];
  return new gmsInteropModule.TaperDefinition(taperFunction, arg.taperLengthSamples);
}

/** Converts a Typescript {@link BeamformingTemplateTypes.BeamDescription} type to a WASM {@link Wasm.BeamDescription}. */
export function convertToWasmBeamDescription(
  gmsInteropModule: GmsInteropModule,
  arg: BeamformingTemplateTypes.BeamDescription
): Wasm.BeamDescription {
  const builder: Wasm.BeamDescriptionBuilder = new gmsInteropModule.BeamDescriptionBuilder();
  const { CONTINUOUS_LOCATION, DETECTION, EVENT, FK } = gmsInteropModule.BeamType;
  let wasmBeamType: Wasm.BeamType;
  if (arg.beamType === BeamformingTemplateTypes.BeamType.CONTINUOUS_LOCATION) {
    wasmBeamType = CONTINUOUS_LOCATION;
  } else if (arg.beamType === BeamformingTemplateTypes.BeamType.DETECTION) {
    wasmBeamType = DETECTION;
  } else if (arg.beamType === BeamformingTemplateTypes.BeamType.EVENT) {
    wasmBeamType = EVENT;
  } else {
    wasmBeamType = FK;
  }

  const { COHERENT, INCOHERENT, RMS } = gmsInteropModule.BeamSummationType;
  let beamSummation: Wasm.BeamSummationType;
  if (arg.beamSummation === 'COHERENT') {
    beamSummation = COHERENT;
  } else if (arg.beamSummation === 'INCOHERENT') {
    beamSummation = INCOHERENT;
  } else if (arg.beamSummation === 'RMS') {
    beamSummation = RMS;
  } else {
    throw new Error(`Invalid beam summation type ${arg.beamSummation}`);
  }

  const { INTERPOLATED, NEAREST_SAMPLE } = gmsInteropModule.SamplingType;
  let samplingType: Wasm.SamplingType;
  if (arg.samplingType === 'INTERPOLATED') {
    samplingType = INTERPOLATED;
  } else if (arg.samplingType === 'NEAREST_SAMPLE') {
    samplingType = NEAREST_SAMPLE;
  } else {
    throw new Error(`Invalid sampling type ${arg.samplingType}`);
  }

  const result = builder
    .beamSummation(beamSummation)
    .beamType(wasmBeamType)
    .phase(arg.phase)
    .samplingType(samplingType)
    .twoDimensional(arg.twoDimensional)
    .preFilterDefinition(convertToWasmFilterDefinition(gmsInteropModule, arg.preFilterDefinition))
    .build();
  builder.delete();
  return result;
}

/** Converts a Typescript {@link BeamformingTemplateTypes.BeamParameters} type to a WASM {@link Wasm.BeamParameters}. */
export function convertToWasmBeamParameters(
  gmsInteropModule: GmsInteropModule,
  arg: BeamformingTemplateTypes.BeamParameters
): Wasm.BeamParameters {
  const builder: Wasm.BeamParametersBuilder = new gmsInteropModule.BeamParametersBuilder();
  const location: Wasm.Location | undefined = arg.location
    ? convertToWasmLocation(gmsInteropModule, arg.location)
    : undefined;
  const orientationAngles = convertToWasmOrientationAngles(gmsInteropModule, arg.orientationAngles);
  const result = builder
    .location(location)
    .minWaveformsToBeam(arg.minWaveformsToBeam)
    .orientationAngles(orientationAngles)
    .orientationAngleToleranceDeg(arg.orientationAngleToleranceDeg)
    .receiverToSourceAzimuthDeg(arg.receiverToSourceAzimuthDeg)
    .sampleRateHz(arg.sampleRateHz)
    .sampleRateToleranceHz(arg.sampleRateToleranceHz)
    .slownessSecPerDeg(arg.slownessSecPerDeg)
    .build();
  builder.delete();
  return result;
}

/** Converts a Typescript {@link BeamformingTemplateTypes.BeamDefinition} type to a WASM {@link Wasm.BeamDefinition}. */
export function convertToWasmBeamDefinition(
  gmsInteropModule: GmsInteropModule,
  arg: BeamformingTemplateTypes.BeamDefinition
): Wasm.BeamDefinition {
  return new gmsInteropModule.BeamDefinition(
    convertToWasmBeamDescription(gmsInteropModule, arg.beamDescription),
    convertToWasmBeamParameters(gmsInteropModule, arg.beamParameters)
  );
}

/** Converts a Typescript {@link FkTypes.SlownessGrid} type to a WASM {@link Wasm.SlownessGrid}. */
export function convertToWasmSlownessGrid(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.SlownessGrid
): Wasm.SlownessGrid {
  return new gmsInteropModule.SlownessGrid(arg.maxSlowness, arg.numPoints);
}

/** Converts a Typescript {@link FkTypes.FkWindow} type to a WASM {@link Wasm.FkSpectrumWindow}. */
export function convertToWasmFkSpectrumWindow(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.FkWindow
): Wasm.FkSpectrumWindow {
  return new gmsInteropModule.FkSpectrumWindow(arg.duration, arg.lead);
}

/** Converts a Typescript {@link FkTypes.FkFrequencyRange} type to a WASM {@link Wasm.FkFrequencyRange}. */
export function convertToWasmFkFrequencyRange(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.FkFrequencyRange
): Wasm.FkFrequencyRange {
  return new gmsInteropModule.FkFrequencyRange(arg.lowFrequencyHz, arg.highFrequencyHz);
}

/** Converts a Typescript {@link FkTypes.FkWaveformSampleRate} type to a WASM {@link Wasm.FkWaveformSampleRate}. */
export function convertToWasmFkWaveformSampleRate(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.FkWaveformSampleRate
): Wasm.FkWaveformSampleRate {
  return new gmsInteropModule.FkWaveformSampleRate(
    arg.waveformSampleRateHz,
    arg.waveformSampleRateToleranceHz
  );
}

/** Converts a Typescript {@link FkTypes.TaperFunction} type to a WASM {@link Wasm.TaperFunction}. */
export function convertToWasmFftTaperFunction(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.TaperFunction
): Wasm.TaperFunction {
  const { BLACKMAN, COSINE, HAMMING, HANNING, PARZEN, WELCH } = gmsInteropModule.TaperFunction;
  let fftTaperFunction: Wasm.TaperFunction;
  switch (arg) {
    case FkTypes.TaperFunction.BLACKMAN:
      fftTaperFunction = BLACKMAN;
      break;
    case FkTypes.TaperFunction.COSINE:
      fftTaperFunction = COSINE;
      break;
    case FkTypes.TaperFunction.HAMMING:
      fftTaperFunction = HAMMING;
      break;

    case FkTypes.TaperFunction.HANNING:
      fftTaperFunction = HANNING;
      break;
    case FkTypes.TaperFunction.PARZEN:
      fftTaperFunction = PARZEN;
      break;
    case FkTypes.TaperFunction.WELCH:
      fftTaperFunction = WELCH;
      break;
    //! TODO: determine default if needed
    default:
      fftTaperFunction = COSINE;
  }
  return fftTaperFunction;
}

/** Converts a Typescript {@link FkTypes.FkUncertaintyOption} type to a WASM {@link WasWasm.FkUncertaintyOption}. */
export function convertToWasmFkUncertaintyOption(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.FkUncertaintyOption
): Wasm.FkUncertaintyOption {
  const {
    EMPIRICAL,
    EXPONENTIAL_SIGNAL_COHERENCE,
    OBSERVED_SIGNAL_COHERENCE,
    PERFECT_SIGNAL_COHERENCE
  } = gmsInteropModule.FkUncertaintyOption;
  let fkUncertaintyOption: Wasm.FkUncertaintyOption;
  switch (arg) {
    case FkTypes.FkUncertaintyOption.EMPIRICAL:
      fkUncertaintyOption = EMPIRICAL;
      break;
    case FkTypes.FkUncertaintyOption.EXPONENTIAL_SIGNAL_COHERENCE:
      fkUncertaintyOption = EXPONENTIAL_SIGNAL_COHERENCE;
      break;
    case FkTypes.FkUncertaintyOption.OBSERVED_SIGNAL_COHERENCE:
      fkUncertaintyOption = OBSERVED_SIGNAL_COHERENCE;
      break;
    case FkTypes.FkUncertaintyOption.PERFECT_SIGNAL_COHERENCE:
      fkUncertaintyOption = PERFECT_SIGNAL_COHERENCE;
      break;
    //! TODO: is this the default we want if any?
    default:
      fkUncertaintyOption = EMPIRICAL;
  }
  return fkUncertaintyOption;
}

/** Converts a Typescript {@link FkTypes.FkSpectraDefinition} type to a WASM {@link Wasm.FkSpectraDefinition}. */
export function convertToWasmFkSpectraDefinition(
  gmsInteropModule: GmsInteropModule,
  arg: FkTypes.FkSpectraDefinition
): Wasm.FkSpectraDefinition {
  //! prop name mismatches
  // phase // c++
  // phaseType // ts
  // orientationAnglesToleranceDeg // c++
  // orientationAngleToleranceDeg // ts

  const builder: Wasm.FkSpectraParametersBuilder =
    new gmsInteropModule.FkSpectraParametersBuilder();

  const fkParametersResult = builder
    .fkFrequencyRange(
      convertToWasmFkFrequencyRange(gmsInteropModule, arg.fkParameters.fkFrequencyRange)
    )
    .fftTaperFunction(
      convertToWasmFftTaperFunction(gmsInteropModule, arg.fkParameters.fftTaperFunction)
    )
    .fftTaperPercent(arg.fkParameters.fftTaperPercent)
    .fkSpectrumWindow(
      convertToWasmFkSpectrumWindow(gmsInteropModule, arg.fkParameters.fkSpectrumWindow)
    )
    .fkUncertaintyOption(
      convertToWasmFkUncertaintyOption(gmsInteropModule, arg.fkParameters.fkUncertaintyOption)
    )
    .minimumWaveformsForSpectra(arg.fkParameters.minimumWaveformsForSpectra)
    .normalizeWaveforms(arg.fkParameters.normalizeWaveforms)
    .phase(arg.fkParameters.phase)
    .preFilter(convertToWasmFilterDefinition(gmsInteropModule, arg.fkParameters.preFilter))
    .orientationAngleToleranceDeg(arg.fkParameters.orientationAngleToleranceDeg)
    .slownessGrid(convertToWasmSlownessGrid(gmsInteropModule, arg.fkParameters.slownessGrid))
    .spectrumStepDuration(arg.fkParameters.spectrumStepDuration)
    .twoDimensional(arg.fkParameters.twoDimensional)
    .waveformSampleRate(
      convertToWasmFkWaveformSampleRate(gmsInteropModule, arg.fkParameters.waveformSampleRate)
    )
    .build();
  builder.delete();

  return new gmsInteropModule.FkSpectraDefinition(
    fkParametersResult,
    convertToWasmOrientationAngles(gmsInteropModule, arg.orientationAngles)
  );
}

/** Converts a Typescript {@link Station} type to a WASM {@link Wasm.Station}. */
export function convertToWasmStation(
  gmsInteropModule: GmsInteropModule,
  arg: StationTypes.Station
): Wasm.Station {
  const relativePositionByChannelMap = convertToWasmRelativePositionByChannelMap(
    gmsInteropModule,
    arg.relativePositionsByChannel
  );
  const stationVersionRef = convertToWasmStationVersionReference(gmsInteropModule, arg);
  return new gmsInteropModule.Station(stationVersionRef, relativePositionByChannelMap);
}

/** Converts a Typescript {@link ProcessingMask} record type to a WASM {@link Wasm.ProcessingMasksByChannelMap}. */
export function convertToWasmProcessingMasksByChannelMap(
  gmsInteropModule: GmsInteropModule,
  arg: Record<string, ChannelSegmentTypes.ProcessingMask[]>
): Wasm.ProcessingMasksByChannelMap {
  const processingMaskByChannelMap = new gmsInteropModule.ProcessingMasksByChannelMap();
  const processingMasksVector = new gmsInteropModule.VectorProcessingMask();
  Object.keys(arg).forEach(channelName => {
    arg[channelName].forEach(processingMask => {
      processingMasksVector.push_back(
        convertToWasmProcessingMask(gmsInteropModule, processingMask)
      );
    });
    processingMaskByChannelMap.add(channelName, processingMasksVector);
  });
  return processingMaskByChannelMap;
}

/** Converts a Typescript {@link FkTypes.FkAttributes} record type to a WASM {@link Wasm.VectorFkAttributes}. */
export function convertToWasmArrayFkAttributes(
  gmsInteropModule: GmsInteropModule,
  fkAttributesArray: FkTypes.FkAttributes[]
): Wasm.VectorFkAttributes {
  const fkAttributesVector: Wasm.VectorFkAttributes = new gmsInteropModule.VectorFkAttributes();
  fkAttributesArray.forEach(fkAttr => {
    const fkAttributes: Wasm.FkAttributes = new gmsInteropModule.FkAttributes(
      fkAttr.peakFStat,
      convertToWasmDoubleValue(gmsInteropModule, fkAttr.slowness),
      convertToWasmDoubleValue(gmsInteropModule, fkAttr.receiverToSourceAzimuth)
    );
    fkAttributesVector.push_back(fkAttributes);
  });
  return fkAttributesVector;
}

/** Converts a Typescript {@link FkTypes.FkSpectrum} record type to a WASM {@link Wasm.FkSpectrum}. */
export function convertToWasmFkSpectrum(
  gmsInteropModule: GmsInteropModule,
  fkSpectrum: FkTypes.FkSpectrum
): Wasm.FkSpectrum {
  const fkAttributes = fkSpectrum.fkAttributes
    ? convertToWasmArrayFkAttributes(gmsInteropModule, fkSpectrum.fkAttributes)
    : undefined;

  const fstatMultiVector: Wasm.MultiVectorDouble = new gmsInteropModule.MultiVectorDouble();
  fkSpectrum.fstat.forEach(numberArray => {
    const numberVector = gmsInteropModule.convertToVectorDouble(numberArray);
    fstatMultiVector.push_back(numberVector);
  });

  const powerMultiVector: Wasm.MultiVectorDouble = new gmsInteropModule.MultiVectorDouble();
  fkSpectrum.power.forEach(numberArray => {
    const numberVector = gmsInteropModule.convertToVectorDouble(numberArray);
    powerMultiVector.push_back(numberVector);
  });

  return new gmsInteropModule.FkSpectrum(
    fstatMultiVector,
    powerMultiVector,
    fkAttributes,
    fkSpectrum?.fkQual
  );
}

/** Converts a Typescript {@link FkTypes.FkSpectra} type to a WASM {@link Wasm.FkSpectra}. */
export function convertToWasmFkSpectra(
  gmsInteropModule: GmsInteropModule,
  fkSpectra: FkTypes.FkSpectraCOI
): Wasm.FkSpectra {
  const vectorFkSpectrum: Wasm.VectorFkSpectrum = new gmsInteropModule.VectorFkSpectrum();

  fkSpectra.samples.forEach(sample => {
    vectorFkSpectrum.push_back(convertToWasmFkSpectrum(gmsInteropModule, sample));
  });

  const fkSpectraMetadata: Wasm.FkSpectraMetadata | undefined = fkSpectra.fkSpectraMetadata
    ? new gmsInteropModule.FkSpectraMetadata(
        new gmsInteropModule.FkSpectrumWindow(
          fkSpectra.fkSpectraMetadata?.fkSpectrumWindow.duration,
          fkSpectra.fkSpectraMetadata?.fkSpectrumWindow.lead
        ),
        fkSpectra.fkSpectraMetadata?.phase,
        new gmsInteropModule.SlownessGrid(
          fkSpectra.fkSpectraMetadata?.slownessGrid.maxSlowness,
          fkSpectra.fkSpectraMetadata?.slownessGrid.numPoints
        )
      )
    : undefined;

  return new gmsInteropModule.FkSpectra(
    vectorFkSpectrum,
    fkSpectraMetadata,
    fkSpectra.startTime,
    fkSpectra.endTime,
    fkSpectra.sampleRateHz,
    fkSpectra.sampleCount
  );
}
