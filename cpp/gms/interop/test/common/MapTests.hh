#ifndef BASE_WASM_MAP_TESTS_H
#define BASE_WASM_MAP_TESTS_H
#include "gtest/gtest.h"

#include <string>

#include "common/Map.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class MapTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // BASE_WASM_MAP_TESTS_H