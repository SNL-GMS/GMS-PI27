#ifndef TEST_UTILS_H
#define TEST_UTILS_H

#include <vector>
#include <string>
#include <math.h>
#include "gtest/gtest.h"
namespace GmsTestUtils{
namespace Comparisons {
     void precisionCompare(std::vector<double>* a, std::vector<double>* b, const double precision = 0.00000000001);
     void precisionCompare(const double* a, const double* b, unsigned long arraySize, const double precision = 0.00000000001);
};
}
#endif //TEST_UTILS_H