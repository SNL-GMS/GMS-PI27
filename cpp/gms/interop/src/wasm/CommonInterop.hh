#ifndef COMMON_INTEROP_H
#define COMMON_INTEROP_H
#include <vector>
#include <string>
#include <optional>

#include "common/AmplitudeMeasurementValue.hh"
#include "common/ArrivalTimeMeasurementValue.hh"
#include "common/BaseVersionReference.hh"
#include "common/Channel.hh"
#include "common/ChannelSegment.hh"
#include "common/DepthRestraintReason.hh"
#include "common/DoubleValue.hh"
#include "common/DurationMeasurementValue.hh"
#include "common/DurationValue.hh"
#include "common/Ellipse.hh"
#include "common/Ellipsoid.hh"
#include "common/EnumeratedMeasurementValue.hh"
#include "common/EventHypothesis.hh"
#include "common/EventHypothesisId.hh"
#include "common/EventLocation.hh"
#include "common/FeatureMeasurementType.hh"
#include "common/FeatureMeasurementWrapper.hh"
#include "common/FeaturePrediction.hh"
#include "common/InstantValue.hh"
#include "common/Location.hh"
#include "common/LocationBehavior.hh"
#include "common/LocationUncertainty.hh"
#include "common/LocationSolution.hh"
#include "common/MagnitudeModel.hh"
#include "common/MagnitudeType.hh"
#include "common/Map.hh"
#include "common/NetworkMagnitudeBehavior.hh"
#include "common/NetworkMagnitudeSolution.hh"
#include "common/NumericMeasurementValue.hh"
#include "common/OrientationAngles.hh"
#include "common/ProcessingMask.hh"
#include "common/QcSegment.hh"
#include "common/QcSegmentCategory.hh"
#include "common/QcSegmentCategoryAndType.hh"
#include "common/QcSegmentType.hh"
#include "common/QcSegmentVersion.hh"
#include "common/QcSegmentVersionId.hh"
#include "common/RequiredPropertyException.hh"
#include "common/RestraintType.hh"
#include "common/SamplingType.hh"
#include "common/SignalDetectionHypothesis.hh"
#include "common/SignalDetectionHypothesisFaceted.hh"
#include "common/SignalDetectionHypothesisId.hh"
#include "common/Station.hh"
#include "common/StationMagnitudeSolution.hh"
#include "common/StationType.hh"
#include "common/StationVersionReference.hh"
#include "common/TaperDefinition.hh"
#include "common/TaperFunction.hh"
#include "common/TimeRange.hh"
#include "common/TimeRangesByChannel.hh"
#include "common/Timeseries.hh"
#include "common/TimeseriesType.hh"
#include "common/TimeseriesWithMissingInputChannels.hh"
#include "common/Units.hh"
#include "common/ValueTypeWrapper.hh"
#include "common/Waveform.hh"
#include "common/WorkflowDefinitionId.hh"

#include "beamprovider/BeamProvider.hh"
#include "beamprovider/BeamSummationType.hh"
#include "beamprovider/definitions/BeamDefinition.hh"
#include "beamprovider/descriptions/BeamDescription.hh"
#include "beamprovider/parameters/BeamParameters.hh"

#include "filterprovider/FilterDesigner.hh"
#include "filterprovider/FilterProvider.hh"
#include "filterprovider/definitions/BaseFilterDefinition.hh"
#include "filterprovider/descriptions/BaseFilterDescription.hh"
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"
#include "filterprovider/descriptions/CascadeFilterDescription.hh"
#include "filterprovider/descriptions/LinearFIRFilterDescription.hh"
#include "filterprovider/descriptions/LinearIIRFilterDescription.hh"
#include "filterprovider/parameters/BaseFilterParameters.hh"
#include "filterprovider/parameters/CascadeFilterParameters.hh"
#include "filterprovider/parameters/FIRFilterParameters.hh"
#include "filterprovider/parameters/IIRFilterParameters.hh"
#include "filterprovider/wrappers/FilterDescriptionWrapper.hh"

#include "fkprovider/FkAttributes.hh"
#include "fkprovider/FkComputeException.hh"
#include "fkprovider/FkComputeUtility.hh"
#include "fkprovider/FkFrequencyRange.hh"
#include "fkprovider/FkSpectra.hh"
#include "fkprovider/FkSpectraDefinition.hh"
#include "fkprovider/FkSpectraMetadata.hh"
#include "fkprovider/FkSpectraParameters.hh"
#include "fkprovider/FkTimeseriesWithMissingInputChannels.hh"

#include "rotationprovider/RotationDefinition.hh"
#include "rotationprovider/RotationDescription.hh"
#include "rotationprovider/RotationParameters.hh"
#include "rotationprovider/RotationProvider.hh"

#include "wasm/ArrayConverter.hh"

/**
 * This section must remain in the Extern C. Note the use of the double* pointer style array.
 * This allows the C code to execute against an allocated memory space and it significantly faster
 * than trying to execute against any other kind of allocated memory that crosses the WASM boundary
 */
extern "C"
{
    void cascadeFilterApply(CascadeFilterDescription* filterDescription, double* data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude);
    void iirFilterApply(LinearIIRFilterDescription* filterDescription, double* data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude);
    void firFilterApply(LinearFIRFilterDescription* filterDescription, double* data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude);
}
CascadeFilterDescription cascadeFilterDesign(CascadeFilterDescription filterDescription);
LinearIIRFilterDescription iirFilterDesign(LinearIIRFilterDescription filterDescription);
LinearFIRFilterDescription firFilterDesign(LinearFIRFilterDescription filterDescription);


#if (__EMSCRIPTEN__)

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/em_macros.h>
EMSCRIPTEN_KEEPALIVE

