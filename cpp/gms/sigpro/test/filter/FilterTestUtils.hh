#ifndef FILTER_TEST_UTILS_H
#define FILTER_TEST_UTILS_H

#include "gtest/gtest.h"

extern "C"
{
    #include "filter/structs.h"
}

class FilterTestUtils
{
    public:
        double error = 0.0000001;
        void filterDefinitionsAreEquivalent(const FilterDefinition *actual, const FilterDefinition *expected);
        void filterDescriptionsAreEquivalent(const CascadeFilterDescription *actual, const CascadeFilterDescription *expected);
        void filterDescriptionsAreEquivalent(const IirFilterDescription *actual, const IirFilterDescription *expected);
        void parametersAreEquivalent(const IirFilterParameters *actual, const IirFilterParameters *expected);
        void parametersAreEquivalent(const CascadeFilterParameters *actual, const CascadeFilterParameters *expected);  
        void coefficientsAreEquivalent(const double *actual, const double *expected, int coefficientsSize);
};

#endif // FILTER_TEST_UTILS_H