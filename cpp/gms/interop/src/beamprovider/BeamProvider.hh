#ifndef BEAM_PROVIDER_H
#define BEAM_PROVIDER_H
#include <cmath>
#include <vector>
#include <string>
#include <optional>

#include "BeamOrchestrator.hh"
#include "definitions/BeamDefinition.hh"
#include "common/Channel.hh"
#include "common/ChannelSegment.hh"
#include "common/Map.hh"
#include "common/ProcessingMask.hh"
#include "common/Station.hh"
#include "common/TaperDefinition.hh"
#include "common/TimeseriesWithMissingInputChannels.hh"
#include "common/Waveform.hh"

#include "utils/ClassToCStructConverter.hh"
#include "utils/CStructToClassConverter.hh"

namespace GmsSigpro {
extern "C" {
#include <common/structs.h>
#include <common/enums.h>
#include <beam/structs.h>
#include <beam/beam.h>
}
}

class BeamProvider {
public:
    BeamProvider() = default;
    TimeseriesWithMissingInputChannels maskAndBeamWaveforms(
        BeamDefinition const& beamDefinition,
        std::vector<ChannelSegment>& channelSegments,
        Map<std::string, RelativePosition> const& relativePositionsByChannel,
        double const& beamStartTime,
        double const& beamEndTime,
        std::optional<double> mediumVelocity,
        Map<std::string, std::vector<ProcessingMask>> const& processingMasks,
        std::optional<TaperDefinition> const& maskTaperDefinition
    );
};

#endif // BEAM_PROVIDER_HH