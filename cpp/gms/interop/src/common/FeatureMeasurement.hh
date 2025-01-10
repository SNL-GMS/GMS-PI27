#ifndef FEATURE_MEASUREMENT_H
#define FEATURE_MEASUREMENT_H

#include <optional>
#include "ChannelSegmentDescriptor.hh"
#include "ChannelVersionReference.hh"
#include "DoubleValue.hh"
#include "FeatureMeasurementType.hh"
#include "WaveformAndFilterDefinition.hh"

#include "AmplitudeMeasurementValue.hh"
#include "ArrivalTimeMeasurementValue.hh"
#include "DurationMeasurementValue.hh"
#include "EnumeratedMeasurementValue.hh"
#include "NumericMeasurementValue.hh"

template <class T>

class FeatureMeasurement {
public:

    explicit FeatureMeasurement(
        ChannelVersionReference const& channel,
        std::optional<ChannelSegmentDescriptor> const& measuredChannelSegment,
        T measurementValue,
        FEATURE_MEASUREMENT_TYPE const& featureMeasurementType,
        std::optional<DoubleValue> const& snr,
        std::optional<WaveformAndFilterDefinition> const& analysisWaveform)
        : channel(channel),
        measuredChannelSegment(measuredChannelSegment),
        measurementValue(measurementValue),
        featureMeasurementType(featureMeasurementType),
        snr(snr),
        analysisWaveform(analysisWaveform) {};

    ChannelVersionReference channel;
    std::optional<ChannelSegmentDescriptor> measuredChannelSegment;
    T measurementValue;
    FEATURE_MEASUREMENT_TYPE featureMeasurementType;
    std::optional<DoubleValue> snr;
    std::optional<WaveformAndFilterDefinition> analysisWaveform;
};

#endif // FEATURE_MEASUREMENT_H