EMSCRIPTEN_BINDINGS(CommonInterop)
{
    //COMMON INTEROP
    emscripten::register_vector<Channel>("VectorChannel");
    emscripten::register_vector<ChannelSegment>("VectorChannelSegment");
    emscripten::register_vector<ChannelSegmentDescriptor>("VectorChannelSegmentDescriptor");
    emscripten::register_vector<ChannelVersionReference>("VectorChannelVersionReference");
    emscripten::register_vector<double>("VectorDouble");
    emscripten::register_vector<std::vector<double>>("MultiVectorDouble");
    emscripten::register_vector<Ellipse>("VectorEllipse");
    emscripten::register_vector<Ellipsoid>("VectorEllipsoid");
    emscripten::register_vector<EventHypothesis>("VectorEventHypothesis");
    emscripten::register_vector<FeatureMeasurementWrapper>("VectorFeatureMeasurementWrapper");
    emscripten::register_vector<FeaturePrediction>("VectorFeaturePrediction");
    emscripten::register_vector<FilterDescriptionWrapper>("VectorFilterDescriptionWrapper");
    emscripten::register_vector<FkAttributes>("VectorFkAttributes");
    emscripten::register_vector<FkSpectrum>("VectorFkSpectrum");
    emscripten::register_vector<FkSpectra>("VectorFkSpectra");
    emscripten::register_vector<LocationBehavior>("VectorLocationBehavior");
    emscripten::register_vector<LocationSolution>("VectorLocationSolution");
    emscripten::register_vector<NetworkMagnitudeBehavior>("VectorNetworkMagnitudeBehavior");
    emscripten::register_vector<NetworkMagnitudeSolution>("VectorNetworkMagnitudeSolution");
    emscripten::register_vector<ProcessingMask>("VectorProcessingMask");
    emscripten::register_vector<QcSegmentVersion>("VectorQcSegmentVersion");
    emscripten::register_vector<SignalDetectionHypothesisFaceted>("VectorSignalDetectionHypothesisFaceted");
    emscripten::register_vector<std::string>("VectorString");
    emscripten::register_vector<TimeRange>("VectorTimeRange");
    emscripten::register_vector<TimeRangesByChannel>("VectorTimeRangesByChannel");
    emscripten::register_vector<Waveform>("VectorWaveform");
    emscripten::register_vector<std::vector<Waveform>>("MultiVectorWaveform");
    emscripten::register_vector<TimeseriesWithMissingInputChannels>("VectorTimeseriesWithMissingInputChannels");

    emscripten::register_optional<AmplitudeMeasurementValue>();
    emscripten::register_optional<ArrivalTimeMeasurementValue>();
    emscripten::register_optional<bool>();
    emscripten::register_optional<BaseFilterDefinition>();
    emscripten::register_optional<BeamSummationType>();
    emscripten::register_optional<BeamType>();
    emscripten::register_optional<ChannelVersionReference>();
    emscripten::register_optional<ChannelSegment>();
    emscripten::register_optional<double>();
    emscripten::register_optional<DurationValue>();
    emscripten::register_optional<DurationMeasurementValue>();
    emscripten::register_optional<EventHypothesis>();
    emscripten::register_optional<std::vector<EventHypothesis>>();
    emscripten::register_optional<EventLocation>();
    emscripten::register_optional<EnumeratedMeasurementValue>();
    emscripten::register_optional<FeatureMeasurementType>();
    emscripten::register_optional<FeatureMeasurementWrapper>();
    emscripten::register_optional<FeaturePrediction>();
    emscripten::register_optional<std::vector<FkAttributes>>();
    emscripten::register_optional<FkSpectraMetadata>();
    emscripten::register_optional<InstantValue>();
    emscripten::register_optional<int>();
    emscripten::register_optional<Location>();
    emscripten::register_optional<LocationUncertainty>();
    emscripten::register_optional<NumericMeasurementValue>();
    emscripten::register_optional<SamplingType>();
    emscripten::register_optional<ScalingFactorType>();
    emscripten::register_optional<SignalDetectionHypothesisFaceted>();
    emscripten::register_optional<ValueTypeWrapper>();
    emscripten::register_optional<TaperDefinition>();
    emscripten::register_optional<TimeRangesByChannel>();
    emscripten::register_optional<std::vector<TimeRangesByChannel>>();
    emscripten::register_optional<LinearIIRFilterDescription>();
    emscripten::register_optional<LinearFIRFilterDescription>();
    
    emscripten::enum_<DepthRestraintReason>("DepthRestraintReason")
        .value("FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS", DepthRestraintReason::FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS)
        .value("FIXED_AS_STANDARD_DEPTH", DepthRestraintReason::FIXED_AS_STANDARD_DEPTH)
        .value("FIXED_AT_SURFACE", DepthRestraintReason::FIXED_AT_SURFACE)
        .value("FIXED_BY_ANALYST", DepthRestraintReason::FIXED_BY_ANALYST)
        .value("OTHER", DepthRestraintReason::OTHER);

    emscripten::enum_<FeatureMeasurementType>("FeatureMeasurementType")
        .value("ARRIVAL_TIME", FeatureMeasurementType::ARRIVAL_TIME)
        .value("EMERGENCE_ANGLE", FeatureMeasurementType::EMERGENCE_ANGLE)
        .value("SOURCE_TO_RECEIVER_AZIMUTH", FeatureMeasurementType::SOURCE_TO_RECEIVER_AZIMUTH)
        .value("RECEIVER_TO_SOURCE_AZIMUTH", FeatureMeasurementType::RECEIVER_TO_SOURCE_AZIMUTH)
        .value("SLOWNESS", FeatureMeasurementType::SLOWNESS)
        .value("SIGNAL_DURATION", FeatureMeasurementType::SIGNAL_DURATION)
        .value("PHASE", FeatureMeasurementType::PHASE)
        .value("AMPLITUDE_A5_OVER_2", FeatureMeasurementType::AMPLITUDE_A5_OVER_2)
        .value("AMPLITUDE_ANL_OVER_2", FeatureMeasurementType::AMPLITUDE_ANL_OVER_2)
        .value("AMPLITUDE_ALR_OVER_2", FeatureMeasurementType::AMPLITUDE_ALR_OVER_2)
        .value("AMPLITUDE_ALR_OVER_2", FeatureMeasurementType::AMPLITUDE_ALR_OVER_2)
        .value("AMPLITUDE_ANP_OVER_2", FeatureMeasurementType::AMPLITUDE_ANP_OVER_2)
        .value("AMPLITUDE_FKSNR", FeatureMeasurementType::AMPLITUDE_FKSNR)
        .value("AMPLITUDE_LRM0", FeatureMeasurementType::AMPLITUDE_LRM0)
        .value("AMPLITUDE_NOI_LRM0", FeatureMeasurementType::AMPLITUDE_NOI_LRM0)
        .value("AMPLITUDE_RMSAMP", FeatureMeasurementType::AMPLITUDE_RMSAMP)
        .value("AMPLITUDE_SBSNR", FeatureMeasurementType::AMPLITUDE_SBSNR)
        .value("PERIOD", FeatureMeasurementType::PERIOD)
        .value("RECTILINEARITY", FeatureMeasurementType::RECTILINEARITY)
        .value("SNR", FeatureMeasurementType::SNR)
        .value("LONG_PERIOD_FIRST_MOTION", FeatureMeasurementType::LONG_PERIOD_FIRST_MOTION)
        .value("SHORT_PERIOD_FIRST_MOTION", FeatureMeasurementType::SHORT_PERIOD_FIRST_MOTION)
        .value("SOURCE_TO_RECEIVER_DISTANCE", FeatureMeasurementType::SOURCE_TO_RECEIVER_DISTANCE)
        .value("MAGNITUDE_CORRECTION", FeatureMeasurementType::MAGNITUDE_CORRECTION);

    emscripten::enum_<MagnitudeModel>("MagnitudeModel")
        .value("NUTTLI", MagnitudeModel::NUTTLI)
        .value("P_FACTOR", MagnitudeModel::P_FACTOR)
        .value("REZAPOUR_PEARCE", MagnitudeModel::REZAPOUR_PEARCE)
        .value("RICHTER", MagnitudeModel::RICHTER)
        .value("UNKNOWN", MagnitudeModel::UNKNOWN)
        .value("NET", MagnitudeModel::NET)
        .value("VEITH_CLAWSON", MagnitudeModel::VEITH_CLAWSON);

    emscripten::enum_<MagnitudeType>("MagnitudeType")
        .value("MB", MagnitudeType::MB)
        .value("MB_CODA", MagnitudeType::MB_CODA)
        .value("MB_MB", MagnitudeType::MB_MB)
        .value("MB_MLE", MagnitudeType::MB_MLE)
        .value("MB_PG", MagnitudeType::MB_PG)
        .value("MB_REL_T", MagnitudeType::MB_REL_T)
        .value("ML", MagnitudeType::ML)
        .value("MS", MagnitudeType::MS)
        .value("MS_MLE", MagnitudeType::MS_MLE)
        .value("MS_VMAX", MagnitudeType::MS_VMAX)
        .value("MW_CODA", MagnitudeType::MW_CODA);

    emscripten::enum_<ProcessingOperation>("ProcessingOperation")
        .value("AMPLITUDE_MEASUREMENT_BEAM", ProcessingOperation::AMPLITUDE_MEASUREMENT_BEAM)
        .value("DISPLAY_FILTER", ProcessingOperation::DISPLAY_FILTER)
        .value("EVENT_BEAM", ProcessingOperation::EVENT_BEAM)
        .value("FK_BEAM", ProcessingOperation::FK_BEAM)
        .value("FK_SPECTRA", ProcessingOperation::FK_SPECTRA)
        .value("ROTATION", ProcessingOperation::ROTATION)
        .value("SIGNAL_DETECTION_BEAM", ProcessingOperation::SIGNAL_DETECTION_BEAM)
        .value("SPECTROGRAM", ProcessingOperation::SPECTROGRAM)
        .value("VIRTUAL_BEAM", ProcessingOperation::VIRTUAL_BEAM);

    emscripten::enum_<QcSegmentCategory>("QcSegmentCategory")
        .value("ANALYST_DEFINED", QcSegmentCategory::ANALYST_DEFINED)
        .value("DATA_AUTHENTICATION", QcSegmentCategory::DATA_AUTHENTICATION)
        .value("LONG_TERM", QcSegmentCategory::LONG_TERM)
        .value("STATION_SOH", QcSegmentCategory::STATION_SOH)
        .value("UNPROCESSED", QcSegmentCategory::UNPROCESSED)
        .value("WAVEFORM", QcSegmentCategory::WAVEFORM);

    emscripten::enum_<QcSegmentType>("QcSegmentType")
        .value("AGGREGATE", QcSegmentType::AGGREGATE)
        .value("CALIBRATION", QcSegmentType::CALIBRATION)
        .value("FLAT", QcSegmentType::FLAT)
        .value("GAP", QcSegmentType::GAP)
        .value("NOISY", QcSegmentType::NOISY)
        .value("SENSOR_PROBLEM", QcSegmentType::SENSOR_PROBLEM)
        .value("SPIKE", QcSegmentType::SPIKE)
        .value("STATION_PROBLEM", QcSegmentType::STATION_PROBLEM)
        .value("STATION_SECURITY", QcSegmentType::STATION_SECURITY)
        .value("TIMING", QcSegmentType::TIMING);

    emscripten::enum_<RestraintType>("RestraintType")
        .value("UNRESTRAINED", RestraintType::UNRESTRAINED)
        .value("FIXED", RestraintType::FIXED);

    emscripten::enum_<SamplingType>("SamplingType")
        .value("INTERPOLATED", SamplingType::INTERPOLATED)
        .value("NEAREST_SAMPLE", SamplingType::NEAREST_SAMPLE);

    emscripten::enum_<ScalingFactorType>("ScalingFactorType")
        .value("CONFIDENCE", ScalingFactorType::CONFIDENCE)
        .value("COVERAGE", ScalingFactorType::COVERAGE)
        .value("K_WEIGHTED", ScalingFactorType::K_WEIGHTED);

    emscripten::enum_<StationType>("StationType")
        .value("SEISMIC_1_COMPONENT", StationType::SEISMIC_1_COMPONENT)
        .value("SEISMIC_3_COMPONENT", StationType::SEISMIC_3_COMPONENT)
        .value("SEISMIC_ARRAY", StationType::SEISMIC_ARRAY)
        .value("SEISMIC_3_COMPONENT_ARRAY", StationType::SEISMIC_3_COMPONENT_ARRAY)
        .value("HYDROACOUSTIC", StationType::HYDROACOUSTIC)
        .value("INFRASOUND", StationType::INFRASOUND)
        .value("INFRASOUND_ARRAY", StationType::INFRASOUND_ARRAY)
        .value("WEATHER", StationType::WEATHER);

    emscripten::enum_<TaperFunction>("TaperFunction")
        .value("BLACKMAN", TaperFunction::BLACKMAN)
        .value("COSINE", TaperFunction::COSINE)
        .value("HAMMING", TaperFunction::HAMMING)
        .value("HANNING", TaperFunction::HANNING)
        .value("PARZEN", TaperFunction::PARZEN)
        .value("WELCH", TaperFunction::WELCH);

    emscripten::enum_<TimeseriesType>("TimeseriesType")
        .value("WAVEFORM", TimeseriesType::WAVEFORM)
        .value("FK_SPECTRA", TimeseriesType::FK_SPECTRA)
        .value("DETECTION_FEATURE_MAP", TimeseriesType::DETECTION_FEATURE_MAP);

    emscripten::enum_<Units>("Units")
        .value("DEGREES", Units::DEGREES)
        .value("DECIBELS", Units::DECIBELS)
        .value("RADIANS", Units::RADIANS)
        .value("SECONDS", Units::SECONDS)
        .value("HERTZ", Units::HERTZ)
        .value("SECONDS_PER_DEGREE", Units::SECONDS_PER_DEGREE)
        .value("SECONDS_PER_RADIAN", Units::SECONDS_PER_RADIAN)
        .value("SECONDS_PER_DEGREE_SQUARED", Units::SECONDS_PER_DEGREE_SQUARED)
        .value("SECONDS_PER_KILOMETER_SQUARED", Units::SECONDS_PER_KILOMETER_SQUARED)
        .value("SECONDS_PER_KILOMETER", Units::SECONDS_PER_KILOMETER)
        .value("SECONDS_PER_KILOMETER_PER_DEGREE", Units::SECONDS_PER_KILOMETER_PER_DEGREE)
        .value("ONE_OVER_KM", Units::ONE_OVER_KM)
        .value("NANOMETERS", Units::NANOMETERS)
        .value("NANOMETERS_PER_SECOND", Units::NANOMETERS_PER_SECOND)
        .value("NANOMETERS_PER_COUNT", Units::NANOMETERS_PER_COUNT)
        .value("NANOMETERS_SQUARED_PER_SECOND", Units::NANOMETERS_SQUARED_PER_SECOND)
        .value("UNITLESS", Units::UNITLESS)
        .value("MAGNITUDE", Units::MAGNITUDE)
        .value("COUNTS_PER_NANOMETER", Units::COUNTS_PER_NANOMETER)
        .value("COUNTS_PER_PASCAL", Units::COUNTS_PER_PASCAL)
        .value("PASCALS_PER_COUNT", Units::PASCALS_PER_COUNT);

    emscripten::class_<AmplitudeMeasurementValue>("AmplitudeMeasurementValue")
        .constructor<double, Units, std::optional<double>, std::optional<bool>, std::optional<double>, std::optional<double>, std::optional<double>>()
        .property("amplitude", &AmplitudeMeasurementValue::amplitude)
        .property("units", &AmplitudeMeasurementValue::units)
        .property("clipped", &AmplitudeMeasurementValue::clipped)
        .property("measurementTime", &AmplitudeMeasurementValue::measurementTime)
        .property("measurementWindowStart", &AmplitudeMeasurementValue::measurementWindowStart)
        .property("measurementWindowDuration", &AmplitudeMeasurementValue::measurementWindowDuration);

    emscripten::function("convertToVectorDouble", &ArrayConverter::convertToVectorDouble);
    emscripten::function("convertToFloat64Array", &ArrayConverter::convertToFloat64Array);
    emscripten::function("vectorFromPointer", &ArrayConverter::vectorFromPointer);

    emscripten::class_<ArrivalTimeMeasurementValue>("ArrivalTimeMeasurementValue")
        .constructor<InstantValue, std::optional<DurationValue>>()
        .property("arrivalTime", &ArrivalTimeMeasurementValue::arrivalTime)
        .property("travelTime", &ArrivalTimeMeasurementValue::travelTime);

    emscripten::class_<BaseVersionReference>("BaseVersionReference")
        .constructor<double>()
        .property("effectiveAt", &BaseVersionReference::effectiveAt);

    emscripten::class_<BeamDefinition>("BeamDefinition")
        .constructor<BeamDescription, BeamParameters>()
        .property("beamDescription", &BeamDefinition::beamDescription)
        .property("beamParameters", &BeamDefinition::beamParameters);

    emscripten::class_<BeamDescription::Builder>("BeamDescriptionBuilder")
        .constructor()
        .function("beamSummation", &BeamDescription::Builder::beamSummation)
        .function("beamType", &BeamDescription::Builder::beamType)
        .function("phase", &BeamDescription::Builder::phase)
        .function("samplingType", &BeamDescription::Builder::samplingType)
        .function("twoDimensional", &BeamDescription::Builder::twoDimensional)
        .function("preFilterDefinition", &BeamDescription::Builder::preFilterDefinition)
        .function("build", &BeamDescription::Builder::build);

    emscripten::class_<BeamDescription>("BeamDescription")
        .property("beamSummation", &BeamDescription::beamSummation)
        .property("beamType", &BeamDescription::beamType)
        .property("phase", &BeamDescription::phase)
        .property("samplingType", &BeamDescription::samplingType)
        .property("twoDimensional", &BeamDescription::twoDimensional)
        .property("preFilterDefinition", &BeamDescription::preFilterDefinition);

    emscripten::class_<BeamParameters::Builder>("BeamParametersBuilder")
        .constructor()
        .function("minWaveformsToBeam", &BeamParameters::Builder::minWaveformsToBeam)
        .function("orientationAngles", &BeamParameters::Builder::orientationAngles)
        .function("orientationAngleToleranceDeg", &BeamParameters::Builder::orientationAngleToleranceDeg)
        .function("receiverToSourceAzimuthDeg", &BeamParameters::Builder::receiverToSourceAzimuthDeg)
        .function("sampleRateHz", &BeamParameters::Builder::sampleRateHz)
        .function("slownessSecPerDeg", &BeamParameters::Builder::slownessSecPerDeg)
        .function("sampleRateToleranceHz", &BeamParameters::Builder::sampleRateToleranceHz)
        .function("location", &BeamParameters::Builder::location)
        .function("build", &BeamParameters::Builder::build);

    emscripten::class_<BeamParameters>("BeamParameters");

    emscripten::enum_<BeamSummationType>("BeamSummationType")
        .value("COHERENT", BeamSummationType::COHERENT)
        .value("INCOHERENT", BeamSummationType::INCOHERENT)
        .value("RMS", BeamSummationType::RMS);

    emscripten::enum_<BeamType>("BeamType")
        .value("AMPLITUDE", BeamType::AMPLITUDE)
        .value("CONTINUOUS_LOCATION", BeamType::CONTINUOUS_LOCATION)
        .value("DETECTION", BeamType::DETECTION)
        .value("EVENT", BeamType::EVENT)
        .value("FK", BeamType::FK);

    emscripten::class_<Channel>("Channel")
        .constructor<std::string>()
        .property("channelName", &Channel::channelName);

    emscripten::class_<ChannelSegment>("ChannelSegment")
        .property("id", &ChannelSegment::id)
        .property("channelSegmentUnits", &ChannelSegment::channelSegmentUnits)
        .property("creationTime", &ChannelSegment::creationTime)
        .property("endTime", &ChannelSegment::endTime)
        .property("maskedBy", &ChannelSegment::maskedBy)
        .property("missingInputChannels", &ChannelSegment::missingInputChannels)
        .property("startTime", &ChannelSegment::startTime)
        .property("timeseries", &ChannelSegment::timeseries)
        .property("timeseriesType", &ChannelSegment::timeseriesType);

    emscripten::class_<ChannelSegment::Builder>("ChannelSegmentBuilder")
        .constructor()
        .function("id", &ChannelSegment::Builder::id)
        .function("channelSegmentUnits", &ChannelSegment::Builder::channelSegmentUnits)
        .function("creationTime", &ChannelSegment::Builder::creationTime)
        .function("endTime", &ChannelSegment::Builder::endTime)
        .function("startTime", &ChannelSegment::Builder::startTime)
        .function("timeseries", &ChannelSegment::Builder::timeseries)
        .function("timeseriesType", &ChannelSegment::Builder::timeseriesType)
        .function("build", &ChannelSegment::Builder::build);

    emscripten::class_<ChannelSegmentDescriptor>("ChannelSegmentDescriptor")
        .constructor<ChannelVersionReference, double, double, double>()
        .property("channel", &ChannelSegmentDescriptor::channel)
        .property("startTime", &ChannelSegmentDescriptor::startTime)
        .property("endTime", &ChannelSegmentDescriptor::endTime)
        .property("creationTime", &ChannelSegmentDescriptor::creationTime);


    emscripten::class_<ChannelVersionReference, emscripten::base<BaseVersionReference>>("ChannelVersionReference")
        .constructor<std::string, double>()
        .property("name", &ChannelVersionReference::name);

    emscripten::class_<DoubleValue>("DoubleValue")
        .constructor<std::optional<double>, Units, double>()
        .property("standardDeviation", &DoubleValue::standardDeviation)
        .property("units", &DoubleValue::units)
        .property("value", &DoubleValue::value);

    emscripten::class_<DurationMeasurementValue>("DurationMeasurementValue")
        .constructor<InstantValue, DurationValue>()
        .property("startTime", &DurationMeasurementValue::startTime)
        .property("duration", &DurationMeasurementValue::duration);

    emscripten::class_<DurationValue>("DurationValue")
        .constructor<double, std::optional<double>>()
        .property("value", &DurationValue::value)
        .property("standardDeviation", &DurationValue::standardDeviation);

    emscripten::class_<Ellipse::Builder>("EllipseBuilder")
        .function("scalingFactorType", &Ellipse::Builder::scalingFactorType)
        .function("kWeight", &Ellipse::Builder::kWeight)
        .function("confidenceLevel", &Ellipse::Builder::confidenceLevel)
        .function("semiMajorAxisLengthKm", &Ellipse::Builder::semiMajorAxisLengthKm)
        .function("semiMinorAxisLengthKm", &Ellipse::Builder::semiMinorAxisLengthKm)
        .function("depthUncertaintyKm", &Ellipse::Builder::depthUncertaintyKm)
        .function("timeUncertainty", &Ellipse::Builder::timeUncertainty)
        .function("build", &Ellipse::Builder::build);

    emscripten::class_<Ellipse>("Ellipse");

    emscripten::class_<Ellipsoid::Builder>("EllipsoidBuilder")
        .function("scalingFactorType", &Ellipsoid::Builder::scalingFactorType)
        .function("kWeight", &Ellipsoid::Builder::kWeight)
        .function("confidenceLevel", &Ellipsoid::Builder::confidenceLevel)
        .function("semiMajorAxisLengthKm", &Ellipsoid::Builder::semiMajorAxisLengthKm)
        .function("semiMajorAxisTrendDeg", &Ellipsoid::Builder::semiMajorAxisTrendDeg)
        .function("semiMajorAxisPlungeDeg", &Ellipsoid::Builder::semiMajorAxisPlungeDeg)
        .function("semiIntermediateAxisLengthKm", &Ellipsoid::Builder::semiIntermediateAxisLengthKm)
        .function("semiIntermediateAxisTrendDeg", &Ellipsoid::Builder::semiIntermediateAxisTrendDeg)
        .function("semiIntermediateAxisPlungeDeg", &Ellipsoid::Builder::semiIntermediateAxisPlungeDeg)
        .function("semiMinorAxisLengthKm", &Ellipsoid::Builder::semiMinorAxisLengthKm)
        .function("semiMinorAxisTrendDeg", &Ellipsoid::Builder::semiMinorAxisTrendDeg)
        .function("semiMinorAxisPlungeDeg", &Ellipsoid::Builder::semiMinorAxisPlungeDeg)
        .function("timeUncertainty", &Ellipsoid::Builder::timeUncertainty)
        .function("build", &Ellipsoid::Builder::build);

    emscripten::class_<Ellipsoid>("Ellipsoid");

    emscripten::class_<EnumeratedMeasurementValue>("EnumeratedMeasurementValue")
        .constructor<std::string, std::optional<double>, std::optional<double>>()
        .property("value", &EnumeratedMeasurementValue::value)
        .property("confidence", &EnumeratedMeasurementValue::confidence)
        .property("referenceTime", &EnumeratedMeasurementValue::referenceTime);

    emscripten::class_<EventHypothesis>("EventHypothesis")
        .constructor<
        EventHypothesisId,
        bool,
        bool,
        std::vector<EventHypothesis>,
        std::vector<SignalDetectionHypothesisFaceted>,
        std::string,
        std::vector<LocationSolution>>()
        .property("id", &EventHypothesis::id)
        .property("rejected", &EventHypothesis::rejected)
        .property("deleted", &EventHypothesis::deleted)
        .property("parentEventHypotheses", &EventHypothesis::parentEventHypotheses)
        .property("associatedSignalDetectionHypotheses", &EventHypothesis::associatedSignalDetectionHypotheses)
        .property("preferredLocationSolution", &EventHypothesis::preferredLocationSolution)
        .property("locationSolutions", &EventHypothesis::locationSolutions);

    emscripten::class_<EventHypothesisId>("EventHypothesisId")
        .constructor<std::string, std::string>()
        .property("eventId", &EventHypothesisId::eventId)
        .property("hypothesisId", &EventHypothesisId::hypothesisId);

    emscripten::class_<EventLocation>("EventLocation")
        .constructor<double, double, double, double>()
        .property("latitudeDegrees", &EventLocation::latitudeDegrees)
        .property("longitudeDegrees", &EventLocation::longitudeDegrees)
        .property("depthKm", &EventLocation::depthKm)
        .property("time", &EventLocation::time);

    emscripten::class_<FeaturePrediction::Builder>("FeaturePredictionBuilder")
        .function("phase", &FeaturePrediction::Builder::phase)
        .function("extrapolated", &FeaturePrediction::Builder::extrapolated)
        .function("predictedValue", &FeaturePrediction::Builder::predictedValue)
        .function("sourceLocation", &FeaturePrediction::Builder::sourceLocation)
        .function("receiverLocation", &FeaturePrediction::Builder::receiverLocation)
        .function("channel", &FeaturePrediction::Builder::channel)
        .function("predictionType", &FeaturePrediction::Builder::predictionType)
        .function("build", &FeaturePrediction::Builder::build);

    emscripten::class_<FeaturePrediction>("FeaturePrediction");

    emscripten::class_<FeatureMeasurementWrapper::Builder>("FeatureMeasurementWrapperBuilder")
        .constructor()
        .function("amplitudeMeasurementValue", &FeatureMeasurementWrapper::Builder::amplitudeMeasurementValue)
        .function("arrivalTimeMeasurementValue", &FeatureMeasurementWrapper::Builder::arrivalTimeMeasurementValue)
        .function("durationMeasurementValue", &FeatureMeasurementWrapper::Builder::durationMeasurementValue)
        .function("enumeratedMeasurementValue", &FeatureMeasurementWrapper::Builder::enumeratedMeasurementValue)
        .function("numericMeasurementValue", &FeatureMeasurementWrapper::Builder::numericMeasurementValue)
        .function("build", &FeatureMeasurementWrapper::Builder::build);

    emscripten::class_<FeatureMeasurementWrapper>("FeatureMeasurementWrapper");

    emscripten::class_<InstantValue>("InstantValue")
        .constructor<double, std::optional<double>>()
        .property("value", &InstantValue::value)
        .property("standardDeviation", &InstantValue::standardDeviation);

    emscripten::class_<Location>("Location")
        .constructor<double, double, double, double>()
        .property("latitudeDegrees", &Location::latitudeDegrees)
        .property("longitudeDegrees", &Location::longitudeDegrees)
        .property("elevationKm", &Location::elevationKm)
        .property("depthKm", &Location::depthKm);

    emscripten::class_<LocationBehavior>("LocationBehavior")
        .constructor<bool, FeatureMeasurementWrapper, std::optional<FeaturePrediction>, std::optional<double>, std::optional<double>>()
        .property("defining", &LocationBehavior::defining)
        .property("measurement", &LocationBehavior::measurement)
        .property("prediction", &LocationBehavior::prediction)
        .property("residual", &LocationBehavior::residual)
        .property("weight", &LocationBehavior::weight);

    emscripten::class_<LocationRestraint::Builder>("LocationRestraintBuilder")
        .function("depthRestraintType", &LocationRestraint::Builder::depthRestraintType)
        .function("timeRestraintType", &LocationRestraint::Builder::timeRestraintType)
        .function("positionRestraintType", &LocationRestraint::Builder::positionRestraintType)
        .function("depthRestraintKm", &LocationRestraint::Builder::depthRestraintKm)
        .function("latitudeRestraintDegrees", &LocationRestraint::Builder::latitudeRestraintDegrees)
        .function("depthRestraintType", &LocationRestraint::Builder::depthRestraintType)
        .function("longitudeRestraintDegrees", &LocationRestraint::Builder::longitudeRestraintDegrees)
        .function("timeRestraint", &LocationRestraint::Builder::timeRestraint)
        .function("build", &LocationRestraint::Builder::build);

    emscripten::class_<LocationRestraint>("LocationRestraint");

    emscripten::class_<LocationSolution>("LocationSolution")
        .constructor<
        std::string,
        std::vector<NetworkMagnitudeSolution>,
        std::vector<FeaturePrediction>,
        std::optional<LocationUncertainty>,
        std::vector<LocationBehavior>,
        EventLocation,
        LocationRestraint>()
        .property("id", &LocationSolution::id)
        .property("networkMagnitudeSolutions", &LocationSolution::networkMagnitudeSolutions)
        .property("featurePredictions", &LocationSolution::featurePredictions)
        .property("locationUncertainty", &LocationSolution::locationUncertainty)
        .property("locationBehaviors", &LocationSolution::locationBehaviors)
        .property("location", &LocationSolution::location)
        .property("locationRestraint", &LocationSolution::locationRestraint);

    emscripten::class_<LocationUncertainty::Builder>("LocationUncertaintyBuilder")
        .function("ellipses", &LocationUncertainty::Builder::ellipses)
        .function("ellipsoids", &LocationUncertainty::Builder::ellipsoids)
        .function("xx", &LocationUncertainty::Builder::xx)
        .function("xy", &LocationUncertainty::Builder::xy)
        .function("xz", &LocationUncertainty::Builder::xz)
        .function("xt", &LocationUncertainty::Builder::xt)
        .function("yy", &LocationUncertainty::Builder::yy)
        .function("yz", &LocationUncertainty::Builder::yz)
        .function("yt", &LocationUncertainty::Builder::yt)
        .function("zz", &LocationUncertainty::Builder::zz)
        .function("zt", &LocationUncertainty::Builder::zt)
        .function("tt", &LocationUncertainty::Builder::tt)
        .function("build", &LocationUncertainty::Builder::build);

    emscripten::class_<LocationUncertainty>("LocationUncertainty");

    emscripten::class_<Map<std::string, TimeseriesWithMissingInputChannels>>("ChannelToTimeseriesWithMissingInputMap")
        .constructor()
        .function("add", &Map<std::string, TimeseriesWithMissingInputChannels>::add)
        .function("empty", &Map<std::string, TimeseriesWithMissingInputChannels>::empty)
        .function("exists", &Map<std::string, TimeseriesWithMissingInputChannels>::exists)
        .function("get", &Map<std::string, TimeseriesWithMissingInputChannels>::get)
        .function("remove", &Map<std::string, TimeseriesWithMissingInputChannels>::remove)
        .function("update", &Map<std::string, TimeseriesWithMissingInputChannels>::update);

    emscripten::class_<Map<std::string, std::vector<ProcessingMask>>>("ProcessingMasksByChannelMap")
        .constructor()
        .function("add", &Map<std::string, std::vector<ProcessingMask>>::add)
        .function("empty", &Map<std::string, std::vector<ProcessingMask>>::empty)
        .function("exists", &Map<std::string, std::vector<ProcessingMask>>::exists)
        .function("get", &Map<std::string, std::vector<ProcessingMask>>::get)
        .function("remove", &Map<std::string, std::vector<ProcessingMask>>::remove)
        .function("update", &Map<std::string, std::vector<ProcessingMask>>::update);

    emscripten::class_<Map<std::string, RelativePosition>>("RelativePositionByChannelMap")
        .constructor()
        .function("add", &Map<std::string, RelativePosition>::add)
        .function("empty", &Map<std::string, RelativePosition>::empty)
        .function("exists", &Map<std::string, RelativePosition>::exists)
        .function("get", &Map<std::string, RelativePosition>::get)
        .function("remove", &Map<std::string, RelativePosition>::remove)
        .function("update", &Map<std::string, RelativePosition>::update);

    emscripten::class_<NetworkMagnitudeBehavior>("NetworkMagnitudeBehavior")
        .constructor<bool, StationMagnitudeSolution, double, double>()
        .property("isDefining", &NetworkMagnitudeBehavior::isDefining)
        .property("stationMagnitudeSolution", &NetworkMagnitudeBehavior::stationMagnitudeSolution)
        .property("residual", &NetworkMagnitudeBehavior::residual)
        .property("weight", &NetworkMagnitudeBehavior::weight);

    emscripten::class_<NetworkMagnitudeSolution>("NetworkMagnitudeSolution")
        .constructor<DoubleValue, std::vector<NetworkMagnitudeBehavior>, MagnitudeType>()
        .property("magnitude", &NetworkMagnitudeSolution::magnitude)
        .property("magnitudeBehaviors", &NetworkMagnitudeSolution::magnitudeBehaviors)
        .property("type", &NetworkMagnitudeSolution::type);

    emscripten::class_<NumericMeasurementValue>("NumericMeasurementValue")
        .constructor<DoubleValue, std::optional<double>>()
        .property("measuredValue", &NumericMeasurementValue::measuredValue)
        .property("referenceTime", &NumericMeasurementValue::referenceTime);

    emscripten::class_<OrientationAngles>("OrientationAngles")
        .constructor<double, double>()
        .property("horizontalAngleDeg", &OrientationAngles::horizontalAngleDeg)
        .property("verticalAngleDeg", &OrientationAngles::verticalAngleDeg);

    emscripten::class_<ProcessingMask>("ProcessingMask")
        .constructor<std::string, Channel, double, double, double, std::vector<QcSegmentVersion>, ProcessingOperation  >()
        .property("id", &ProcessingMask::id)
        .property("appliedToRawChannel", &ProcessingMask::appliedToRawChannel)
        .property("effectiveAt", &ProcessingMask::effectiveAt)
        .property("startTime", &ProcessingMask::startTime)
        .property("endTime", &ProcessingMask::endTime)
        .property("maskedQcSegmentVersions", &ProcessingMask::maskedQcSegmentVersions)
        .property("processingOperation", &ProcessingMask::processingOperation);

    emscripten::class_<QcSegment>("QcSegment")
        .constructor<std::string, Channel, QcSegmentVersion>()
        .property("id", &QcSegment::id)
        .property("channel", &QcSegment::channel)
        .property("versionHistory", &QcSegment::versionHistory);

    emscripten::class_<QcSegmentCategoryAndType>("QcSegmentCategoryAndType")
        .constructor<QcSegmentCategory>()
        .constructor<QcSegmentCategory, QcSegmentType>()
        .property("category", &QcSegmentCategoryAndType::category)
        .property("type", &QcSegmentCategoryAndType::type);

    emscripten::class_<QcSegmentVersion::Builder>("QcSegmentVersionBuilder")
        .function("id", &QcSegmentVersion::Builder::id)
        .function("category", &QcSegmentVersion::Builder::category)
        .function("channels", &QcSegmentVersion::Builder::channels)
        .function("type", &QcSegmentVersion::Builder::type)
        .function("startTime", &QcSegmentVersion::Builder::startTime)
        .function("endTime", &QcSegmentVersion::Builder::endTime)
        .function("createdBy", &QcSegmentVersion::Builder::createdBy)
        .function("rejected", &QcSegmentVersion::Builder::rejected)
        .function("rationale", &QcSegmentVersion::Builder::rationale)
        .function("stageId", &QcSegmentVersion::Builder::stageId)
        .function("discoveredOn", &QcSegmentVersion::Builder::discoveredOn)
        .function("build", &QcSegmentVersion::Builder::build);

    emscripten::class_<QcSegmentVersion>("QcSegmentVersion")
        .property("id", &QcSegmentVersion::id)
        .property("category", &QcSegmentVersion::category)
        .property("channels", &QcSegmentVersion::channels)
        .property("type", &QcSegmentVersion::type)
        .property("startTime", &QcSegmentVersion::startTime)
        .property("endTime", &QcSegmentVersion::endTime)
        .property("createdBy", &QcSegmentVersion::createdBy)
        .property("rejected", &QcSegmentVersion::rejected)
        .property("rationale", &QcSegmentVersion::rationale)
        .property("stageId", &QcSegmentVersion::stageId)
        .property("discoveredOn", &QcSegmentVersion::discoveredOn);

    emscripten::class_<QcSegmentVersionId, emscripten::base<BaseVersionReference>>("QcSegmentVersionId")
        .constructor<std::string, double>()
        .property("parentQcSegmentId", &QcSegmentVersionId::parentQcSegmentId);

    emscripten::class_<RelativePosition>("RelativePosition")
        .constructor<double, double, double>()
        .property("northDisplacementKm", &RelativePosition::northDisplacementKm)
        .property("eastDisplacementKm", &RelativePosition::eastDisplacementKm)
        .property("verticalDisplacementKm", &RelativePosition::verticalDisplacementKm);

    emscripten::class_<SignalDetectionHypothesisId>("SignalDetectionHypothesisId")
        .constructor<std::string, std::string>()
        .property("id", &SignalDetectionHypothesisId::id)
        .property("signalDetectionId", &SignalDetectionHypothesisId::signalDetectionId);

    emscripten::class_<SignalDetectionHypothesisFaceted>("SignalDetectionHypothesisFaceted")
        .constructor<SignalDetectionHypothesisId>()
        .property("id", &SignalDetectionHypothesisFaceted::id);

    emscripten::class_<SignalDetectionHypothesis>("SignalDetectionHypothesis")
        .constructor<
        SignalDetectionHypothesisId,
        std::string,
        bool,
        StationVersionReference,
        std::vector<FeatureMeasurementWrapper>,
        std::optional<SignalDetectionHypothesisFaceted>>()
        .property("id", &SignalDetectionHypothesis::id)
        .property("monitoringOrganization", &SignalDetectionHypothesis::monitoringOrganization)
        .property("deleted", &SignalDetectionHypothesis::deleted)
        .property("station", &SignalDetectionHypothesis::station)
        .property("featureMeasurements", &SignalDetectionHypothesis::featureMeasurements)
        .property("parentSignalDetectionHypothesis", &SignalDetectionHypothesis::parentSignalDetectionHypothesis);

    emscripten::class_<StationMagnitudeSolution>("StationMagnitudeSolution")
        .constructor<MagnitudeType, MagnitudeModel, StationVersionReference, std::string, DoubleValue, std::optional<FeatureMeasurementWrapper>>()
        .property("type", &StationMagnitudeSolution::type)
        .property("model", &StationMagnitudeSolution::model)
        .property("station", &StationMagnitudeSolution::station)
        .property("phase", &StationMagnitudeSolution::phase)
        .property("magnitude", &StationMagnitudeSolution::magnitude)
        .property("measurement", &StationMagnitudeSolution::measurement);

    emscripten::class_<Station>("Station")
        .constructor<StationVersionReference, Map<std::string, RelativePosition>>()
        .property("stationVersionReference", &Station::stationVersionReference)
        .property("relativePositionsByChannel", &Station::relativePositionsByChannel);

    emscripten::class_<StationVersionReference>("StationVersionReference")
        .constructor<std::string, double>()
        .property("name", &StationVersionReference::name);

    emscripten::class_<TaperDefinition>("TaperDefinition")
        .constructor<TaperFunction, int>()
        .property("taperFunction", &TaperDefinition::taperFunction)
        .property("taperLengthSamples", &TaperDefinition::taperLengthSamples);

    emscripten::class_<TimeRange>("TimeRange")
        .constructor<double, double>()
        .property("startTime", &TimeRange::startTime)
        .property("endTime", &TimeRange::endTime);

    emscripten::class_<TimeRangesByChannel>("TimeRangesByChannel")
        .constructor<ChannelVersionReference, std::vector<TimeRange>>()
        .property("channelVersionReference", &TimeRangesByChannel::channelVersionReference)
        .property("timeRanges", &TimeRangesByChannel::timeRanges);

    emscripten::class_<Timeseries>("Timeseries")
        .constructor<double, double, double, int>()
        .property("startTime", &Timeseries::startTime)
        .property("endTime", &Timeseries::endTime)
        .property("sampleRateHz", &Timeseries::sampleRateHz)
        .property("sampleCount", &Timeseries::sampleCount);

    emscripten::class_ <ValueTypeWrapper::Builder>("ValueTypeWrapperBuilder")
        .function("doubleValue", &ValueTypeWrapper::Builder::doubleValue)
        .function("durationValue", &ValueTypeWrapper::Builder::durationValue)
        .function("instantValue", &ValueTypeWrapper::Builder::instantValue)
        .function("build", &ValueTypeWrapper::Builder::build);

    emscripten::class_<ValueTypeWrapper>("ValueTypeWrapper");

    emscripten::class_<Waveform, emscripten::base<Timeseries>>("Waveform")
        .constructor<std::vector<double>, double, double, double>()
        .property("samples", &Waveform::samples);

    emscripten::class_<WorkflowDefinitionId, emscripten::base<BaseVersionReference>>("WorkflowDefinitionId")
        .constructor<std::string, double>()
        .property("name", &WorkflowDefinitionId::name);

    emscripten::class_<TimeseriesWithMissingInputChannels>("TimeseriesWithMissingInputChannels")
        .constructor<std::vector<Waveform>, std::vector<TimeRangesByChannel>>()
        .property("timeseries", &TimeseriesWithMissingInputChannels::timeseries)
        .property("missingInputChannels", &TimeseriesWithMissingInputChannels::missingInputChannels);

    emscripten::class_<BeamProvider>("BeamProvider")
        .constructor()
        .function("maskAndBeamWaveforms", &BeamProvider::maskAndBeamWaveforms, emscripten::allow_raw_pointers());

    //FILTERING INTEROP

    emscripten::constant("MAX_NAME_SIZE", MAX_NAME_SIZE);
    emscripten::constant("MAX_COMMENT_SIZE", MAX_COMMENT_SIZE);
    emscripten::constant("MAX_FILTER_ORDER", MAX_FILTER_ORDER);
    emscripten::constant("MAX_POLES", MAX_POLES);
    emscripten::constant("MAX_SOS", MAX_SOS);
    emscripten::constant("MAX_TRANSFER_FUNCTION", MAX_TRANSFER_FUNCTION);
    emscripten::constant("MAX_FILTER_DESCRIPTIONS", MAX_FILTER_DESCRIPTIONS);


    emscripten::enum_<FilterComputationType>("FilterComputationType")
        .value("FIR", FilterComputationType::FIR)
        .value("IIR", FilterComputationType::IIR)
        .value("AR", FilterComputationType::AR)
        .value("PM", FilterComputationType::PM);

    emscripten::enum_<FilterDesignModel>("FilterDesignModel")
        .value("BUTTERWORTH", FilterDesignModel::BUTTERWORTH)
        .value("CHEBYSHEV_I", FilterDesignModel::CHEBYSHEV_I)
        .value("CHEBYSHEV_II", FilterDesignModel::CHEBYSHEV_II)
        .value("ELLIPTIC", FilterDesignModel::ELLIPTIC);

    emscripten::enum_<FilterBandType>("FilterBandType")
        .value("LOW_PASS", FilterBandType::LOW_PASS)
        .value("HIGH_PASS", FilterBandType::HIGH_PASS)
        .value("BAND_PASS", FilterBandType::BAND_PASS)
        .value("BAND_REJECT", FilterBandType::BAND_REJECT);

    emscripten::enum_<FilterDescriptionType>("FilterDescriptionType")
        .value("FIR_FILTER_DESCRIPTION", FilterDescriptionType::FIR_FILTER_DESCRIPTION)
        .value("IIR_FILTER_DESCRIPTION", FilterDescriptionType::IIR_FILTER_DESCRIPTION);

    emscripten::enum_<FkUncertaintyOption>("FkUncertaintyOption")
        .value("EMPIRICAL", FkUncertaintyOption::EMPIRICAL)
        .value("EXPONENTIAL_SIGNAL_COHERENCE", FkUncertaintyOption::EXPONENTIAL_SIGNAL_COHERENCE)
        .value("OBSERVED_SIGNAL_COHERENCE", FkUncertaintyOption::OBSERVED_SIGNAL_COHERENCE)
        .value("PERFECT_SIGNAL_COHERENCE", FkUncertaintyOption::PERFECT_SIGNAL_COHERENCE);

    emscripten::class_<BaseFilterDefinition>("BaseFilterDefinition")
        .constructor();

    emscripten::class_<BaseFilterParameters>("BaseFilterParameters")
        .constructor<int, bool, double, double>()
        .property("groupDelaySec", &BaseFilterParameters::groupDelaySec)
        .property("isDesigned", &BaseFilterParameters::isDesigned)
        .property("sampleRateHz", &BaseFilterParameters::sampleRateHz)
        .property("sampleRateToleranceHz", &BaseFilterParameters::sampleRateToleranceHz);

    emscripten::class_<IIRFilterParameters, emscripten::base<BaseFilterParameters>>("IIRFilterParameters")
        .constructor<std::vector<double>, std::vector<double>, std::vector<double>, int, bool, double, double>()
        .function("getSosNumeratorAsTypedArray", &IIRFilterParameters::getSosNumeratorAsTypedArray)
        .function("getSosDenominatorAsTypedArray", &IIRFilterParameters::getSosDenominatorAsTypedArray)
        .function("getSosCoefficientsAsTypedArray", &IIRFilterParameters::getSosCoefficientsAsTypedArray);

    emscripten::class_<FIRFilterParameters, emscripten::base<BaseFilterParameters>>("FIRFilterParameters")
        .constructor< std::vector<double>, int, bool, double, double>()
        .function("getTransferFunctionAsTypedArray", &FIRFilterParameters::getTransferFunctionAsTypedArray);

    emscripten::class_<CascadeFilterParameters, emscripten::base<BaseFilterParameters>>("CascadeFilterParameters")
        .constructor<int, bool, double, double>();

    emscripten::class_<FilterDescriptionWrapper::Builder>("FilterDescriptionWrapperBuilder")
        .constructor()
        .function("build", &FilterDescriptionWrapper::Builder::build)
        .function("iirDescription", &FilterDescriptionWrapper::Builder::iirDescription)
        .function("firDescription", &FilterDescriptionWrapper::Builder::firDescription);

    emscripten::class_<FilterDescriptionWrapper>("FilterDescriptionWrapper")
        .function("getFilterTypeValue", &FilterDescriptionWrapper::getFilterTypeValue)
        .property("iirDescription", &FilterDescriptionWrapper::iirDescription)
        .property("firDescription", &FilterDescriptionWrapper::firDescription);

    emscripten::class_<BaseFilterDescription>("BaseFilterDescription")
        .constructor<bool, std::string>()
        .property("causal", &BaseFilterDescription::causal)
        .property("comments", &BaseFilterDescription::comments);

    emscripten::class_<CascadeFilterDescription, emscripten::base<BaseFilterDescription>>("CascadeFilterDescription")
        .constructor<std::vector<FilterDescriptionWrapper>, CascadeFilterParameters, bool, std::string>()
        .property("parameters", &CascadeFilterDescription::parameters)
        .property("filterDescriptions", &CascadeFilterDescription::filterDescriptions);

    emscripten::class_<BaseLinearFilterDescription, emscripten::base<BaseFilterDescription>>("BaseLinearFilterDescription")
        .constructor<double, double, FilterBandType, FilterDesignModel, int, bool, bool, std::string>()
        .property("highFrequencyHz", &BaseLinearFilterDescription::highFrequencyHz)
        .property("lowFrequencyHz", &BaseLinearFilterDescription::lowFrequencyHz)
        .property("passBandType", &BaseLinearFilterDescription::passBandType)
        .property("filterDesignModel", &BaseLinearFilterDescription::filterDesignModel)
        .property("order", &BaseLinearFilterDescription::order)
        .property("zeroPhase", &BaseLinearFilterDescription::zeroPhase);

    emscripten::class_<LinearIIRFilterDescription, emscripten::base<BaseLinearFilterDescription>>("LinearIIRFilterDescription")
        .constructor<IIRFilterParameters, bool, std::string, double, double, FilterBandType, FilterDesignModel, int, int>()
        .property("parameters", &LinearIIRFilterDescription::parameters);

    emscripten::class_<LinearFIRFilterDescription, emscripten::base<BaseLinearFilterDescription>>("LinearFIRFilterDescription")
        .constructor<FIRFilterParameters, bool, std::string, double, double, FilterBandType, FilterDesignModel, int, int>()
        .property("parameters", &LinearFIRFilterDescription::parameters);

    emscripten::function("cascadeFilterDesign", &cascadeFilterDesign);
    emscripten::function("iirFilterDesign", &iirFilterDesign);
    emscripten::function("firFilterDesign", &firFilterDesign);

    //FK INTEROP

    emscripten::class_<FkAttributes>("FkAttributes")
        .constructor<double, DoubleValue, DoubleValue>()
        .property("peakFstat", &FkAttributes::peakFstat)
        .property("slowness", &FkAttributes::slowness)
        .property("receiverToSourceAzimuth", &FkAttributes::receiverToSourceAzimuth);

    emscripten::class_<FkComputeUtility>("FkComputeUtility")
        .constructor()
        .function("computeFk", &FkComputeUtility::computeFk, emscripten::allow_raw_pointers())
        .function("getPeakFkAttributes", &FkComputeUtility::getPeakFkAttributes, emscripten::allow_raw_pointers());

    emscripten::class_<FkFrequencyRange>("FkFrequencyRange")
        .constructor<double, double>()
        .property("lowFrequencyHz", &FkFrequencyRange::lowFrequencyHz)
        .property("highFrequencyHz", &FkFrequencyRange::highFrequencyHz);

    emscripten::class_<FkSpectra, emscripten::base<Timeseries>>("FkSpectra")
        .constructor<std::vector<FkSpectrum>, std::optional<FkSpectraMetadata>, double, double, double, int>()
        .property("fkSpectraMetadata", &FkSpectra::fkSpectraMetadata)
        .property("samples", &FkSpectra::samples);

    emscripten::class_<FkTimeseriesWithMissingInputChannels>("FkTimeseriesWithMissingInputChannels")
        .constructor<std::vector<FkSpectra>, std::vector<TimeRangesByChannel>>()
        .property("timeseries", &FkTimeseriesWithMissingInputChannels::timeseries)
        .property("missingInputChannels", &FkTimeseriesWithMissingInputChannels::missingInputChannels);

    emscripten::class_<FkSpectraDefinition>("FkSpectraDefinition")
        .constructor<FkSpectraParameters, OrientationAngles>()
        .property("fkParameters", &FkSpectraDefinition::fkParameters)
        .property("orientationAngles", &FkSpectraDefinition::orientationAngles);

    emscripten::class_<FkSpectraMetadata>("FkSpectraMetadata")
        .constructor<FkSpectrumWindow, std::string, SlownessGrid>()
        .property("fkSpectrumWindow", &FkSpectraMetadata::fkSpectrumWindow)
        .property("phase", &FkSpectraMetadata::phase)
        .property("slownessGrid", &FkSpectraMetadata::slownessGrid);

    emscripten::class_<FkSpectraParameters>("FkSpectraParameters")
        .property("fkFrequencyRange", &FkSpectraParameters::fkFrequencyRange)
        .property("fftTaperFunction", &FkSpectraParameters::fftTaperFunction)
        .property("fftTaperPercent", &FkSpectraParameters::fftTaperPercent)
        .property("fkSpectrumWindow", &FkSpectraParameters::fkSpectrumWindow)
        .property("fkUncertaintyOption", &FkSpectraParameters::fkUncertaintyOption)
        .property("minimumWaveformsForSpectra", &FkSpectraParameters::minimumWaveformsForSpectra)
        .property("normalizeWaveforms", &FkSpectraParameters::normalizeWaveforms)
        .property("phase", &FkSpectraParameters::phase)
        .property("preFilter", &FkSpectraParameters::preFilter)
        .property("orientationAngleToleranceDeg", &FkSpectraParameters::orientationAngleToleranceDeg)
        .property("slownessGrid", &FkSpectraParameters::slownessGrid)
        .property("spectrumStepDuration", &FkSpectraParameters::spectrumStepDuration)
        .property("twoDimensional", &FkSpectraParameters::twoDimensional)
        .property("waveformSampleRate", &FkSpectraParameters::waveformSampleRate);

    emscripten::class_<FkSpectraParameters::Builder>("FkSpectraParametersBuilder")
        .constructor()
        .function("fkFrequencyRange", &FkSpectraParameters::Builder::fkFrequencyRange)
        .function("fftTaperFunction", &FkSpectraParameters::Builder::fftTaperFunction)
        .function("fftTaperPercent", &FkSpectraParameters::Builder::fftTaperPercent)
        .function("fkSpectrumWindow", &FkSpectraParameters::Builder::fkSpectrumWindow)
        .function("fkUncertaintyOption", &FkSpectraParameters::Builder::fkUncertaintyOption)
        .function("minimumWaveformsForSpectra", &FkSpectraParameters::Builder::minimumWaveformsForSpectra)
        .function("normalizeWaveforms", &FkSpectraParameters::Builder::normalizeWaveforms)
        .function("phase", &FkSpectraParameters::Builder::phase)
        .function("preFilter", &FkSpectraParameters::Builder::preFilter)
        .function("orientationAngleToleranceDeg", &FkSpectraParameters::Builder::orientationAngleToleranceDeg)
        .function("slownessGrid", &FkSpectraParameters::Builder::slownessGrid)
        .function("spectrumStepDuration", &FkSpectraParameters::Builder::spectrumStepDuration)
        .function("twoDimensional", &FkSpectraParameters::Builder::twoDimensional)
        .function("waveformSampleRate", &FkSpectraParameters::Builder::waveformSampleRate)
        .function("build", &FkSpectraParameters::Builder::build);

    emscripten::class_<FkSpectrum>("FkSpectrum")
        .constructor<std::vector<std::vector<double>>, std::vector<std::vector<double>>, std::optional<std::vector<FkAttributes>>, std::optional<double>>()
        .property("fstat", &FkSpectrum::fstat)
        .property("power", &FkSpectrum::power)
        .property("fkAttributes", &FkSpectrum::fkAttributes)
        .property("fkQual", &FkSpectrum::fkQual);

    emscripten::class_<FkSpectrumWindow>("FkSpectrumWindow")
        .constructor<double, double>()
        .property("duration", &FkSpectrumWindow::duration)
        .property("lead", &FkSpectrumWindow::lead);

    emscripten::class_<FkWaveformSampleRate>("FkWaveformSampleRate")
        .constructor<double, double>()
        .property("waveformSampleRateHz", &FkWaveformSampleRate::waveformSampleRateHz)
        .property("waveformSampleRateToleranceHz", &FkWaveformSampleRate::waveformSampleRateToleranceHz);

    emscripten::class_<SlownessGrid>("SlownessGrid")
        .constructor<double, double>()
        .property("maxSlowness", &SlownessGrid::maxSlowness)
        .property("numPoints", &SlownessGrid::numPoints);

    //ROTATION
    emscripten::class_<RotationParameters::Builder>("RotationParametersBuilder")
        .constructor()
        .function("receiverToSourceAzimuthDeg", &RotationParameters::Builder::receiverToSourceAzimuthDeg)
        .function("slownessSecPerDeg", &RotationParameters::Builder::slownessSecPerDeg)
        .function("sampleRateHz", &RotationParameters::Builder::sampleRateHz)
        .function("sampleRateToleranceHz", &RotationParameters::Builder::sampleRateToleranceHz)
        .function("location", &RotationParameters::Builder::location)
        .function("locationToleranceKm", &RotationParameters::Builder::locationToleranceKm)
        .function("orientationAngles", &RotationParameters::Builder::orientationAngles)
        .function("orientationAngleToleranceDeg", &RotationParameters::Builder::orientationAngleToleranceDeg)
        .function("build", &RotationParameters::Builder::build);

    emscripten::class_<RotationParameters>("RotationParameters")
        .property("receiverToSourceAzimuthDeg", &RotationParameters::receiverToSourceAzimuthDeg)
        .property("slownessSecPerDeg", &RotationParameters::slownessSecPerDeg)
        .property("sampleRateHz", &RotationParameters::sampleRateHz)
        .property("sampleRateToleranceHz", &RotationParameters::sampleRateToleranceHz)
        .property("location", &RotationParameters::location)
        .property("locationToleranceKm", &RotationParameters::locationToleranceKm)
        .property("orientationAngles", &RotationParameters::orientationAngles)
        .property("orientationAngleToleranceDeg", &RotationParameters::orientationAngleToleranceDeg);

    emscripten::class_<RotationDescription>("RotationDescription")
        .constructor<bool, std::string, SamplingType>()
        .property("twoDimensional", &RotationDescription::twoDimensional)
        .property("phase", &RotationDescription::phase)
        .property("samplingType", &RotationDescription::samplingType);

    emscripten::class_<RotationDefinition>("RotationDefinition")
        .constructor<RotationDescription, RotationParameters>()
        .property("rotationDescription", &RotationDefinition::rotationDescription)
        .property("rotationParameters", &RotationDefinition::rotationParameters);

    emscripten::class_<RotationProvider>("RotationProvider")
        .constructor()
        .function("maskAndRotate2d", &RotationProvider::maskAndRotate2d);

    emscripten::class_<RequiredPropertyException>("RequiredPropertyException")
        .function("getMessage", &RequiredPropertyException::getMessage);

    emscripten::class_<FkComputeException>("FkComputeException")
        .function("getMessage", &FkComputeException::getMessage);

};

#endif
#endif // EMSCRIPTEN_BINDINGS_H