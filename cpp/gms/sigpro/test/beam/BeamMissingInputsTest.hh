#ifndef BEAM_MISSING_INPUTS_H
#define BEAM_MISSING_INPUTS_H

#include "gtest/gtest.h"
#include <json/json.h>
#include <vector>
#include <string>
#include <cstring>
#include "FileLoader.hh"

extern "C"
{
#include "common/enums.h"
#include "common/structs.h"
#include "beam/structs.h"
#include "beam/beam.h"
#include "qc/qc.h"
}

class BeamMissingInputsTest : public ::testing::Test
{
    public:
        void SetUp() override;
        std::vector<MissingInputChannelTimeRanges> buildMissingInputChannels();
        std::vector<std::pair<int, int>> findChannelSegmentGapEndpoints(int channelSegmentNumber);
        std::vector<ProcessingChannelSegment> buildChannelSegments();
        BeamDefinition buildBeamDefinition();
        Json::Value data;
        ProcessingMaskDefinition processingMaskDefinition;
        TaperDefinition maskTaperDefinition;
        double error = 0.000001;
};

#endif // BEAM_MISSING_INPUTS_H