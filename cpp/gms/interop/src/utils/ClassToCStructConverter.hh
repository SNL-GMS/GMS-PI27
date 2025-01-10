#ifndef CLASS_TO_C_STRUCT_CONVERTER_H
#define CLASS_TO_C_STRUCT_CONVERTER_H

#include <cmath>
#include <map>
#include <string>
#include <vector>

#include "common/ChannelSegment.hh"
#include "common/DoubleValue.hh"
#include "common/Map.hh"
#include "common/ProcessingMask.hh"
#include "common/RelativePosition.hh"
#include "common/Station.hh"
#include "common/TaperDefinition.hh"
#include "common/Units.hh"

#include "beamprovider/definitions/BeamDefinition.hh"

#include "fkprovider/FkSpectra.hh"
#include "fkprovider/FkSpectraDefinition.hh"
#include "fkprovider/FkSpectrumWindow.hh"

namespace GmsSigpro {
    extern "C" {
#include <common/structs.h>
#include <beam/structs.h>
#include <fk/structs.h>
#include <fk/fk.h>
    }
}

namespace ClassToCStructConverter {
     GmsSigpro::MissingInputChannelTimeRanges convertToStruct(TimeRangesByChannel const& timeRangesByChannel);
     std::vector<GmsSigpro::MissingInputChannelTimeRanges> convertToStruct(std::vector<TimeRangesByChannel> const& timeRangesByChannels);

     GmsSigpro::ProcessingMask convertToStruct(ProcessingMask const& processingMask);
     std::vector<GmsSigpro::ProcessingMask> convertToStruct(std::vector<ProcessingMask> const& processingMasks);

     GmsSigpro::ProcessingWaveform convertToStruct(
        Waveform& waveform, RelativePosition const& relativePosition, std::string const& channelName, std::vector<ProcessingMask> const& processingMasks);
     void convertToStruct(
        std::vector<Waveform>& waveforms, RelativePosition const& relativePosition, std::string const& channelName, 
        std::vector<ProcessingMask> const& processingMasks, std::vector<GmsSigpro::ProcessingWaveform>& outProcessingWaveforms);

     GmsSigpro::ProcessingChannelSegment convertToStruct(ChannelSegment& channelSegment, RelativePosition const& relativePosition, std::vector<GmsSigpro::ProcessingWaveform>& outProcessingWaveforms);

     GmsSigpro::FkSpectraDefinition convertToStruct(FkSpectraParameters const& params, OrientationAngles const& angles);

     GmsSigpro::BeamDefinition convertToStruct(BeamDefinition const& beamDefinition);

     GmsSigpro::TaperDefinition convertToStruct(TaperDefinition const& taperDefinition);

     GmsSigpro::ProcessingMaskDefinition convertToStruct(GmsSigpro::FIX_TYPE fixType, int const& fixThreshold);
};

#endif //CLASS_TO_C_STRUCT_CONVERTER_H