#ifndef GROUP_DELAY_TEST_H
#define GROUP_DELAY_TEST_H

#include "gtest/gtest.h"
#include "payloads/TestFilters.hh"
#include "payloads/TestData.hh"
#include "FilterTestUtils.hh"
#include <cstdlib>

extern "C"
{
    #include "common/enums.h"
    #include "filter/structs.h"
    #include "filter/filter.h"
}

class GroupDelayTest : public ::testing::Test
{
    public:
        void SetUp() override;
        void TearDown() override;
        FilterDefinition filterDefinition;
        ProcessingWaveform waveform;
        FilterTestUtils filterTestUtils;
        TestFilters testFilters;
};

#endif // GROUP_DELAY_TEST_H