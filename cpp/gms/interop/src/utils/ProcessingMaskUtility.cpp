#include "ProcessingMaskUtility.hh"

void ProcessingMaskUtility::applyProcessingMasks(ChannelSegment* channelSegment,
    std::vector<ProcessingMask> const* processingMasks,
    std::optional<TaperDefinition> const* maskTaperDefinition)
{

    //TODO: This should be passed in, it should not originate here
    auto maskDef = GmsSigpro::ProcessingMaskDefinition{
        .fixType = GmsSigpro::FIX_TYPE::ZERO,
        .fixThreshold = 0
    };


    GmsSigpro::TaperDefinition taperDef{};
    if (maskTaperDefinition->has_value()) {
        taperDef = ClassToCStructConverter::convertToStruct(maskTaperDefinition->value());
    }

    std::vector<GmsSigpro::TimeRange> sigproMissingTimes;
    GmsSigpro::MissingInputChannelTimeRanges sigproMissingInputChannels = {
        .channelName = channelSegment->id.channel.name.c_str(),
        .timeRanges = sigproMissingTimes.data()
    };

    std::vector<GmsSigpro::ProcessingMask> sigproMasks;
    for (ProcessingMask const& mask : *processingMasks) {
        if (mask.appliedToRawChannel.channelName == channelSegment->id.channel.name) {
            sigproMasks.push_back(ClassToCStructConverter::convertToStruct(mask));
        }
    }

    std::vector<GmsSigpro::ProcessingWaveform> sigproWaveforms;
    for (auto& timeseries : channelSegment->timeseries) {
        sigproWaveforms.push_back(
            GmsSigpro::ProcessingWaveform{
                .sampleRateHz = timeseries.sampleRateHz,
                .startTime = timeseries.startTime,
                .endTime = timeseries.endTime,
                .sampleCount = timeseries.sampleCount,
                .data = timeseries.samples.data()
            });
    }

    GmsSigpro::ProcessingChannelSegment sigproChannelSegment = {
        .channelName = channelSegment->id.channel.name.c_str(),
        .startTime = channelSegment->startTime,
        .endTime = channelSegment->endTime,
        .processingMaskCount = static_cast<int>(sigproMasks.size()),
        .masksToApply = sigproMasks.data(),
        .northDisplacementKm = 0,
        .eastDisplacementKm = 0,
        .verticalDisplacementKm = 0,
        .missingInputChannelCount = 0,
        .missingInputChannels = &sigproMissingInputChannels,
        .waveformCount = static_cast<int>(sigproWaveforms.size()),
        .waveforms = sigproWaveforms.data()
    };

    ProcessingMaskUtility::applyProcessingMasks(sigproChannelSegment, sigproMasks, maskDef);
    
    std::for_each(sigproWaveforms.begin(), sigproWaveforms.end(),
        [&maskTaperDefinition, &taperDef]
        (GmsSigpro::ProcessingWaveform& wave) {
            if (maskTaperDefinition->has_value() && wave.maskedBy != nullptr) {
                int taperResult = GmsSigpro::qcTaper(&wave, &taperDef);
                if (taperResult != 0) {
                    throw std::invalid_argument("Processing mask application failed for: " + std::string(wave.channelName));
                }
            }
        });
}

void ProcessingMaskUtility::applyProcessingMasks(GmsSigpro::ProcessingChannelSegment& channelSegment,
    std::vector<GmsSigpro::ProcessingMask>& processingMasks,
    GmsSigpro::ProcessingMaskDefinition const& maskDefinition)
{
    //apply masks
    int resultCode = GmsSigpro::qcFixChannelSegment(&maskDefinition, &channelSegment);

    if (resultCode != 0) {
        throw std::invalid_argument("Processing mask application failed for: " + std::string(channelSegment.channelName));
    }
}