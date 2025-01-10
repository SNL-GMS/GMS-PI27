#include "FilterTestUtils.hh"

void FilterTestUtils::filterDefinitionsAreEquivalent(const FilterDefinition *actual, const FilterDefinition *expected)
{
    if ((actual == nullptr && expected != nullptr) || (actual != nullptr && expected == nullptr))
    {
        FAIL();
    } 

    ASSERT_EQ(actual->causal, expected->causal);
    ASSERT_EQ(actual->filterType, expected->filterType);
    ASSERT_EQ(actual->isDesigned, expected->isDesigned);

    if (actual->filterType == CASCADE)
    {
        filterDescriptionsAreEquivalent(&(actual->filterDescription.cascadeFilterDescription), 
                                        &(expected->filterDescription.cascadeFilterDescription));
    } 
    else
    {
        filterDescriptionsAreEquivalent(&(actual->filterDescription.nonCascadeFilterDescription.iirFilterDescription), 
                                        &(expected->filterDescription.nonCascadeFilterDescription.iirFilterDescription));
    }
}

void FilterTestUtils::filterDescriptionsAreEquivalent(const CascadeFilterDescription *actual, const CascadeFilterDescription *expected)
{
    if ((actual == nullptr && expected != nullptr) || (actual != nullptr && expected == nullptr))
    {
        FAIL();
    }

    parametersAreEquivalent(&(actual->parameters), &(expected->parameters));
    ASSERT_EQ(actual->filterDescriptionCount, expected->filterDescriptionCount);

    for (int i = 0; i < actual->filterDescriptionCount; i++)
    {
        filterDescriptionsAreEquivalent(&(actual->filterDescriptions[i].iirFilterDescription), &(expected->filterDescriptions[i].iirFilterDescription));
    }
}

void FilterTestUtils::filterDescriptionsAreEquivalent(const IirFilterDescription *actual, const IirFilterDescription *expected)
{
    if ((actual == nullptr && expected != nullptr) || (actual != nullptr && expected == nullptr))
    {
        FAIL();
    }

    ASSERT_EQ(actual->lowFrequencyHz, expected->lowFrequencyHz);
    ASSERT_EQ(actual->highFrequencyHz, expected->highFrequencyHz);
    ASSERT_EQ(actual->order, expected->order);
    ASSERT_EQ(actual->zeroPhase, expected->zeroPhase);
    ASSERT_EQ(actual->causal, expected->causal);
    ASSERT_EQ(actual->bandType, expected->bandType);
    parametersAreEquivalent(&(actual->parameters), &(expected->parameters));
}

void FilterTestUtils::parametersAreEquivalent(const CascadeFilterParameters *actual, const CascadeFilterParameters *expected)
{
    if ((actual == nullptr && expected != nullptr) || (actual != nullptr && expected == nullptr))
    {
        FAIL();
    }

    ASSERT_EQ(actual->sampleRateHz, expected->sampleRateHz);
    ASSERT_EQ(actual->sampleRateToleranceHz, expected->sampleRateToleranceHz);
    ASSERT_EQ(actual->groupDelaySec, expected->groupDelaySec);
}

void FilterTestUtils::parametersAreEquivalent(const IirFilterParameters *actual, const IirFilterParameters *expected)
{
    if ((actual == nullptr && expected != nullptr) || (actual != nullptr && expected == nullptr))
    {
        FAIL();
    }

    ASSERT_EQ(actual->sampleRateHz, expected->sampleRateHz);
    ASSERT_EQ(actual->sampleRateToleranceHz, expected->sampleRateToleranceHz);
    ASSERT_EQ(actual->groupDelaySec, expected->groupDelaySec);
    ASSERT_EQ(actual->sosCoefficientsSize, expected->sosCoefficientsSize);

    coefficientsAreEquivalent(actual->sosNumeratorCoefficients, expected->sosNumeratorCoefficients, actual->sosCoefficientsSize);
    coefficientsAreEquivalent(actual->sosDenominatorCoefficients, expected->sosDenominatorCoefficients, actual->sosCoefficientsSize);
}

void FilterTestUtils::coefficientsAreEquivalent(const double *actual, const double *expected, int coefficientsSize)
{
    if ((actual == nullptr && expected != nullptr) || (actual != nullptr && expected == nullptr))
    {
        FAIL();
    }

    if (actual != nullptr && expected != nullptr)
    {
        for (int i = 0; i < coefficientsSize; i++)
        {
            ASSERT_NEAR(actual[i], expected[i], error);
        }
    }
}
