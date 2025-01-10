#ifndef ROTATION_CONSTRUCTOR_TEST_H
#define ROTATION_CONSTRUCTOR_TEST_H
#include "gtest/gtest.h"

#include <optional>
#include <vector>

#include "common/Location.hh"
#include "common/OrientationAngles.hh"

#include "rotationprovider/RotationDefinition.hh"
#include "rotationprovider/RotationDescription.hh"
#include "rotationprovider/RotationParameters.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class RotationConstructorTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // ROTATION_CONSTRUCTOR_TEST_H