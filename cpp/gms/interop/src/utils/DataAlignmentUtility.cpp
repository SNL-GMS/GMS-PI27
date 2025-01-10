#include "DataAlignmentUtility.hh"

/// @brief Aligns two channel segments & their properties according to a desired start and end time.
/// @param firstSegment
/// @param secondSegment 
/// @param startTime 
/// @param endTime 
void DataAlignmentUtility::alignChannelSegments(ChannelSegment& firstSegment, ChannelSegment& secondSegment, double const& startTime, double const& endTime)
{

    //if one of the channel segments has empty timeseries, nothing to be done.
    if (firstSegment.timeseries.empty() || secondSegment.timeseries.empty()) {
        throw std::invalid_argument("ChannelSegments must contain Timeseries data for comparison");
    }

    std::vector<Waveform> derivedFirstWaveforms;
    std::vector<Waveform> derivedSecondWaveforms;

    int firstIdx = 0;
    int secondIdx = 0;
    auto maxFirst = static_cast<int>(firstSegment.timeseries.size() - 1); //maximum number of timeseries to process for the first segment
    auto maxSecond = static_cast<int>(secondSegment.timeseries.size() - 1); //maximum number of timeseries to process for the second segment
    auto firstWaveformsComplete = false;
    auto secondWaveformsComplete = false;
    auto processingComplete = false;

    while (!processingComplete) {
        firstWaveformsComplete = firstIdx == maxFirst;
        secondWaveformsComplete = secondIdx == maxSecond;
        auto currentFirstWaveform = firstSegment.timeseries.at(firstIdx);
        auto currentSecondWaveform = secondSegment.timeseries.at(secondIdx);

        //perfectly aligned waveforms
        if (currentFirstWaveform.samples.empty() || currentSecondWaveform.samples.empty()) {
            throw std::invalid_argument("Waveforms must contain sample data for comparison");
        }

        //Am I done processing available waveform?
        if ((firstWaveformsComplete && currentFirstWaveform.endTime <= currentSecondWaveform.startTime)
            || (secondWaveformsComplete && currentSecondWaveform.endTime <= currentFirstWaveform.startTime))
        {
            //nothing else to align
            firstWaveformsComplete = true;
            secondWaveformsComplete = true;
        }
        else if ((currentFirstWaveform.startTime <= currentSecondWaveform.startTime && currentFirstWaveform.endTime >= currentSecondWaveform.startTime)
            || (currentSecondWaveform.startTime <= currentFirstWaveform.startTime && currentSecondWaveform.endTime >= currentFirstWaveform.startTime)) //check for any overlap
        {
            auto derivedWaveforms = alignWaveforms(currentFirstWaveform, currentSecondWaveform, startTime, endTime);
            derivedFirstWaveforms.push_back(derivedWaveforms[0]);
            derivedSecondWaveforms.push_back(derivedWaveforms[1]);
        }
        //no overlap, figure out next NE indices
        if (((currentFirstWaveform.endTime <= currentSecondWaveform.startTime)
            || (currentFirstWaveform.startTime < currentSecondWaveform.endTime && currentFirstWaveform.endTime > currentSecondWaveform.startTime && currentFirstWaveform.endTime <= currentSecondWaveform.endTime)
            || (currentFirstWaveform.startTime > currentSecondWaveform.startTime && currentFirstWaveform.endTime < currentSecondWaveform.endTime))
            && firstIdx < maxFirst) //check if first waveform is the leading edge
        {
            firstIdx += 1;
        }
        if (((currentSecondWaveform.endTime <= currentFirstWaveform.startTime)
            || (currentSecondWaveform.startTime < currentFirstWaveform.endTime && currentSecondWaveform.endTime > currentFirstWaveform.startTime && currentSecondWaveform.endTime <= currentFirstWaveform.endTime)
            || (currentSecondWaveform.startTime >= currentFirstWaveform.startTime && currentSecondWaveform.endTime <= currentFirstWaveform.endTime))
            && secondIdx < maxSecond) //check if second waveform is the leading edge
        {
            secondIdx += 1;
        }
        processingComplete = firstWaveformsComplete && secondWaveformsComplete;
    }
    firstSegment.timeseries = derivedFirstWaveforms;
    secondSegment.timeseries = derivedSecondWaveforms;
};


