#ifndef IIR_BUTTERWORTH_FILTER_DESIGN_TEST_H
#define IIR_BUTTERWORTH_FILTER_DESIGN_TEST_H

#include "gtest/gtest.h"
#include "payloads/TestFilters.hh"
#include "FilterTestUtils.hh"

extern "C"
{
#include "common/enums.h"
#include "filter/structs.h"
#include "filter/filter.h"
#include "filter/constants.h"
}

class IirButterworthFilterDesignTest : public ::testing::Test
{
    public:
        TestFilters testFilters;
        FilterTestUtils filterTestUtils;
};

#endif // IIR_BUTTERWORTH_FILTER_DESIGN_TEST_H