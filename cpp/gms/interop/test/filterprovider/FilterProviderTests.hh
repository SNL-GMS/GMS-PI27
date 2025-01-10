
#ifndef FILTERPROVIDERTESTS_H
#define FILTERPROVIDERTESTS_H
#include <string>
#include <vector>
#include "gtest/gtest.h"

#include "Comparisons.hh"

#include "FilterTestUtils.hh"
#include "filterprovider/enums.hh"
#include "filterprovider/FilterProvider.hh"
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"

class FilterProviderTests : public ::testing::Test
{
public:
    void SetUp() override;
    static const int TEST_DATA_SIZE = 12000;
    std::array<double,TEST_DATA_SIZE>  TEST_DATA;
};

#endif // FILTERPROVIDERTESTS_H
