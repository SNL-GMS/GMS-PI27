#ifndef ROTATION_PROVIDER_HH
#define ROTATION_PROVIDER_HH

#include <cmath>
#include <optional>
#include <vector>

#include "common/ChannelSegment.hh"
#include "common/Map.hh"
#include "common/ProcessingMask.hh"
#include "common/TaperDefinition.hh"
#include "common/TimeseriesWithMissingInputChannels.hh"
#include "common/Waveform.hh"
#include "utils/DataAlignmentUtility.hh"
#include "utils/ProcessingMaskUtility.hh"
#include "RotationDefinition.hh"

namespace GmsSigpro {
    extern "C" {
#include <rotation/rotation.h>
#include <common/structs.h>
#include <common/enums.h>
#include <qc/qc.h>
    }
}

class RotationProvider {
public:
    Map<std::string, TimeseriesWithMissingInputChannels> maskAndRotate2d(RotationDefinition const& rotationDefinition,
        std::vector<ChannelSegment>& channelSegments,
        double const& startTime,
        double const& endTime,
        Map<std::string, std::vector<ProcessingMask>> const& processingMasksByChannels,
        std::optional<TaperDefinition> const& maskTaperDefinition);

};

#endif //ROTATION_PROVIDER_HH