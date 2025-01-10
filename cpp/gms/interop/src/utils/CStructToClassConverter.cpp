#include "CStructToClassConverter.hh"

Waveform CStructToClassConverter::convertToClass(GmsSigpro::ProcessingWaveform const& processingWaveform) {
    return Waveform(std::vector<double>(processingWaveform.data, processingWaveform.data + processingWaveform.sampleCount),
        processingWaveform.startTime,
        processingWaveform.endTime,
        processingWaveform.sampleRateHz);
};

std::vector<Waveform> CStructToClassConverter::convertToClass(
    GmsSigpro::ProcessingWaveform const* processingWaveforms, int const& processingWaveformCount) {
    std::vector<Waveform> waveforms;
    for (int i = 0; i < processingWaveformCount; i++) {
        waveforms.emplace_back(CStructToClassConverter::convertToClass(processingWaveforms[i]));
    }
    return waveforms;
};

ChannelSegment CStructToClassConverter::convertToClass(GmsSigpro::ProcessingChannelSegment const& processingChannelSegment) {
    ChannelVersionReference channel(processingChannelSegment.channelName, 0);
    ChannelSegmentDescriptor id(channel,
        processingChannelSegment.startTime, processingChannelSegment.endTime, 0);

    std::vector<Waveform> timeseries;
    for (int i = 0; i < processingChannelSegment.waveformCount; i++) {
        timeseries.push_back(CStructToClassConverter::convertToClass(processingChannelSegment.waveforms[i]));
    }
    auto channelSegment = ChannelSegment::Builder()
        .channelSegmentUnits(Units::HERTZ)
        .creationTime(0.0)
        .endTime(processingChannelSegment.endTime)
        .id(id)
        .startTime(processingChannelSegment.startTime)
        .timeseries(timeseries)
        .timeseriesType(TimeseriesType::WAVEFORM)
        .build();

    channelSegment.missingInputChannels = CStructToClassConverter::convertToClass(
        processingChannelSegment.missingInputChannels, processingChannelSegment.missingInputChannelCount);
    return channelSegment;
};

std::vector<TimeRangesByChannel> CStructToClassConverter::convertToClass(GmsSigpro::MissingInputChannelTimeRanges const* missingInputChannels, int const& missingInputChannelCount)
{
    std::vector<TimeRangesByChannel> missing;
    for (int i = 0; i < missingInputChannelCount; i++) {
        ChannelVersionReference missingInputChannelName(missingInputChannels[i].channelName, 0);
        std::vector<TimeRange> missingTimeRanges;
        for (int j = 0; j < missingInputChannels[i].timeRangeCount; j++) {
            missingTimeRanges.push_back(TimeRange(
                missingInputChannels[i].timeRanges[j].startTime,
                missingInputChannels[i].timeRanges[j].endTime
            ));
        }
        missing.emplace_back(missingInputChannelName, missingTimeRanges);
    }
    return missing;
}

TimeseriesWithMissingInputChannels CStructToClassConverter::convertToClass(GmsSigpro::ProcessingWaveform const* waveforms, int const& waveformCount,
    GmsSigpro::MissingInputChannelTimeRanges const* missingInputChannels, int const& missingInputChannelCount)
{
    return TimeseriesWithMissingInputChannels(
        CStructToClassConverter::convertToClass(waveforms, waveformCount),
        CStructToClassConverter::convertToClass(missingInputChannels, missingInputChannelCount)
    );
}