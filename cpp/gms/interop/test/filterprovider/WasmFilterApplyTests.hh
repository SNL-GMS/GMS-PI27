
#ifndef FILTERPROVIDERTESTS_H
#define FILTERPROVIDERTESTS_H
#include "gtest/gtest.h"

#include "Comparisons.hh"

#include "FilterTestUtils.hh"
#include "filterprovider/enums.hh"
#include "wasm/CommonInterop.hh"
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"

class WasmFilterApplyTests : public ::testing::Test
{
protected:
    void SetUp() override;
    static const int TEST_DATA_SIZE = 12000;
    std::array<double,TEST_DATA_SIZE>  TEST_DATA;
};

#endif // FILTERPROVIDERTESTS_H
