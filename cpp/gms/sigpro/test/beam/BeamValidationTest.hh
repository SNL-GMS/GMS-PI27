#ifndef BEAM_VALIDATION_TEST_H
#define BEAM_VALIDATION_TEST_H

#include "gtest/gtest.h"
#include <vector>
#include <string>
#include <json/json.h>

#include "FileLoader.hh"

extern "C"
{
#include "common/enums.h"
#include "common/structs.h"
#include "beam/structs.h"
#include "beam/beam.h"
#include "qc/qc.h"
}

class BeamValidationTest : public ::testing::Test
{
    public:
        void SetUp() override;
        std::vector<ProcessingChannelSegment> buildChannelSegments(std::string dataSet);
        BeamDefinition buildBeamDefinition(std::string dataSet);
        ProcessingChannelSegment buildExpectedBeam(std::string dataSet);
        Json::Value data;
        ProcessingMaskDefinition processingMaskDefinition;
        TaperDefinition maskTaperDefinition;
        double error = 0.000001;
};

#endif // BEAM_VALIDATION_TEST_H