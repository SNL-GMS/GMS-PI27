#ifndef BEAM_ORCHESTRATOR_H
#define BEAM_ORCHESTRATOR_H

#include <vector>
#include <cstdlib>
#include <string>
#include <stdexcept>
#include "utils/ProcessingMaskUtility.hh"

namespace GmsSigpro
{
    extern "C"
    {
#include <common/structs.h>
#include <common/enums.h>
#include <common/taper.h>
#include <beam/structs.h>
#include <beam/beam.h>
#include <filter/structs.h>
#include <filter/filter.h>
#include <qc/qc.h>
    }
}

namespace BeamOrchestrator
{
    GmsSigpro::ProcessingChannelSegment maskAndBeamWaveforms(
        GmsSigpro::BeamDefinition const* beamDefinition,
        std::vector<GmsSigpro::ProcessingChannelSegment> const* channelSegments,
        double const& beamStartTime,
        double const& beamEndTime,
        double const* mediumVelocity,
        GmsSigpro::ProcessingMaskDefinition const* processingMaskDefinition,
        GmsSigpro::TaperDefinition const* maskTaperDefinition);
};

#endif // BEAM_ORCHESTRATOR_H