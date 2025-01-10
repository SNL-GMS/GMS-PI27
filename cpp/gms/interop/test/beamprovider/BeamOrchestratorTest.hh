#ifndef BEAM_ORCHESTRATOR_TEST_H
#define BEAM_ORCHESTRATOR_TEST_H

#include <vector>
#include <string>
#include <json/json.h>
#include "gtest/gtest.h"
#include "FileLoader.hh"

#include "beamprovider/BeamOrchestrator.hh"

namespace GmsSigpro
{
    extern "C"
    {
#include "common/structs.h"
#include "beam/structs.h"
#include "beam/beam.h"
    }
}
class BeamOrchestratorTest : public ::testing::Test
{
    public:
        void SetUp() override;
        std::vector<GmsSigpro::ProcessingChannelSegment> buildChannelSegments(std::string dataSet);
        GmsSigpro::BeamDefinition buildBeamDefinition(std::string dataSet);
        GmsSigpro::ProcessingChannelSegment buildExpectedBeam(std::string dataSet);
        Json::Value data;
        GmsSigpro::ProcessingMaskDefinition processingMaskDefinition;
        GmsSigpro::TaperDefinition maskTaperDefinition;
        double error = 0.000001;
};

#endif // BEAM_ORCHESTRATOR_TEST_H