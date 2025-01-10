#ifndef WAVEFORM_ALIGNMENT_UTILITY_H
#define WAVEFORM_ALIGNMENT_UTILITY_H

#include <algorithm>
#include <array>
#include <cmath>
#include <vector>

#include "common/Waveform.hh"
#include "common/ChannelSegment.hh"

namespace DataAlignmentUtility {
    void alignChannelSegments(ChannelSegment& first, ChannelSegment& second, double const& startTime, double const& endTime);
    std::array<Waveform, 2> alignWaveforms(Waveform const& first, Waveform const& second, double const& startTime, double const& endTime);
    double findEarliestTime(double const& firstTime, double const& secondTime, double const& thirdTime);
    double findLatestTime(double const& firstTime, double const& secondTime, double const& thirdTime);
    void elideMaskedData(std::vector<Waveform>* waveforms, std::vector<ProcessingMask> const* processingMasks);
};

#endif //WAVEFORM_ALIGNMENT_UTILITY_H