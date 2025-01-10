#ifndef TAPER_UTILITY_TEST_H
#define TAPER_UTILITY_TEST_H

#include <json/json.h>

#include "gtest/gtest.h"
#include "FileLoader.hh"

#include "filter/payloads/TestData.hh"

extern "C"
{
#include "common/enums.h"
#include "common/structs.h"
#include "common/taper.h"
}

class TaperUtilityTest : public ::testing::Test
{
    public:
        void SetUp() override;
        void TearDown() override;
        void createValidationCaseData();
        TaperDefinition taperDefinition;
        ProcessingWaveform waveform;
        double error = 0.000001;
};

#endif // TAPER_UTILITY_TEST_H