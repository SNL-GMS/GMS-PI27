#include "Comparisons.hh"

void GmsTestUtils::Comparisons::precisionCompare(std::vector<double>* a, std::vector<double>* b, const double precision)
{
    bool areEitherVecNull = (a->empty()) || (b->empty());
    ASSERT_FALSE(areEitherVecNull);
    ASSERT_EQ(a->size(), b->size());
    precisionCompare(a->data(), b->data(), a->size(), precision);
}

void GmsTestUtils::Comparisons::precisionCompare(const double* a, const double* b, const unsigned long arraySize, const double precision)
{
    for (int sizeIdx = 0; sizeIdx < arraySize; sizeIdx++)
    {
        double actual = a[sizeIdx];
        double expected = b[sizeIdx];
        ASSERT_LE(fabs(actual - expected), precision);
    }
}
