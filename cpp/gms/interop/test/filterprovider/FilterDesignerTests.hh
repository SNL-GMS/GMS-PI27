#ifndef FILTER_DESIGNER_TESTS_H
#define FILTER_DESIGNER_TESTS_H
#include "gtest/gtest.h"

#include "Comparisons.hh"

#include "FilterTestUtils.hh"
#include "filterprovider/enums.hh"
#include "filterprovider/FilterDesigner.hh"
#include "filterprovider/descriptions/LinearIIRFilterDescription.hh"
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"

class FilterDesignerTests : public ::testing::Test
{
protected:
    FilterTestUtils testUtils;
};

#endif // FILTER_DESIGNER_TESTS_H