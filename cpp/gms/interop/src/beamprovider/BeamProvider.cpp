
#include "BeamProvider.hh"

TimeseriesWithMissingInputChannels BeamProvider::maskAndBeamWaveforms(
        BeamDefinition const& beamDefinition,
        std::vector<ChannelSegment>& channelSegments,
        Map<std::string, RelativePosition> const& relativePositionsByChannel,
        double const& beamStartTime,
        double const& beamEndTime,
        std::optional<double> mediumVelocity,
        Map<std::string, std::vector<ProcessingMask>> const& processingMasks,
        std::optional<TaperDefinition> const& maskTaperDefinition
    )
{
    GmsSigpro::BeamDefinition sigproBeamDefinition = ClassToCStructConverter::convertToStruct(beamDefinition);

    std::vector<GmsSigpro::ProcessingChannelSegment> sigproProcessingChannelSegments;
    sigproProcessingChannelSegments.resize(channelSegments.size());

    std::vector<std::vector<GmsSigpro::ProcessingWaveform>> sigproProcessingWaveforms;
    sigproProcessingWaveforms.resize(channelSegments.size());

    std::vector<std::vector<GmsSigpro::ProcessingMask>> sigproProcessingMasks;
    sigproProcessingMasks.resize(channelSegments.size());

    for (int channelSegmentIndex = 0; channelSegmentIndex < channelSegments.size(); channelSegmentIndex++) {
        if (!relativePositionsByChannel.exists(channelSegments[channelSegmentIndex].id.channel.name)) {
            throw std::invalid_argument("Failed to retrieve the relative position for channel name " + channelSegments[channelSegmentIndex].id.channel.name);
        }
        auto relativePosition = relativePositionsByChannel.get(channelSegments[channelSegmentIndex].id.channel.name);
        sigproProcessingWaveforms[channelSegmentIndex].resize(channelSegments[channelSegmentIndex].timeseries.size());
        sigproProcessingChannelSegments[channelSegmentIndex] = ClassToCStructConverter::convertToStruct(
            channelSegments[channelSegmentIndex], relativePosition,  sigproProcessingWaveforms[channelSegmentIndex]);
        
        for(ProcessingMask mask: processingMasks.get(channelSegments[channelSegmentIndex].id.channel.name)){
                sigproProcessingMasks[channelSegmentIndex].push_back(ClassToCStructConverter::convertToStruct(mask));
        }
        sigproProcessingChannelSegments[channelSegmentIndex].processingMaskCount = static_cast<int>(sigproProcessingMasks[channelSegmentIndex].size());
        sigproProcessingChannelSegments[channelSegmentIndex].masksToApply =  sigproProcessingMasks[channelSegmentIndex].data();
    }

    double const processingMediumVelocity = mediumVelocity.value_or(0);

    // TODO: determine how to handle processing mask definitions
    GmsSigpro::ProcessingMaskDefinition processingMaskDefinition = ClassToCStructConverter::convertToStruct(GmsSigpro::FIX_TYPE::ZERO, 0);

    GmsSigpro::TaperDefinition sigproTaperDefinition = maskTaperDefinition.has_value()
        ? ClassToCStructConverter::convertToStruct(maskTaperDefinition.value())
        : GmsSigpro::TaperDefinition{ .taperLength = 0, .taperFunction = GmsSigpro::TAPER_FUNCTION::BLACKMAN };

    auto const& result = BeamOrchestrator::maskAndBeamWaveforms(
        &sigproBeamDefinition, &sigproProcessingChannelSegments, beamStartTime, beamEndTime, &processingMediumVelocity, &processingMaskDefinition, &sigproTaperDefinition);

    auto const& returnResult = CStructToClassConverter::convertToClass(
        result.waveforms, result.waveformCount, result.missingInputChannels, result.missingInputChannelCount);

    sigproProcessingChannelSegments.clear();
    sigproProcessingWaveforms.clear();
    sigproProcessingMasks.clear();
    
    return returnResult;
}