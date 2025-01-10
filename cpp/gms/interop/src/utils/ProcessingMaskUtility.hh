#ifndef PROCESSING_MASK_UTILITY_H
#define PROCESSING_MASK_UTILITY_H

#include <cmath>
#include <vector>

#include "common/ChannelSegment.hh"
#include "common/ProcessingMask.hh"
#include "common/TaperDefinition.hh"
#include "utils/ClassToCStructConverter.hh"

namespace GmsSigpro {
    extern "C" {
#include <rotation/rotation.h>
#include <common/structs.h>
#include <common/enums.h>
#include <qc/qc.h>
#include <common/taper.h>
    }
}


namespace ProcessingMaskUtility {
     void applyProcessingMasks(ChannelSegment* channelSegment,
        std::vector<ProcessingMask> const* processingMasks,
        std::optional<TaperDefinition> const* maskTaperDefinition);

     void applyProcessingMasks(GmsSigpro::ProcessingChannelSegment& channelSegment,
        std::vector<GmsSigpro::ProcessingMask>& processingMasks,
        GmsSigpro::ProcessingMaskDefinition const& maskDefinition);
};

#endif //PROCESSING_MASK_UTILITY_H