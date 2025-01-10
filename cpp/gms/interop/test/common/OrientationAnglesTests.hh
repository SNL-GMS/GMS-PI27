#ifndef ORIENTATION_ANGLES_TESTS_H
#define ORIENTATION_ANGLES_TESTS_H
#include "gtest/gtest.h"
#include "common/OrientationAngles.hh"


/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class OrientationAnglesTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // ORIENTATION_ANGLES_TESTS_H