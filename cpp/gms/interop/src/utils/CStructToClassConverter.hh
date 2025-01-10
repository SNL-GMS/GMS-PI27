#ifndef C_STRUCT_TO_CLASS_CONVERTER_H
#define C_STRUCT_TO_CLASS_CONVERTER_H

#include <map>
#include <string>
#include <vector>

#include "common/ChannelSegment.hh"
#include "common/DoubleValue.hh"
#include "common/Map.hh"
#include "common/ProcessingMask.hh"
#include "common/TimeRangesByChannel.hh"
#include "common/TimeseriesWithMissingInputChannels.hh"
#include "common/RelativePosition.hh"
#include "common/Station.hh"
#include "common/TaperDefinition.hh"
#include "common/Units.hh"

namespace GmsSigpro {
    extern "C" {
#include <common/structs.h>
#include <beam/structs.h>
    }
}

namespace CStructToClassConverter {

    Waveform convertToClass(GmsSigpro::ProcessingWaveform const& processingWaveform);

    std::vector<Waveform> convertToClass(GmsSigpro::ProcessingWaveform const* processingWaveforms, int const& processingWaveformCount);

    ChannelSegment convertToClass(GmsSigpro::ProcessingChannelSegment const& processingChannelSegment);

    std::vector<TimeRangesByChannel> convertToClass(GmsSigpro::MissingInputChannelTimeRanges const* missingInputChannels, int const& missingInputChannelCount);

    TimeseriesWithMissingInputChannels convertToClass(GmsSigpro::ProcessingWaveform const* waveforms, int const& waveformCount,
        GmsSigpro::MissingInputChannelTimeRanges const* missingInputChannels, int const& missingInputChannelCount);
};

#endif //C_STRUCT_TO_CLASS_CONVERTER_H