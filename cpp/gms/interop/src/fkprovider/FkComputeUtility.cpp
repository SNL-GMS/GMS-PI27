#include "FkComputeUtility.hh"
using namespace std;

FkTimeseriesWithMissingInputChannels FkComputeUtility::computeFk(
    const FkSpectraDefinition* fkSpectraDefinition,
    const Station* station,
    const std::vector<std::string>* inputChannelNames,
    double detectionTime, // arrival time used in new computeFkChannelSegment call
    double startTime,
    double endTime,
    const std::vector<ChannelSegment>* channelSegments,
    const Map<std::string, std::vector<ProcessingMask>>* processingMasksByChannels,
    std::optional<TaperDefinition> maskTaperDefinition) const
{
    const auto window = ::FkSpectrumWindow(fkSpectraDefinition->fkParameters.fkSpectrumWindow.duration,
        fkSpectraDefinition->fkParameters.fkSpectrumWindow.lead);

    const auto metadata = FkSpectraMetadata(window, fkSpectraDefinition->fkParameters.phase, fkSpectraDefinition->fkParameters.slownessGrid);

    GmsSigpro::FkSpectraDefinition definition = ClassToCStructConverter::convertToStruct(fkSpectraDefinition->fkParameters, fkSpectraDefinition->orientationAngles);
    GmsSigpro::MissingInputChannelTimeRanges missingInputChannelsRef;
    GmsSigpro::FkSpectra spectra;

    std::vector<GmsSigpro::ProcessingChannelSegment> segments;

    if (!processingMasksByChannels->empty() && !maskTaperDefinition.has_value()) {
        throw std::invalid_argument("ProcessingMask was provided without a TaperDefinition");
    }

    for (ChannelSegment seg : *channelSegments) {
        std::vector<GmsSigpro::ProcessingWaveform> waveforms;

        if (!station->relativePositionsByChannel.exists(seg.id.channel.name)) {
            throw std::invalid_argument("Failed to retrieve the relative position for channel name " + seg.id.channel.name);
        }

        auto relativePosition = station->relativePositionsByChannel.get(seg.id.channel.name);

        for (Waveform wv : seg.timeseries) {
            GmsSigpro::ProcessingWaveform sWv = ClassToCStructConverter::convertToStruct(wv, relativePosition, seg.id.channel.name, {});
            waveforms.push_back(sWv);
        }

        std::vector<ProcessingMask> processingMask = processingMasksByChannels->get(seg.id.channel.name);
        ProcessingMaskUtility::applyProcessingMasks(&seg, &processingMask, &maskTaperDefinition);
        DataAlignmentUtility::elideMaskedData(&seg.timeseries, &processingMask);

        GmsSigpro::ProcessingChannelSegment result = ClassToCStructConverter::convertToStruct(seg, relativePosition, waveforms);

        segments.push_back(result);
    }

    double** power;
    double** fstat;

    if (int code = GmsSigpro::computeFkChannelSegment(
        &definition,
        (int)channelSegments->size(),
        segments.data(),
        detectionTime,
        startTime,
        endTime,
        &spectra,
        &missingInputChannelsRef); code != 2) {
        throw FkComputeException(code);
    }

    // Populate with first input channel name to return
    auto channel = ChannelVersionReference(inputChannelNames->front(), detectionTime);
    auto timeRange = TimeRange(startTime, endTime);
    std::vector<TimeRange> timeRanges = { timeRange };
    auto timeRangeByChannel = TimeRangesByChannel(channel, timeRanges);
    std::vector<TimeRangesByChannel> missingInputChannels = { timeRangeByChannel };

    // Populate spectra to return
    std::vector<FkSpectrum> spectrumvecta;
    auto fkSpectra = FkSpectra(
        spectrumvecta,
        metadata,
        startTime,
        endTime,
        fkSpectraDefinition->fkParameters.waveformSampleRate.waveformSampleRateHz,
        static_cast<int>(channelSegments->size()));
    std::vector<FkSpectra> fkSpectras{};
    fkSpectras.push_back(fkSpectra);
    auto result = FkTimeseriesWithMissingInputChannels(fkSpectras, missingInputChannels);
    return result;
};

FkAttributes FkComputeUtility::getPeakFkAttributes(FkSpectra const& fkSpectra) const
{
    auto receiverToSourceAzimuth = DoubleValue(1.0, Units::DECIBELS, 2.0);
    auto slowness = DoubleValue(1.0, Units::DECIBELS, 2.0);
    auto result = FkAttributes(fkSpectra.fkSpectraMetadata->slownessGrid.maxSlowness, slowness, receiverToSourceAzimuth);
    return result;
};
