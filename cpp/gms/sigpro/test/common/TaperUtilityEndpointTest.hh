#ifndef TAPER_UTILITY_ENDPOINT_TEST_H
#define TAPER_UTILITY_ENDPOINT_TEST_H

#include "gtest/gtest.h"
#include "filter/payloads/TestData.hh"

extern "C"
{
#include "common/enums.h"
#include "common/structs.h"
#include "common/taper.h"
}

class TaperUtilityEndpointTest : public ::testing::Test
{
    public:
        void SetUp() override;
        void TearDown() override;
        TaperDefinition taperDefinition;
        ProcessingWaveform waveform;
        double error = 0.000001; 
};

#endif // TAPER_UTILITY_ENDPOINT_TEST_H