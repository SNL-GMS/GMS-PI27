#ifndef TAPER_UTILITY_CHANNEL_SEGMENT_TEST_H
#define TAPER_UTILITY_CHANNEL_SEGMENT_TEST_H

#include "gtest/gtest.h"
#include <json/json.h>
#include "FileLoader.hh"
#include "filter/payloads/TestData.hh"

extern "C"
{
    #include "common/enums.h"
    #include "common/structs.h"
    #include "common/taper.h"
}

class TaperUtilityChannelSegmentTest : public ::testing::Test
{
    public:
        void SetUp() override;
        void TearDown() override;
        void createValidationCaseData();
        TaperDefinition taperDefinition;
        ProcessingChannelSegment channelSegment;
        double error = 0.000001;
};

#endif // TAPER_UTILITY_CHANNEL_SEGMENT_TEST_H