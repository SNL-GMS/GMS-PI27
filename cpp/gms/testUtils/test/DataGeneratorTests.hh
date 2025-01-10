#ifndef DATA_GENERATOR_TESTS_H
#define DATA_GENERATOR_TESTS_H
#include "gtest/gtest.h"

#include <optional>
#include <vector>
#include "DataGenerator.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class DataGeneratorTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // DATA_ALIGNMENT_UTILITY_TESTS_H