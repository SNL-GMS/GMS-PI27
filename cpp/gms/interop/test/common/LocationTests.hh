#ifndef LOCATION_TESTS_H
#define LOCATION_TESTS_H
#include "gtest/gtest.h"
#include "common/Location.hh"


/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class LocationTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // LOCATION_TESTS_H