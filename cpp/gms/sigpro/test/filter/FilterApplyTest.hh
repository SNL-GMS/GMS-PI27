#ifndef FILTER_APPLY_TEST_H
#define FILTER_APPLY_TEST_H

#include "gtest/gtest.h"
#include "payloads/TestFilters.hh"
#include "payloads/TestData.hh"
#include "FilterTestUtils.hh"
#include <array>
#include <cstdlib>

extern "C"
{
    #include "common/enums.h"
    #include "common/structs.h"
    #include "filter/structs.h"
    #include "filter/filter.h"
}

class FilterApplyTest : public ::testing::Test
{
    public:
        void SetUp() override;
        void TearDown() override;
        TestFilters testFilters;
        FilterTestUtils filterTestUtils;
        ProcessingWaveform waveform;
        FilterDefinition filterDefinition;
};

#endif //FILTER_APPLY_TEST_H