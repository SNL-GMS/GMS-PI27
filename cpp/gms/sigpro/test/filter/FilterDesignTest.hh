#ifndef FILTER_DESIGN_TEST_H
#define FILTER_DESIGN_TEST_H

#include "gtest/gtest.h"
#include "payloads/TestFilters.hh"
#include "FilterTestUtils.hh"

extern "C"
{
#include "common/enums.h"
#include "filter/structs.h"
#include "filter/filter.h"
}

class FilterDesignTest : public ::testing::Test
{
    public:
        TestFilters testFilters;
        FilterTestUtils filterTestUtils;
};

#endif // FILTER_DESIGN_TEST_H