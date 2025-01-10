#ifndef DEFAULT_FK_TEST_H
#define DEFAULT_FK_TEST_H
#include "gtest/gtest.h"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class DefaultFkTest : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // DEFAULT_FK_TEST_H