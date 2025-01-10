#ifndef VECTOR_MATH_TEST_H
#define VECTOR_MATH_TEST_H

#include "gtest/gtest.h"
#include <math.h>

extern "C"
{
#include "common/enums.h"
#include "common/vectorMath.h"
}
class VectorMathTest : public ::testing::Test
{
    public:
        void SetUp() override;
};

#endif // VECTOR_MATH_TEST_H