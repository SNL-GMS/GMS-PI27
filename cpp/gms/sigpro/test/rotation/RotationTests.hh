#ifndef ROTATION_TESTS_H
#define ROTATION_TESTS_H

#include <array>
#include <fstream>
#include <json/json.h>
#include <math.h>
#include <vector>

#include "gtest/gtest.h"

#include "FileLoader.hh"

extern "C" {
#include "rotation/rotation.h"
}
/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class RotationTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // DEFAULT_BEAM_TEST_H