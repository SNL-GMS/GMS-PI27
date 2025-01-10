#include "RotationProvider.hh"

Map<std::string, TimeseriesWithMissingInputChannels> RotationProvider::maskAndRotate2d(RotationDefinition const& rotationDefinition,
    std::vector<ChannelSegment>& channelSegments,
    double const& startTime,
    double const& endTime,
    Map<std::string, std::vector<ProcessingMask>> const& processingMasksByChannels,
    std::optional<TaperDefinition> const& maskTaperDefinition)
{

    if (channelSegments.size() != 2)
    {
        throw std::invalid_argument("Parameter channelSegments must contain two (2) ChannelSegment objects");
    }

    auto northChannelSegment = channelSegments[0];
    auto eastChannelSegment = channelSegments[1];

    if (!processingMasksByChannels.empty() && !maskTaperDefinition.has_value()) {
        throw std::invalid_argument("ProcessingMask was provided without a TaperDefinition");
    }

    std::vector<ProcessingMask> northMasks = processingMasksByChannels.get(northChannelSegment.id.channel.name);
    std::vector<ProcessingMask> eastMasks = processingMasksByChannels.get(eastChannelSegment.id.channel.name);

    ProcessingMaskUtility::applyProcessingMasks(&northChannelSegment, &northMasks, &maskTaperDefinition);
    DataAlignmentUtility::elideMaskedData(&northChannelSegment.timeseries, &northMasks);

    ProcessingMaskUtility::applyProcessingMasks(&eastChannelSegment, &eastMasks, &maskTaperDefinition);
    DataAlignmentUtility::elideMaskedData(&eastChannelSegment.timeseries, &eastMasks);

    DataAlignmentUtility::alignChannelSegments(northChannelSegment, eastChannelSegment, startTime, endTime);
    // rotate (N,E) for each derived waveform pair
    // push to result vectors

    for (auto timeseriesCount = 0; timeseriesCount < northChannelSegment.timeseries.size(); timeseriesCount++)
    {
        if (int returnCode = GmsSigpro::rotateRadTrans(
            northChannelSegment.timeseries.at(timeseriesCount).samples.data(),
            eastChannelSegment.timeseries.at(timeseriesCount).samples.data(),
            northChannelSegment.timeseries.at(timeseriesCount).sampleCount,
            rotationDefinition.rotationParameters.receiverToSourceAzimuthDeg); returnCode != 0)
        {
            throw std::invalid_argument("GmsSigPro::Rotation returned a code: " + std::to_string(returnCode));
        }
    }
    auto const northName = northChannelSegment.id.channel.name;
    auto const eastName = eastChannelSegment.id.channel.name;
    auto const northMissingInputs = TimeseriesWithMissingInputChannels(northChannelSegment.timeseries, northChannelSegment.missingInputChannels);
    auto const eastMissingInputs = TimeseriesWithMissingInputChannels(eastChannelSegment.timeseries, eastChannelSegment.missingInputChannels);
    auto result = Map<std::string, TimeseriesWithMissingInputChannels>();
    result.add(northName, northMissingInputs);
    result.add(eastName, eastMissingInputs);
    return result;
};
 