/// @brief Aligns two waveforms based on a start and end time
/// @param first 
/// @param second 
/// @param startTime 
/// @param endTime 
/// @return Array of resulting waveforms
std::array<Waveform, 2> DataAlignmentUtility::alignWaveforms(Waveform const& first, Waveform const& second, double const& startTime, double const& endTime)
{
    auto derivedStart = DataAlignmentUtility::findLatestTime(first.startTime, second.startTime, startTime);
    auto derivedEnd = DataAlignmentUtility::findEarliestTime(first.endTime, second.endTime, endTime);

    auto firstStartSample = static_cast<long>((derivedStart - first.startTime) * first.sampleRateHz);
    auto firstEndSample = static_cast<long>((derivedEnd - first.startTime) * first.sampleRateHz);
    std::vector<double> derivedFirstData(first.samples.begin() + firstStartSample, first.samples.begin() + firstEndSample);
    auto derivedFirst = Waveform(derivedFirstData, derivedStart, derivedEnd, first.sampleRateHz);

    auto secondStartSample = (long)((derivedStart - second.startTime) * second.sampleRateHz);
    auto secondEndSample = (long)((derivedEnd - second.startTime) * second.sampleRateHz);
    std::vector<double> derivedSecondData(second.samples.begin() + secondStartSample, second.samples.begin() + secondEndSample);
    auto derivedSecond = Waveform(derivedSecondData, derivedStart, derivedEnd, second.sampleRateHz);

    std::array<Waveform, 2> result{ derivedFirst, derivedSecond };
    return result;
};

