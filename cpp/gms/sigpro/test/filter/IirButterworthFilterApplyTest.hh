#ifndef IIR_BUTTERWORTH_FILTER_APPLY_TEST_H
#define IIR_BUTTERWORTH_FILTER_APPLY_TEST_H

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

class IirButterworthFilterApplyTest : public ::testing::Test
{
    public:
        TestFilters testFilters;
        FilterTestUtils filterTestUtils;
};

#endif // IIR_BUTTERWORTH_FILTER_APPLY_TEST_H