/// @brief Elide means to merge or omit. This function trims the zeroed data out of a waveform
/// @param channelSegment 
void DataAlignmentUtility::elideMaskedData(std::vector<Waveform>* waveforms, std::vector<ProcessingMask> const* processingMasks) {
    if (waveforms->empty() || processingMasks->empty()) {
        //nothing to do; return
        return;
    }
    auto maskIdx = 0;
    auto waveformIdx = 0;
    auto maxMasks = processingMasks->size() - 1;
    auto maxWaveforms = waveforms->size() - 1;
    auto masksComplete = maskIdx == maxMasks; // may start as complete if there is only one
    auto waveformsComplete = waveformIdx == maxWaveforms; // may start as complete if there is only one
    auto processingComplete = false;
    while (!processingComplete) {

        if (processingMasks->at(maskIdx).endTime < waveforms->at(waveformIdx).startTime) {
            masksComplete = maskIdx == maxMasks;
            maskIdx = masksComplete ? maskIdx : maskIdx + 1;
        }
        else if (waveforms->at(waveformIdx).endTime < processingMasks->at(maskIdx).startTime) {
            waveformsComplete = waveformIdx == maxWaveforms;
            waveformIdx = waveformsComplete ? waveformIdx : waveformIdx + 1;
        }
        else if (waveforms->at(waveformIdx).startTime >= processingMasks->at(maskIdx).startTime && waveforms->at(waveformIdx).endTime <= processingMasks->at(maskIdx).endTime) { //waveform exists inside mask range
            //waveform is fully masked, remove it
            waveforms->erase(waveforms->begin() + waveformIdx);
            maxWaveforms = maxWaveforms - 1;
            waveformsComplete = waveformIdx == maxWaveforms;
            waveformIdx = waveformsComplete ? waveformIdx : waveformIdx + 1;
        }
        else if (waveforms->at(waveformIdx).startTime < processingMasks->at(maskIdx).startTime && processingMasks->at(maskIdx).endTime > processingMasks->at(maskIdx).startTime && processingMasks->at(maskIdx).endTime < waveforms->at(waveformIdx).endTime)
        {
            //TODO: Waveforms should be of a certain length. This requirement has yet to be determined. When it is, each of these waveforms must be a minimum lenght of that value
            //mask is a portion of the waveform. Split the waveform into two unmasked segments
            auto preMaskEnd = static_cast<long>((processingMasks->at(maskIdx).startTime - waveforms->at(waveformIdx).startTime) * waveforms->at(waveformIdx).sampleRateHz);
            std::vector<double> preMaskData(waveforms->at(waveformIdx).samples.begin(), waveforms->at(waveformIdx).samples.begin() + preMaskEnd);
            auto preMaskWaveform = Waveform(preMaskData, waveforms->at(waveformIdx).startTime, processingMasks->at(maskIdx).startTime, waveforms->at(waveformIdx).sampleRateHz);
            auto postMaskStart = static_cast<long>((waveforms->at(waveformIdx).endTime - processingMasks->at(maskIdx).endTime) * waveforms->at(waveformIdx).sampleRateHz);
            std::vector<double> postMaskData(waveforms->at(waveformIdx).samples.begin() + postMaskStart, waveforms->at(waveformIdx).samples.end());
            auto postMaskWaveform = Waveform(postMaskData, processingMasks->at(maskIdx).endTime, waveforms->at(waveformIdx).endTime, waveforms->at(waveformIdx).sampleRateHz);
            waveforms->at(waveformIdx) = preMaskWaveform;
            waveforms->insert(waveforms->begin() + waveformIdx + 1, postMaskWaveform);
            masksComplete = maskIdx == maxMasks;
            maskIdx = masksComplete ? maskIdx : maskIdx + 1;
        }
        else if (waveforms->at(waveformIdx).startTime < processingMasks->at(maskIdx).startTime && processingMasks->at(maskIdx).endTime > processingMasks->at(maskIdx).startTime && processingMasks->at(maskIdx).endTime > waveforms->at(waveformIdx).endTime) {
            //waveform starts, then gets masked. Remove the masked data and leave the unmasked.
            auto preMaskEnd = static_cast<long>((processingMasks->at(maskIdx).startTime - waveforms->at(waveformIdx).startTime) * waveforms->at(waveformIdx).sampleRateHz);
            std::vector<double> preMaskData(waveforms->at(waveformIdx).samples.begin(), waveforms->at(waveformIdx).samples.begin() + preMaskEnd);
            auto preMaskWaveform = Waveform(preMaskData, waveforms->at(waveformIdx).startTime, processingMasks->at(maskIdx).startTime, waveforms->at(waveformIdx).sampleRateHz);
            waveforms->at(waveformIdx) = preMaskWaveform;
            waveformsComplete = waveformIdx == maxWaveforms;
            waveformIdx = waveformsComplete ? waveformIdx : waveformIdx + 1;
        }
        else if (waveforms->at(waveformIdx).startTime >= processingMasks->at(maskIdx).startTime && waveforms->at(waveformIdx).startTime < processingMasks->at(maskIdx).endTime && waveforms->at(waveformIdx).endTime > processingMasks->at(maskIdx).endTime) {
            //waveform starts masked, then gets unmasked. Remove the masked data and leave the unmasked.
            auto postMaskStart = static_cast<long>((waveforms->at(waveformIdx).endTime - processingMasks->at(maskIdx).endTime) * waveforms->at(waveformIdx).sampleRateHz);
            std::vector<double> postMaskData(waveforms->at(waveformIdx).samples.begin() + postMaskStart, waveforms->at(waveformIdx).samples.end());
            auto postMaskWaveform = Waveform(postMaskData, processingMasks->at(maskIdx).endTime, waveforms->at(waveformIdx).endTime, waveforms->at(waveformIdx).sampleRateHz);
            waveforms->at(waveformIdx) = postMaskWaveform;
            masksComplete = maskIdx == maxMasks;
            maskIdx = masksComplete ? maskIdx : maskIdx + 1;
        }
        processingComplete = waveformsComplete && masksComplete;
    }
};

double DataAlignmentUtility::findEarliestTime(double const& firstTime, double const& secondTime, double const& thirdTime) {
    auto earliest = firstTime <= secondTime ? firstTime : secondTime;
    auto syncTime = earliest <= thirdTime ? earliest : thirdTime;
    return syncTime;
};

double DataAlignmentUtility::findLatestTime(double const& firstTime, double const& secondTime, double const& thirdTime) {
    auto latest = firstTime >= secondTime ? firstTime : secondTime;
    auto syncTime = latest >= thirdTime ? latest : thirdTime;
    return syncTime;
};